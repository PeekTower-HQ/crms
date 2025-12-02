/**
 * Image Upload API Route
 *
 * POST /api/upload/image - Upload and process image with thumbnails
 *
 * Handles image uploads for Person, Officer, AmberAlert, and WantedPerson entities.
 * Processes images through Sharp to generate optimized variants (thumbnail, small, medium).
 *
 * Pan-African Design:
 * - WebP output for bandwidth optimization on 2G/3G networks
 * - Multiple size variants for different network conditions
 * - Smart cropping with attention focus for face detection
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { uploadImageWithVariants } from "@/lib/s3";
import { processImageWithTimeout, validateImage } from "@/lib/image/image-processor";
import { ImageProcessingError, ImageEntityType } from "@/lib/image/image-types";
import { IMAGE_CONFIG } from "@/lib/image/image-config";
import { PermissionResource } from "@/src/domain/entities/Permission";

/**
 * Map entity types to their permission resources
 */
const ENTITY_PERMISSION_MAP: Record<ImageEntityType, PermissionResource> = {
  person: "persons",
  officer: "officers",
  "amber-alert": "alerts",
  "wanted-person": "alerts",
};

/**
 * POST /api/upload/image
 * Upload and process an image with thumbnail generation
 *
 * FormData fields:
 * - file: The image file (required)
 * - entityType: Type of entity (person, officer, amber-alert, wanted-person) (required)
 * - entityId: Optional entity ID for organizing in S3
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate request
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as ImageEntityType | null;
    const entityId = (formData.get("entityId") as string) || "temp";

    // 3. Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!entityType || !ENTITY_PERMISSION_MAP[entityType]) {
      return NextResponse.json(
        { error: "Invalid or missing entityType. Must be: person, officer, amber-alert, or wanted-person" },
        { status: 400 }
      );
    }

    // 4. Check permissions
    const permissionResource = ENTITY_PERMISSION_MAP[entityType];
    if (!hasPermission(session, permissionResource, "create", "station")) {
      return NextResponse.json(
        { error: "You don't have permission to upload images for this entity type" },
        { status: 403 }
      );
    }

    // 5. Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Validate image
    const maxSizeMB = IMAGE_CONFIG.maxInputSize / (1024 * 1024);
    const validation = await validateImage(buffer, file.type, maxSizeMB);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 7. Process image with Sharp (generate all variants)
    const variants = await processImageWithTimeout(buffer, file.name);

    // 8. Upload all variants to S3 in parallel
    const uploadResult = await uploadImageWithVariants(
      variants,
      entityType,
      entityId,
      file.name
    );

    // 9. Audit log the upload
    await container.auditLogRepository.create({
      entityType: entityType,
      entityId: entityId,
      officerId: session.user.id,
      action: "upload_image",
      success: true,
      details: {
        fileName: file.name,
        fileSize: uploadResult.size,
        dimensions: `${uploadResult.width}x${uploadResult.height}`,
        mimeType: uploadResult.mimeType,
        hash: uploadResult.hash,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      stationId: session.user.stationId,
    });

    // 10. Return the upload result
    return NextResponse.json(
      {
        success: true,
        image: {
          url: uploadResult.url,
          key: uploadResult.key,
          thumbnailUrl: uploadResult.thumbnailUrl,
          smallUrl: uploadResult.smallUrl,
          mediumUrl: uploadResult.mediumUrl,
          hash: uploadResult.hash,
          size: uploadResult.size,
          width: uploadResult.width,
          height: uploadResult.height,
          mimeType: uploadResult.mimeType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Image upload error:", error);

    // Handle specific error types
    if (error instanceof ImageProcessingError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    // Log failed upload attempt
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        await container.auditLogRepository.create({
          entityType: "image_upload",
          entityId: "unknown",
          officerId: session.user.id,
          action: "upload_image",
          success: false,
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
          ipAddress: request.headers.get("x-forwarded-for") || undefined,
          stationId: session.user.stationId,
        });
      }
    } catch {
      // Ignore audit log errors
    }

    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
