/**
 * IWhatsAppNewsletterRepository
 *
 * Repository interface for WhatsAppNewsletter entity
 * Defines contract for data access operations
 *
 * Pan-African Design: Country-agnostic newsletter management
 */

import {
  WhatsAppNewsletter,
  NewsletterStatus,
} from "@/src/domain/entities/WhatsAppNewsletter";

/**
 * DTO for creating a new Newsletter
 */
export interface CreateWhatsAppNewsletterDto {
  channelId: string;              // WhatsApp channel ID
  name: string;
  description?: string | null;
  pictureUrl?: string | null;
  status?: NewsletterStatus;
  subscriberCount?: number | null;
  reactionsEnabled?: boolean;
  createdById: string;
}

/**
 * DTO for updating a Newsletter
 */
export interface UpdateWhatsAppNewsletterDto {
  name?: string;
  description?: string | null;
  pictureUrl?: string | null;
  status?: NewsletterStatus;
  subscriberCount?: number | null;
  reactionsEnabled?: boolean;
}

/**
 * Filters for querying Newsletters
 */
export interface WhatsAppNewsletterFilters {
  status?: NewsletterStatus;
  createdById?: string;
  fromDate?: Date;
  toDate?: Date;
  searchTerm?: string;  // Search in name or description
}

/**
 * Newsletter statistics
 */
export interface WhatsAppNewsletterStatistics {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  totalSubscribers: number;
  averageSubscribers: number;
  createdLast30Days: number;
}

/**
 * WhatsAppNewsletter Repository Interface
 *
 * Defines all data access operations for WhatsApp Newsletters
 */
export interface IWhatsAppNewsletterRepository {
  /**
   * Find newsletter by ID
   */
  findById(id: string): Promise<WhatsAppNewsletter | null>;

  /**
   * Find newsletter by channel ID
   */
  findByChannelId(channelId: string): Promise<WhatsAppNewsletter | null>;

  /**
   * Find all newsletters matching filters
   */
  findAll(
    filters?: WhatsAppNewsletterFilters,
    limit?: number,
    offset?: number
  ): Promise<WhatsAppNewsletter[]>;

  /**
   * Find active newsletters only
   */
  findActive(limit?: number): Promise<WhatsAppNewsletter[]>;

  /**
   * Find newsletters by status
   */
  findByStatus(
    status: NewsletterStatus,
    limit?: number,
    offset?: number
  ): Promise<WhatsAppNewsletter[]>;

  /**
   * Find newsletters created by officer
   */
  findByOfficer(
    officerId: string,
    limit?: number,
    offset?: number
  ): Promise<WhatsAppNewsletter[]>;

  /**
   * Search newsletters by name or description
   */
  search(searchTerm: string, limit?: number): Promise<WhatsAppNewsletter[]>;

  /**
   * Create new newsletter
   */
  create(data: CreateWhatsAppNewsletterDto): Promise<WhatsAppNewsletter>;

  /**
   * Update newsletter
   */
  update(id: string, data: UpdateWhatsAppNewsletterDto): Promise<WhatsAppNewsletter>;

  /**
   * Update newsletter status
   */
  updateStatus(id: string, status: NewsletterStatus): Promise<WhatsAppNewsletter>;

  /**
   * Update subscriber count (from Whapi sync)
   */
  updateSubscriberCount(id: string, count: number): Promise<WhatsAppNewsletter>;

  /**
   * Soft delete newsletter (mark as deleted)
   */
  softDelete(id: string): Promise<WhatsAppNewsletter>;

  /**
   * Hard delete newsletter (remove from database)
   */
  delete(id: string): Promise<void>;

  /**
   * Count newsletters matching filters
   */
  count(filters?: WhatsAppNewsletterFilters): Promise<number>;

  /**
   * Get newsletter statistics
   */
  getStatistics(fromDate?: Date, toDate?: Date): Promise<WhatsAppNewsletterStatistics>;

  /**
   * Check if newsletter with channel ID exists
   */
  existsByChannelId(channelId: string): Promise<boolean>;
}
