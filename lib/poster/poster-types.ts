/**
 * Poster Generation Types
 *
 * TypeScript interfaces for alert poster generation
 * Supports both PDF and image output formats
 *
 * CRMS - Pan-African Digital Public Good
 */

import { AmberAlert } from "@/src/domain/entities/AmberAlert";
import { WantedPerson } from "@/src/domain/entities/WantedPerson";

/**
 * Supported poster output formats
 */
export type PosterFormat = "pdf" | "image";

/**
 * Poster size presets
 */
export type PosterSize = "a4" | "social";

/**
 * Alert type for poster generation
 */
export type AlertType = "wanted" | "amber";

/**
 * Poster dimensions in pixels
 */
export interface PosterDimensions {
  width: number;
  height: number;
}

/**
 * Color theme for posters
 */
export interface PosterColorTheme {
  primary: string;      // Main banner color
  secondary: string;    // Background accents
  accent: string;       // Borders, highlights
  text: string;         // Text on primary color
  textDark: string;     // Text on light backgrounds
  badge: string;        // Danger/urgency badge
}

/**
 * Branding configuration from environment
 */
export interface PosterBranding {
  organizationName: string;
  organizationAbbreviation: string;
  hotline: string;
  logoPath: string | null;
  logoUrl: string | null;
  website: string | null;
}

/**
 * Complete poster configuration
 */
export interface PosterConfig {
  branding: PosterBranding;
  colors: {
    wanted: PosterColorTheme;
    amber: PosterColorTheme;
  };
  dimensions: {
    a4: PosterDimensions;
    social: PosterDimensions;
  };
  fonts: {
    primary: string;
    bold: string;
  };
}

/**
 * Data for Wanted Person poster
 */
export interface WantedPosterData {
  id: string;
  name: string;
  nin: string | null;
  warrantNumber: string;
  charges: string[];
  primaryCharge: string;
  dangerLevel: "low" | "medium" | "high" | "extreme";
  dangerLevelDisplay: string;
  physicalDescription: string;
  photoUrl: string | null;
  rewardAmount: number | null;
  rewardDisplay: string | null;
  lastSeenLocation: string | null;
  lastSeenDate: string | null;
  contactPhone: string;
  isRegionalAlert: boolean;
  issuedDate: string;
  publicAdvisory: string;
}

/**
 * Data for Amber Alert poster
 */
export interface AmberAlertPosterData {
  id: string;
  personName: string;
  age: number | null;
  ageDisplay: string;
  gender: string | null;
  genderDisplay: string;
  description: string;
  photoUrl: string | null;
  lastSeenLocation: string | null;
  lastSeenDate: string | null;
  daysMissing: number | null;
  urgencyLevel: "critical" | "high" | "medium";
  urgencyDisplay: string;
  contactPhone: string;
  publicAdvisory: string;
  createdAt: string;
}

/**
 * Result from poster generation
 */
export interface PosterGenerationResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
  size: number;
}

/**
 * Options for poster generation
 */
export interface PosterGenerationOptions {
  format: PosterFormat;
  size?: PosterSize;
  includeQRCode?: boolean;
}

/**
 * Transform AmberAlert entity to poster data
 */
export function amberAlertToPosterData(alert: AmberAlert): AmberAlertPosterData {
  const daysMissing = alert.getDaysMissing();
  const urgencyLevel = alert.getUrgencyLevel();

  let urgencyDisplay = "MEDIUM PRIORITY";
  if (urgencyLevel === "critical") {
    urgencyDisplay = "CRITICAL - IMMEDIATE ACTION REQUIRED";
  } else if (urgencyLevel === "high") {
    urgencyDisplay = "HIGH PRIORITY";
  }

  let publicAdvisory = `The public is requested to assist in locating ${alert.personName}`;
  if (alert.lastSeenLocation) {
    publicAdvisory += ` who was last seen in ${alert.lastSeenLocation}`;
  }
  if (daysMissing !== null && daysMissing <= 2) {
    publicAdvisory += ". Time is critical. Any information could help bring this child home safely.";
  } else {
    publicAdvisory += ". Any information, no matter how small, could be vital.";
  }

  return {
    id: alert.id,
    personName: alert.personName,
    age: alert.age,
    ageDisplay: alert.getAgeDisplay(),
    gender: alert.gender,
    genderDisplay: alert.gender ? alert.gender.charAt(0).toUpperCase() + alert.gender.slice(1) : "Unknown",
    description: alert.description,
    photoUrl: alert.getPhotoUrl("medium"),
    lastSeenLocation: alert.lastSeenLocation,
    lastSeenDate: alert.lastSeenDate?.toLocaleDateString() || null,
    daysMissing,
    urgencyLevel,
    urgencyDisplay,
    contactPhone: alert.contactPhone,
    publicAdvisory,
    createdAt: alert.createdAt.toLocaleDateString(),
  };
}

/**
 * Transform WantedPerson entity to poster data
 */
export function wantedPersonToPosterData(wanted: WantedPerson): WantedPosterData {
  const dangerLevelDisplayMap: Record<string, string> = {
    low: "LOW RISK",
    medium: "MEDIUM RISK",
    high: "HIGH RISK - APPROACH WITH CAUTION",
    extreme: "EXTREME DANGER - DO NOT APPROACH",
  };

  let publicAdvisory = "";
  if (wanted.dangerLevel === "extreme" || wanted.dangerLevel === "high") {
    publicAdvisory = `WARNING: ${wanted.personName} is considered ${wanted.dangerLevel === "extreme" ? "extremely dangerous" : "dangerous"}. Do NOT attempt to apprehend. Contact law enforcement immediately if sighted.`;
  } else {
    publicAdvisory = `If you have any information about the whereabouts of ${wanted.personName}, please contact local law enforcement. Do not approach directly.`;
  }

  return {
    id: wanted.id,
    name: wanted.personName,
    nin: wanted.nin,
    warrantNumber: wanted.warrantNumber,
    charges: wanted.charges.map((c) => c.charge),
    primaryCharge: wanted.getPrimaryCharge(),
    dangerLevel: wanted.dangerLevel,
    dangerLevelDisplay: dangerLevelDisplayMap[wanted.dangerLevel] || "UNKNOWN",
    physicalDescription: wanted.physicalDescription,
    photoUrl: wanted.getPhotoUrl("medium"),
    rewardAmount: wanted.rewardAmount,
    rewardDisplay: wanted.rewardAmount ? wanted.getRewardDisplay() : null,
    lastSeenLocation: wanted.lastSeenLocation,
    lastSeenDate: wanted.lastSeenDate?.toLocaleDateString() || null,
    contactPhone: wanted.contactPhone,
    isRegionalAlert: wanted.isRegionalAlert,
    issuedDate: wanted.issuedDate.toLocaleDateString(),
    publicAdvisory,
  };
}
