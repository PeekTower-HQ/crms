/**
 * WhatsAppNewsletter Domain Entity
 *
 * Represents a WhatsApp Newsletter/Channel in the system
 * Includes business logic for newsletter validation and status management
 *
 * Pan-African Design:
 * - Multi-language broadcast capability
 * - Support for low-bandwidth environments
 * - Channel-based public communication
 */

/**
 * Newsletter Status
 */
export type NewsletterStatus = "active" | "inactive" | "deleted";

/**
 * WhatsAppNewsletter Entity
 *
 * Core domain entity for managing WhatsApp Newsletters with business logic
 */
export class WhatsAppNewsletter {
  constructor(
    public readonly id: string,
    public readonly channelId: string,           // WhatsApp channel ID (e.g., "120363401094307597@newsletter")
    public readonly name: string,
    public readonly description: string | null,
    public readonly pictureUrl: string | null,
    public readonly status: NewsletterStatus,
    public readonly subscriberCount: number | null,
    public readonly reactionsEnabled: boolean,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if the newsletter is active
   */
  isActive(): boolean {
    return this.status === "active";
  }

  /**
   * Check if the newsletter is deleted
   */
  isDeleted(): boolean {
    return this.status === "deleted";
  }

  /**
   * Check if the newsletter can be deleted
   */
  canBeDeleted(): { allowed: boolean; reason?: string } {
    if (this.status === "deleted") {
      return { allowed: false, reason: "Newsletter is already deleted" };
    }

    return { allowed: true };
  }

  /**
   * Check if the newsletter can be updated
   */
  canBeUpdated(): { allowed: boolean; reason?: string } {
    if (this.status === "deleted") {
      return { allowed: false, reason: "Cannot update deleted newsletter" };
    }

    return { allowed: true };
  }

  /**
   * Check if the newsletter can send broadcasts
   */
  canBroadcast(): { allowed: boolean; reason?: string } {
    if (this.status === "deleted") {
      return { allowed: false, reason: "Cannot broadcast to deleted newsletter" };
    }

    if (this.status === "inactive") {
      return { allowed: false, reason: "Newsletter is inactive" };
    }

    return { allowed: true };
  }

  /**
   * Get newsletter display name with status indicator
   */
  getDisplayName(): string {
    if (this.status === "inactive") {
      return `${this.name} (Inactive)`;
    }
    if (this.status === "deleted") {
      return `${this.name} (Deleted)`;
    }
    return this.name;
  }

  /**
   * Get formatted channel ID (ensures @newsletter suffix)
   */
  getFormattedChannelId(): string {
    return this.channelId.includes("@newsletter")
      ? this.channelId
      : `${this.channelId}@newsletter`;
  }

  /**
   * Get subscriber count display text
   */
  getSubscriberDisplay(): string {
    if (this.subscriberCount === null) {
      return "Unknown";
    }
    if (this.subscriberCount === 0) {
      return "No subscribers";
    }
    if (this.subscriberCount === 1) {
      return "1 subscriber";
    }
    return `${this.subscriberCount.toLocaleString()} subscribers`;
  }

  /**
   * Check if newsletter has a profile picture
   */
  hasPicture(): boolean {
    return this.pictureUrl !== null && this.pictureUrl.length > 0;
  }

  /**
   * Get status badge color for UI
   */
  getStatusColor(): string {
    const colors: Record<NewsletterStatus, string> = {
      active: "green",
      inactive: "yellow",
      deleted: "gray",
    };
    return colors[this.status] || "gray";
  }

  /**
   * Validate newsletter data meets minimum requirements
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("Newsletter name is required");
    }

    if (this.name && this.name.length > 255) {
      errors.push("Newsletter name must be 255 characters or less");
    }

    if (!this.channelId || this.channelId.trim().length === 0) {
      errors.push("WhatsApp channel ID is required");
    }

    if (!this.createdById || this.createdById.trim().length === 0) {
      errors.push("Created by officer ID is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get age of newsletter in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check if newsletter was recently created (within 7 days)
   */
  isRecentlyCreated(): boolean {
    return this.getAgeInDays() <= 7;
  }
}
