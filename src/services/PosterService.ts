/**
 * Poster Service
 *
 * Business logic layer for generating alert posters (PDF and images)
 * Handles poster generation, branding configuration, and audit logging
 *
 * Pan-African Design:
 * - Country-configurable branding
 * - Multi-format output (PDF for printing, PNG for sharing)
 * - Audit logging for all poster generations
 *
 * CRMS - Pan-African Digital Public Good
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { IAmberAlertRepository } from "@/src/domain/interfaces/repositories/IAmberAlertRepository";
import { IWantedPersonRepository } from "@/src/domain/interfaces/repositories/IWantedPersonRepository";
import { NotFoundError, ValidationError } from "@/src/lib/errors";
import {
  PosterFormat,
  PosterGenerationResult,
  amberAlertToPosterData,
  wantedPersonToPosterData,
  getPosterConfig,
  generateWantedPosterImage,
  generateAmberAlertPosterImage,
  WantedPosterData,
  AmberAlertPosterData,
  PosterBranding,
} from "@/lib/poster";

/**
 * Poster Service
 * Generates PDF and image posters for Wanted Persons and Amber Alerts
 */
export class PosterService {
  constructor(
    private readonly amberAlertRepository: IAmberAlertRepository,
    private readonly wantedPersonRepository: IWantedPersonRepository,
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  /**
   * Generate Wanted Person PDF
   * Uses dynamic import to avoid bundling issues
   */
  private async generateWantedPDF(
    data: WantedPosterData,
    branding: PosterBranding
  ): Promise<Buffer> {
    // Dynamic import to avoid bundling issues with @react-pdf/renderer
    const React = await import("react");
    const { WantedPosterPDF } = await import("@/components/posters/wanted-poster-pdf");

    const element = React.createElement(WantedPosterPDF, {
      data,
      branding,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(element as any);
    return Buffer.from(pdfBuffer);
  }

  /**
   * Generate Amber Alert PDF
   * Uses dynamic import to avoid bundling issues
   */
  private async generateAmberAlertPDF(
    data: AmberAlertPosterData,
    branding: PosterBranding
  ): Promise<Buffer> {
    // Dynamic import to avoid bundling issues with @react-pdf/renderer
    const React = await import("react");
    const { AmberAlertPosterPDF } = await import("@/components/posters/amber-alert-poster-pdf");

    const element = React.createElement(AmberAlertPosterPDF, {
      data,
      branding,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(element as any);
    return Buffer.from(pdfBuffer);
  }

  /**
   * Generate a Wanted Person poster
   *
   * @param id - Wanted person ID
   * @param format - Output format (pdf or image)
   * @param officerId - ID of the officer generating the poster
   * @param ipAddress - Optional IP address for audit logging
   * @returns Generated poster as buffer with metadata
   */
  async generateWantedPoster(
    id: string,
    format: PosterFormat,
    officerId: string,
    ipAddress?: string
  ): Promise<PosterGenerationResult> {
    // Fetch wanted person
    const wantedPerson = await this.wantedPersonRepository.findById(id);

    if (!wantedPerson) {
      throw new NotFoundError(`Wanted person not found: ${id}`);
    }

    // Get branding configuration
    const config = getPosterConfig();
    const branding = config.branding;

    // Transform to poster data
    const posterData = wantedPersonToPosterData(wantedPerson);

    let result: PosterGenerationResult;

    if (format === "pdf") {
      // Generate PDF
      const pdfBuffer = await this.generateWantedPDF(posterData, branding);

      result = {
        buffer: pdfBuffer,
        contentType: "application/pdf",
        filename: `wanted-${id.substring(0, 8)}.pdf`,
        size: pdfBuffer.byteLength,
      };
    } else {
      // Generate image
      result = await generateWantedPosterImage(posterData, branding);
    }

    // Audit log the poster generation
    await this.auditLogRepository.create({
      entityType: "wanted_person",
      entityId: id,
      officerId: officerId,
      action: "export",
      success: true,
      details: {
        operation: "poster_generation",
        format: format,
        filename: result.filename,
        size: result.size,
      },
      ipAddress: ipAddress,
    });

    return result;
  }

  /**
   * Generate an Amber Alert poster
   *
   * @param id - Amber alert ID
   * @param format - Output format (pdf or image)
   * @param officerId - ID of the officer generating the poster
   * @param ipAddress - Optional IP address for audit logging
   * @returns Generated poster as buffer with metadata
   */
  async generateAmberAlertPoster(
    id: string,
    format: PosterFormat,
    officerId: string,
    ipAddress?: string
  ): Promise<PosterGenerationResult> {
    // Fetch amber alert
    const amberAlert = await this.amberAlertRepository.findById(id);

    if (!amberAlert) {
      throw new NotFoundError(`Amber alert not found: ${id}`);
    }

    // Get branding configuration
    const config = getPosterConfig();
    const branding = config.branding;

    // Transform to poster data
    const posterData = amberAlertToPosterData(amberAlert);

    let result: PosterGenerationResult;

    if (format === "pdf") {
      // Generate PDF
      const pdfBuffer = await this.generateAmberAlertPDF(posterData, branding);

      result = {
        buffer: pdfBuffer,
        contentType: "application/pdf",
        filename: `amber-alert-${id.substring(0, 8)}.pdf`,
        size: pdfBuffer.byteLength,
      };
    } else {
      // Generate image
      result = await generateAmberAlertPosterImage(posterData, branding);
    }

    // Audit log the poster generation
    await this.auditLogRepository.create({
      entityType: "amber_alert",
      entityId: id,
      officerId: officerId,
      action: "export",
      success: true,
      details: {
        operation: "poster_generation",
        format: format,
        filename: result.filename,
        size: result.size,
        urgencyLevel: posterData.urgencyLevel,
      },
      ipAddress: ipAddress,
    });

    return result;
  }

  /**
   * Validate poster generation request
   *
   * @param format - Requested format
   * @throws ValidationError if format is invalid
   */
  validateFormat(format: string): PosterFormat {
    if (format !== "pdf" && format !== "image") {
      throw new ValidationError(
        `Invalid format: ${format}. Supported formats: pdf, image`
      );
    }
    return format as PosterFormat;
  }
}
