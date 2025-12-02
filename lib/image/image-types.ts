/**
 * Image Processing Types
 *
 * Type definitions for image upload and processing functionality.
 */

/**
 * Supported entity types for image uploads
 */
export type ImageEntityType = "person" | "officer" | "amber-alert" | "wanted-person";

/**
 * Image size variant names
 */
export type ImageSizeVariant = "thumbnail" | "small" | "medium" | "original";

/**
 * Configuration for a single image size variant
 */
export interface ImageSizeConfig {
  width: number;
  height: number;
  quality: number;
}

/**
 * Result from processing a single image variant
 */
export interface ProcessedImageVariant {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * All processed image variants
 */
export interface ImageVariants {
  thumbnail: ProcessedImageVariant;
  small: ProcessedImageVariant;
  medium: ProcessedImageVariant;
  original: ProcessedImageVariant;
}

/**
 * Result from uploading all image variants to S3
 */
export interface ImageUploadResult {
  /** Original image URL */
  url: string;
  /** Original image S3 key */
  key: string;
  /** Thumbnail URL (80x80) */
  thumbnailUrl: string;
  /** Thumbnail S3 key */
  thumbnailKey: string;
  /** Small image URL (200x200) */
  smallUrl: string;
  /** Small image S3 key */
  smallKey: string;
  /** Medium image URL (400x400) */
  mediumUrl: string;
  /** Medium image S3 key */
  mediumKey: string;
  /** SHA-256 hash of original image */
  hash: string;
  /** Original file size in bytes */
  size: number;
  /** Original image width */
  width: number;
  /** Original image height */
  height: number;
  /** MIME type of the output format */
  mimeType: string;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Error codes for image processing
 */
export enum ImageErrorCode {
  INVALID_FORMAT = "INVALID_FORMAT",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  PROCESSING_FAILED = "PROCESSING_FAILED",
  UPLOAD_FAILED = "UPLOAD_FAILED",
  TIMEOUT = "TIMEOUT",
  CORRUPT_IMAGE = "CORRUPT_IMAGE",
}

/**
 * Custom error class for image processing errors
 */
export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: ImageErrorCode,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Keys for deleting image variants
 */
export interface ImageDeleteKeys {
  key?: string | null;
  thumbnailKey?: string | null;
  smallKey?: string | null;
  mediumKey?: string | null;
}
