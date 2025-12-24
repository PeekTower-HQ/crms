/**
 * Amber Alert Poster PDF Template
 *
 * Generates a professional PDF poster for missing children
 * Designed for urgent distribution and printing
 *
 * Pan-African Design:
 * - Country-configurable branding
 * - Multi-language ready
 * - Print-optimized A4 format
 * - Urgency-focused design
 *
 * CRMS - Pan-African Digital Public Good
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  AmberAlertPosterData,
  PosterBranding,
  generateBulletinNumber,
  truncateText,
} from "@/lib/poster";
import { baseStyles, amberStyles, getUrgencyBadgeStyle } from "./poster-styles";

interface AmberAlertPosterPDFProps {
  data: AmberAlertPosterData;
  branding: PosterBranding;
}

/**
 * Amber Alert Poster PDF Component
 */
export function AmberAlertPosterPDF({ data, branding }: AmberAlertPosterPDFProps) {
  const bulletinNumber = generateBulletinNumber(data.id, "amber");
  const urgencyBadgeStyle = getUrgencyBadgeStyle(data.urgencyLevel);

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <View style={baseStyles.header}>
          <View style={baseStyles.headerLeft}>
            {branding.logoUrl && (
              <Image src={branding.logoUrl} style={baseStyles.logo} />
            )}
            <View>
              <Text style={baseStyles.orgName}>{branding.organizationName}</Text>
              <Text style={baseStyles.bulletinNumber}>
                Alert No. {bulletinNumber}
              </Text>
            </View>
          </View>
          <View style={baseStyles.badgeContainer}>
            <View style={urgencyBadgeStyle}>
              <Text>{data.urgencyDisplay}</Text>
            </View>
          </View>
        </View>

        {/* Main Banner */}
        <View style={amberStyles.banner}>
          <Text style={amberStyles.bannerText}>AMBER ALERT</Text>
        </View>

        {/* Missing Duration Alert */}
        {data.daysMissing !== null && (
          <View style={styles.missingDuration}>
            <Text style={styles.missingDurationText}>
              MISSING FOR {data.daysMissing} DAY{data.daysMissing !== 1 ? "S" : ""}
            </Text>
          </View>
        )}

        {/* Content Row - Photo and Details */}
        <View style={baseStyles.contentRow}>
          {/* Photo */}
          <View style={baseStyles.photoContainer}>
            {data.photoUrl ? (
              <Image src={data.photoUrl} style={baseStyles.photo} />
            ) : (
              <Text style={baseStyles.photoPlaceholder}>
                NO PHOTO{"\n"}AVAILABLE
              </Text>
            )}
          </View>

          {/* Details Panel */}
          <View style={baseStyles.detailsPanel}>
            {/* Name */}
            <View style={baseStyles.detailRow}>
              <Text style={amberStyles.detailLabel}>NAME</Text>
              <Text style={amberStyles.detailValue}>
                {truncateText(data.personName, 40)}
              </Text>
            </View>

            {/* Age and Gender */}
            <View style={baseStyles.detailRow}>
              <Text style={amberStyles.detailLabel}>AGE / GENDER</Text>
              <Text style={amberStyles.detailValue}>
                {data.ageDisplay} | {data.genderDisplay}
              </Text>
            </View>

            {/* Last Seen */}
            <View style={baseStyles.detailRow}>
              <Text style={amberStyles.detailLabel}>LAST SEEN</Text>
              <Text style={amberStyles.detailValue}>
                {data.lastSeenLocation || "Unknown Location"}
                {data.lastSeenDate && `\n${data.lastSeenDate}`}
              </Text>
            </View>

            {/* Contact */}
            <View style={baseStyles.detailRow}>
              <Text style={amberStyles.detailLabel}>EMERGENCY CONTACT</Text>
              <Text style={amberStyles.detailValue}>
                Call Immediately:{"\n"}
                {data.contactPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* Physical Description */}
        <View style={baseStyles.chargesSection}>
          <Text style={baseStyles.chargesTitle}>DESCRIPTION</Text>
          <Text style={baseStyles.chargesText}>
            {truncateText(data.description, 300)}
          </Text>
        </View>

        {/* Public Advisory */}
        <View style={amberStyles.advisorySection}>
          <Text style={baseStyles.advisoryTitle}>PUBLIC ADVISORY</Text>
          <Text style={baseStyles.advisoryText}>{data.publicAdvisory}</Text>
          {data.urgencyLevel === "critical" && (
            <Text style={styles.urgentNotice}>
              {"\n"}TIME IS CRITICAL. The first 48 hours are crucial in missing child cases.
            </Text>
          )}
        </View>

        {/* How to Help */}
        <View style={amberStyles.helpSection}>
          <Text style={baseStyles.helpTitle}>IF YOU SEE THIS CHILD</Text>
          <View style={styles.helpSteps}>
            <Text style={baseStyles.helpText}>
              1. Do NOT approach or attempt to intervene directly
            </Text>
            <Text style={baseStyles.helpText}>
              2. Note the location, time, and any accompanying individuals
            </Text>
            <Text style={baseStyles.helpText}>
              3. Call immediately:
            </Text>
          </View>
          <Text style={baseStyles.contactNumber}>
            {branding.hotline} | {data.contactPhone}
          </Text>
        </View>

        {/* Alert Info */}
        <View style={styles.alertInfo}>
          <Text style={styles.alertText}>
            Alert Issued: {data.createdAt}
            {" | "}
            All information shared confidentially
          </Text>
        </View>

        {/* Footer */}
        <Text style={baseStyles.footer}>
          {branding.organizationName}
          {branding.website && ` | ${branding.website}`}
          {"\n"}
          Help bring our children home - Share this alert
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Additional styles specific to amber alert poster
 */
const styles = StyleSheet.create({
  missingDuration: {
    backgroundColor: "#DC2626",
    padding: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  missingDurationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  urgentNotice: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#DC2626",
    marginTop: 5,
  },
  helpSteps: {
    marginBottom: 8,
  },
  alertInfo: {
    marginTop: 5,
    padding: 5,
    backgroundColor: "#FEF3C7",
    borderRadius: 2,
  },
  alertText: {
    fontSize: 8,
    color: "#92400E",
    textAlign: "center",
  },
});

export default AmberAlertPosterPDF;
