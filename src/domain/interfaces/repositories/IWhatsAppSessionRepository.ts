/**
 * WhatsApp Session Repository Interface
 *
 * Handles persistence and retrieval of WhatsApp session data
 * using PostgreSQL with automatic TTL management.
 *
 * Key features:
 * - Phone number as primary lookup key
 * - 5-minute TTL with activity-based extension
 * - On-access expiry cleanup
 * - State transition validation
 */

import {
  WhatsAppSession,
  WhatsAppSessionState,
  WhatsAppQueryType,
  CreateWhatsAppSessionDto,
  UpdateWhatsAppSessionDto,
} from "@/src/domain/types/WhatsAppSession";

export interface IWhatsAppSessionRepository {
  // ==================== CRUD Operations ====================

  /**
   * Find session by phone number (primary lookup method)
   * Returns null if session not found OR expired
   *
   * @param phoneNumber E.164 format phone number
   * @returns Session or null if not found/expired
   */
  findByPhoneNumber(phoneNumber: string): Promise<WhatsAppSession | null>;

  /**
   * Find session by ID
   *
   * @param id Session UUID
   * @returns Session or null if not found/expired
   */
  findById(id: string): Promise<WhatsAppSession | null>;

  /**
   * Create a new session
   * If session already exists for phone number, it will be replaced
   *
   * @param data Session creation data
   * @returns Created session
   */
  create(data: CreateWhatsAppSessionDto): Promise<WhatsAppSession>;

  /**
   * Update session by phone number
   * Automatically extends TTL on update (activity resets expiration)
   *
   * @param phoneNumber E.164 format phone number
   * @param data Update data
   * @returns Updated session
   * @throws Error if session not found
   */
  update(
    phoneNumber: string,
    data: UpdateWhatsAppSessionDto
  ): Promise<WhatsAppSession>;

  /**
   * Delete session by phone number
   *
   * @param phoneNumber E.164 format phone number
   */
  delete(phoneNumber: string): Promise<void>;

  // ==================== State Management ====================

  /**
   * Transition session to a new state
   * Validates state transition is allowed
   *
   * @param phoneNumber E.164 format phone number
   * @param newState Target state
   * @returns Updated session
   * @throws Error if transition is invalid
   */
  transitionState(
    phoneNumber: string,
    newState: WhatsAppSessionState
  ): Promise<WhatsAppSession>;

  /**
   * Set the selected query type and transition to AWAITING_SEARCH
   * For stats, transitions directly to AWAITING_PIN
   *
   * @param phoneNumber E.164 format phone number
   * @param queryType Selected query type
   * @returns Updated session
   */
  setQueryType(
    phoneNumber: string,
    queryType: WhatsAppQueryType
  ): Promise<WhatsAppSession>;

  /**
   * Set search term and transition to AWAITING_PIN
   *
   * @param phoneNumber E.164 format phone number
   * @param searchTerm NIN or license plate
   * @returns Updated session
   */
  setSearchTerm(
    phoneNumber: string,
    searchTerm: string
  ): Promise<WhatsAppSession>;

  /**
   * Authenticate session (set officer ID) after PIN validation
   *
   * @param phoneNumber E.164 format phone number
   * @param officerId Officer ID after PIN verification
   * @returns Updated session
   */
  authenticate(
    phoneNumber: string,
    officerId: string
  ): Promise<WhatsAppSession>;

  /**
   * Increment failed PIN attempts
   * Returns true if max attempts reached
   *
   * @param phoneNumber E.164 format phone number
   * @returns true if should reset session (max attempts)
   */
  incrementPinAttempts(phoneNumber: string): Promise<boolean>;

  /**
   * Reset session to MAIN_MENU state
   *
   * @param phoneNumber E.164 format phone number
   * @returns Reset session
   */
  resetToMainMenu(phoneNumber: string): Promise<WhatsAppSession>;

  // ==================== TTL Management ====================

  /**
   * Extend session TTL (called on any activity)
   *
   * @param phoneNumber E.164 format phone number
   * @param ttlMinutes TTL in minutes (default: 5)
   */
  extendTTL(phoneNumber: string, ttlMinutes?: number): Promise<void>;

  /**
   * Check if session is expired
   *
   * @param phoneNumber E.164 format phone number
   * @returns true if expired or not found
   */
  isExpired(phoneNumber: string): Promise<boolean>;

  // ==================== Cleanup Operations ====================

  /**
   * Delete all expired sessions
   * Should be called periodically (on-access or cron)
   *
   * @returns Number of sessions deleted
   */
  cleanupExpired(): Promise<number>;

  /**
   * Get count of active (non-expired) sessions
   * For monitoring/analytics
   */
  getActiveSessionCount(): Promise<number>;

  // ==================== Utility ====================

  /**
   * Check if session exists and is valid (not expired)
   *
   * @param phoneNumber E.164 format phone number
   */
  exists(phoneNumber: string): Promise<boolean>;

  /**
   * Get or create session for phone number
   * If session exists and is valid, returns it (extends TTL)
   * If expired or doesn't exist, creates new session in MAIN_MENU state
   *
   * @param phoneNumber E.164 format phone number
   * @returns Existing or new session
   */
  getOrCreate(phoneNumber: string): Promise<WhatsAppSession>;
}
