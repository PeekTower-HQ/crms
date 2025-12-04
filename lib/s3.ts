/**
 * S3 File Upload Service
 *
 * Handles file uploads to S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces, etc.)
 * for evidence files in the CRMS system.
 *
 * Features:
 * - Upload files to S3
 * - Generate SHA-256 hash for file integrity
 * - Delete files
 * - Generate presigned URLs for secure downloads
 * - Supports both AWS S3 and MinIO
 *
 * Pan-African Design:
 * - Works with any S3-compatible storage
 * - Configurable endpoint for regional providers
 * - Minimal bandwidth usage
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT, // For MinIO or other S3-compatible services
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET || "crms-evidence";

// Maximum file size: 100MB (configurable)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "104857600"); // 100MB in bytes

/**
 * Upload a file to S3
 *
 * @param file - File buffer to upload
 * @param fileName - Original file name
 * @param mimeType - MIME type of the file
 * @param prefix - Optional prefix for the S3 key (e.g., "evidence/")
 * @returns Object containing file URL, key, hash, and size
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  mimeType: string,
  prefix: string = "evidence/"
): Promise<{
  url: string;
  key: string;
  hash: string;
  size: number;
}> {
  // Validate file size
  if (file.length > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Generate unique file key
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString("hex");
  const sanitizedFileName = sanitizeFileName(fileName);
  const key = `${prefix}${timestamp}-${randomId}-${sanitizedFileName}`;

  // Calculate SHA-256 hash for file integrity
  const hash = calculateFileHash(file);

  try {
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        originalName: fileName,
        hash: hash,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate file URL
    const url = getFileUrl(key);

    return {
      url,
      key,
      hash,
      size: file.length,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete a file from S3
 *
 * @param key - S3 key of the file to delete
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a presigned URL for secure file download
 *
 * @param key - S3 key of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for download
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("S3 presigned URL error:", error);
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check if a file exists in S3
 *
 * @param key - S3 key of the file
 * @returns True if file exists, false otherwise
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: unknown) {
    if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Calculate SHA-256 hash of a file buffer
 *
 * @param buffer - File buffer
 * @returns Hex string of SHA-256 hash
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Sanitize a file name to prevent directory traversal and injection attacks
 *
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove directory traversal attempts
  let sanitized = fileName.replace(/\.\./g, "");

  // Remove path separators
  sanitized = sanitized.replace(/[\/\\]/g, "");

  // Keep only alphanumeric, dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Get public URL for a file (if bucket is public) or construct endpoint URL
 *
 * @param key - S3 key of the file
 * @returns File URL
 */
function getFileUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT || "https://s3.amazonaws.com";
  const bucket = BUCKET_NAME;

  // For AWS S3
  if (!endpoint.includes("localhost") && !endpoint.includes("minio")) {
    return `https://${bucket}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${key}`;
  }

  // For MinIO or local development
  return `${endpoint}/${bucket}/${key}`;
}

/**
 * Validate file type based on MIME type
 *
 * @param mimeType - MIME type to validate
 * @param allowedTypes - Array of allowed MIME types (optional)
 * @returns True if valid, false otherwise
 */
export function validateFileType(
  mimeType: string,
  allowedTypes?: string[]
): boolean {
  const defaultAllowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    // Audio
    "audio/mpeg",
    "audio/wav",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
  ];

  const types = allowedTypes || defaultAllowedTypes;
  return types.includes(mimeType.toLowerCase());
}

/**
 * Get file extension from MIME type
 *
 * @param mimeType - MIME type
 * @returns File extension (e.g., ".jpg", ".pdf")
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "video/mp4": ".mp4",
    "video/mpeg": ".mpeg",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
  };

  return mimeToExt[mimeType.toLowerCase()] || "";
}

/**
 * Format file size to human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ============================================================================
// Image Upload Functions
// ============================================================================

import type { ImageVariants, ImageUploadResult, ImageDeleteKeys } from "./image";

/**
 * Upload all image variants (original, medium, small, thumbnail) to S3
 *
 * @param variants - Processed image variants from Sharp
 * @param entityType - Type of entity (person, amber-alert, wanted-person)
 * @param entityId - ID of the entity (for organizing in S3)
 * @param originalFileName - Original uploaded file name
 * @returns URLs and keys for all variants
 */
export async function uploadImageWithVariants(
  variants: ImageVariants,
  entityType: "person" | "officer" | "amber-alert" | "wanted-person",
  entityId: string,
  originalFileName: string
): Promise<ImageUploadResult> {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString("hex");
  const basePrefix = `images/${entityType}s/${entityId}/`;

  // Determine extension based on format
  const ext = variants.original.format === "webp" ? ".webp" : ".jpg";
  const mimeType = variants.original.format === "webp" ? "image/webp" : "image/jpeg";

  // Generate keys for all variants
  const keys = {
    original: `${basePrefix}original-${timestamp}-${randomId}${ext}`,
    medium: `${basePrefix}medium-${timestamp}-${randomId}${ext}`,
    small: `${basePrefix}small-${timestamp}-${randomId}${ext}`,
    thumbnail: `${basePrefix}thumbnail-${timestamp}-${randomId}${ext}`,
  };

  try {
    // Upload all variants in parallel for efficiency
    const [originalResult, mediumResult, smallResult, thumbnailResult] = await Promise.all([
      uploadVariant(variants.original.buffer, keys.original, mimeType, originalFileName),
      uploadVariant(variants.medium.buffer, keys.medium, mimeType, originalFileName),
      uploadVariant(variants.small.buffer, keys.small, mimeType, originalFileName),
      uploadVariant(variants.thumbnail.buffer, keys.thumbnail, mimeType, originalFileName),
    ]);

    return {
      url: originalResult.url,
      key: originalResult.key,
      thumbnailUrl: thumbnailResult.url,
      thumbnailKey: thumbnailResult.key,
      smallUrl: smallResult.url,
      smallKey: smallResult.key,
      mediumUrl: mediumResult.url,
      mediumKey: mediumResult.key,
      hash: calculateFileHash(variants.original.buffer),
      size: variants.original.size,
      width: variants.original.width,
      height: variants.original.height,
      mimeType,
    };
  } catch (error) {
    console.error("Image upload error:", error);
    throw new Error(
      `Failed to upload image variants: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Upload a single image variant to S3
 */
async function uploadVariant(
  buffer: Buffer,
  key: string,
  mimeType: string,
  originalFileName: string
): Promise<{ url: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    Metadata: {
      originalName: originalFileName,
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);

  return {
    url: getFileUrl(key),
    key,
  };
}

/**
 * Delete all image variants for an entity
 *
 * @param keys - Object containing keys for all variants to delete
 */
export async function deleteImageVariants(keys: ImageDeleteKeys): Promise<void> {
  const keysToDelete = [keys.key, keys.thumbnailKey, keys.smallKey, keys.mediumKey].filter(
    (k): k is string => k != null && k !== ""
  );

  if (keysToDelete.length === 0) {
    return;
  }

  try {
    // Delete all variants in parallel
    await Promise.all(keysToDelete.map((key) => deleteFile(key)));
  } catch (error) {
    console.error("Error deleting image variants:", error);
    // Don't throw - cleanup failures shouldn't break the operation
  }
}

/**
 * Get the public URL for a file
 * Exported for use in image upload functions
 */
export { getFileUrl };
