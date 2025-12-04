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
import type { BroadcastMessageInput } from "@/src/services/NewsletterService";

/**
 * POST /api/admin/newsletters/[id]/broadcast
 * Broadcast a message to newsletter subscribers
 *
 * Supports:
 * - Text broadcast: { type: "text", message: string }
 * - Link preview: { type: "link_preview", body: string, title?: string, media?: string }
 * - Legacy format: { message: string } (treated as text)
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

    // Transform input to BroadcastMessageInput format
    let broadcastInput: BroadcastMessageInput;

    if (body.type === "text") {
      // NEW FORMAT: Explicit text broadcast
      broadcastInput = {
        type: "text",
        message: body.message,
      };
    } else if (body.type === "link_preview") {
      // NEW FORMAT: Link preview broadcast
      broadcastInput = {
        type: "link_preview",
        body: body.body,
        title: body.title,
        media: body.media,
      };
    } else if (body.message && !body.type) {
      // LEGACY FORMAT: Backward compatibility (treat as text)
      broadcastInput = {
        type: "text",
        message: body.message,
      };
    } else {
      return NextResponse.json(
        {
          error: "Invalid request format. Must include 'type' field or 'message' field.",
          examples: {
            text: { type: "text", message: "Your message" },
            link_preview: {
              type: "link_preview",
              body: "Check this out: https://example.com",
              title: "Optional Title",
              media: "https://example.com/image.jpg"
            }
          }
        },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    const result = await container.newsletterService.broadcastMessage(
      id,
      broadcastInput,
      session.user.id,
      ipAddress
    );

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      message: `Broadcast sent successfully (type: ${broadcastInput.type})`,
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
