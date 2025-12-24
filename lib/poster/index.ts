/**
 * Poster Generation Module
 *
 * Exports all poster-related utilities for alert PDF and image generation
 *
 * CRMS - Pan-African Digital Public Good
 */

// Types
export type {
  PosterFormat,
  PosterSize,
  AlertType,
  PosterDimensions,
  PosterColorTheme,
  PosterBranding,
  PosterConfig,
  WantedPosterData,
  AmberAlertPosterData,
  PosterGenerationResult,
  PosterGenerationOptions,
} from "./poster-types";

// Type transformers
export {
  amberAlertToPosterData,
  wantedPersonToPosterData,
} from "./poster-types";

// Configuration
export {
  getPosterConfig,
  getColorTheme,
  getPosterDimensions,
  getImageDimensions,
  generateBulletinNumber,
  formatPosterDate,
  truncateText,
  POSTER_LAYOUT,
  WANTED_COLORS,
  AMBER_COLORS,
  DIMENSIONS,
} from "./poster-config";

// Image generator
export {
  generateWantedPosterImage,
  generateAmberAlertPosterImage,
} from "./poster-image-generator";
