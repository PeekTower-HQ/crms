/**
 * Statistics Handler
 *
 * Handles officer statistics queries via WhatsApp.
 */

import { container } from "@/src/di/container";
import { QueryHandlerResult } from "./types";
import * as templates from "./whapi_message_template";

/**
 * Handle statistics query
 */
export async function handleStats(officerId: string): Promise<QueryHandlerResult> {
  const { fieldCheckService } = container;

  const result = await fieldCheckService.getStatistics(officerId, "whatsapp");

  let responseText: string;

  if (!result.success || !result.data) {
    responseText = await templates.errorTemplate(
      result.error || "Error retrieving statistics"
    );
  } else {
    responseText =
      `*Your CRMS Statistics*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*Today:* ${result.data.today}\n` +
      `*This Week:* ${result.data.thisWeek}\n` +
      `*This Month:* ${result.data.thisMonth}\n` +
      `*Total:* ${result.data.total}\n` +
      `*Success Rate:* ${result.data.successRate.toFixed(1)}%\n\n` +
      `Reply with any message to continue.`;
  }

  return { responseText };
}
