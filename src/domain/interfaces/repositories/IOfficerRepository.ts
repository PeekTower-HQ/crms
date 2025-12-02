/**
 * Officer Repository Interface
 *
 * Contract for officer data access operations.
 * Pan-African Design: Country-agnostic interface that works with any police force structure
 */
import { Officer } from "@/src/domain/entities/Officer";

export interface CreateOfficerDto {
  badge: string;
  nationalId?: string; // NIN or national ID
  name: string;
  email?: string;
  phone?: string;
  pinHash: string;
  roleId: string;
  stationId: string;
  enrollmentDate?: Date; // Date officer was enrolled/hired
  // Photo fields
  photoUrl?: string;
  photoFileKey?: string;
  photoThumbnailUrl?: string;
  photoSmallUrl?: string;
  photoMediumUrl?: string;
  photoHash?: string;
  photoSize?: number;
}

export interface UpdateOfficerDto {
  nationalId?: string | null; // NIN or national ID
  name?: string;
  email?: string;
  phone?: string;
  pinHash?: string;
  roleId?: string;
  stationId?: string;
  active?: boolean;
  enrollmentDate?: Date | null; // Date officer was enrolled/hired
  mfaEnabled?: boolean;
  mfaSecret?: string;
  // USSD fields
  ussdPhoneNumber?: string;
  ussdQuickPinHash?: string;
  ussdEnabled?: boolean;
  ussdRegisteredAt?: Date;
  ussdDailyLimit?: number;
  // Photo fields
  photoUrl?: string | null;
  photoFileKey?: string | null;
  photoThumbnailUrl?: string | null;
  photoSmallUrl?: string | null;
  photoMediumUrl?: string | null;
  photoHash?: string | null;
  photoSize?: number | null;
}

export interface OfficerFilters {
  active?: boolean;
  roleId?: string;
  stationId?: string;
  search?: string; // Search by name, badge, email
}

export interface IOfficerRepository {
  // Queries
  findById(id: string): Promise<Officer | null>;
  findByBadge(badge: string): Promise<Officer | null>;
  findByNationalId(nationalId: string): Promise<Officer | null>;
  findByEmail(email: string): Promise<Officer | null>;
  findByStationId(stationId: string): Promise<Officer[]>;
  findAll(filters?: OfficerFilters): Promise<Officer[]>;
  count(filters?: OfficerFilters): Promise<number>;

  // Commands
  create(data: CreateOfficerDto): Promise<Officer>;
  update(id: string, data: UpdateOfficerDto): Promise<Officer>;
  delete(id: string): Promise<void>;

  // Specific operations for authentication
  incrementFailedAttempts(id: string): Promise<void>;
  resetFailedAttempts(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  updatePinHash(id: string, pinHash: string): Promise<void>;
  getPinHash(id: string): Promise<string | null>;
}
