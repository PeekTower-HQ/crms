/**
 * WhatsAppNewsletter Repository Implementation
 *
 * Implements IWhatsAppNewsletterRepository with Prisma ORM
 * Handles newsletter storage and retrieval
 *
 * Pan-African Design: Country-agnostic newsletter data access
 */

import { BaseRepository } from "../base/BaseRepository";
import {
  IWhatsAppNewsletterRepository,
  CreateWhatsAppNewsletterDto,
  UpdateWhatsAppNewsletterDto,
  WhatsAppNewsletterFilters,
  WhatsAppNewsletterStatistics,
} from "@/src/domain/interfaces/repositories/IWhatsAppNewsletterRepository";
import {
  WhatsAppNewsletter,
  NewsletterStatus,
} from "@/src/domain/entities/WhatsAppNewsletter";
import { Prisma } from "@prisma/client";

/**
 * WhatsAppNewsletterRepository implementation using Prisma
 */
export class WhatsAppNewsletterRepository
  extends BaseRepository
  implements IWhatsAppNewsletterRepository
{
  /**
   * Map Prisma WhatsAppNewsletter to domain entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(data: any): WhatsAppNewsletter {
    return new WhatsAppNewsletter(
      data.id,
      data.channelId,
      data.name,
      data.description,
      data.pictureUrl,
      data.status as NewsletterStatus,
      data.subscriberCount,
      data.reactionsEnabled,
      data.createdById,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(
    filters?: WhatsAppNewsletterFilters
  ): Prisma.WhatsAppNewsletterWhereInput {
    if (!filters) return {};

    const where: Prisma.WhatsAppNewsletterWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    if (filters.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: "insensitive" } },
        { description: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * Find newsletter by ID
   */
  async findById(id: string): Promise<WhatsAppNewsletter | null> {
    return this.execute(async () => {
      const data = await this.prisma.whatsAppNewsletter.findUnique({
        where: { id },
      });

      return data ? this.toDomain(data) : null;
    }, "findById");
  }

  /**
   * Find newsletter by channel ID
   */
  async findByChannelId(channelId: string): Promise<WhatsAppNewsletter | null> {
    return this.execute(async () => {
      const data = await this.prisma.whatsAppNewsletter.findUnique({
        where: { channelId },
      });

      return data ? this.toDomain(data) : null;
    }, "findByChannelId");
  }

  /**
   * Find all newsletters matching filters
   */
  async findAll(
    filters?: WhatsAppNewsletterFilters,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppNewsletter[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const data = await this.prisma.whatsAppNewsletter.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findAll");
  }

  /**
   * Find active newsletters only
   */
  async findActive(limit = 100): Promise<WhatsAppNewsletter[]> {
    return this.execute(async () => {
      const data = await this.prisma.whatsAppNewsletter.findMany({
        where: { status: "active" },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findActive");
  }

  /**
   * Find newsletters by status
   */
  async findByStatus(
    status: NewsletterStatus,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppNewsletter[]> {
    return this.execute(async () => {
      const data = await this.prisma.whatsAppNewsletter.findMany({
        where: { status },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByStatus");
  }

  /**
   * Find newsletters created by officer
   */
  async findByOfficer(
    officerId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppNewsletter[]> {
    return this.execute(async () => {
      const data = await this.prisma.whatsAppNewsletter.findMany({
        where: { createdById: officerId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByOfficer");
  }

  /**
   * Search newsletters by name or description
   */
  async search(searchTerm: string, limit = 50): Promise<WhatsAppNewsletter[]> {
    return this.execute(async () => {
      const data = await this.prisma.whatsAppNewsletter.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "search");
  }

  /**
   * Create new newsletter
   */
  async create(data: CreateWhatsAppNewsletterDto): Promise<WhatsAppNewsletter> {
    return this.execute(async () => {
      const created = await this.prisma.whatsAppNewsletter.create({
        data: {
          channelId: data.channelId,
          name: data.name,
          description: data.description || null,
          pictureUrl: data.pictureUrl || null,
          status: data.status || "active",
          subscriberCount: data.subscriberCount || 0,
          reactionsEnabled: data.reactionsEnabled !== undefined ? data.reactionsEnabled : true,
          createdById: data.createdById,
        },
      });

      return this.toDomain(created);
    }, "create");
  }

  /**
   * Update newsletter
   */
  async update(
    id: string,
    data: UpdateWhatsAppNewsletterDto
  ): Promise<WhatsAppNewsletter> {
    return this.execute(async () => {
      const updated = await this.prisma.whatsAppNewsletter.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.pictureUrl !== undefined && { pictureUrl: data.pictureUrl }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.subscriberCount !== undefined && { subscriberCount: data.subscriberCount }),
          ...(data.reactionsEnabled !== undefined && { reactionsEnabled: data.reactionsEnabled }),
        },
      });

      return this.toDomain(updated);
    }, "update");
  }

  /**
   * Update newsletter status
   */
  async updateStatus(
    id: string,
    status: NewsletterStatus
  ): Promise<WhatsAppNewsletter> {
    return this.execute(async () => {
      const updated = await this.prisma.whatsAppNewsletter.update({
        where: { id },
        data: { status },
      });

      return this.toDomain(updated);
    }, "updateStatus");
  }

  /**
   * Update subscriber count (from Whapi sync)
   */
  async updateSubscriberCount(id: string, count: number): Promise<WhatsAppNewsletter> {
    return this.execute(async () => {
      const updated = await this.prisma.whatsAppNewsletter.update({
        where: { id },
        data: { subscriberCount: count },
      });

      return this.toDomain(updated);
    }, "updateSubscriberCount");
  }

  /**
   * Soft delete newsletter (mark as deleted)
   */
  async softDelete(id: string): Promise<WhatsAppNewsletter> {
    return this.execute(async () => {
      const updated = await this.prisma.whatsAppNewsletter.update({
        where: { id },
        data: { status: "deleted" },
      });

      return this.toDomain(updated);
    }, "softDelete");
  }

  /**
   * Hard delete newsletter (remove from database)
   */
  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.whatsAppNewsletter.delete({
        where: { id },
      });
    }, "delete");
  }

  /**
   * Count newsletters matching filters
   */
  async count(filters?: WhatsAppNewsletterFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);
      return await this.prisma.whatsAppNewsletter.count({ where });
    }, "count");
  }

  /**
   * Get newsletter statistics
   */
  async getStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<WhatsAppNewsletterStatistics> {
    return this.execute(async () => {
      const where: Prisma.WhatsAppNewsletterWhereInput = {};

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = fromDate;
        }
        if (toDate) {
          where.createdAt.lte = toDate;
        }
      }

      // Get counts by status
      const [total, active, inactive, deleted] = await Promise.all([
        this.prisma.whatsAppNewsletter.count({ where }),
        this.prisma.whatsAppNewsletter.count({ where: { ...where, status: "active" } }),
        this.prisma.whatsAppNewsletter.count({ where: { ...where, status: "inactive" } }),
        this.prisma.whatsAppNewsletter.count({ where: { ...where, status: "deleted" } }),
      ]);

      // Count created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const createdLast30Days = await this.prisma.whatsAppNewsletter.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Calculate subscriber statistics
      const aggregateResult = await this.prisma.whatsAppNewsletter.aggregate({
        where: { ...where, subscriberCount: { not: null } },
        _sum: {
          subscriberCount: true,
        },
        _avg: {
          subscriberCount: true,
        },
      });

      const totalSubscribers = aggregateResult._sum.subscriberCount || 0;
      const averageSubscribers = Math.round(aggregateResult._avg.subscriberCount || 0);

      return {
        total,
        active,
        inactive,
        deleted,
        totalSubscribers,
        averageSubscribers,
        createdLast30Days,
      };
    }, "getStatistics");
  }

  /**
   * Check if newsletter with channel ID exists
   */
  async existsByChannelId(channelId: string): Promise<boolean> {
    return this.execute(async () => {
      const count = await this.prisma.whatsAppNewsletter.count({
        where: { channelId },
      });

      return count > 0;
    }, "existsByChannelId");
  }
}
