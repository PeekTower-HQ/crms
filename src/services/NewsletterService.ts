/**
 * Newsletter Service
 *
 * Business logic for WhatsApp Newsletter/Channel management
 * Handles creation, updates, broadcasts, and synchronization with Whapi
 *
 * Pan-African Design:
 * - Multi-language broadcast support
 * - Channel-based public communication
 * - Integration with Whapi.cloud API
 */

import { IWhatsAppNewsletterRepository } from "@/src/domain/interfaces/repositories/IWhatsAppNewsletterRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { WhatsAppNewsletter, NewsletterStatus } from "@/src/domain/entities/WhatsAppNewsletter";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";
import * as whapi from "@/lib/whapi";

/**
 * Input for creating a newsletter
 */
export interface CreateNewsletterInput {
  name: string;
  description?: string;
  pictureUrl?: string;
}

/**
 * Input for updating a newsletter
 */
export interface UpdateNewsletterInput {
  name?: string;
  description?: string;
  pictureUrl?: string;
  reactionsEnabled?: boolean;
}

/**
 * Input for broadcasting a message
 */
export interface BroadcastMessageInput {
  message: string;
}

/**
 * Newsletter Service
 * Coordinates newsletter operations between Whapi API and database
 */
export class NewsletterService {
  constructor(
    private readonly newsletterRepo: IWhatsAppNewsletterRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Create a new WhatsApp Newsletter
   *
   * Steps:
   * 1. Validate input
   * 2. Create newsletter via Whapi API
   * 3. Store in database
   * 4. Audit log
   *
   * @param input - Newsletter creation data
   * @param officerId - Officer creating the newsletter
   * @param ipAddress - IP address for audit
   * @returns Created newsletter entity
   */
  async createNewsletter(
    input: CreateNewsletterInput,
    officerId: string,
    ipAddress?: string
  ): Promise<WhatsAppNewsletter> {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("Newsletter name is required");
    }

    if (input.name.length > 255) {
      throw new ValidationError("Newsletter name must be 255 characters or less");
    }

    try {
      // Create newsletter via Whapi API
      const whapiResult = await whapi.createNewsletter(
        input.name,
        input.description,
        input.pictureUrl
      );

      if (!whapiResult.success || !whapiResult.newsletter) {
        throw new Error(whapiResult.error || "Failed to create newsletter on Whapi");
      }

      // Store in database
      const newsletter = await this.newsletterRepo.create({
        channelId: whapiResult.newsletter.id,
        name: input.name,
        description: input.description || null,
        pictureUrl: input.pictureUrl || null,
        status: "active",
        subscriberCount: 0,
        reactionsEnabled: true,
        createdById: officerId,
      });

      // Audit log
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: newsletter.id,
        officerId,
        action: "create",
        success: true,
        details: {
          name: newsletter.name,
          channelId: newsletter.channelId,
        },
        ipAddress,
      });

      return newsletter;
    } catch (error) {
      // Audit failed attempt
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: undefined,
        officerId,
        action: "create",
        success: false,
        details: {
          name: input.name,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        ipAddress,
      });

      throw error;
    }
  }

  /**
   * Get newsletter by ID
   */
  async getNewsletterById(id: string): Promise<WhatsAppNewsletter> {
    const newsletter = await this.newsletterRepo.findById(id);

    if (!newsletter) {
      throw new NotFoundError(`Newsletter with ID ${id} not found`);
    }

    return newsletter;
  }

  /**
   * Get all newsletters with filters
   */
  async getNewsletters(
    filters?: {
      status?: NewsletterStatus;
      createdById?: string;
      searchTerm?: string;
    },
    limit = 100,
    offset = 0
  ): Promise<{ newsletters: WhatsAppNewsletter[]; total: number }> {
    const newsletters = await this.newsletterRepo.findAll(filters, limit, offset);
    const total = await this.newsletterRepo.count(filters);

    return { newsletters, total };
  }

  /**
   * Update newsletter
   *
   * Steps:
   * 1. Validate newsletter exists and can be updated
   * 2. Update via Whapi API
   * 3. Update in database
   * 4. Audit log
   */
  async updateNewsletter(
    id: string,
    input: UpdateNewsletterInput,
    officerId: string,
    ipAddress?: string
  ): Promise<WhatsAppNewsletter> {
    // Get existing newsletter
    const newsletter = await this.getNewsletterById(id);

    // Check if can be updated
    const canUpdate = newsletter.canBeUpdated();
    if (!canUpdate.allowed) {
      throw new ForbiddenError(canUpdate.reason || "Cannot update newsletter");
    }

    try {
      // Update via Whapi API
      const whapiResult = await whapi.updateNewsletter(newsletter.channelId, {
        name: input.name,
        description: input.description,
        pictureUrl: input.pictureUrl,
        reactions: input.reactionsEnabled,
      });

      if (!whapiResult.success) {
        throw new Error(whapiResult.error || "Failed to update newsletter on Whapi");
      }

      // Update in database
      const updated = await this.newsletterRepo.update(id, {
        name: input.name,
        description: input.description,
        pictureUrl: input.pictureUrl,
        reactionsEnabled: input.reactionsEnabled,
      });

      // Audit log
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: id,
        officerId,
        action: "update",
        success: true,
        details: {
          changes: input,
        },
        ipAddress,
      });

      return updated;
    } catch (error) {
      // Audit failed attempt
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: id,
        officerId,
        action: "update",
        success: false,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        ipAddress,
      });

      throw error;
    }
  }

  /**
   * Delete newsletter
   *
   * Steps:
   * 1. Validate newsletter exists and can be deleted
   * 2. Delete via Whapi API
   * 3. Soft delete in database (mark as deleted)
   * 4. Audit log
   */
  async deleteNewsletter(
    id: string,
    officerId: string,
    ipAddress?: string
  ): Promise<void> {
    // Get existing newsletter
    const newsletter = await this.getNewsletterById(id);

    // Check if can be deleted
    const canDelete = newsletter.canBeDeleted();
    if (!canDelete.allowed) {
      throw new ForbiddenError(canDelete.reason || "Cannot delete newsletter");
    }

    try {
      // Delete via Whapi API
      const whapiResult = await whapi.deleteNewsletter(newsletter.channelId);

      if (!whapiResult.success) {
        throw new Error(whapiResult.error || "Failed to delete newsletter on Whapi");
      }

      // Soft delete in database
      await this.newsletterRepo.softDelete(id);

      // Audit log
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: id,
        officerId,
        action: "delete",
        success: true,
        details: {
          name: newsletter.name,
          channelId: newsletter.channelId,
        },
        ipAddress,
      });
    } catch (error) {
      // Audit failed attempt
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: id,
        officerId,
        action: "delete",
        success: false,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        ipAddress,
      });

      throw error;
    }
  }

  /**
   * Broadcast message to newsletter
   *
   * Steps:
   * 1. Validate newsletter can broadcast
   * 2. Send message via Whapi API
   * 3. Audit log
   */
  async broadcastMessage(
    id: string,
    input: BroadcastMessageInput,
    officerId: string,
    ipAddress?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    // Get newsletter
    const newsletter = await this.getNewsletterById(id);

    // Check if can broadcast
    const canBroadcast = newsletter.canBroadcast();
    if (!canBroadcast.allowed) {
      throw new ForbiddenError(canBroadcast.reason || "Cannot broadcast to newsletter");
    }

    // Validate message
    if (!input.message || input.message.trim().length === 0) {
      throw new ValidationError("Message is required");
    }

    try {
      // Send via Whapi API
      const whapiResult = await whapi.sendNewsletterMessage(
        newsletter.channelId,
        input.message
      );

      if (!whapiResult.success) {
        throw new Error(whapiResult.error || "Failed to send newsletter message");
      }

      // Audit log
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: id,
        officerId,
        action: "broadcast",
        success: true,
        details: {
          messageLength: input.message.length,
          messageId: whapiResult.messageId,
        },
        ipAddress,
      });

      return {
        success: true,
        messageId: whapiResult.messageId,
      };
    } catch (error) {
      // Audit failed attempt
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: id,
        officerId,
        action: "broadcast",
        success: false,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        ipAddress,
      });

      throw error;
    }
  }

  /**
   * Sync newsletters from Whapi
   *
   * Fetches newsletters from Whapi and updates subscriber counts
   * Can be called periodically to keep data fresh
   */
  async syncNewsletters(officerId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Fetch from Whapi
      const whapiResult = await whapi.listNewsletters(100);

      if (!whapiResult.success || !whapiResult.newsletters) {
        errors.push(whapiResult.error || "Failed to fetch newsletters from Whapi");
        return { synced, errors };
      }

      // Update each newsletter in database
      for (const whapiNewsletter of whapiResult.newsletters) {
        try {
          const existing = await this.newsletterRepo.findByChannelId(whapiNewsletter.id);

          if (existing) {
            // Update subscriber count
            await this.newsletterRepo.updateSubscriberCount(
              existing.id,
              whapiNewsletter.subscribers || 0
            );
            synced++;
          }
        } catch (error) {
          errors.push(
            `Failed to sync newsletter ${whapiNewsletter.id}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Audit log
      await this.auditRepo.create({
        entityType: "whatsapp_newsletter",
        entityId: undefined,
        officerId,
        action: "sync",
        success: true,
        details: {
          synced,
          errors: errors.length,
        },
      });

      return { synced, errors };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown error");
      return { synced, errors };
    }
  }

  /**
   * Get newsletter statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    deleted: number;
    totalSubscribers: number;
    averageSubscribers: number;
    createdLast30Days: number;
  }> {
    return await this.newsletterRepo.getStatistics();
  }

  /**
   * Toggle newsletter status (activate/deactivate)
   */
  async toggleStatus(
    id: string,
    officerId: string,
    ipAddress?: string
  ): Promise<WhatsAppNewsletter> {
    const newsletter = await this.getNewsletterById(id);

    const newStatus: NewsletterStatus =
      newsletter.status === "active" ? "inactive" : "active";

    const updated = await this.newsletterRepo.updateStatus(id, newStatus);

    // Audit log
    await this.auditRepo.create({
      entityType: "whatsapp_newsletter",
      entityId: id,
      officerId,
      action: "update",
      success: true,
      details: {
        statusChanged: {
          from: newsletter.status,
          to: newStatus,
        },
      },
      ipAddress,
    });

    return updated;
  }
}
