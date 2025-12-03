/**
 * Field Check Service
 *
 * Channel-agnostic business logic for officer field checks.
 * Shared between USSD and WhatsApp channels.
 *
 * Features:
 * - Quick PIN authentication
 * - Rate limiting (50 queries/day per officer)
 * - Wanted/Missing person checks
 * - Background checks
 * - Vehicle checks
 * - Query statistics
 * - Complete audit logging
 *
 * Pan-African Design:
 * - Works with any national ID system
 * - Country-agnostic vehicle plate formats
 * - USSD/WhatsApp compatible result structures
 */

import { PrismaClient } from "@prisma/client";
import { verify } from "argon2";

// Repository Interfaces
import { IOfficerRepository } from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { IVehicleRepository } from "@/src/domain/interfaces/repositories/IVehicleRepository";
import { IWantedPersonRepository } from "@/src/domain/interfaces/repositories/IWantedPersonRepository";
import { ICaseRepository } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";

// Service Interface
import {
  IFieldCheckService,
  FieldCheckRequest,
  FieldCheckResult,
  FieldCheckType,
  FieldCheckChannel,
  RateLimitCheckResult,
  AuthenticatedOfficer,
  WantedPersonCheckResult,
  MissingPersonCheckResult,
  BackgroundCheckResult,
  VehicleCheckResult,
  QueryStatistics,
} from "@/src/domain/interfaces/services/IFieldCheckService";

/**
 * Configuration for rate limiting
 */
interface RateLimitConfig {
  defaultDailyLimit: number;
  resetHour: number; // Hour of day when limit resets (0-23)
}

/**
 * FieldCheckService Implementation
 */
export class FieldCheckService implements IFieldCheckService {
  private readonly rateLimitConfig: RateLimitConfig = {
    defaultDailyLimit: 50,
    resetHour: 0, // Midnight
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly officerRepo: IOfficerRepository,
    private readonly personRepo: IPersonRepository,
    private readonly vehicleRepo: IVehicleRepository,
    private readonly wantedPersonRepo: IWantedPersonRepository,
    private readonly caseRepo: ICaseRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  // =====================
  // OFFICER LOOKUP & AUTH
  // =====================

  /**
   * Find officer by phone number
   */
  async findOfficerByPhone(
    phoneNumber: string
  ): Promise<AuthenticatedOfficer | null> {
    try {
      const officer = await this.prisma.officer.findFirst({
        where: { ussdPhoneNumber: phoneNumber },
        include: {
          station: true,
          role: true,
        },
      });

      if (!officer) {
        return null;
      }

      return {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        stationId: officer.stationId,
        stationName: officer.station.name,
        stationCode: officer.station.code,
        roleLevel: officer.role.level,
        dailyLimit: officer.ussdDailyLimit,
      };
    } catch (error) {
      console.error("[FieldCheckService] Find officer error:", error);
      return null;
    }
  }

  /**
   * Verify PIN for already identified officer
   */
  async verifyOfficerPin(officerId: string, quickPin: string): Promise<boolean> {
    try {
      if (!this.isValidQuickPin(quickPin)) {
        return false;
      }

      const officer = await this.prisma.officer.findUnique({
        where: { id: officerId },
        select: {
          ussdQuickPinHash: true,
          active: true,
          ussdEnabled: true,
          lockedUntil: true,
        },
      });

      if (!officer?.ussdQuickPinHash) {
        return false;
      }

      // Check if account is active
      if (!officer.active || !officer.ussdEnabled) {
        return false;
      }

      // Check if account is locked
      if (officer.lockedUntil && officer.lockedUntil > new Date()) {
        return false;
      }

      const isValid = await verify(officer.ussdQuickPinHash, quickPin);

      if (isValid) {
        // Update last used timestamp
        await this.prisma.officer.update({
          where: { id: officerId },
          data: { ussdLastUsed: new Date() },
        });
      }

      return isValid;
    } catch (error) {
      console.error("[FieldCheckService] PIN verification error:", error);
      return false;
    }
  }

  /**
   * Check if channel is enabled for officer
   */
  async isChannelEnabled(
    officerId: string,
    channel: FieldCheckChannel
  ): Promise<boolean> {
    try {
      const officer = await this.prisma.officer.findUnique({
        where: { id: officerId },
        select: {
          ussdEnabled: true,
          active: true,
        },
      });

      if (!officer) {
        return false;
      }

      // Currently both channels use ussdEnabled flag
      return officer.active && officer.ussdEnabled;
    } catch (error) {
      console.error("[FieldCheckService] Channel check error:", error);
      return false;
    }
  }

  // =====================
  // RATE LIMITING
  // =====================

  /**
   * Check rate limit for officer
   */
  async checkRateLimit(officerId: string): Promise<RateLimitCheckResult> {
    try {
      // Get officer's daily limit
      const officer = await this.prisma.officer.findUnique({
        where: { id: officerId },
        select: { ussdDailyLimit: true },
      });

      const limit =
        officer?.ussdDailyLimit ?? this.rateLimitConfig.defaultDailyLimit;

      // Calculate today's midnight
      const todayMidnight = new Date();
      todayMidnight.setHours(this.rateLimitConfig.resetHour, 0, 0, 0);

      // Calculate tomorrow's midnight for reset time
      const tomorrowMidnight = new Date(todayMidnight);
      tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

      // Count queries since midnight (all channels combined)
      const count = await this.prisma.uSSDQueryLog.count({
        where: {
          officerId,
          timestamp: {
            gte: todayMidnight,
          },
        },
      });

      const remaining = Math.max(0, limit - count);

      return {
        allowed: count < limit,
        remaining,
        limit,
        resetAt: tomorrowMidnight,
      };
    } catch (error) {
      console.error("[FieldCheckService] Rate limit check error:", error);
      // Fail closed - deny access on error
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      return {
        allowed: false,
        remaining: 0,
        limit: this.rateLimitConfig.defaultDailyLimit,
        resetAt: tomorrow,
      };
    }
  }

  // =====================
  // FIELD CHECKS
  // =====================

  /**
   * Check wanted person status
   */
  async checkWantedPerson(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<WantedPersonCheckResult>> {
    const startTime = Date.now();

    try {
      // Check rate limit
      const rateLimit = await this.checkRateLimit(request.officerId);
      if (!rateLimit.allowed) {
        return this.createRateLimitedResult(request);
      }

      // Find person by NIN
      const person = await this.personRepo.findByNIN(
        request.searchTerm.toUpperCase()
      );

      let result: WantedPersonCheckResult;

      if (!person) {
        result = {
          found: false,
          personExists: false,
          isWanted: false,
        };
      } else {
        // Check for active wanted status
        const wantedPersons = await this.wantedPersonRepo.findByPersonId(
          person.id
        );
        const activeWanted = wantedPersons.find((wp) => wp.status === "active");

        if (activeWanted) {
          result = {
            found: true,
            personExists: true,
            isWanted: true,
            person: {
              name: `${person.firstName} ${person.lastName}`,
              nin: person.nin,
            },
            wantedDetails: {
              warrantNumber: activeWanted.warrantNumber,
              charges: activeWanted.charges.map((c) => c.charge),
              dangerLevel: activeWanted.dangerLevel as
                | "low"
                | "medium"
                | "high"
                | "extreme",
              lastSeenLocation: activeWanted.lastSeenLocation,
              rewardAmount: activeWanted.rewardAmount,
            },
          };
        } else {
          result = {
            found: true,
            personExists: true,
            isWanted: false,
            person: {
              name: `${person.firstName} ${person.lastName}`,
              nin: person.nin,
            },
          };
        }
      }

      // Log query
      await this.logQuery({
        ...request,
        resultSummary: result.isWanted
          ? "WANTED"
          : result.personExists
            ? "NOT_WANTED"
            : "NOT_FOUND",
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        checkType: "wanted",
        timestamp: new Date(),
        officerId: request.officerId,
        data: result,
      };
    } catch (error) {
      console.error("[FieldCheckService] Wanted person check error:", error);
      await this.logQuery({
        ...request,
        success: false,
        errorMessage: "Database error",
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        checkType: "wanted",
        timestamp: new Date(),
        officerId: request.officerId,
        error: "Error checking wanted status",
        errorCode: "DATABASE_ERROR",
      };
    }
  }

  /**
   * Check missing person status
   */
  async checkMissingPerson(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<MissingPersonCheckResult>> {
    const startTime = Date.now();

    try {
      // Check rate limit
      const rateLimit = await this.checkRateLimit(request.officerId);
      if (!rateLimit.allowed) {
        return this.createRateLimitedResult(request);
      }

      // Find person by NIN
      const person = await this.personRepo.findByNIN(
        request.searchTerm.toUpperCase()
      );

      let result: MissingPersonCheckResult;

      if (!person) {
        result = {
          found: false,
          personExists: false,
          isMissing: false,
        };
      } else if (person.isDeceasedOrMissing) {
        result = {
          found: true,
          personExists: true,
          isMissing: true,
          person: {
            name: `${person.firstName} ${person.lastName}`,
            nin: person.nin,
          },
          missingDetails: {
            status: "Missing/Deceased",
            lastSeenLocation: null,
            lastSeenDate: null,
            description: "Contact station for details",
            contactPhone: "Contact local station",
          },
        };
      } else {
        result = {
          found: true,
          personExists: true,
          isMissing: false,
          person: {
            name: `${person.firstName} ${person.lastName}`,
            nin: person.nin,
          },
        };
      }

      // Log query
      await this.logQuery({
        ...request,
        resultSummary: result.isMissing
          ? "MISSING"
          : result.personExists
            ? "NOT_MISSING"
            : "NOT_FOUND",
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        checkType: "missing",
        timestamp: new Date(),
        officerId: request.officerId,
        data: result,
      };
    } catch (error) {
      console.error("[FieldCheckService] Missing person check error:", error);
      await this.logQuery({
        ...request,
        success: false,
        errorMessage: "Database error",
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        checkType: "missing",
        timestamp: new Date(),
        officerId: request.officerId,
        error: "Error checking missing status",
        errorCode: "DATABASE_ERROR",
      };
    }
  }

  /**
   * Check background (criminal record)
   */
  async checkBackground(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<BackgroundCheckResult>> {
    const startTime = Date.now();

    try {
      // Check rate limit
      const rateLimit = await this.checkRateLimit(request.officerId);
      if (!rateLimit.allowed) {
        return this.createRateLimitedResult(request);
      }

      // Find person by NIN
      const person = await this.personRepo.findByNIN(
        request.searchTerm.toUpperCase()
      );

      let result: BackgroundCheckResult;

      if (!person) {
        result = {
          found: false,
          personExists: false,
          status: "clear",
        };
      } else {
        // Get case count
        const cases = await this.caseRepo.findByPersonId(person.id);
        const caseCount = cases.length;

        // Check wanted status
        const wantedPersons = await this.wantedPersonRepo.findByPersonId(
          person.id
        );
        const isWanted = wantedPersons.some((wp) => wp.status === "active");

        const isMissing = person.isDeceasedOrMissing;

        if (caseCount === 0 && !isWanted && !isMissing) {
          result = {
            found: true,
            personExists: true,
            status: "clear",
            person: {
              name: `${person.firstName} ${person.lastName}`,
              nin: person.nin,
            },
          };
        } else {
          // Calculate risk level
          const hasCritical = cases.some((c) => c.severity === "critical");
          const hasMajor = cases.some((c) => c.severity === "major");

          let riskLevel: "low" | "medium" | "high" = "low";
          if (hasCritical || isWanted) {
            riskLevel = "high";
          } else if (hasMajor) {
            riskLevel = "medium";
          }

          result = {
            found: true,
            personExists: true,
            status: "has_record",
            person: {
              name: `${person.firstName} ${person.lastName}`,
              nin: person.nin,
            },
            recordDetails: {
              caseCount,
              isWanted,
              isMissing,
              riskLevel,
            },
          };
        }
      }

      // Log query
      await this.logQuery({
        ...request,
        resultSummary:
          result.status === "has_record"
            ? "HAS_RECORD"
            : result.personExists
              ? "CLEAR"
              : "NOT_FOUND",
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        checkType: "background",
        timestamp: new Date(),
        officerId: request.officerId,
        data: result,
      };
    } catch (error) {
      console.error("[FieldCheckService] Background check error:", error);
      await this.logQuery({
        ...request,
        success: false,
        errorMessage: "Database error",
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        checkType: "background",
        timestamp: new Date(),
        officerId: request.officerId,
        error: "Error performing background check",
        errorCode: "DATABASE_ERROR",
      };
    }
  }

  /**
   * Check vehicle status
   */
  async checkVehicle(
    request: FieldCheckRequest
  ): Promise<FieldCheckResult<VehicleCheckResult>> {
    const startTime = Date.now();

    try {
      // Check rate limit
      const rateLimit = await this.checkRateLimit(request.officerId);
      if (!rateLimit.allowed) {
        return this.createRateLimitedResult(request);
      }

      // Normalize license plate (remove spaces, uppercase)
      const plate = request.searchTerm.toUpperCase().replace(/\s/g, "");

      // Find vehicle by license plate
      const vehicle = await this.vehicleRepo.findByLicensePlate(plate);

      let result: VehicleCheckResult;

      if (!vehicle) {
        result = {
          found: false,
          status: "not_found",
        };
      } else if (vehicle.status === "stolen") {
        const daysStolen = vehicle.stolenDate
          ? Math.floor(
              (Date.now() - vehicle.stolenDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        result = {
          found: true,
          status: "stolen",
          vehicle: {
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            year: vehicle.year,
            ownerName: vehicle.ownerName,
          },
          stolenDetails: {
            stolenDate: vehicle.stolenDate!,
            daysStolen,
            reportedBy: vehicle.stolenReportedBy,
          },
        };
      } else if (vehicle.status === "impounded") {
        result = {
          found: true,
          status: "impounded",
          vehicle: {
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            year: vehicle.year,
            ownerName: vehicle.ownerName,
          },
        };
      } else if (vehicle.status === "recovered") {
        result = {
          found: true,
          status: "recovered",
          vehicle: {
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            year: vehicle.year,
            ownerName: vehicle.ownerName,
          },
        };
      } else {
        result = {
          found: true,
          status: "clean",
          vehicle: {
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            year: vehicle.year,
            ownerName: vehicle.ownerName,
          },
        };
      }

      // Log query
      await this.logQuery({
        ...request,
        resultSummary: result.status.toUpperCase(),
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        checkType: "vehicle",
        timestamp: new Date(),
        officerId: request.officerId,
        data: result,
      };
    } catch (error) {
      console.error("[FieldCheckService] Vehicle check error:", error);
      await this.logQuery({
        ...request,
        success: false,
        errorMessage: "Database error",
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        checkType: "vehicle",
        timestamp: new Date(),
        officerId: request.officerId,
        error: "Error checking vehicle status",
        errorCode: "DATABASE_ERROR",
      };
    }
  }

  /**
   * Get officer query statistics
   */
  async getStatistics(
    officerId: string,
    channel: FieldCheckChannel
  ): Promise<FieldCheckResult<QueryStatistics>> {
    try {
      const stats = await this.calculateStatistics(officerId);

      // Log stats access
      await this.logQuery({
        officerId,
        checkType: "stats",
        searchTerm: "self",
        channel,
        resultSummary: "SUCCESS",
        success: true,
      });

      return {
        success: true,
        checkType: "stats",
        timestamp: new Date(),
        officerId,
        data: stats,
      };
    } catch (error) {
      console.error("[FieldCheckService] Statistics error:", error);
      return {
        success: false,
        checkType: "stats",
        timestamp: new Date(),
        officerId,
        error: "Error retrieving statistics",
        errorCode: "DATABASE_ERROR",
      };
    }
  }

  // =====================
  // PRIVATE HELPERS
  // =====================

  /**
   * Validate quick PIN format (4 digits)
   */
  private isValidQuickPin(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }

  /**
   * Log field check query
   */
  private async logQuery(data: {
    officerId: string;
    checkType: FieldCheckType;
    searchTerm: string;
    channel: FieldCheckChannel;
    sessionId?: string;
    resultSummary?: string;
    success: boolean;
    errorMessage?: string;
    durationMs?: number;
  }): Promise<void> {
    try {
      // Get officer phone number for logging
      const officer = await this.prisma.officer.findUnique({
        where: { id: data.officerId },
        select: { ussdPhoneNumber: true },
      });

      await this.prisma.uSSDQueryLog.create({
        data: {
          officerId: data.officerId,
          phoneNumber: officer?.ussdPhoneNumber || "unknown",
          queryType: data.checkType,
          searchTerm: data.searchTerm,
          resultSummary: data.resultSummary || null,
          success: data.success,
          errorMessage: data.errorMessage || null,
          sessionId: data.sessionId || null,
          timestamp: new Date(),
        },
      });

      // Also create audit log for compliance
      await this.auditRepo.create({
        entityType: "field_check",
        entityId: data.sessionId,
        officerId: data.officerId,
        action: "read",
        success: data.success,
        details: {
          checkType: data.checkType,
          channel: data.channel,
          searchTerm: data.searchTerm,
          resultSummary: data.resultSummary,
          durationMs: data.durationMs,
        },
      });
    } catch (error) {
      console.error("[FieldCheckService] Query logging error:", error);
    }
  }

  /**
   * Calculate query statistics for officer
   */
  private async calculateStatistics(
    officerId: string
  ): Promise<QueryStatistics> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, thisWeek, thisMonth, total] = await Promise.all([
      this.prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: todayStart } },
      }),
      this.prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: weekStart } },
      }),
      this.prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: monthStart } },
      }),
      this.prisma.uSSDQueryLog.count({
        where: { officerId },
      }),
    ]);

    // Get queries by type
    const byTypeData = await this.prisma.uSSDQueryLog.groupBy({
      by: ["queryType"],
      where: { officerId },
      _count: { queryType: true },
    });

    const byType: Record<string, number> = {};
    byTypeData.forEach((item) => {
      byType[item.queryType] = item._count.queryType;
    });

    // Calculate success rate
    const successCount = await this.prisma.uSSDQueryLog.count({
      where: { officerId, success: true },
    });
    const successRate = total > 0 ? (successCount / total) * 100 : 0;

    return {
      today,
      thisWeek,
      thisMonth,
      total,
      byType,
      successRate,
    };
  }

  /**
   * Create rate limited result
   */
  private createRateLimitedResult<T>(
    request: FieldCheckRequest
  ): FieldCheckResult<T> {
    return {
      success: false,
      checkType: request.checkType,
      timestamp: new Date(),
      officerId: request.officerId,
      error: "Daily query limit reached. Please try again tomorrow.",
      errorCode: "RATE_LIMITED",
    };
  }
}
