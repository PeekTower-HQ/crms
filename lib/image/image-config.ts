/**
 * Image Processing Configuration
 *
 * Optimized for Pan-African deployment with low-bandwidth considerations.
 * - WebP format for superior compression
 * - Aggressive thumbnail compression for 2G/3G networks
 * - Multiple size variants for progressive loading
 */

import type { ImageSizeConfig } from "./image-types";

/**
 * Image processing configuration
 */
export const IMAGE_CONFIG = {
  /**
   * Output format - WebP provides best compression for photos
   * Falls back to JPEG for animated GIFs
   */
  outputFormat: "webp" as const,
  fallbackFormat: "jpeg" as const,

  /**
   * Size variants optimized for different use cases
   * Target file sizes are for typical portrait photos
   */
  sizes: {
    /** List views, search results - target < 5KB */
    thumbnail: {
      width: 80,
      height: 80,
      quality: 60,
    } as ImageSizeConfig,
    /** Profile cards, small previews - target < 15KB */
    small: {
      width: 200,
      height: 200,
      quality: 70,
    } as ImageSizeConfig,
    /** Detail views, modal previews - target < 40KB */
    medium: {
      width: 400,
      height: 400,
      quality: 75,
    } as ImageSizeConfig,
    /** Original quality preservation */
    original: {
      quality: 85,
    },
  },

  /**
   * Input constraints
   */
  maxInputSize: 10 * 1024 * 1024, // 10MB max for photos
  maxInputPixels: 50_000_000, // 50MP limit to prevent memory issues

  /**
   * Supported input MIME types
   */
  supportedInputTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ] as const,

  /**
   * Processing settings
   */
  processing: {
    /** Timeout for image processing operations */
    timeoutMs: 30_000,
    /** Use 'attention' for smart cropping (face detection) */
    cropStrategy: "attention" as const,
  },

  /**
   * S3 storage prefixes for different entity types
   */
  s3Prefixes: {
    person: "images/persons/",
    officer: "images/officers/",
    "amber-alert": "images/amber-alerts/",
    "wanted-person": "images/wanted-persons/",
  } as const,

  /**
   * Output MIME types
   */
  outputMimeType: {
    webp: "image/webp",
    jpeg: "image/jpeg",
  } as const,
} as const;

/**
 * Check if a MIME type is a supported image type
 */
export function isValidImageType(mimeType: string): boolean {
  return IMAGE_CONFIG.supportedInputTypes.includes(
    mimeType.toLowerCase() as (typeof IMAGE_CONFIG.supportedInputTypes)[number]
  );
}

/**
 * Get the S3 prefix for an entity type
 */
export function getS3PrefixForEntity(
  entityType: keyof typeof IMAGE_CONFIG.s3Prefixes
): string {
  return IMAGE_CONFIG.s3Prefixes[entityType];
}
