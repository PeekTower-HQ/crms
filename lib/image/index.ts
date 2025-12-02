/**
 * Image Processing Module
 *
 * Exports for image upload and processing functionality.
 */

// Types
export type {
  ImageEntityType,
  ImageSizeVariant,
  ImageSizeConfig,
  ProcessedImageVariant,
  ImageVariants,
  ImageUploadResult,
  ImageValidationResult,
  ImageDeleteKeys,
} from "./image-types";

export { ImageProcessingError, ImageErrorCode } from "./image-types";

// Configuration
export {
  IMAGE_CONFIG,
  isValidImageType,
  getS3PrefixForEntity,
} from "./image-config";

// Processing
export {
  processImageWithVariants,
  processImageWithTimeout,
  validateImage,
  getOutputExtension,
  getOutputMimeType,
} from "./image-processor";
