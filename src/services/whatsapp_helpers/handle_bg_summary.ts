/**
 * Background Check Handler
 *
 * Handles background check queries via WhatsApp.
 */

import { container } from "@/src/di/container";
import { QueryHandlerParams, QueryHandlerResult } from "./types";
import * as templates from "./whapi_message_template";

/**
 * Handle background check query
 */
export async function handleBackgroundCheck(
  params: QueryHandlerParams
): Promise<QueryHandlerResult> {
  const { fieldCheckService } = container;
  const { session, officerId, searchTerm } = params;

  const result = await fieldCheckService.checkBackground({
    officerId,
    checkType: "background",
    searchTerm,
    channel: "whatsapp",
    sessionId: session.id,
  });

  let responseText: string;

  if (!result.success) {
    responseText = await templates.errorTemplate(
      result.error || "Error performing background check"
    );
  } else if (
    result.data?.status === "has_record" &&
    result.data.recordDetails
  ) {
    responseText = await templates.backgroundCheckFoundTemplate({
      name: result.data.person?.name || "Unknown",
      nin: result.data.person?.nin || searchTerm,
      charges: [
        `Criminal Cases: ${result.data.recordDetails.caseCount}`,
        `Wanted: ${result.data.recordDetails.isWanted ? "YES" : "NO"}`,
        `Missing: ${result.data.recordDetails.isMissing ? "YES" : "NO"}`,
      ],
      dangerLevel: result.data.recordDetails.riskLevel,
      warrantNumber: result.data.recordDetails.isWanted
        ? "Active warrant exists"
        : "No active warrants",
    });
  } else {
    responseText = await templates.backgroundCheckNotFoundTemplate({
      name: result.data?.person?.name || "Unknown",
      nin: result.data?.person?.nin || searchTerm,
    });
  }

  return { responseText };
}
