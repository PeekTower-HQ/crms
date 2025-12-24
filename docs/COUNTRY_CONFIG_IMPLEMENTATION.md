# Country Configuration System

## Overview

CRMS uses a **single-file country configuration system** that allows any African country to deploy CRMS by simply customizing one JSON file: `config/deployment.json`.

## What Was Implemented

### 1. Configuration Structure

#### Files Created/Modified
- ✅ `config/deployment.json` - Active deployment configuration (git-ignored)
- ✅ `config/deployment.example.json` - Template for new deployments (tracked in git)
- ✅ `docs/examples/SLE.json` - Sierra Leone reference example
- ✅ `docs/examples/GHA.json` - Ghana reference example
- ✅ `docs/examples/NGA.json` - Nigeria reference example

#### Files Removed
- ❌ `config/countries/` - Removed multi-country folder structure
  - Simplified to single deployment per instance model

### 2. Type System

**File**: `src/domain/types/DeploymentConfig.ts`

Created comprehensive TypeScript interfaces for:
- `NationalIdSystem` - National ID format and validation
- `Language` - Localization preferences
- `Currency` - Currency information
- `PoliceStructure` - Organization and ranks
- `LegalFramework` - Legal references
- `OffenseCategory` - Crime classifications
- `Telecom` - USSD and SMS configuration
- `Integrations` - External system APIs
- `DeploymentConfig` - Complete configuration structure

### 3. Configuration Service

**File**: `src/services/CountryConfigService.ts`

Created singleton service that:
- ✅ Loads `config/deployment.json` on startup
- ✅ Caches configuration in memory
- ✅ Validates JSON structure
- ✅ Provides type-safe getters for all config sections
- ✅ Implements validation helpers (NIN, offense categories, ranks)

**Key Methods**:
```typescript
getConfig(): DeploymentConfig
validateNationalId(nin: string): boolean
getNationalIdSystem(): NationalIdSystem
getOffenseCategories(): OffenseCategory[]
isValidOffenseCategory(categoryName: string): boolean
getPoliceRanks(): string[]
isValidPoliceRank(rank: string): boolean
getUssdShortcode(): string
getUssdGateways(): string[]
getPhonePattern(): RegExp
formatNationalId(nin: string): string
getCountryCode(): string
getDefaultLanguage(): string
getSupportedLanguages(): string[]
getDateFormat(): string
getTimeFormat(): "12h" | "24h"
isNationalIdRegistryEnabled(): boolean
```

### 4. Integration into Services

#### PersonService
**File**: `src/services/PersonService.ts`

- ✅ Injected `CountryConfigService` into constructor
- ✅ Updated NIN validation to use `countryConfig.validateNationalId()`
- ✅ Dynamic error messages showing config-specific ID format

**Before**:
```typescript
if (!Person.isValidNIN(data.nin)) {
  throw new ValidationError("Invalid NIN format");
}
```

**After**:
```typescript
const ninSystem = this.countryConfig.getNationalIdSystem();
if (!this.countryConfig.validateNationalId(data.nin)) {
  throw new ValidationError(
    `Invalid ${ninSystem.displayName} format. Expected format: ${ninSystem.format}`
  );
}
```

#### CaseService
**File**: `src/services/CaseService.ts`

- ✅ Injected `CountryConfigService` into constructor
- ✅ Replaced hardcoded offense categories with config-driven validation
- ✅ Supports both category names and subcategory names
- ✅ Dynamic error messages listing valid categories

**Before**: 12 hardcoded categories
**After**: Dynamically loaded from `deployment.json`

#### USSDService
**File**: `src/services/USSDService.ts`

- ✅ Injected `CountryConfigService` into constructor
- ✅ Added `getUSSDShortcode()` method
- ✅ Added `getUSSDGateways()` method
- ✅ USSD codes now configurable per country

### 5. Validation System

**File**: `src/lib/validation.ts`

- ✅ Updated `createNationalIdSchema()` to accept `CountryConfigService`
- ✅ Removed hardcoded NIN formats
- ✅ Added legacy function for backward compatibility
- ✅ Uses deployment config regex for validation

**Before**:
```typescript
export function createNationalIdSchema(countryCode: string = "SLE") {
  const formats: Record<string, RegExp> = {
    SLE: /^NIN-\d{9}$/,
    GHA: /^GHA-\d{9}-\d$/,
    // ... hardcoded
  };
}
```

**After**:
```typescript
export function createNationalIdSchema(configService: CountryConfigService) {
  const config = configService.getNationalIdSystem();
  const pattern = new RegExp(config.validationRegex);
  return z.string().regex(pattern, `Invalid ${config.displayName} format`);
}
```

### 6. Dependency Injection

**File**: `src/di/container.ts`

- ✅ Registered `CountryConfigService` as singleton
- ✅ Injected into `PersonService`
- ✅ Injected into `CaseService`
- ✅ Injected into `USSDService`

### 7. Git Configuration

**File**: `.gitignore`

- ✅ Added `config/deployment.json` to ignore list
- ✅ Whitelisted `config/deployment.example.json` to track template
- ✅ Ensures deployment configs aren't accidentally committed

### 8. Documentation

Created comprehensive guides:

#### `docs/DEPLOYMENT_CUSTOMIZATION.md`
- ✅ Complete field-by-field configuration guide
- ✅ Examples for Rwanda and Ethiopia
- ✅ Testing instructions
- ✅ FAQ section
- ✅ 500+ lines of detailed documentation

#### Updated `README.md`
- ✅ Added deployment configuration section
- ✅ Reorganized documentation links
- ✅ Highlighted single JSON file approach

---

## Configuration Schema

### Complete Structure

```json
{
  "countryCode": "XXX",
  "countryName": "Country Name",
  "capital": "Capital City",
  
  "nationalIdSystem": {
    "type": "ID_TYPE",
    "displayName": "Display Name",
    "format": "XXXX-XXXX",
    "validationRegex": "^[0-9]{4}-[0-9]{4}$",
    "length": 9
  },
  
  "language": {
    "default": "en",
    "supported": ["en"],
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h"
  },
  
  "currency": {
    "code": "XXX",
    "symbol": "¤",
    "name": "Currency Name"
  },
  
  "policeStructure": {
    "type": "centralized",
    "levels": ["national", "station"],
    "ranks": ["Inspector General", "Officer"]
  },
  
  "legalFramework": {
    "dataProtectionAct": "Act Name",
    "penalCode": "Code Name",
    "evidenceAct": "Act Name"
  },
  
  "offenseCategories": [
    {
      "code": "01",
      "name": "Category",
      "subcategories": ["Subcategory"]
    }
  ],
  
  "telecom": {
    "ussdGateways": ["Provider"],
    "ussdShortcode": "*XXX#",
    "smsProvider": "provider",
    "smsApiKey": "env:VAR_NAME"
  },
  
  "integrations": {
    "nationalIdRegistry": {
      "enabled": false,
      "apiEndpoint": null,
      "apiKey": null
    },
    "courtSystem": {
      "enabled": false,
      "apiEndpoint": null
    }
  }
}
```

---

## Usage Examples

### For Developers

```typescript
// In any service
import { container } from "@/src/di/container";

const config = container.countryConfigService.getConfig();
console.log(config.countryName); // "Sierra Leone"

// Validate NIN
const isValid = container.countryConfigService.validateNationalId("1234-5678-9012");

// Get offense categories
const categories = container.countryConfigService.getOffenseCategories();

// Get USSD shortcode
const ussdCode = container.countryConfigService.getUssdShortcode(); // "*456#"
```

### For New Country Deployments

1. **Clone repository**
```bash
git clone https://github.com/your-org/crms.git
cd crms
```

2. **Create deployment config**
```bash
cp config/deployment.example.json config/deployment.json
vim config/deployment.json
```

3. **Customize for your country**
- Update country code, name, capital
- Configure national ID system
- Add offense categories from penal code
- List police ranks
- Set USSD shortcode

4. **Deploy**
```bash
npm install
npm run build
npm start
```

**That's it!** No code changes needed.

---

## Benefits

### For Law Enforcement Agencies

✅ **Quick Deployment** - Hours, not weeks  
✅ **No Technical Expertise** - Just edit JSON  
✅ **Country-Specific** - Reflects local laws and structures  
✅ **Cost-Effective** - No custom development needed  

### For Developers

✅ **Type Safety** - Full TypeScript support  
✅ **Centralized Config** - Single source of truth  
✅ **Easy Testing** - Mock configs for tests  
✅ **Maintainable** - Changes in one place  

### For the DPG Ecosystem

✅ **True Reusability** - One codebase, 54 deployments (African countries)  
✅ **No Forking** - All improvements benefit everyone  
✅ **Rapid Adoption** - Lower barrier to entry  
✅ **Continental Scale** - Pan-African by design  

---

## Testing Checklist

- [x] Build compiles without errors
- [x] TypeScript types are correct
- [x] CountryConfigService loads deployment.json
- [x] PersonService validates NINs from config
- [x] CaseService validates offense categories from config
- [x] USSDService uses configured shortcode
- [x] Validation schemas use config patterns
- [x] DI container injects service correctly

---

## Future Enhancements

### Short Term
- [ ] Add config validation schema (Zod)
- [ ] CLI tool to validate deployment.json
- [ ] Migration script for existing deployments

### Medium Term
- [ ] Multi-language UI translations from config
- [ ] Dynamic form generation from config
- [ ] Config hot-reload in development

### Long Term
- [ ] Web-based config editor
- [ ] Config version management
- [ ] Regional config inheritance (e.g., ECOWAS defaults)

---

## Migration Guide (For Existing Deployments)

If you have an existing CRMS deployment before this update:

1. **Backup your data**
```bash
pg_dump crms > backup.sql
```

2. **Pull latest code**
```bash
git pull origin main
```

3. **Create your deployment config**
```bash
cp config/deployment.example.json config/deployment.json
# Edit to match your current settings
```

4. **Rebuild and redeploy**
```bash
npm install
npm run build
npm start
```

**Note**: No database changes required. This is purely a code-level refactor.

---

## Support

**Questions?** Check:
- `docs/DEPLOYMENT_CUSTOMIZATION.md` - Detailed guide
- `docs/examples/` - Reference configurations
- GitHub Issues - Community support

**Contributing?** 
- Add your country's config to `docs/examples/`
- Help translate documentation
- Report issues or suggest improvements

---

## Conclusion

The country configuration system transforms CRMS from a Sierra Leone-specific tool into a **truly pan-African Digital Public Good**. Any country can now deploy CRMS with a single JSON file, no code changes required.

**This is what a reusable DPG looks like.** 🌍
