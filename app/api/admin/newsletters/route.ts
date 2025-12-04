/**
 * WhatsApp Newsletters API Routes
 *
 * Endpoints:
 * GET /api/admin/newsletters - List all newsletters
 * POST /api/admin/newsletters - Create a new newsletter
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin or SuperAdmin
 *
 * CRMS - Pan-African Digital Public Good
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { isAdmin } from "@/lib/permissions";
import { ValidationError, ForbiddenError } from "@/src/lib/errors";

/**
 * GET /api/admin/newsletters
 * List all WhatsApp newsletters with optional filters
 *
 * Query parameters:
 * - status: Filter by status (active, inactive, deleted)
 * - createdById: Filter by creator officer ID
 * - searchTerm: Search in name or description
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Permissions: Admin or SuperAdmin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only admins can manage newsletters
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const createdById = searchParams.get("createdById");
    const searchTerm = searchParams.get("searchTerm");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any = {};
    if (status) filters.status = status;
    if (createdById) filters.createdById = createdById;
    if (searchTerm) filters.searchTerm = searchTerm;

    // Get newsletters
    const result = await container.newsletterService.getNewsletters(
      filters,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0
    );

    return NextResponse.json({
      newsletters: result.newsletters,
      total: result.total,
    });
  } catch (error) {
    console.error("GET /api/admin/newsletters error:", error);

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/newsletters
 * Create a new WhatsApp Newsletter
 *
 * Request body:
 * {
 *   name: string (required),
 *   description?: string,
 *   pictureUrl?: string
 * }
 *
 * Permissions: Admin or SuperAdmin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    console.log("[API] POST /api/admin/newsletters received body:", {
      name: body.name,
      description: body.description,
      pictureUrl: body.pictureUrl ? `${body.pictureUrl.substring(0, 50)}...` : undefined,
      hasPictureUrl: !!body.pictureUrl,
      pictureUrlLength: body.pictureUrl?.length,
      pictureUrlType: typeof body.pictureUrl,
    });

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Newsletter name is required" },
        { status: 400 }
      );
    }

    // Get IP address for audit
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Create newsletter
    console.log("[API] Calling newsletterService.createNewsletter with:", {
      name: body.name,
      description: body.description,
      pictureUrl: body.pictureUrl ? `${body.pictureUrl.substring(0, 50)}...` : undefined,
      officerId: session.user.id,
      ipAddress,
    });

    const newsletter = await container.newsletterService.createNewsletter(
      {
        name: body.name,
        description: body.description,
        pictureUrl: body.pictureUrl,
      },
      session.user.id,
      ipAddress
    );

    return NextResponse.json(
      {
        newsletter,
        message: "Newsletter created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/newsletters error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
