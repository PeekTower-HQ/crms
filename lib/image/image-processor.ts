/**
 * Image Processing Service
 *
 * Uses Sharp for efficient image processing with thumbnail generation.
 * Optimized for Pan-African deployment with low-bandwidth considerations.
 */

import sharp from "sharp";
import { IMAGE_CONFIG, isValidImageType } from "./image-config";
import {
  ImageVariants,
  ProcessedImageVariant,
  ImageValidationResult,
  ImageProcessingError,
  ImageErrorCode,
} from "./image-types";

/**
 * Process an image and generate all required size variants
 *
 * @param input - Buffer containing the image data
 * @param filename - Original filename (for logging/debugging)
 * @returns All processed image variants (thumbnail, small, medium, original)
 */
export async function processImageWithVariants(
  input: Buffer,
  filename: string
): Promise<ImageVariants> {
  const config = IMAGE_CONFIG;

  // Validate input size
  if (input.length > config.maxInputSize) {
    throw new ImageProcessingError(
      `Image file too large. Maximum size is ${config.maxInputSize / (1024 * 1024)}MB.`,
      ImageErrorCode.FILE_TOO_LARGE
    );
  }

  try {
    // Create Sharp instance with input
    const pipeline = sharp(input, {
      failOnError: true,
      limitInputPixels: config.maxInputPixels,
    });

    // Get original metadata
    const metadata = await pipeline.metadata();

    if (!metadata.width || !metadata.height) {
      throw new ImageProcessingError(
        "Unable to read image dimensions",
        ImageErrorCode.CORRUPT_IMAGE
      );
    }

    // Determine output format (prefer WebP, fallback to JPEG for animated GIFs)
    const outputFormat =
      metadata.pages && metadata.pages > 1
        ? config.fallbackFormat
        : config.outputFormat;

    // Process all variants in parallel for efficiency
    const [thumbnail, small, medium, original] = await Promise.all([
      // Thumbnail (80x80) - For list views
      processVariant(input, config.sizes.thumbnail, outputFormat),

      // Small (200x200) - For profile cards
      processVariant(input, config.sizes.small, outputFormat),

      // Medium (400x400) - For detail views
      processVariant(input, config.sizes.medium, outputFormat),

      // Original (optimized but not resized)
      sharp(input)
        .toFormat(outputFormat, { quality: config.sizes.original.quality })
        .toBuffer({ resolveWithObject: true })
        .then(mapSharpOutput),
    ]);

    return {
      thumbnail,
      small,
      medium,
      original: {
        ...original,
        width: metadata.width,
        height: metadata.height,
      },
    };
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw error;
    }

    throw new ImageProcessingError(
      `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`,
      ImageErrorCode.PROCESSING_FAILED,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Process a single image variant with specified dimensions
 */
async function processVariant(
  input: Buffer,
  sizeConfig: { width: number; height: number; quality: number },
  format: "webp" | "jpeg"
): Promise<ProcessedImageVariant> {
  const result = await sharp(input)
    .resize(sizeConfig.width, sizeConfig.height, {
      fit: "cover",
      position: IMAGE_CONFIG.processing.cropStrategy,
      withoutEnlargement: true,
    })
    .toFormat(format, { quality: sizeConfig.quality })
    .toBuffer({ resolveWithObject: true });

  return mapSharpOutput(result);
}

/**
 * Map Sharp output to ProcessedImageVariant
 */
function mapSharpOutput(output: {
  data: Buffer;
  info: sharp.OutputInfo;
}): ProcessedImageVariant {
  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    format: output.info.format,
    size: output.data.length,
  };
}

/**
 * Validate an image file before processing
 *
 * @param buffer - Buffer containing the image data
 * @param mimeType - MIME type from the uploaded file
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns Validation result with dimensions if valid
 */
export async function validateImage(
  buffer: Buffer,
  mimeType: string,
  maxSizeMB: number = 10
): Promise<ImageValidationResult> {
  // Check MIME type
  if (!isValidImageType(mimeType)) {
    return {
      valid: false,
      error: `Invalid image type. Supported types: JPEG, PNG, WebP, GIF`,
    };
  }

  // Check size
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Image exceeds ${maxSizeMB}MB limit. Your file is ${sizeMB.toFixed(1)}MB.`,
    };
  }

  // Validate with Sharp
  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: "Invalid image format - unable to read dimensions" };
    }

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (error) {
    return {
      valid: false,
      error: "Unable to process image - file may be corrupted",
    };
  }
}

/**
 * Process image with timeout protection
 *
 * @param input - Buffer containing the image data
 * @param filename - Original filename
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns All processed image variants
 */
export async function processImageWithTimeout(
  input: Buffer,
  filename: string,
  timeoutMs: number = IMAGE_CONFIG.processing.timeoutMs
): Promise<ImageVariants> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new ImageProcessingError(
          "Image processing timed out",
          ImageErrorCode.TIMEOUT
        )
      );
    }, timeoutMs);

    processImageWithVariants(input, filename)
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

/**
 * Get the file extension for the output format
 */
export function getOutputExtension(): string {
  return IMAGE_CONFIG.outputFormat === "webp" ? ".webp" : ".jpg";
}

/**
 * Get the output MIME type
 */
export function getOutputMimeType(): string {
  return IMAGE_CONFIG.outputMimeType[IMAGE_CONFIG.outputFormat];
}
