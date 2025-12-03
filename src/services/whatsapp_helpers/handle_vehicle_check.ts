/**
 * Vehicle Check Handler
 *
 * Handles vehicle status queries via WhatsApp.
 */

import { container } from "@/src/di/container";
import { QueryHandlerParams, QueryHandlerResult } from "./types";
import * as templates from "./whapi_message_template";

/**
 * Handle vehicle check query
 */
export async function handleVehicleCheck(
  params: QueryHandlerParams
): Promise<QueryHandlerResult> {
  const { fieldCheckService } = container;
  const { session, officerId, searchTerm } = params;

  const result = await fieldCheckService.checkVehicle({
    officerId,
    checkType: "vehicle",
    searchTerm,
    channel: "whatsapp",
    sessionId: session.id,
  });

  let responseText: string;

  if (!result.success) {
    responseText = await templates.errorTemplate(
      result.error || "Error checking vehicle status"
    );
  } else if (result.data?.status === "stolen" && result.data.stolenDetails) {
    responseText = await templates.vehicleCheckFoundTemplate({
      vehicle:
        `${result.data.vehicle?.make || ""} ${result.data.vehicle?.model || ""}`.trim() ||
        "Unknown",
      vrn: result.data.vehicle?.licensePlate || searchTerm,
      charges: [
        `Reported Stolen: ${result.data.stolenDetails.stolenDate.toLocaleDateString()}`,
        `Days Stolen: ${result.data.stolenDetails.daysStolen}`,
        `Color: ${result.data.vehicle?.color || "Unknown"}`,
      ],
      dangerLevel: "high",
      warrantNumber: "Contact station immediately",
    });
  } else if (result.data?.status === "not_found") {
    responseText = await templates.vehicleCheckNotFoundTemplate({
      vehicle: "Not in system",
      vrn: searchTerm,
    });
  } else {
    // Clean vehicle
    responseText = await templates.vehicleCheckNotFoundTemplate({
      vehicle:
        `${result.data?.vehicle?.make || ""} ${result.data?.vehicle?.model || ""}`.trim() ||
        "Vehicle",
      vrn: result.data?.vehicle?.licensePlate || searchTerm,
    });
  }

  return { responseText };
}
