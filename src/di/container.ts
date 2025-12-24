/**
 * Dependency Injection Container
 *
 * Centralized container for managing application dependencies.
 * Implements singleton pattern to ensure single instances across the application.
 *
 * Usage:
 *   import { container } from "@/src/di/container";
 *   const officer = await container.authService.authenticateOfficer(badge, pin);
 *
 * Pan-African Design: Single source of truth for all services and repositories
 */
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

// Repository Interfaces
import { IOfficerRepository } from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { IRoleRepository } from "@/src/domain/interfaces/repositories/IRoleRepository";
import { IPermissionRepository } from "@/src/domain/interfaces/repositories/IPermissionRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { IStationRepository } from "@/src/domain/interfaces/repositories/IStationRepository";
import { ICaseRepository } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { IEvidenceRepository } from "@/src/domain/interfaces/repositories/IEvidenceRepository";
import { ISyncQueueRepository } from "@/src/domain/interfaces/repositories/ISyncQueueRepository";
import { IBackgroundCheckRepository } from "@/src/domain/interfaces/repositories/IBackgroundCheckRepository";
import { IAmberAlertRepository } from "@/src/domain/interfaces/repositories/IAmberAlertRepository";
import { IWantedPersonRepository } from "@/src/domain/interfaces/repositories/IWantedPersonRepository";
import { IVehicleRepository } from "@/src/domain/interfaces/repositories/IVehicleRepository";
import { IUSSDSessionRepository } from "@/src/domain/interfaces/repositories/IUSSDSessionRepository";
import { IWhatsAppSessionRepository } from "@/src/domain/interfaces/repositories/IWhatsAppSessionRepository";
import { IWhatsAppNewsletterRepository } from "@/src/domain/interfaces/repositories/IWhatsAppNewsletterRepository";

// Service Interfaces
import { IFieldCheckService } from "@/src/domain/interfaces/services/IFieldCheckService";

// Repository Implementations
import { OfficerRepository } from "@/src/repositories/implementations/OfficerRepository";
import { RoleRepository } from "@/src/repositories/implementations/RoleRepository";
import { PermissionRepository } from "@/src/repositories/implementations/PermissionRepository";
import { AuditLogRepository } from "@/src/repositories/implementations/AuditLogRepository";
import { StationRepository } from "@/src/repositories/implementations/StationRepository";
import { CaseRepository } from "@/src/repositories/implementations/CaseRepository";
import { PersonRepository } from "@/src/repositories/implementations/PersonRepository";
import { EvidenceRepository } from "@/src/repositories/implementations/EvidenceRepository";
import { SyncQueueRepository } from "@/src/repositories/implementations/SyncQueueRepository";
import { BackgroundCheckRepository } from "@/src/repositories/implementations/BackgroundCheckRepository";
import { AmberAlertRepository } from "@/src/repositories/implementations/AmberAlertRepository";
import { WantedPersonRepository } from "@/src/repositories/implementations/WantedPersonRepository";
import { VehicleRepository } from "@/src/repositories/implementations/VehicleRepository";
import { USSDSessionRepository } from "@/src/repositories/implementations/USSDSessionRepository";
import { WhatsAppSessionRepository } from "@/src/repositories/implementations/WhatsAppSessionRepository";
import { WhatsAppNewsletterRepository } from "@/src/repositories/implementations/WhatsAppNewsletterRepository";

// Services
import { AuthService } from "@/src/services/AuthService";
import { AuditService } from "@/src/services/AuditService";
import { CaseService } from "@/src/services/CaseService";
import { PersonService } from "@/src/services/PersonService";
import { EvidenceService } from "@/src/services/EvidenceService";
import { SyncService } from "@/src/services/SyncService";
import { BackgroundCheckService } from "@/src/services/BackgroundCheckService";
import { AlertService } from "@/src/services/AlertService";
import { VehicleService } from "@/src/services/VehicleService";
import { AnalyticsService } from "@/src/services/AnalyticsService";
import { ReportService } from "@/src/services/ReportService";
import { PerformanceService } from "@/src/services/PerformanceService";
import { OfficerService } from "@/src/services/OfficerService";
import { StationService } from "@/src/services/StationService";
import { RoleService } from "@/src/services/RoleService";
import { USSDService } from "@/src/services/USSDService";
import { CountryConfigService } from "@/src/services/CountryConfigService";
import { FieldCheckService } from "@/src/services/FieldCheckService";
import { NewsletterService } from "@/src/services/NewsletterService";
import { PosterService } from "@/src/services/PosterService";

/**
 * Application Dependency Injection Container
 * Singleton class that manages all repositories and services
 */
export class Container {
  private static instance: Container;

  // Prisma Client
  public readonly prismaClient: PrismaClient;

  // Configuration Services
  public readonly countryConfigService: CountryConfigService;

  // Repositories
  public readonly officerRepository: IOfficerRepository;
  public readonly roleRepository: IRoleRepository;
  public readonly permissionRepository: IPermissionRepository;
  public readonly auditLogRepository: IAuditLogRepository;
  public readonly stationRepository: IStationRepository;
  public readonly caseRepository: ICaseRepository;
  public readonly personRepository: IPersonRepository;
  public readonly evidenceRepository: IEvidenceRepository;
  public readonly syncQueueRepository: ISyncQueueRepository;
  public readonly backgroundCheckRepository: IBackgroundCheckRepository;
  public readonly amberAlertRepository: IAmberAlertRepository;
  public readonly wantedPersonRepository: IWantedPersonRepository;
  public readonly vehicleRepository: IVehicleRepository;
  public readonly ussdSessionRepository: IUSSDSessionRepository;
  public readonly whatsappSessionRepository: IWhatsAppSessionRepository;
  public readonly whatsappNewsletterRepository: IWhatsAppNewsletterRepository;

  // Services
  public readonly authService: AuthService;
  public readonly auditService: AuditService;
  public readonly caseService: CaseService;
  public readonly personService: PersonService;
  public readonly evidenceService: EvidenceService;
  public readonly syncService: SyncService;
  public readonly backgroundCheckService: BackgroundCheckService;
  public readonly alertService: AlertService;
  public readonly vehicleService: VehicleService;
  public readonly analyticsService: AnalyticsService;
  public readonly reportService: ReportService;
  public readonly performanceService: PerformanceService;
  public readonly officerService: OfficerService;
  public readonly stationService: StationService;
  public readonly roleService: RoleService;
  public readonly ussdService: USSDService;
  public readonly fieldCheckService: IFieldCheckService;
  public readonly newsletterService: NewsletterService;
  public readonly posterService: PosterService;

  private constructor() {
    // Initialize Prisma Client
    this.prismaClient = prisma;

    // Initialize Configuration Services
    this.countryConfigService = new CountryConfigService();

    // Initialize Repositories
    this.officerRepository = new OfficerRepository(this.prismaClient);
    this.roleRepository = new RoleRepository(this.prismaClient);
    this.permissionRepository = new PermissionRepository(this.prismaClient);
    this.auditLogRepository = new AuditLogRepository(this.prismaClient);
    this.stationRepository = new StationRepository(this.prismaClient);
    this.caseRepository = new CaseRepository(this.prismaClient);
    this.personRepository = new PersonRepository(this.prismaClient);
    this.evidenceRepository = new EvidenceRepository(this.prismaClient);
    this.syncQueueRepository = new SyncQueueRepository(this.prismaClient);
    this.backgroundCheckRepository = new BackgroundCheckRepository(this.prismaClient);
    this.amberAlertRepository = new AmberAlertRepository(this.prismaClient);
    this.wantedPersonRepository = new WantedPersonRepository(this.prismaClient);
    this.vehicleRepository = new VehicleRepository(this.prismaClient);
    this.ussdSessionRepository = new USSDSessionRepository();
    this.whatsappSessionRepository = new WhatsAppSessionRepository(this.prismaClient);
    this.whatsappNewsletterRepository = new WhatsAppNewsletterRepository(this.prismaClient);

    // Initialize Services with injected dependencies
    this.authService = new AuthService(
      this.officerRepository,
      this.auditLogRepository
    );

    this.auditService = new AuditService(this.auditLogRepository);

    this.caseService = new CaseService(
      this.caseRepository,
      this.auditLogRepository,
      this.countryConfigService
    );

    this.personService = new PersonService(
      this.personRepository,
      this.auditLogRepository,
      this.countryConfigService
    );

    this.evidenceService = new EvidenceService(
      this.evidenceRepository,
      this.auditLogRepository
    );

    this.syncService = new SyncService(
      this.syncQueueRepository,
      this.auditLogRepository
    );

    this.backgroundCheckService = new BackgroundCheckService(
      this.backgroundCheckRepository,
      this.personRepository,
      this.caseRepository,
      this.auditLogRepository
    );

    this.alertService = new AlertService(
      this.amberAlertRepository,
      this.wantedPersonRepository,
      this.personRepository,
      this.auditLogRepository
    );

    this.vehicleService = new VehicleService(
      this.vehicleRepository,
      this.auditLogRepository
    );

    this.analyticsService = new AnalyticsService(
      this.caseRepository,
      this.personRepository,
      this.evidenceRepository,
      this.auditLogRepository,
      this.backgroundCheckRepository,
      this.amberAlertRepository,
      this.vehicleRepository
    );

    this.reportService = new ReportService(
      this.caseRepository,
      this.personRepository,
      this.evidenceRepository,
      this.auditLogRepository
    );

    // Phase 9: Performance monitoring service
    this.performanceService = new PerformanceService();

    // Admin management services
    this.officerService = new OfficerService(
      this.officerRepository,
      this.roleRepository,
      this.stationRepository,
      this.auditLogRepository
    );

    this.stationService = new StationService(
      this.stationRepository,
      this.auditLogRepository
    );

    this.roleService = new RoleService(
      this.roleRepository,
      this.permissionRepository,
      this.officerRepository,
      this.auditLogRepository
    );

    // Phase 7: USSD service for officer field tools
    this.ussdService = new USSDService(
      this.ussdSessionRepository,
      this.officerRepository,
      this.personRepository,
      this.vehicleRepository,
      this.wantedPersonRepository,
      this.caseRepository,
      this.auditLogRepository,
      this.prismaClient,
      this.countryConfigService
    );

    // Phase 8: Field Check Service (shared between USSD and WhatsApp)
    this.fieldCheckService = new FieldCheckService(
      this.prismaClient,
      this.officerRepository,
      this.personRepository,
      this.vehicleRepository,
      this.wantedPersonRepository,
      this.caseRepository,
      this.auditLogRepository
    );

    // Phase 8: Newsletter Service (WhatsApp newsletter/channel management)
    this.newsletterService = new NewsletterService(
      this.whatsappNewsletterRepository,
      this.auditLogRepository
    );

    // Poster Service (PDF and image generation for alerts)
    this.posterService = new PosterService(
      this.amberAlertRepository,
      this.wantedPersonRepository,
      this.auditLogRepository
    );
  }

  /**
   * Get singleton instance of the container
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Reset the container (useful for testing)
   * WARNING: Use with caution in production
   */
  public static reset(): void {
    Container.instance = new Container();
  }
}

/**
 * Singleton container instance
 * Import and use this throughout your application
 */
export const container = Container.getInstance();
