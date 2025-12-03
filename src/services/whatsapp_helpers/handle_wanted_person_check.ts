/**
 * Wanted Person Check Handler
 *
 * Handles wanted person queries via WhatsApp.
 */

import { container } from "@/src/di/container";
import { QueryHandlerParams, QueryHandlerResult } from "./types";
import * as templates from "./whapi_message_template";

/**
 * Handle wanted person check query
 */
export async function handleWantedPersonCheck(
  params: QueryHandlerParams
): Promise<QueryHandlerResult> {
  const { fieldCheckService } = container;
  const { session, officerId, searchTerm } = params;

  const result = await fieldCheckService.checkWantedPerson({
    officerId,
    checkType: "wanted",
    searchTerm,
    channel: "whatsapp",
    sessionId: session.id,
  });

  let responseText: string;

  if (!result.success) {
    responseText = await templates.errorTemplate(
      result.error || "Error checking wanted status"
    );
  } else if (result.data?.isWanted && result.data.wantedDetails) {
    responseText = await templates.wantedPersonFoundTemplate({
      name: result.data.person?.name || "Unknown",
      nin: result.data.person?.nin || searchTerm,
      charges: result.data.wantedDetails.charges,
      dangerLevel: result.data.wantedDetails.dangerLevel,
      warrantNumber: result.data.wantedDetails.warrantNumber || "N/A",
    });
  } else {
    responseText = await templates.wantedPersonNotFoundTemplate({
      name: result.data?.person?.name || "Unknown",
      nin: result.data?.person?.nin || searchTerm,
    });
  }

  return { responseText };
}
