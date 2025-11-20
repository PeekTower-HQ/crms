/**
 * Country Configuration Service
 * 
 * Loads and manages the deployment configuration from config/deployment.json.
 * Each country deployment has its own configuration file that defines:
 * - National ID format and validation
 * - Offense categories from local penal code
 * - Police structure and ranks
 * - Telecom providers and USSD codes
 * - Language and localization settings
 * 
 * This service is a singleton that loads the config once at startup.
 */

import fs from "fs";
import path from "path";
import type {
  DeploymentConfig,
  OffenseCategory,
  NationalIdSystem,
} from "@/src/domain/types/DeploymentConfig";

export class CountryConfigService {
  private config: DeploymentConfig | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    // Default to config/deployment.json in project root
    this.configPath = configPath || path.join(process.cwd(), "config", "deployment.json");
  }

  /**
   * Load the deployment configuration
   * Throws error if config file doesn't exist or is invalid
   */
  private loadConfig(): DeploymentConfig {
    try {
      const configFile = fs.readFileSync(this.configPath, "utf-8");
      const config = JSON.parse(configFile) as DeploymentConfig;
      
      // Basic validation
      if (!config.countryCode || !config.nationalIdSystem) {
        throw new Error("Invalid deployment configuration: missing required fields");
      }

      return config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          `Deployment configuration not found at ${this.configPath}. ` +
          `Please copy config/deployment.example.json to config/deployment.json ` +
          `and customize it for your country.`
        );
      }
      throw error;
    }
  }

  /**
   * Get the deployment configuration
   * Lazy loads on first access
   */
  getConfig(): DeploymentConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  /**
   * Reload configuration from disk
   * Useful for testing or hot-reload scenarios
   */
  reloadConfig(): void {
    this.config = null;
    this.getConfig();
  }

  /**
   * Validate a national ID against the configured format
   */
  validateNationalId(nin: string): boolean {
    const config = this.getConfig();
    const regex = new RegExp(config.nationalIdSystem.validationRegex);
    return regex.test(nin);
  }

  /**
   * Get the national ID system configuration
   */
  getNationalIdSystem(): NationalIdSystem {
    return this.getConfig().nationalIdSystem;
  }

  /**
   * Get all offense categories for this deployment
   */
  getOffenseCategories(): OffenseCategory[] {
    return this.getConfig().offenseCategories;
  }

  /**
   * Check if an offense category is valid
   */
  isValidOffenseCategory(categoryName: string): boolean {
    const categories = this.getOffenseCategories();
    return categories.some((cat) => cat.name === categoryName);
  }

  /**
   * Get offense subcategories for a given category
   */
  getOffenseSubcategories(categoryName: string): string[] {
    const category = this.getOffenseCategories().find((cat) => cat.name === categoryName);
    if (!category) {
      return [];
    }
    
    // Handle both string[] and OffenseSubcategory[] formats
    return category.subcategories.map((sub) => 
      typeof sub === "string" ? sub : sub.name
    );
  }

  /**
   * Get police ranks for this deployment
   */
  getPoliceRanks(): string[] {
    return this.getConfig().policeStructure.ranks;
  }

  /**
   * Check if a police rank is valid
   */
  isValidPoliceRank(rank: string): boolean {
    const ranks = this.getPoliceRanks();
    return ranks.includes(rank);
  }

  /**
   * Get the USSD shortcode for this deployment
   */
  getUssdShortcode(): string {
    return this.getConfig().telecom.ussdShortcode;
  }

  /**
   * Get USSD gateways (telecom providers)
   */
  getUssdGateways(): string[] {
    return this.getConfig().telecom.ussdGateways;
  }

  /**
   * Get phone number pattern for validation
   * Returns E.164 international format as default
   */
  getPhonePattern(): RegExp {
    // E.164 format: +[country code][number]
    // This is a sensible default for all countries
    return /^\+?[1-9]\d{1,14}$/;
  }

  /**
   * Format a national ID according to the configured display format
   */
  formatNationalId(nin: string): string {
    const config = this.getConfig();
    // For now, return as-is
    // Future: implement smart formatting based on config.nationalIdSystem.format
    return nin;
  }

  /**
   * Get the country code (ISO 3166-1 alpha-3)
   */
  getCountryCode(): string {
    return this.getConfig().countryCode;
  }

  /**
   * Get the country name
   */
  getCountryName(): string {
    return this.getConfig().countryName;
  }

  /**
   * Get the default language
   */
  getDefaultLanguage(): string {
    return this.getConfig().language.default;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return this.getConfig().language.supported;
  }

  /**
   * Get date format preference
   */
  getDateFormat(): string {
    return this.getConfig().language.dateFormat;
  }

  /**
   * Get time format preference (12h or 24h)
   */
  getTimeFormat(): "12h" | "24h" {
    return this.getConfig().language.timeFormat;
  }

  /**
   * Check if national ID registry integration is enabled
   */
  isNationalIdRegistryEnabled(): boolean {
    return this.getConfig().integrations.nationalIdRegistry.enabled;
  }

  /**
   * Get national ID registry API endpoint
   */
  getNationalIdRegistryEndpoint(): string | null {
    return this.getConfig().integrations.nationalIdRegistry.apiEndpoint;
  }
}
