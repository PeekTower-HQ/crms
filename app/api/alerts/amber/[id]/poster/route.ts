/**
 * Amber Alert Poster Generation API
 *
 * Endpoint: GET /api/alerts/amber/[id]/poster
 * Query params:
 *   - format: "pdf" | "image" (default: "pdf")
 *
 * Authentication: Required (NextAuth session)
 * Permissions: alerts:read (station scope)
 *
 * CRMS - Pan-African Digital Public Good
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError, ValidationError } from "@/src/lib/errors";

/**
 * GET /api/alerts/amber/[id]/poster
 * Generate a poster for an amber alert (PDF or image)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session, "alerts", "read", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to generate posters" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get format from query params
    const { searchParams } = new URL(request.url);
    const formatParam = searchParams.get("format") || "pdf";

    // Validate format
    const format = container.posterService.validateFormat(formatParam);

    // Get IP address for audit
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Generate poster
    const result = await container.posterService.generateAmberAlertPoster(
      id,
      format,
      session.user.id,
      ipAddress
    );

    // Return the poster with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": result.size.toString(),
        "Cache-Control": "private, max-age=300", // 5 minute cache
      },
    });
  } catch (error) {
    console.error(`GET /api/alerts/amber/[id]/poster error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
