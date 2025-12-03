/**
 * WhatsApp Session Repository Implementation
 *
 * PostgreSQL-based session storage for WhatsApp bot.
 * Implements automatic TTL management and state transitions.
 *
 * Features:
 * - PostgreSQL persistence (survives server restarts)
 * - Automatic TTL with configurable expiration
 * - On-access cleanup of expired sessions
 * - State machine validation
 */

import { Prisma, PrismaClient, WhatsAppSession as PrismaWhatsAppSession } from "@prisma/client";
import { BaseRepository } from "../base/BaseRepository";
import { IWhatsAppSessionRepository } from "@/src/domain/interfaces/repositories/IWhatsAppSessionRepository";
import {
  WhatsAppSession,
  WhatsAppSessionState,
  WhatsAppQueryType,
  CreateWhatsAppSessionDto,
  UpdateWhatsAppSessionDto,
  WHATSAPP_SESSION_CONFIG,
  isValidStateTransition,
} from "@/src/domain/types/WhatsAppSession";
import { NotFoundError, ValidationError } from "@/src/lib/errors";

export class WhatsAppSessionRepository
  extends BaseRepository
  implements IWhatsAppSessionRepository
{
  private cleanupCounter: number = 0;
  private readonly CLEANUP_INTERVAL: number = 10; // Run cleanup every 10 operations

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  // ==================== CRUD Operations ====================

  async findByPhoneNumber(phoneNumber: string): Promise<WhatsAppSession | null> {
    // Opportunistic cleanup on read
    await this.maybeCleanupExpired();

    return this.execute(async () => {
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { phoneNumber },
      });

      if (!session) return null;

      // Check if expired
      if (new Date() > session.expiresAt) {
        // Delete expired session
        await this.prisma.whatsAppSession.delete({
          where: { phoneNumber },
        });
        return null;
      }

      return this.toDomain(session);
    }, "findByPhoneNumber");
  }

  async findById(id: string): Promise<WhatsAppSession | null> {
    return this.execute(async () => {
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { id },
      });

      if (!session) return null;

      // Check if expired
      if (new Date() > session.expiresAt) {
        await this.prisma.whatsAppSession.delete({
          where: { id },
        });
        return null;
      }

      return this.toDomain(session);
    }, "findById");
  }

  async create(data: CreateWhatsAppSessionDto): Promise<WhatsAppSession> {
    return this.execute(async () => {
      const ttlMinutes =
        data.ttlMinutes ?? WHATSAPP_SESSION_CONFIG.DEFAULT_TTL_MINUTES;
      const expiresAt = this.calculateExpiresAt(ttlMinutes);

      // Use upsert to handle case where session already exists
      const session = await this.prisma.whatsAppSession.upsert({
        where: { phoneNumber: data.phoneNumber },
        update: {
          state: data.state ?? WhatsAppSessionState.MAIN_MENU,
          selectedQueryType: data.selectedQueryType ?? null,
          searchTerm: null,
          queryData: Prisma.JsonNull,
          officerId: null, // Reset authentication on new session
          pinAttempts: 0,
          expiresAt,
          lastActivityAt: new Date(),
        },
        create: {
          phoneNumber: data.phoneNumber,
          state: data.state ?? WhatsAppSessionState.MAIN_MENU,
          selectedQueryType: data.selectedQueryType ?? null,
          expiresAt,
        },
      });

      return this.toDomain(session);
    }, "create");
  }

  async update(
    phoneNumber: string,
    data: UpdateWhatsAppSessionDto
  ): Promise<WhatsAppSession> {
    return this.execute(async () => {
      // Build update object
      const updateData: Record<string, unknown> = {
        lastActivityAt: new Date(),
      };

      if (data.officerId !== undefined) updateData.officerId = data.officerId;
      if (data.state !== undefined) updateData.state = data.state;
      if (data.selectedQueryType !== undefined)
        updateData.selectedQueryType = data.selectedQueryType;
      if (data.searchTerm !== undefined) updateData.searchTerm = data.searchTerm;
      if (data.queryData !== undefined) updateData.queryData = data.queryData;
      if (data.pinAttempts !== undefined)
        updateData.pinAttempts = data.pinAttempts;

      // Extend TTL if specified or by default
      const ttlMinutes =
        data.ttlMinutes ?? WHATSAPP_SESSION_CONFIG.DEFAULT_TTL_MINUTES;
      updateData.expiresAt = this.calculateExpiresAt(ttlMinutes);

      const session = await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: updateData,
      });

      return this.toDomain(session);
    }, "update");
  }

  async delete(phoneNumber: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.whatsAppSession.deleteMany({
        where: { phoneNumber },
      });
    }, "delete");
  }

  // ==================== State Management ====================

  async transitionState(
    phoneNumber: string,
    newState: WhatsAppSessionState
  ): Promise<WhatsAppSession> {
    return this.execute(async () => {
      // Get current session
      const current = await this.prisma.whatsAppSession.findUnique({
        where: { phoneNumber },
      });

      if (!current) {
        throw new NotFoundError(`Session not found for phone: ${phoneNumber}`);
      }

      // Validate transition
      const currentState = current.state as WhatsAppSessionState;

      if (!isValidStateTransition(currentState, newState)) {
        throw new ValidationError(
          `Invalid state transition: ${currentState} -> ${newState}`,
          "state"
        );
      }

      // Perform transition
      const updated = await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: {
          state: newState,
          lastActivityAt: new Date(),
          expiresAt: this.calculateExpiresAt(),
        },
      });

      return this.toDomain(updated);
    }, "transitionState");
  }

  async setQueryType(
    phoneNumber: string,
    queryType: WhatsAppQueryType
  ): Promise<WhatsAppSession> {
    return this.execute(async () => {
      // For stats, skip to AWAITING_PIN; for others, go to AWAITING_SEARCH
      const nextState =
        queryType === WhatsAppQueryType.STATS
          ? WhatsAppSessionState.AWAITING_PIN
          : WhatsAppSessionState.AWAITING_SEARCH;

      const session = await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: {
          selectedQueryType: queryType,
          state: nextState,
          lastActivityAt: new Date(),
          expiresAt: this.calculateExpiresAt(),
        },
      });

      return this.toDomain(session);
    }, "setQueryType");
  }

  async setSearchTerm(
    phoneNumber: string,
    searchTerm: string
  ): Promise<WhatsAppSession> {
    return this.execute(async () => {
      const session = await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: {
          searchTerm,
          state: WhatsAppSessionState.AWAITING_PIN,
          lastActivityAt: new Date(),
          expiresAt: this.calculateExpiresAt(),
        },
      });

      return this.toDomain(session);
    }, "setSearchTerm");
  }

  async authenticate(
    phoneNumber: string,
    officerId: string
  ): Promise<WhatsAppSession> {
    return this.execute(async () => {
      const session = await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: {
          officerId,
          pinAttempts: 0, // Reset attempts on success
          lastActivityAt: new Date(),
          expiresAt: this.calculateExpiresAt(),
        },
      });

      return this.toDomain(session);
    }, "authenticate");
  }

  async incrementPinAttempts(phoneNumber: string): Promise<boolean> {
    return this.execute(async () => {
      const session = await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: {
          pinAttempts: { increment: 1 },
          lastActivityAt: new Date(),
          expiresAt: this.calculateExpiresAt(),
        },
      });

      return session.pinAttempts >= WHATSAPP_SESSION_CONFIG.MAX_PIN_ATTEMPTS;
    }, "incrementPinAttempts");
  }

  async resetToMainMenu(phoneNumber: string): Promise<WhatsAppSession> {
    return this.execute(async () => {
      const session = await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: {
          state: WhatsAppSessionState.MAIN_MENU,
          selectedQueryType: null,
          searchTerm: null,
          queryData: Prisma.JsonNull,
          pinAttempts: 0,
          lastActivityAt: new Date(),
          expiresAt: this.calculateExpiresAt(),
        },
      });

      return this.toDomain(session);
    }, "resetToMainMenu");
  }

  // ==================== TTL Management ====================

  async extendTTL(phoneNumber: string, ttlMinutes?: number): Promise<void> {
    const ttl = ttlMinutes ?? WHATSAPP_SESSION_CONFIG.DEFAULT_TTL_MINUTES;

    return this.execute(async () => {
      await this.prisma.whatsAppSession.update({
        where: { phoneNumber },
        data: {
          expiresAt: this.calculateExpiresAt(ttl),
          lastActivityAt: new Date(),
        },
      });
    }, "extendTTL");
  }

  async isExpired(phoneNumber: string): Promise<boolean> {
    return this.execute(async () => {
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { phoneNumber },
        select: { expiresAt: true },
      });

      if (!session) return true;
      return new Date() > session.expiresAt;
    }, "isExpired");
  }

  // ==================== Cleanup Operations ====================

  async cleanupExpired(): Promise<number> {
    return this.execute(async () => {
      const result = await this.prisma.whatsAppSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        console.log(
          `[WhatsAppSessionRepository] Cleaned up ${result.count} expired sessions`
        );
      }

      return result.count;
    }, "cleanupExpired");
  }

  async getActiveSessionCount(): Promise<number> {
    return this.execute(async () => {
      return await this.prisma.whatsAppSession.count({
        where: {
          expiresAt: { gte: new Date() },
        },
      });
    }, "getActiveSessionCount");
  }

  // ==================== Utility ====================

  async exists(phoneNumber: string): Promise<boolean> {
    const session = await this.findByPhoneNumber(phoneNumber);
    return session !== null;
  }

  async getOrCreate(phoneNumber: string): Promise<WhatsAppSession> {
    // Try to get existing session
    const existing = await this.findByPhoneNumber(phoneNumber);

    if (existing) {
      // Extend TTL on access
      await this.extendTTL(phoneNumber);
      return existing;
    }

    // Create new session
    return this.create({ phoneNumber });
  }

  // ==================== Private Helpers ====================

  /**
   * Calculate expiration timestamp from now
   */
  private calculateExpiresAt(ttlMinutes?: number): Date {
    const ttl = Math.min(
      ttlMinutes ?? WHATSAPP_SESSION_CONFIG.DEFAULT_TTL_MINUTES,
      WHATSAPP_SESSION_CONFIG.MAX_TTL_MINUTES
    );
    return new Date(Date.now() + ttl * 60 * 1000);
  }

  /**
   * Map Prisma model to domain type
   */
  private toDomain(data: PrismaWhatsAppSession): WhatsAppSession {
    return {
      id: data.id,
      phoneNumber: data.phoneNumber,
      officerId: data.officerId,
      state: data.state as WhatsAppSessionState,
      selectedQueryType: data.selectedQueryType as WhatsAppQueryType | null,
      searchTerm: data.searchTerm,
      queryData: data.queryData as Record<string, unknown> | null,
      pinAttempts: data.pinAttempts,
      expiresAt: data.expiresAt,
      lastActivityAt: data.lastActivityAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Opportunistic cleanup - runs cleanup every N operations
   * This is a lightweight alternative to a cron job
   */
  private async maybeCleanupExpired(): Promise<void> {
    this.cleanupCounter++;

    if (this.cleanupCounter >= this.CLEANUP_INTERVAL) {
      this.cleanupCounter = 0;
      // Run cleanup in background (don't await)
      this.cleanupExpired().catch((err) => {
        console.error("[WhatsAppSessionRepository] Cleanup error:", err);
      });
    }
  }
}
