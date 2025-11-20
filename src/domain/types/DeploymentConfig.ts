/**
 * Deployment Configuration Types
 * 
 * Defines the structure of deployment.json - the single configuration file
 * that each country customizes when deploying CRMS.
 */

export interface NationalIdSystem {
  type: string;
  displayName: string;
  format: string;
  validationRegex: string;
  length: number;
}

export interface Language {
  default: string;
  supported: string[];
  dateFormat: string;
  timeFormat: "12h" | "24h";
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface PoliceStructure {
  type: "centralized" | "federal" | "regional";
  levels: string[];
  ranks: string[];
}

export interface LegalFramework {
  dataProtectionAct: string;
  penalCode: string;
  evidenceAct: string;
}

export interface OffenseSubcategory {
  code?: string;
  name: string;
}

export interface OffenseCategory {
  code: string;
  name: string;
  subcategories: string[] | OffenseSubcategory[];
}

export interface Telecom {
  ussdGateways: string[];
  ussdShortcode: string;
  smsProvider: string;
  smsApiKey: string;
}

export interface Integration {
  enabled: boolean;
  apiEndpoint: string | null;
  apiKey?: string | null;
}

export interface Integrations {
  nationalIdRegistry: Integration;
  courtSystem: Integration;
}

/**
 * Main Deployment Configuration Interface
 * 
 * This represents the complete structure of config/deployment.json
 */
export interface DeploymentConfig {
  countryCode: string;
  countryName: string;
  capital: string;
  nationalIdSystem: NationalIdSystem;
  language: Language;
  currency: Currency;
  policeStructure: PoliceStructure;
  legalFramework: LegalFramework;
  offenseCategories: OffenseCategory[];
  telecom: Telecom;
  integrations: Integrations;
}
