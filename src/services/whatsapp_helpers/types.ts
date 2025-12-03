/**
 * WhatsApp Handler Types
 *
 * Shared interfaces for WhatsApp query handlers.
 */

import { WhatsAppSession } from "@/src/domain/types/WhatsAppSession";

/**
 * Parameters passed to query handlers
 */
export interface QueryHandlerParams {
  session: WhatsAppSession;
  officerId: string;
  searchTerm: string;
}

/**
 * Result returned by query handlers
 */
export interface QueryHandlerResult {
  responseText: string;
}

/**
 * Result of PIN validation
 */
export interface PinValidationResult {
  valid: boolean;
  error?: string;
  shouldReset?: boolean;
}
