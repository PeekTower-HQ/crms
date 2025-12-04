/**
 * Active Alerts Public API Route
 *
 * Endpoints:
 * GET /api/alerts/active - Get all active alerts (public, no auth required)
 *
 * Authentication: NOT required (public endpoint for USSD/web)
 * Permissions: None (public access)
 *
 * CRMS - Pan-African Digital Public Good
 * This endpoint is designed for:
 * - Public USSD access
 * - Public web viewing
 * - Mobile app integration
 * - Alert broadcasting systems
 */
import { NextRequest, NextResponse } from "next/server";
import { container } from "@/src/di/container";

/**
 * Types for alert responses
 */
interface AmberAlertUSSDFormat {
  id: string;
  personName: string;
  age: number | null;
  message: string;
  urgency: string;
  daysMissing: number | null;
}

interface AmberAlertFullFormat {
  id: string;
  type: "amber";
  personName: string;
  age: number | null;
  gender: string | null;
  description: string;
  photoUrl: string | null;
  lastSeenLocation: string | null;
  lastSeenDate: string | null;
  contactPhone: string;
  publishedAt: string | null;
  urgency: string;
  daysMissing: number | null;
  broadcastMessage: string;
}

interface WantedPersonUSSDFormat {
  id: string;
  personName: string;
  message: string;
  dangerLevel: string;
  reward: number | null;
}

interface WantedPersonFullFormat {
  id: string;
  type: "wanted";
  personName: string;
  warrantNumber: string;
  charges: string[];
  dangerLevel: string;
  physicalDescription: string;
  photoUrl: string | null;
  lastSeenLocation: string | null;
  lastSeenDate: string | null;
  rewardAmount: number | null;
  contactPhone: string;
  isRegionalAlert: boolean;
  issuedDate: string;
  broadcastMessage: string;
}

interface ResponseCount {
  amberAlerts: number;
  wantedPersons: number;
  total: number;
}

interface AlertResponse {
  timestamp: string;
  count: ResponseCount;
  amberAlerts?: Array<AmberAlertUSSDFormat | AmberAlertFullFormat>;
  wantedPersons?: Array<WantedPersonUSSDFormat | WantedPersonFullFormat>;
  alerts?: Array<AmberAlertUSSDFormat | AmberAlertFullFormat | WantedPersonUSSDFormat | WantedPersonFullFormat>;
}

/**
 * GET /api/alerts/active
 * Get all active alerts (Amber Alerts + Wanted Persons)
 *
 * Query parameters:
 * - type: Filter by type ("amber" | "wanted" | "all") - default: "all"
 * - limit: Number of results per type (default: 50)
 * - format: Response format ("full" | "ussd") - default: "full"
 *
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const limit = searchParams.get("limit");
    const format = searchParams.get("format") || "full";

    const resultLimit = limit ? parseInt(limit) : 50;

    let amberAlerts: Array<AmberAlertUSSDFormat | AmberAlertFullFormat> = [];
    let wantedPersons: Array<WantedPersonUSSDFormat | WantedPersonFullFormat> = [];

    // Fetch Amber Alerts if requested
    if (type === "all" || type === "amber") {
      const alerts = await container.alertService.getActiveAmberAlerts(resultLimit);

      // Format based on request
      if (format === "ussd") {
        // USSD-friendly format (short messages)
        amberAlerts = alerts.map((alert) => ({
          id: alert.id,
          personName: alert.personName,
          age: alert.age,
          message: alert.getUSSDMessage(),
          urgency: alert.getUrgencyLevel(),
          daysMissing: alert.getDaysMissing(),
        }));
      } else {
        // Full format
        amberAlerts = alerts.map((alert) => ({
          id: alert.id,
          type: "amber",
          personName: alert.personName,
          age: alert.age,
          gender: alert.gender,
          description: alert.description,
          photoUrl: alert.photoUrl,
          lastSeenLocation: alert.lastSeenLocation,
          lastSeenDate: alert.lastSeenDate ? alert.lastSeenDate.toISOString() : null,
          contactPhone: alert.contactPhone,
          publishedAt: alert.publishedAt ? alert.publishedAt.toISOString() : null,
          urgency: alert.getUrgencyLevel(),
          daysMissing: alert.getDaysMissing(),
          broadcastMessage: alert.getBroadcastMessage(),
        }));
      }
    }

    // Fetch Wanted Persons if requested
    if (type === "all" || type === "wanted") {
      const wanted = await container.alertService.getActiveWantedPersons(resultLimit);

      // Format based on request
      if (format === "ussd") {
        // USSD-friendly format
        wantedPersons = wanted.map((wp) => ({
          id: wp.id,
          personName: wp.personName,
          message: wp.getUSSDMessage(),
          dangerLevel: wp.dangerLevel,
          reward: wp.rewardAmount,
        }));
      } else {
        // Full format
        wantedPersons = wanted.map((wp) => ({
          id: wp.id,
          type: "wanted",
          personName: wp.personName,
          warrantNumber: wp.warrantNumber,
          charges: wp.charges.map((c) => c.charge),
          dangerLevel: wp.dangerLevel,
          physicalDescription: wp.physicalDescription,
          photoUrl: wp.photoUrl,
          lastSeenLocation: wp.lastSeenLocation,
          lastSeenDate: wp.lastSeenDate ? wp.lastSeenDate.toISOString() : null,
          rewardAmount: wp.rewardAmount,
          contactPhone: wp.contactPhone,
          isRegionalAlert: wp.isRegionalAlert,
          issuedDate: wp.issuedDate.toISOString(),
          broadcastMessage: wp.getBroadcastMessage(),
        }));
      }
    }

    // Combine and return
    const response: AlertResponse = {
      timestamp: new Date().toISOString(),
      count: {
        amberAlerts: amberAlerts.length,
        wantedPersons: wantedPersons.length,
        total: amberAlerts.length + wantedPersons.length,
      },
    };

    if (type === "all") {
      response.amberAlerts = amberAlerts;
      response.wantedPersons = wantedPersons;
    } else if (type === "amber") {
      response.alerts = amberAlerts;
    } else if (type === "wanted") {
      response.alerts = wantedPersons;
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("GET /api/alerts/active error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch active alerts",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
