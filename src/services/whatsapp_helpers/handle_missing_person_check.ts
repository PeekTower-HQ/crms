/**
 * Missing Person Check Handler
 *
 * Handles missing person queries via WhatsApp.
 */

import { container } from "@/src/di/container";
import { QueryHandlerParams, QueryHandlerResult } from "./types";
import * as templates from "./whapi_message_template";

/**
 * Handle missing person check query
 */
export async function handleMissingPersonCheck(
  params: QueryHandlerParams
): Promise<QueryHandlerResult> {
  const { fieldCheckService } = container;
  const { session, officerId, searchTerm } = params;

  const result = await fieldCheckService.checkMissingPerson({
    officerId,
    checkType: "missing",
    searchTerm,
    channel: "whatsapp",
    sessionId: session.id,
  });

  let responseText: string;

  if (!result.success) {
    responseText = await templates.errorTemplate(
      result.error || "Error checking missing status"
    );
  } else if (result.data?.isMissing) {
    responseText = await templates.missingPersonFoundTemplate({
      name: result.data.person?.name || "Unknown",
      nin: result.data.person?.nin || searchTerm,
      charges: ["Reported Missing/Deceased"],
      dangerLevel: "N/A",
      warrantNumber: "Contact station for details",
    });
  } else {
    responseText = await templates.missingPersonNotFoundTemplate({
      name: result.data?.person?.name || "Unknown",
      nin: result.data?.person?.nin || searchTerm,
    });
  }

  return { responseText };
}
