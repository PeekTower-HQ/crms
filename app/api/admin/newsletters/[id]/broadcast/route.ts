/**
 * WhatsApp Newsletter Broadcast API
 *
 * Endpoint:
 * POST /api/admin/newsletters/[id]/broadcast - Send message to newsletter
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
 * POST /api/admin/newsletters/[id]/broadcast
 * Broadcast a message to newsletter subscribers
 *
 * Request body:
 * {
 *   message: string (required)
 * }
 */
export async function POST(
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

    // Validate message
    if (!body.message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    const result = await container.newsletterService.broadcastMessage(
      id,
      { message: body.message },
      session.user.id,
      ipAddress
    );

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      message: "Broadcast sent successfully",
    });
  } catch (error) {
    console.error("POST /api/admin/newsletters/[id]/broadcast error:", error);

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
