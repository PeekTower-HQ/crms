/**
 * Poster Configuration
 *
 * Centralized configuration for alert poster generation
 * Supports country-configurable branding via environment variables
 *
 * CRMS - Pan-African Digital Public Good
 */

import {
  PosterConfig,
  PosterColorTheme,
  PosterBranding,
  PosterDimensions,
} from "./poster-types";

/**
 * Default color theme for Wanted posters (Red theme)
 */
const WANTED_COLORS: PosterColorTheme = {
  primary: "#DC2626",      // Red-600 - Main banner
  secondary: "#FEE2E2",    // Red-100 - Background accents
  accent: "#991B1B",       // Red-800 - Borders, highlights
  text: "#FFFFFF",         // White text on red
  textDark: "#1F2937",     // Gray-800 for dark text
  badge: "#7C3AED",        // Purple for danger badge
};

/**
 * Default color theme for Amber Alert posters (Amber/Yellow theme)
 */
const AMBER_COLORS: PosterColorTheme = {
  primary: "#F59E0B",      // Amber-500 - Main banner
  secondary: "#FEF3C7",    // Amber-100 - Background accents
  accent: "#B45309",       // Amber-700 - Borders, highlights
  text: "#1F2937",         // Dark text on amber
  textDark: "#1F2937",     // Gray-800 for dark text
  badge: "#DC2626",        // Red for urgency badge
};

/**
 * Poster dimensions
 */
const DIMENSIONS: Record<string, PosterDimensions> = {
  // A4 at 72 DPI for PDF
  a4: {
    width: 595,
    height: 842,
  },
  // A4 at 300 DPI for high-quality print
  a4_print: {
    width: 2480,
    height: 3508,
  },
  // Instagram/Facebook portrait (1080x1350 - 4:5 ratio)
  social: {
    width: 1080,
    height: 1350,
  },
  // Twitter/LinkedIn landscape
  social_landscape: {
    width: 1200,
    height: 630,
  },
};

/**
 * Get branding configuration from environment variables
 */
function getBranding(): PosterBranding {
  return {
    organizationName: process.env.POSTER_ORG_NAME || "Police Department",
    organizationAbbreviation: process.env.POSTER_ORG_ABBREV || "PD",
    hotline: process.env.POSTER_HOTLINE || "999",
    logoPath: process.env.POSTER_LOGO_PATH || null,
    logoUrl: process.env.POSTER_LOGO_URL || null,
    website: process.env.POSTER_WEBSITE || null,
  };
}

/**
 * Get complete poster configuration
 */
export function getPosterConfig(): PosterConfig {
  return {
    branding: getBranding(),
    colors: {
      wanted: WANTED_COLORS,
      amber: AMBER_COLORS,
    },
    dimensions: {
      a4: DIMENSIONS.a4,
      social: DIMENSIONS.social,
    },
    fonts: {
      primary: "Helvetica",
      bold: "Helvetica-Bold",
    },
  };
}

/**
 * Get color theme for alert type
 */
export function getColorTheme(alertType: "wanted" | "amber"): PosterColorTheme {
  const config = getPosterConfig();
  return alertType === "wanted" ? config.colors.wanted : config.colors.amber;
}

/**
 * Get dimensions for poster size
 */
export function getPosterDimensions(size: "a4" | "social"): PosterDimensions {
  return DIMENSIONS[size] || DIMENSIONS.social;
}

/**
 * Get high-resolution dimensions for image generation
 */
export function getImageDimensions(): PosterDimensions {
  return DIMENSIONS.social;
}

/**
 * Layout constants for poster design
 */
export const POSTER_LAYOUT = {
  // Margins and padding
  margin: 40,
  padding: 20,
  sectionGap: 15,

  // Header section
  header: {
    height: 60,
    logoSize: 40,
    fontSize: {
      orgName: 14,
      bulletinNumber: 10,
    },
  },

  // Danger/Urgency badge
  badge: {
    height: 35,
    fontSize: 12,
    borderRadius: 4,
  },

  // Main banner (WANTED / AMBER ALERT)
  banner: {
    height: 70,
    fontSize: 42,
    fontWeight: "bold",
  },

  // Photo section
  photo: {
    width: 300,
    height: 400,
    borderRadius: 8,
    placeholderColor: "#E5E7EB",
  },

  // Details panel
  details: {
    labelFontSize: 11,
    valueFontSize: 13,
    rowHeight: 50,
  },

  // Charges section
  charges: {
    height: 60,
    fontSize: 11,
  },

  // Public advisory
  advisory: {
    height: 80,
    fontSize: 10,
    lineHeight: 1.4,
  },

  // How to help section
  help: {
    height: 60,
    fontSize: 11,
  },

  // Footer
  footer: {
    height: 40,
    fontSize: 9,
  },
} as const;

/**
 * Generate a unique bulletin number for posters
 */
export function generateBulletinNumber(alertId: string, alertType: "wanted" | "amber"): string {
  const prefix = alertType === "wanted" ? "WP" : "AA";
  const year = new Date().getFullYear();
  const shortId = alertId.substring(0, 8).toUpperCase();
  return `${year}-${prefix}-${shortId}`;
}

/**
 * Format date for poster display
 */
export function formatPosterDate(date: Date | string | null): string {
  if (!date) return "Unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Truncate text with ellipsis if too long
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Export constants for external use
 */
export { WANTED_COLORS, AMBER_COLORS, DIMENSIONS };
