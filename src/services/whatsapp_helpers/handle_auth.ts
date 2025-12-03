/**
 * WhatsApp Authentication Handler
 *
 * Handles PIN validation and failed attempt tracking.
 */

import { container } from "@/src/di/container";
import { PinValidationResult } from "./types";

/**
 * Validate officer PIN
 *
 * @param phoneNumber - Officer's phone number
 * @param officerId - Officer ID
 * @param pin - PIN entered by officer
 * @returns Validation result with error message if invalid
 */
export async function validatePin(
  phoneNumber: string,
  officerId: string,
  pin: string
): Promise<PinValidationResult> {
  const { whatsappSessionRepository, fieldCheckService } = container;

  // Validate PIN format (4 digits)
  if (!pin || !/^\d{4}$/.test(pin)) {
    return {
      valid: false,
      error: "Invalid PIN format. Please enter your 4-digit Quick PIN:",
    };
  }

  // Verify PIN against stored hash
  const isValid = await fieldCheckService.verifyOfficerPin(officerId, pin);

  if (!isValid) {
    // Increment failed attempts
    const shouldReset =
      await whatsappSessionRepository.incrementPinAttempts(phoneNumber);

    if (shouldReset) {
      // Max attempts reached - reset session
      await whatsappSessionRepository.resetToMainMenu(phoneNumber);
      return {
        valid: false,
        error: "Too many failed PIN attempts. Please start over.",
        shouldReset: true,
      };
    }

    return {
      valid: false,
      error: "Invalid PIN. Please try again:",
    };
  }

  // PIN valid - authenticate session
  await whatsappSessionRepository.authenticate(phoneNumber, officerId);

  return { valid: true };
}

/**
 * Check rate limit for officer
 *
 * @param officerId - Officer ID
 * @returns Rate limit status with error message if exceeded
 */
export async function checkRateLimit(
  officerId: string
): Promise<{ allowed: boolean; error?: string }> {
  const { fieldCheckService } = container;

  const rateLimit = await fieldCheckService.checkRateLimit(officerId);

  if (!rateLimit.allowed) {
    return {
      allowed: false,
      error: `Daily query limit reached (${rateLimit.limit} queries). Resets at midnight.`,
    };
  }

  return { allowed: true };
}
