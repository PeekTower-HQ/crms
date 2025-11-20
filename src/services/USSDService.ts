/**
 * USSD Service
 *
 * Handles all USSD business logic for officer field tools.
 * Coordinates between session management, authentication, rate limiting,
 * and feature execution (wanted/missing checks, background checks, vehicle checks).
 *
 * Features:
 * - Main menu navigation
 * - Quick PIN authentication
 * - Rate limiting enforcement
 * - Query logging with audit trails
 * - Integration with existing services (AlertService, PersonService, VehicleService, BackgroundCheckService)
 *
 * Pan-African Design: Works with basic feature phones via USSD codes (*123#)
 */

import { IUSSDSessionRepository } from "@/src/domain/interfaces/repositories/IUSSDSessionRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { IVehicleRepository } from "@/src/domain/interfaces/repositories/IVehicleRepository";
import { IWantedPersonRepository } from "@/src/domain/interfaces/repositories/IWantedPersonRepository";
import { ICaseRepository } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { IOfficerRepository } from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { PrismaClient } from "@prisma/client";
import { verify } from "argon2";
import type { CountryConfigService } from "@/src/services/CountryConfigService";

/**
 * USSD Webhook Data from gateway (Africa's Talking / Twilio)
 */
export interface USSDWebhookData {
  sessionId: string;
  phoneNumber: string;
  text: string;
}

/**
 * Query statistics for an officer
 */
export interface QueryStatistics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  byType: Record<string, number>;
  successRate: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

/**
 * USSD Service Implementation
 */
export class USSDService {
  constructor(
    private readonly sessionRepo: IUSSDSessionRepository,
    private readonly officerRepo: IOfficerRepository,
    private readonly personRepo: IPersonRepository,
    private readonly vehicleRepo: IVehicleRepository,
    private readonly wantedPersonRepo: IWantedPersonRepository,
    private readonly caseRepo: ICaseRepository,
    private readonly auditLogRepo: IAuditLogRepository,
    private readonly prisma: PrismaClient,
    private readonly countryConfig: CountryConfigService
  ) {}

  /**
   * Get the USSD shortcode for this deployment
   * Example: "*456#" for Sierra Leone
   */
  getUSSDShortcode(): string {
    return this.countryConfig.getUssdShortcode();
  }

  /**
   * Get available USSD gateways (telecom providers) for this deployment
   * Example: ["Orange", "Africell", "Qcell"] for Sierra Leone
   */
  getUSSDGateways(): string[] {
    return this.countryConfig.getUssdGateways();
  }

  /**
   * Main USSD callback handler
   * Orchestrates the entire USSD flow
   */
  async handleCallback(webhookData: USSDWebhookData): Promise<string> {
    try {
      const { sessionId, phoneNumber, text } = webhookData;

      if (!sessionId || !phoneNumber) {
        return "END Invalid request";
      }

      // Get or create session
      let session = await this.sessionRepo.get(sessionId);
      if (!session) {
        await this.sessionRepo.save(sessionId, {
          phoneNumber,
          currentMenu: "main",
          data: {},
        });
        session = await this.sessionRepo.get(sessionId);
      }

      // Parse user input
      const inputs = this.parseUSSDInput(text);
      const lastInput = this.getLastInput(text);

      // Route based on input level
      let response: string;

      if (inputs.length === 0) {
        // Main menu
        response = this.getMainMenu();
      } else if (inputs.length === 1) {
        // Feature selection
        response = await this.handleFeatureSelection(sessionId, phoneNumber, inputs[0]);
      } else if (inputs.length === 2) {
        // Authentication (Quick PIN entry)
        response = await this.handleAuthentication(sessionId, phoneNumber, inputs, lastInput!);
      } else if (inputs.length >= 3) {
        // Execute query
        response = await this.handleQuery(sessionId, phoneNumber, inputs);
      } else {
        response = "END Invalid selection";
      }

      return response;
    } catch (error) {
      console.error("[USSDService] Callback error:", error);
      return "END Service temporarily unavailable";
    }
  }

  /**
   * Display main menu
   */
  private getMainMenu(): string {
    return (
      "CON CRMS Field Tools\n" +
      "1. Check wanted person\n" +
      "2. Check missing person\n" +
      "3. Background check\n" +
      "4. Check vehicle\n" +
      "5. My stats"
    );
  }

  /**
   * Handle feature selection (Level 1)
   */
  private async handleFeatureSelection(
    sessionId: string,
    phoneNumber: string,
    selection: string
  ): Promise<string> {
    const features: Record<string, string> = {
      "1": "wanted",
      "2": "missing",
      "3": "background",
      "4": "vehicle",
      "5": "stats",
    };

    const feature = features[selection];
    if (!feature) {
      return "END Invalid selection";
    }

    // Store selected feature in session
    await this.sessionRepo.setData(sessionId, "feature", feature);

    return "CON Enter your 4-digit Quick PIN:";
  }

  /**
   * Handle authentication with Quick PIN (Level 2)
   */
  private async handleAuthentication(
    sessionId: string,
    phoneNumber: string,
    inputs: string[],
    quickPin: string
  ): Promise<string> {
    // Validate Quick PIN format
    if (!this.isValidQuickPin(quickPin)) {
      await this.sessionRepo.delete(sessionId);
      return "END Invalid Quick PIN format. Must be 4 digits.";
    }

    // Authenticate officer
    const authResult = await this.authenticateQuickPin(phoneNumber, quickPin);

    if (!authResult.success) {
      await this.sessionRepo.delete(sessionId);
      return `END ${authResult.error}`;
    }

    // Store officer data in session
    await this.sessionRepo.authenticateSession(sessionId, authResult.officer!.id, authResult.officer);

    // Check rate limit
    const rateLimit = await this.checkRateLimit(authResult.officer!.id);
    if (!rateLimit.allowed) {
      await this.sessionRepo.delete(sessionId);
      return `END Daily limit reached (${rateLimit.limit} queries).\nResets at midnight.`;
    }

    // Get selected feature
    const feature = await this.sessionRepo.getData(sessionId, "feature");

    // Prompt for input based on feature
    if (feature === "stats") {
      // Stats doesn't need additional input - execute immediately
      return await this.executeStatsQuery(sessionId, authResult.officer!.id, phoneNumber);
    } else if (feature === "vehicle") {
      return "CON Enter license plate:";
    } else {
      // wanted, missing, background
      return "CON Enter NIN:";
    }
  }

  /**
   * Handle query execution (Level 3+)
   */
  private async handleQuery(
    sessionId: string,
    phoneNumber: string,
    inputs: string[]
  ): Promise<string> {
    // Get officer data from session
    const session = await this.sessionRepo.get(sessionId);
    if (!session || !session.officerId) {
      await this.sessionRepo.delete(sessionId);
      return "END Session expired. Please try again.";
    }

    const feature = await this.sessionRepo.getData(sessionId, "feature");
    const searchTerm = inputs[inputs.length - 1];

    // Execute query based on feature
    let result: string;
    switch (feature) {
      case "wanted":
        result = await this.executeWantedCheck(session.officerId, searchTerm, phoneNumber, sessionId);
        break;
      case "missing":
        result = await this.executeMissingCheck(session.officerId, searchTerm, phoneNumber, sessionId);
        break;
      case "background":
        result = await this.executeBackgroundCheck(session.officerId, searchTerm, phoneNumber, sessionId);
        break;
      case "vehicle":
        result = await this.executeVehicleCheck(session.officerId, searchTerm, phoneNumber, sessionId);
        break;
      default:
        result = "END Invalid feature";
    }

    // Clear session after query
    await this.sessionRepo.delete(sessionId);

    return result;
  }

  /**
   * Execute wanted person check
   */
  private async executeWantedCheck(
    officerId: string,
    nin: string,
    phoneNumber: string,
    sessionId: string
  ): Promise<string> {
    try {
      // Find person by NIN
      const person = await this.personRepo.findByNIN(nin);

      let resultSummary: string;
      let response: string;

      if (!person) {
        resultSummary = "NOT_FOUND";
        response = "END No record found for NIN: " + nin;
      } else {
        // Check if person has active wanted status
        const wantedPersons = await this.wantedPersonRepo.findByPersonId(person.id);
        const activeWanted = wantedPersons.find((wp) => wp.status === "active");

        if (activeWanted) {
          resultSummary = "WANTED";
          response =
            "END ⚠️ WANTED PERSON\n" +
            `Name: ${person.firstName} ${person.lastName}\n` +
            `Charges: ${activeWanted.charges.join(", ")}\n` +
            `Danger: ${activeWanted.dangerLevel.toUpperCase()}\n` +
            `Warrant: ${activeWanted.warrantNumber || "N/A"}`;
        } else {
          resultSummary = "NOT_WANTED";
          response = "END ✓ No active warrants\n" + `Name: ${person.firstName} ${person.lastName}`;
        }
      }

      // Log query
      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "wanted",
        searchTerm: nin,
        resultSummary,
        success: true,
        sessionId,
      });

      return response;
    } catch (error) {
      console.error("[USSDService] Wanted check error:", error);
      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "wanted",
        searchTerm: nin,
        success: false,
        errorMessage: "Database error",
        sessionId,
      });
      return "END Error checking wanted status";
    }
  }

  /**
   * Execute missing person check
   */
  private async executeMissingCheck(
    officerId: string,
    nin: string,
    phoneNumber: string,
    sessionId: string
  ): Promise<string> {
    try {
      // Find person by NIN
      const person = await this.personRepo.findByNIN(nin);

      let resultSummary: string;
      let response: string;

      if (!person) {
        resultSummary = "NOT_FOUND";
        response = "END No record found for NIN: " + nin;
      } else if (person.isDeceasedOrMissing) {
        resultSummary = "MISSING";
        response =
          "END ⚠️ MISSING/DECEASED\n" +
          `Name: ${person.firstName} ${person.lastName}\n` +
          `Status: Missing or Deceased\n` +
          "Contact station for details";
      } else {
        resultSummary = "NOT_MISSING";
        response = "END ✓ Not reported missing\n" + `Name: ${person.firstName} ${person.lastName}`;
      }

      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "missing",
        searchTerm: nin,
        resultSummary,
        success: true,
        sessionId,
      });

      return response;
    } catch (error) {
      console.error("[USSDService] Missing check error:", error);
      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "missing",
        searchTerm: nin,
        success: false,
        errorMessage: "Database error",
        sessionId,
      });
      return "END Error checking missing status";
    }
  }

  /**
   * Execute background check
   */
  private async executeBackgroundCheck(
    officerId: string,
    nin: string,
    phoneNumber: string,
    sessionId: string
  ): Promise<string> {
    try {
      // Find person by NIN
      const person = await this.personRepo.findByNIN(nin);

      let resultSummary: string;
      let response: string;

      if (!person) {
        resultSummary = "NOT_FOUND";
        response = "END No record found for NIN: " + nin;
      } else {
        // Get person's case count
        const cases = await this.caseRepo.findByPersonId(person.id);
        const criminalCases = cases.length;

        // Check wanted status
        const wantedPersons = await this.wantedPersonRepo.findByPersonId(person.id);
        const isWanted = wantedPersons.some((wp) => wp.status === "active");
        const isMissing = person.isDeceasedOrMissing;

        if (criminalCases === 0 && !isWanted && !isMissing) {
          resultSummary = "CLEAR";
          response = "END ✓ CLEAR\n" + `Name: ${person.firstName} ${person.lastName}\n` + "No criminal record";
        } else {
          resultSummary = "HAS_RECORD";
          response =
            "END ⚠️ RECORD EXISTS\n" +
            `Name: ${person.firstName} ${person.lastName}\n` +
            `Cases: ${criminalCases}\n` +
            `Wanted: ${isWanted ? "YES" : "NO"}\n` +
            `Missing: ${isMissing ? "YES" : "NO"}`;
        }
      }

      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "background",
        searchTerm: nin,
        resultSummary,
        success: true,
        sessionId,
      });

      return response;
    } catch (error) {
      console.error("[USSDService] Background check error:", error);
      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "background",
        searchTerm: nin,
        success: false,
        errorMessage: "Database error",
        sessionId,
      });
      return "END Error performing background check";
    }
  }

  /**
   * Execute vehicle check
   */
  private async executeVehicleCheck(
    officerId: string,
    licensePlate: string,
    phoneNumber: string,
    sessionId: string
  ): Promise<string> {
    try {
      // Find vehicle by license plate
      const vehicle = await this.vehicleRepo.findByLicensePlate(licensePlate.toUpperCase());

      let resultSummary: string;
      let response: string;

      if (!vehicle) {
        resultSummary = "NOT_FOUND";
        response = "END No record found for plate: " + licensePlate;
      } else if (vehicle.status === "stolen") {
        resultSummary = "STOLEN";
        response =
          "END ⚠️ STOLEN VEHICLE\n" +
          `Plate: ${vehicle.licensePlate}\n` +
          `Make: ${vehicle.make || "N/A"}\n` +
          `Model: ${vehicle.model || "N/A"}\n` +
          `Color: ${vehicle.color || "N/A"}\n` +
          `Stolen: ${vehicle.stolenDate ? new Date(vehicle.stolenDate).toLocaleDateString() : "Yes"}`;
      } else {
        resultSummary = "NOT_STOLEN";
        response =
          "END ✓ Not reported stolen\n" +
          `Plate: ${vehicle.licensePlate}\n` +
          `Make: ${vehicle.make || "N/A"}\n` +
          `Model: ${vehicle.model || "N/A"}`;
      }

      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "vehicle",
        searchTerm: licensePlate,
        resultSummary,
        success: true,
        sessionId,
      });

      return response;
    } catch (error) {
      console.error("[USSDService] Vehicle check error:", error);
      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "vehicle",
        searchTerm: licensePlate,
        success: false,
        errorMessage: "Database error",
        sessionId,
      });
      return "END Error checking vehicle status";
    }
  }

  /**
   * Execute stats query
   */
  private async executeStatsQuery(sessionId: string, officerId: string, phoneNumber: string): Promise<string> {
    try {
      const stats = await this.getQueryStatistics(officerId);

      const response =
        "END 📊 Your USSD Stats\n" +
        `Today: ${stats.today}\n` +
        `This week: ${stats.thisWeek}\n` +
        `This month: ${stats.thisMonth}\n` +
        `Total: ${stats.total}\n` +
        `Success rate: ${stats.successRate.toFixed(1)}%`;

      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "stats",
        searchTerm: "self",
        resultSummary: "SUCCESS",
        success: true,
        sessionId,
      });

      await this.sessionRepo.delete(sessionId);

      return response;
    } catch (error) {
      console.error("[USSDService] Stats error:", error);
      await this.logQuery({
        officerId,
        phoneNumber,
        queryType: "stats",
        searchTerm: "self",
        success: false,
        errorMessage: "Database error",
        sessionId,
      });
      return "END Error retrieving stats";
    }
  }

  /**
   * Authenticate officer using phone number and Quick PIN
   */
  private async authenticateQuickPin(
    phoneNumber: string,
    quickPin: string
  ): Promise<{
    success: boolean;
    officer?: {
      id: string;
      badge: string;
      name: string;
      stationId: string;
      stationName: string;
      stationCode: string;
      roleLevel: number;
      ussdDailyLimit: number;
    };
    error?: string;
  }> {
    try {
      // Find officer by phone number
      const officer = await this.prisma.officer.findFirst({
        where: { ussdPhoneNumber: phoneNumber },
        include: {
          station: true,
          role: true,
        },
      });

      if (!officer) {
        return {
          success: false,
          error: "Phone number not registered",
        };
      }

      // Check if USSD is enabled
      if (!officer.ussdEnabled) {
        return {
          success: false,
          error: "USSD access disabled. Contact your station commander.",
        };
      }

      // Check if account is active
      if (!officer.active) {
        return {
          success: false,
          error: "Officer account is inactive",
        };
      }

      // Verify Quick PIN
      if (!officer.ussdQuickPinHash) {
        return {
          success: false,
          error: "USSD not properly configured. Please re-register.",
        };
      }

      const pinValid = await verify(officer.ussdQuickPinHash, quickPin);
      if (!pinValid) {
        return {
          success: false,
          error: "Invalid Quick PIN",
        };
      }

      // Update last used timestamp
      await this.prisma.officer.update({
        where: { id: officer.id },
        data: {
          ussdLastUsed: new Date(),
        },
      });

      return {
        success: true,
        officer: {
          id: officer.id,
          badge: officer.badge,
          name: officer.name,
          stationId: officer.stationId,
          stationName: officer.station.name,
          stationCode: officer.station.code,
          roleLevel: officer.role.level,
          ussdDailyLimit: officer.ussdDailyLimit,
        },
      };
    } catch (error) {
      console.error("[USSDService] Authentication error:", error);
      return {
        success: false,
        error: "Authentication failed. Please try again.",
      };
    }
  }

  /**
   * Check rate limit for officer
   */
  async checkRateLimit(officerId: string): Promise<RateLimitResult> {
    try {
      // Get officer's daily limit
      const officer = await this.prisma.officer.findUnique({
        where: { id: officerId },
        select: { ussdDailyLimit: true },
      });

      if (!officer) {
        throw new Error("Officer not found");
      }

      const limit = officer.ussdDailyLimit;

      // Calculate today's midnight
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      // Calculate tomorrow's midnight for reset time
      const tomorrowMidnight = new Date(todayMidnight);
      tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

      // Count queries since midnight
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
      console.error("[USSDService] Rate limit error:", error);
      // Fail closed - deny access on error
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      return {
        allowed: false,
        remaining: 0,
        limit: 50,
        resetAt: tomorrow,
      };
    }
  }

  /**
   * Log a USSD query
   */
  private async logQuery(data: {
    officerId: string;
    phoneNumber: string;
    queryType: "wanted" | "missing" | "background" | "vehicle" | "stats";
    searchTerm: string;
    resultSummary?: string;
    success: boolean;
    errorMessage?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      await this.prisma.uSSDQueryLog.create({
        data: {
          officerId: data.officerId,
          phoneNumber: data.phoneNumber,
          queryType: data.queryType,
          searchTerm: data.searchTerm,
          resultSummary: data.resultSummary || null,
          success: data.success,
          errorMessage: data.errorMessage || null,
          sessionId: data.sessionId || null,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("[USSDService] Query logging error:", error);
    }
  }

  /**
   * Get query statistics for an officer
   */
  async getQueryStatistics(officerId: string): Promise<QueryStatistics> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count queries
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
    } catch (error) {
      console.error("[USSDService] Statistics error:", error);
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
        byType: {},
        successRate: 0,
      };
    }
  }

  /**
   * Helper: Parse USSD input chain
   */
  private parseUSSDInput(text: string): string[] {
    if (!text || text.trim() === "") {
      return [];
    }
    return text.split("*").filter((part) => part.trim() !== "");
  }

  /**
   * Helper: Get last input from USSD chain
   */
  private getLastInput(text: string): string | null {
    const inputs = this.parseUSSDInput(text);
    return inputs.length > 0 ? inputs[inputs.length - 1] : null;
  }

  /**
   * Helper: Validate Quick PIN format (4 digits)
   */
  private isValidQuickPin(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }
}
