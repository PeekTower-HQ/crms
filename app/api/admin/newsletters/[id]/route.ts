/**
 * WhatsApp Newsletter Detail API Routes
 *
 * Endpoints:
 * GET /api/admin/newsletters/[id] - Get newsletter by ID
 * PATCH /api/admin/newsletters/[id] - Update newsletter
 * DELETE /api/admin/newsletters/[id] - Delete newsletter
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
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/src/lib/errors";

/**
 * GET /api/admin/newsletters/[id]
 * Get a specific newsletter by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const newsletter = await container.newsletterService.getNewsletterById(id);

    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error("GET /api/admin/newsletters/[id] error:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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

/**
 * PATCH /api/admin/newsletters/[id]
 * Update a newsletter
 *
 * Request body (all optional):
 * {
 *   name?: string,
 *   description?: string,
 *   pictureUrl?: string,
 *   reactionsEnabled?: boolean
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    const newsletter = await container.newsletterService.updateNewsletter(
      id,
      body,
      session.user.id,
      ipAddress
    );

    return NextResponse.json({
      newsletter,
      message: "Newsletter updated successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/newsletters/[id] error:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

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

/**
 * DELETE /api/admin/newsletters/[id]
 * Delete a newsletter (soft delete - marks as deleted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    await container.newsletterService.deleteNewsletter(
      id,
      session.user.id,
      ipAddress
    );

    return NextResponse.json({
      message: "Newsletter deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/newsletters/[id] error:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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
