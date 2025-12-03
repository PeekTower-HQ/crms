/**
 * WhatsApp Session Types
 *
 * Defines the state machine and types for WhatsApp bot sessions.
 * Uses PostgreSQL for persistence with 5-minute TTL.
 *
 * Flow:
 * 1. Officer sends message -> Check phone registration
 * 2. Show main menu (NO PIN yet)
 * 3. Select query type -> Prompt for search term
 * 4. Enter search term -> Prompt for PIN
 * 5. Validate PIN -> Execute query -> Show result
 */

/**
 * WhatsApp Session States
 *
 * State Machine:
 * MAIN_MENU -> AWAITING_SEARCH -> AWAITING_PIN -> RESULT_SENT -> MAIN_MENU
 *
 * Note: AWAITING_SEARCH comes BEFORE AWAITING_PIN
 * (officer enters search term first, then PIN to confirm)
 */
export enum WhatsAppSessionState {
  /** Initial state - showing main menu with query options */
  MAIN_MENU = "MAIN_MENU",

  /** User selected a query type, awaiting search term (NIN/plate) */
  AWAITING_SEARCH = "AWAITING_SEARCH",

  /** Search term captured, awaiting PIN authentication */
  AWAITING_PIN = "AWAITING_PIN",

  /** Results have been sent, awaiting next interaction */
  RESULT_SENT = "RESULT_SENT",
}

/**
 * Query Types available via WhatsApp
 */
export enum WhatsAppQueryType {
  WANTED = "wanted",
  MISSING = "missing",
  BACKGROUND = "background",
  VEHICLE = "vehicle",
  STATS = "stats",
}

/**
 * WhatsApp Session Domain Entity
 */
export interface WhatsAppSession {
  id: string;
  phoneNumber: string; // E.164 format
  officerId: string | null;
  state: WhatsAppSessionState;
  selectedQueryType: WhatsAppQueryType | null;
  searchTerm: string | null; // NIN or plate stored before PIN validation
  queryData: Record<string, unknown> | null;
  pinAttempts: number;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new session
 */
export interface CreateWhatsAppSessionDto {
  phoneNumber: string;
  state?: WhatsAppSessionState;
  selectedQueryType?: WhatsAppQueryType;
  ttlMinutes?: number; // Default: 5 minutes
}

/**
 * DTO for updating session
 */
export interface UpdateWhatsAppSessionDto {
  officerId?: string | null;
  state?: WhatsAppSessionState;
  selectedQueryType?: WhatsAppQueryType | null;
  searchTerm?: string | null;
  queryData?: Record<string, unknown> | null;
  pinAttempts?: number;
  ttlMinutes?: number; // Extend TTL on activity
}

/**
 * Session TTL Configuration
 */
export const WHATSAPP_SESSION_CONFIG = {
  /** Default TTL in minutes */
  DEFAULT_TTL_MINUTES: 5,

  /** Max TTL in minutes (for security) */
  MAX_TTL_MINUTES: 10,

  /** Max PIN attempts before session reset */
  MAX_PIN_ATTEMPTS: 3,

  /** Cleanup batch size for expired sessions */
  CLEANUP_BATCH_SIZE: 100,
} as const;

/**
 * Valid state transitions for the session state machine
 */
export const VALID_STATE_TRANSITIONS: Record<
  WhatsAppSessionState,
  WhatsAppSessionState[]
> = {
  [WhatsAppSessionState.MAIN_MENU]: [
    WhatsAppSessionState.AWAITING_SEARCH,
    WhatsAppSessionState.AWAITING_PIN, // For stats (skip search)
  ],
  [WhatsAppSessionState.AWAITING_SEARCH]: [
    WhatsAppSessionState.AWAITING_PIN,
    WhatsAppSessionState.MAIN_MENU, // Back/cancel
  ],
  [WhatsAppSessionState.AWAITING_PIN]: [
    WhatsAppSessionState.RESULT_SENT,
    WhatsAppSessionState.MAIN_MENU, // Failed PIN attempts
  ],
  [WhatsAppSessionState.RESULT_SENT]: [
    WhatsAppSessionState.MAIN_MENU, // Any message restarts
  ],
};

/**
 * Check if a state transition is valid
 */
export function isValidStateTransition(
  from: WhatsAppSessionState,
  to: WhatsAppSessionState
): boolean {
  const allowedTransitions = VALID_STATE_TRANSITIONS[from] || [];
  return allowedTransitions.includes(to);
}
