/**
 * USSD Callback Handler
 *
 * Thin controller for Africa's Talking / Twilio USSD webhook.
 * Delegates all business logic to USSDService.
 *
 * Architecture: Service-Repository Pattern
 * - This route handles HTTP concerns only
 * - USSDService contains all business logic
 * - Repositories handle data access
 *
 * Features:
 * - Wanted person check (by NIN)
 * - Missing person check (by NIN)
 * - Background summary (by NIN)
 * - Vehicle check (by license plate)
 * - Officer stats
 *
 * Pan-African Design: Works with basic feature phones via USSD
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "@/src/di/container";

/**
 * POST /api/ussd/callback
 *
 * Webhook endpoint for USSD gateway (Africa's Talking / Twilio)
 * Public route (no authentication required - auth happens via Quick PIN in service layer)
 *
 * Thin controller: Parses request and delegates to USSDService
 */
export async function POST(request: NextRequest) {
  try {
    // Parse webhook request (Africa's Talking / Twilio format)
    const body = await request.formData();
    const sessionId = body.get("sessionId") as string;
    const phoneNumber = body.get("phoneNumber") as string;
    const text = (body.get("text") as string) || "";

    // Basic validation
    if (!sessionId || !phoneNumber) {
      return new NextResponse("END Invalid request", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Delegate to USSDService for all business logic
    const response = await container.ussdService.handleCallback({
      sessionId,
      phoneNumber,
      text,
    });

    // Return USSD response (CON = continue, END = terminate)
    return new NextResponse(response, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[USSD Callback Error]", error);
    return new NextResponse("END Service temporarily unavailable", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
