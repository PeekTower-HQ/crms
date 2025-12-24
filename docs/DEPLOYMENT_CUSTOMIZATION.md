# Deployment Customization Guide

## Overview

CRMS is designed as a **reusable Digital Public Good** that any African country can deploy with minimal effort. The key to this flexibility is the single configuration file: `config/deployment.json`.

**When you deploy CRMS for your country, you simply:**
1. Clone the repository
2. Customize `config/deployment.json` for your country
3. Set environment variables
4. Deploy

**No code changes required.**

---

## Quick Start for New Countries

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/crms.git
cd crms
```

### 2. Create Your Deployment Configuration

```bash
# Copy the example template
cp config/deployment.example.json config/deployment.json

# Edit with your country's specifications
vim config/deployment.json
```

### 3. Configure for Your Country

Edit `config/deployment.json` with your country-specific settings. See the [Configuration Reference](#configuration-reference) below.

### 4. Set Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
vim .env
```

### 5. Deploy

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma db push

# Seed initial data (optional)
npx prisma db seed

# Build and start
npm run build
npm start
```

---

## Configuration Reference

### Complete `deployment.json` Structure

```json
{
  "countryCode": "XXX",
  "countryName": "Your Country",
  "capital": "Capital City",

  "nationalIdSystem": {
    "type": "ID_TYPE",
    "displayName": "Display Name for UI",
    "format": "XXXX-XXXX-XXXX",
    "validationRegex": "^[0-9]{4}-[0-9]{4}-[0-9]{4}$",
    "length": 14
  },

  "language": {
    "default": "en",
    "supported": ["en", "fr", "pt"],
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
    "levels": ["national", "regional", "district", "station"],
    "ranks": [
      "Inspector General",
      "Deputy Inspector General",
      "Commissioner",
      "Superintendent",
      "Inspector",
      "Sergeant",
      "Corporal",
      "Constable"
    ]
  },

  "legalFramework": {
    "dataProtectionAct": "Your Data Protection Act",
    "penalCode": "Your Penal Code",
    "evidenceAct": "Your Evidence Act"
  },

  "offenseCategories": [
    {
      "code": "01",
      "name": "Offences Against the Person",
      "subcategories": ["Murder", "Manslaughter", "Assault"]
    },
    {
      "code": "02",
      "name": "Offences Against Property",
      "subcategories": ["Theft", "Robbery", "Burglary"]
    }
  ],

  "telecom": {
    "ussdGateways": ["Provider1", "Provider2"],
    "ussdShortcode": "*XXX#",
    "smsProvider": "africas-talking",
    "smsApiKey": "env:USSD_API_KEY"
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

## Field-by-Field Guide

### Basic Information

#### `countryCode` (required)
- **Format**: ISO 3166-1 alpha-3 (3-letter country code)
- **Examples**: `"SLE"` (Sierra Leone), `"GHA"` (Ghana), `"NGA"` (Nigeria), `"KEN"` (Kenya)
- **Used for**: Database indexing, multi-country analytics

#### `countryName` (required)
- **Format**: Full country name
- **Example**: `"Sierra Leone"`
- **Used for**: Display in UI, reports, documentation

#### `capital` (optional)
- **Format**: Capital city name
- **Example**: `"Freetown"`
- **Used for**: Metadata, documentation

---

### National ID System

This is the **most important section** for customization. It defines how your country's national identification numbers are validated.

#### `nationalIdSystem.type` (required)
- **Format**: Short identifier for your ID system
- **Examples**: `"NIN"`, `"GHANA_CARD"`, `"NIDA"`, `"CNI"`
- **Used for**: Internal reference, logging

#### `nationalIdSystem.displayName` (required)
- **Format**: User-friendly name shown in UI
- **Examples**: 
  - `"National Identification Number (NIN)"`
  - `"Ghana Card"`
  - `"Carte Nationale d'Identité"`
- **Used for**: Form labels, error messages, help text

#### `nationalIdSystem.format` (required)
- **Format**: Human-readable format pattern using X for alphanumeric characters
- **Examples**:
  - `"XXXXXXXX"` (Sierra Leone NIN - 8 alphanumeric, e.g., W7RGGVGI)
  - `"GHA-XXXXXXXXX-X"` (Ghana Card)
  - `"XXXXXXXXXXX"` (Nigeria NIN - 11 digits)
  - `"XXXXXXXXXXXXXXXX"` (Rwanda NIDA - 16 digits)
- **Used for**: Placeholder text, user guidance

#### `nationalIdSystem.validationRegex` (required)
- **Format**: JavaScript regular expression pattern
- **Examples**:
  - `"^[A-Z0-9]{8}$"` (Sierra Leone - 8 alphanumeric uppercase)
  - `"^GHA-[0-9]{9}-[0-9]$"` (Ghana)
  - `"^[0-9]{11}$"` (Nigeria)
  - `"^[0-9]{16}$"` (Rwanda)
- **Used for**: Real-time validation in forms, API validation
- **Important**: Must match your ID format exactly

#### `nationalIdSystem.length` (required)
- **Format**: Total character count including separators
- **Examples**: `8` (Sierra Leone), `11` (Nigeria), `15` (Ghana with dashes)
- **Used for**: Input field max length, pre-validation

---

### Language and Localization

#### `language.default` (required)
- **Format**: ISO 639-1 language code (2 letters)
- **Examples**: `"en"` (English), `"fr"` (French), `"pt"` (Portuguese), `"ar"` (Arabic)
- **Used for**: Default UI language

#### `language.supported` (required)
- **Format**: Array of ISO 639-1 codes
- **Examples**: 
  - `["en", "kri"]` (Sierra Leone: English, Krio)
  - `["en", "tw", "ee", "ak"]` (Ghana: English, Twi, Ewe, Akan)
  - `["en", "ha", "yo", "ig"]` (Nigeria: English, Hausa, Yoruba, Igbo)
  - `["rw", "en", "fr"]` (Rwanda: Kinyarwanda, English, French)
- **Used for**: Language selector, i18n

#### `language.dateFormat` (required)
- **Format**: Date format string
- **Options**: `"DD/MM/YYYY"` (most African countries), `"MM/DD/YYYY"` (uncommon)
- **Used for**: Date display, date picker format

#### `language.timeFormat` (required)
- **Format**: Either `"12h"` or `"24h"`
- **Used for**: Time display across UI

---

### Currency

#### `currency.code` (required)
- **Format**: ISO 4217 currency code (3 letters)
- **Examples**: `"SLE"` (Leone), `"GHS"` (Cedi), `"NGN"` (Naira), `"KES"` (Shilling)
- **Used for**: Financial transactions, fines, bail amounts

#### `currency.symbol` (required)
- **Format**: Currency symbol
- **Examples**: `"Le"`, `"GH₵"`, `"₦"`, `"KSh"`
- **Used for**: Display in UI

#### `currency.name` (required)
- **Format**: Full currency name
- **Examples**: `"Sierra Leonean Leone"`, `"Ghanaian Cedi"`
- **Used for**: Reports, documentation

---

### Police Structure

#### `policeStructure.type` (required)
- **Format**: Organization type
- **Options**: 
  - `"centralized"` - Single national police force
  - `"federal"` - Federal + state/provincial police
  - `"regional"` - Regional autonomous forces
- **Examples**:
  - `"centralized"` (Sierra Leone, Ghana, Kenya)
  - `"federal"` (Nigeria)
- **Used for**: Jurisdiction logic, reporting structure

#### `policeStructure.levels` (required)
- **Format**: Array of hierarchical levels (highest to lowest)
- **Examples**:
  - `["national", "regional", "district", "station"]`
  - `["national", "zonal", "state", "area", "division", "station"]` (Nigeria)
- **Used for**: Access control scopes, data filtering

#### `policeStructure.ranks` (required)
- **Format**: Array of rank names (highest to lowest)
- **Examples** (Sierra Leone):
  ```json
  [
    "Inspector General (IG)",
    "Deputy Inspector General (DIG)",
    "Assistant Inspector General (AIG)",
    "Chief Superintendent (CSP)",
    "Superintendent (SP)",
    "Assistant Superintendent (ASP)",
    "Inspector (INS)",
    "Sergeant (SGT)",
    "Corporal (CPL)",
    "Constable (PC)"
  ]
  ```
- **Used for**: Officer profile validation, rank-based permissions

---

### Legal Framework

#### `legalFramework.dataProtectionAct` (required)
- **Format**: Name and year of your data protection law
- **Examples**:
  - `"Data Protection Act, 2023"` (Sierra Leone)
  - `"Data Protection Act, 2012 (Act 843)"` (Ghana)
  - `"Nigeria Data Protection Regulation (NDPR), 2019"`
- **Used for**: Privacy policy, compliance documentation

#### `legalFramework.penalCode` (required)
- **Format**: Name and year of your criminal/penal code
- **Examples**:
  - `"The Criminal Procedure Act, 1965"` (Sierra Leone)
  - `"Criminal Offences Act, 1960 (Act 29)"` (Ghana)
  - `"Criminal Code Act, Chapter 77, Laws of the Federation of Nigeria"`
- **Used for**: Case categorization reference, legal citations

#### `legalFramework.evidenceAct` (required)
- **Format**: Name and year of your evidence law
- **Examples**:
  - `"Evidence Act, 1965"` (Sierra Leone)
  - `"Evidence Act, 1975 (NRCD 323)"` (Ghana)
  - `"Evidence Act, 2011"` (Nigeria)
- **Used for**: Evidence handling procedures, chain of custody standards

---

### Offense Categories

This section defines the crime classifications used in your country's penal code. **This is critical for case management.**

#### Structure
```json
{
  "code": "01",
  "name": "Category Name",
  "subcategories": ["Subcategory 1", "Subcategory 2"]
}
```

#### Example (Sierra Leone)
```json
[
  {
    "code": "01",
    "name": "Offences Against the Person",
    "subcategories": ["Murder", "Manslaughter", "Assault", "Kidnapping", "Rape"]
  },
  {
    "code": "02",
    "name": "Offences Against Property",
    "subcategories": ["Theft", "Robbery", "Burglary", "Arson"]
  },
  {
    "code": "03",
    "name": "Fraud and Economic Crimes",
    "subcategories": ["Fraud", "Embezzlement", "Forgery", "Cyber Crime"]
  },
  {
    "code": "04",
    "name": "Drug Offences",
    "subcategories": ["Drug Trafficking", "Drug Possession"]
  },
  {
    "code": "05",
    "name": "Public Order Offences",
    "subcategories": ["Riot", "Unlawful Assembly", "Affray"]
  }
]
```

#### How to Customize
1. Review your country's penal code
2. Identify major offense categories
3. List subcategories under each
4. Assign sequential codes (01, 02, 03...)
5. Use subcategory names exactly as they appear in legal documents

**Important**: Case creation will validate against these categories. If an offense isn't listed here, it cannot be selected.

---

### Telecom Integration

#### `telecom.ussdGateways` (required)
- **Format**: Array of telecom provider names
- **Examples**:
  - `["Orange", "Africell", "Qcell"]` (Sierra Leone)
  - `["MTN", "Vodafone", "AirtelTigo"]` (Ghana)
  - `["MTN", "Glo", "Airtel", "9mobile"]` (Nigeria)
- **Used for**: USSD integration, SMS routing

#### `telecom.ussdShortcode` (required)
- **Format**: USSD dial code
- **Examples**: `"*456#"`, `"*920#"`, `"*347#"`
- **Used for**: Officer field tools, feature phone access
- **Note**: You must register this shortcode with your national telecom regulator

#### `telecom.smsProvider` (required)
- **Format**: SMS gateway provider
- **Options**: `"africas-talking"`, `"twilio"`, `"custom"`
- **Used for**: MFA codes, notifications

#### `telecom.smsApiKey` (required)
- **Format**: `"env:VARIABLE_NAME"` (reference to environment variable)
- **Example**: `"env:USSD_API_KEY"`
- **Security**: Never put actual API keys in this file - use environment variables

---

### Integrations

#### National ID Registry
Enable if your country has a digital national ID verification API.

```json
"nationalIdRegistry": {
  "enabled": true,
  "apiEndpoint": "https://api.nia.gov.gh/verify",
  "apiKey": "env:NIA_API_KEY"
}
```

**Examples**:
- Ghana: National Identification Authority (NIA) API
- Nigeria: National Identity Management Commission (NIMC) API
- Kenya: Huduma Namba API

#### Court System
Enable if your country has a digital court case management system you want to integrate with.

```json
"courtSystem": {
  "enabled": true,
  "apiEndpoint": "https://courts.gov.xx/api"
}
```

---

## Example Configurations

### Example 1: Rwanda Deployment

```json
{
  "countryCode": "RWA",
  "countryName": "Rwanda",
  "capital": "Kigali",

  "nationalIdSystem": {
    "type": "NIDA",
    "displayName": "National ID (NIDA)",
    "format": "XXXXXXXXXXXXXXXX",
    "validationRegex": "^[0-9]{16}$",
    "length": 16
  },

  "language": {
    "default": "rw",
    "supported": ["rw", "en", "fr"],
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h"
  },

  "currency": {
    "code": "RWF",
    "symbol": "FRw",
    "name": "Rwandan Franc"
  },

  "policeStructure": {
    "type": "centralized",
    "levels": ["national", "district", "sector", "station"],
    "ranks": [
      "Inspector General",
      "Commissioner General",
      "Commissioner",
      "Assistant Commissioner",
      "Superintendent",
      "Inspector",
      "Sergeant",
      "Corporal",
      "Constable"
    ]
  },

  "legalFramework": {
    "dataProtectionAct": "Law on the Protection of Personal Data and Privacy, 2021",
    "penalCode": "Penal Code of Rwanda, 2018",
    "evidenceAct": "Law on Evidence, 2013"
  },

  "offenseCategories": [
    {
      "code": "01",
      "name": "Genocide and Crimes Against Humanity",
      "subcategories": ["Genocide", "Crimes Against Humanity"]
    },
    {
      "code": "02",
      "name": "Offences Against the Person",
      "subcategories": ["Murder", "Assault", "Kidnapping"]
    },
    {
      "code": "03",
      "name": "Offences Against Property",
      "subcategories": ["Theft", "Robbery", "Vandalism"]
    },
    {
      "code": "04",
      "name": "Economic Crimes",
      "subcategories": ["Fraud", "Embezzlement", "Money Laundering"]
    }
  ],

  "telecom": {
    "ussdGateways": ["MTN Rwanda", "Airtel Rwanda"],
    "ussdShortcode": "*182#",
    "smsProvider": "africas-talking",
    "smsApiKey": "env:USSD_API_KEY"
  },

  "integrations": {
    "nationalIdRegistry": {
      "enabled": true,
      "apiEndpoint": "https://api.nida.gov.rw/verify",
      "apiKey": "env:NIDA_API_KEY"
    },
    "courtSystem": {
      "enabled": false,
      "apiEndpoint": null
    }
  }
}
```

### Example 2: Ethiopia Deployment

```json
{
  "countryCode": "ETH",
  "countryName": "Ethiopia",
  "capital": "Addis Ababa",

  "nationalIdSystem": {
    "type": "FEID",
    "displayName": "Fayda Electron ID",
    "format": "ET-XXXX-XXXX-XXXX",
    "validationRegex": "^ET-[0-9]{4}-[0-9]{4}-[0-9]{4}$",
    "length": 18
  },

  "language": {
    "default": "am",
    "supported": ["am", "en", "om", "ti"],
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "12h"
  },

  "currency": {
    "code": "ETB",
    "symbol": "Br",
    "name": "Ethiopian Birr"
  },

  "policeStructure": {
    "type": "federal",
    "levels": ["federal", "regional", "zonal", "woreda", "station"],
    "ranks": [
      "Federal Police Commissioner",
      "Deputy Commissioner",
      "Assistant Commissioner",
      "Chief Superintendent",
      "Superintendent",
      "Inspector",
      "Sergeant",
      "Corporal",
      "Constable"
    ]
  },

  "legalFramework": {
    "dataProtectionAct": "Draft Data Protection Proclamation, 2023",
    "penalCode": "Criminal Code of Ethiopia, 2004",
    "evidenceAct": "Criminal Procedure Code, 1961"
  },

  "offenseCategories": [
    {
      "code": "01",
      "name": "Crimes Against the State",
      "subcategories": ["Treason", "Terrorism", "Sedition"]
    },
    {
      "code": "02",
      "name": "Crimes Against Persons",
      "subcategories": ["Homicide", "Assault", "Kidnapping", "Human Trafficking"]
    },
    {
      "code": "03",
      "name": "Crimes Against Property",
      "subcategories": ["Theft", "Robbery", "Burglary", "Arson"]
    },
    {
      "code": "04",
      "name": "Economic Crimes",
      "subcategories": ["Fraud", "Embezzlement", "Bribery", "Corruption"]
    },
    {
      "code": "05",
      "name": "Drug-Related Crimes",
      "subcategories": ["Drug Trafficking", "Drug Possession", "Drug Manufacturing"]
    }
  ],

  "telecom": {
    "ussdGateways": ["Ethio Telecom"],
    "ussdShortcode": "*847#",
    "smsProvider": "africas-talking",
    "smsApiKey": "env:USSD_API_KEY"
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

## Testing Your Configuration

After customizing your `config/deployment.json`, test it:

### 1. Validate JSON Structure
```bash
# Check for JSON syntax errors
cat config/deployment.json | jq .
```

### 2. Test National ID Validation
```bash
# Start the app
npm run dev

# Try creating a person with your country's NID format
# The system should validate according to your regex
```

### 3. Test Offense Categories
```bash
# Try creating a case
# The category dropdown should show your offense categories
# Validation should reject categories not in your config
```

### 4. Check USSD Integration
```bash
# In your application logs, verify:
# - USSD shortcode is correct
# - Telecom gateways are recognized
```

---

## Frequently Asked Questions

### Can I change the config after deployment?
Yes, but:
- Restart the application for changes to take effect
- Changing validation rules (like NID format) won't retroactively affect existing data
- Use database migrations if you need to transform existing data

### What if my country doesn't have a national ID system?
- Set `validationRegex` to `"^.+$"` (any non-empty string)
- Set `format` to `"Any valid ID"`
- Document alternate ID types in your deployment guide

### Can I add custom fields to the config?
Yes, but they won't be used by the application unless you modify the code. For true customization without code changes, stick to the defined structure.

### How do I update offense categories?
1. Edit `offenseCategories` in `config/deployment.json`
2. Restart the application
3. New cases will validate against updated categories
4. Existing cases keep their original categories

### My country uses multiple languages - how do I add translations?
Currently, the config defines which languages are supported, but actual UI translations require:
1. Adding translation files (future feature)
2. For now, list languages but UI will be in English

---

## Support

Need help customizing for your country?

1. Check existing examples in `docs/examples/`
2. Review this guide thoroughly
3. Open an issue on GitHub with your questions
4. Tag with `deployment` label

---

## Contributing Your Configuration

Once you've successfully deployed for your country, please contribute your configuration back to the project:

1. Copy your `config/deployment.json` to `docs/examples/YOUR_COUNTRY.json`
2. Remove any sensitive information (API keys, endpoints)
3. Submit a pull request
4. Help other countries learn from your deployment!

---

**Remember**: One JSON file is all you need. No code changes. That's the power of a true Digital Public Good. 🌍
