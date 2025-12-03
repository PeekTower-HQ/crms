/**
 * Field Check Service Interface
 *
 * Channel-agnostic interface for field check operations.
 * Designed to be consumed by both USSD and WhatsApp channels.
 *
 * Pan-African Design:
 * - Channel-independent business logic
 * - Rate limiting for fair usage
 * - Complete audit trail
 * - Structured results for formatting flexibility
 */

/**
 * Field Check Types
 */
export type FieldCheckType =
  | "wanted"
  | "missing"
  | "background"
  | "vehicle"
  | "stats";

/**
 * Channel identifiers for audit logging
 */
export type FieldCheckChannel = "ussd" | "whatsapp" | "api";

/**
 * Authenticated officer context
 */
export interface AuthenticatedOfficer {
  id: string;
  badge: string;
  name: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  roleLevel: number;
  dailyLimit: number;
}

/**
 * Authentication result
 */
export interface FieldCheckAuthResult {
  success: boolean;
  officer?: AuthenticatedOfficer;
  error?: string;
  errorCode?:
    | "INVALID_PIN"
    | "NOT_REGISTERED"
    | "ACCOUNT_INACTIVE"
    | "CHANNEL_DISABLED"
    | "ACCOUNT_LOCKED";
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

/**
 * Base field check request
 */
export interface FieldCheckRequest {
  officerId: string;
  checkType: FieldCheckType;
  searchTerm: string;
  channel: FieldCheckChannel;
  sessionId?: string;
  ipAddress?: string;
}

/**
 * Wanted person check result
 */
export interface WantedPersonCheckResult {
  found: boolean;
  personExists: boolean;
  isWanted: boolean;
  person?: {
    name: string;
    nin: string | null;
  };
  wantedDetails?: {
    warrantNumber: string | null;
    charges: string[];
    dangerLevel: "low" | "medium" | "high" | "extreme";
    issuedDate?: Date;
    lastSeenLocation: string | null;
    rewardAmount: number | null;
    contactPhone?: string;
  };
}

/**
 * Missing person check result
 */
export interface MissingPersonCheckResult {
  found: boolean;
  personExists: boolean;
  isMissing: boolean;
  person?: {
    name: string;
    nin: string | null;
  };
  missingDetails?: {
    status: string;
    lastSeenLocation: string | null;
    lastSeenDate: Date | null;
    description?: string;
    contactPhone?: string;
  };
}

/**
 * Background check result
 */
export interface BackgroundCheckResult {
  found: boolean;
  personExists: boolean;
  status: "clear" | "has_record";
  person?: {
    name: string;
    nin: string | null;
  };
  recordDetails?: {
    caseCount: number;
    isWanted: boolean;
    isMissing: boolean;
    riskLevel: "low" | "medium" | "high";
  };
}

/**
 * Vehicle check result
 */
export interface VehicleCheckResult {
  found: boolean;
  status: "not_found" | "clean" | "stolen" | "impounded" | "recovered";
  vehicle?: {
    licensePlate: string;
    make: string | null;
    model: string | null;
    color: string | null;
    year: number | null;
    ownerName: string | null;
  };
  stolenDetails?: {
    stolenDate: Date;
    daysStolen: number;
    reportedBy: string | null;
  };
}

/**
 * Query statistics
 */
export interface QueryStatistics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  byType: Record<string, number>;
  successRate: number;
}

/**
 * Generic field check result wrapper
 */
export interface FieldCheckResult<T> {
  success: boolean;
  checkType: FieldCheckType;
  timestamp: Date;
  officerId: string;
  data?: T;
  error?: string;
  errorCode?:
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "DATABASE_ERROR"
    | "VALIDATION_ERROR";
}

/**
 * Field Check Service Interface
 */
export interface IFieldCheckService {
  /**
   * Find officer by phone number (for USSD/WhatsApp identification)
   */
  findOfficerByPhone(phoneNumber: string): Promise<AuthenticatedOfficer | null>;

  /**
   * Verify PIN for an already identified officer
   * Used when officer is already identified by phone/session
   */
  verifyOfficerPin(officerId: string, quickPin: string): Promise<boolean>;

  /**
   * Check if officer has channel enabled
   */
  isChannelEnabled(
    officerId: string,
    channel: FieldCheckChannel
  ): Promise<boolean>;

  /**
   * Check rate limit for officer
   */
  checkRateLimit(officerId: string): Promise<RateLimitCheckResult>;

  /**
   * Perform wanted person check
   */
  checkWantedPerson(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<WantedPersonCheckResult>>;

  /**
   * Perform missing person check
   */
  checkMissingPerson(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<MissingPersonCheckResult>>;

  /**
   * Perform background check
   */
  checkBackground(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<BackgroundCheckResult>>;

  /**
   * Perform vehicle check
   */
  checkVehicle(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<VehicleCheckResult>>;

  /**
   * Get officer query statistics
   */
  getStatistics(
    officerId: string,
    channel: FieldCheckChannel
  ): Promise<FieldCheckResult<QueryStatistics>>;
}
