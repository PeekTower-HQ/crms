# Criminal Record Management System (CRMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DPG](https://img.shields.io/badge/Digital%20Public%20Good-Candidate-blue)](https://digitalpublicgoods.net)
[![SDG 16](https://img.shields.io/badge/SDG-16%20Peace%20%26%20Justice-green)](https://sdgs.un.org/goals/goal16)
[![Pan-African](https://img.shields.io/badge/Scope-Pan--African-orange)](https://github.com/PeekTower-HQ/crms)
[![Development Status](https://img.shields.io/badge/Status-Production--Ready%20(Pre--Pilot)-blue)](https://github.com/PeekTower-HQ/crms)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-2D3748)](https://www.prisma.io)

A **Pan-African Digital Public Good** for managing criminal records across the African continent, with offline-first architecture for limited internet connectivity. **Production-ready and prepared for pilot deployment** in Sierra Leone Police Force and other African countries.

---

## 📸 Screenshots

*Note: Screenshots show development environment. System is production-ready and prepared for deployment.*

### Main Dashboard
![CRMS Dashboard](sample_screens/Dashboard.png)
*Central command center with case statistics and recent activity*

### Authentication
![Login Interface](sample_screens/Login%20Page.png)
*Secure badge + PIN authentication system*

---

## 🌍 About

CRMS is a **reusable, configurable open-source platform** designed for law enforcement agencies across Africa. Production-ready and prepared for pilot deployment in Sierra Leone, CRMS can be deployed in any African country with configuration-based customization (no code forking required).

### Key Features

- 🔐 **Secure Authentication** - Badge + PIN with Argon2id hashing, Multi-Factor Authentication (MFA)
- 👥 **Role-Based Access Control (RBAC)** - 6 roles with granular permissions
- 📱 **Progressive Web App (PWA)** - Works offline with service workers and IndexedDB
- 🌐 **USSD Support** - Background checks via feature phones (no smartphone required)
- 📱 **WhatsApp Integration** - Field checks via WhatsApp for smartphone users
- 📊 **Comprehensive Audit Logging** - Immutable audit trails for all actions
- 🔒 **End-to-End Encryption** - AES-256 for PII, TLS 1.3 in transit
- 🚀 **Optimized for 2G/3G Networks** - Minimal data usage, offline-first
- 🌍 **Multi-Language Support** - English, French, Portuguese, Arabic, and more
- 🗂️ **Case Management** - Track investigations from report to prosecution
- 👤 **Person Records** - Biometric data, aliases, national ID integration
- 📦 **Evidence Management** - QR codes, chain of custody, file integrity
- 🚨 **Amber Alerts & Wanted Notices** - Real-time alerts for missing persons and fugitives
- ✅ **Background Checks** - Citizen and employer background verification
- 📈 **Dashboards & Reporting** - Data-driven insights for law enforcement

### Country-Agnostic Design

- ✅ Supports any national ID system (NIN, Ghana Card, Huduma Namba, etc.)
- ✅ Configurable legal frameworks and case workflows
- ✅ Multi-language and multi-currency support
- ✅ Adaptable to different police organizational structures
- ✅ Interoperability with regional security systems (ECOWAS, SADC, AU)

---

## 🎯 Digital Public Good Alignment

This project aligns with:

- **SDG 16**: Peace, Justice and Strong Institutions (Targets 16.3, 16.a, 16.6)
- **DPG Standard**: Meets all 9 indicators for Digital Public Goods
- **Data Protection**: GDPR and Malabo Convention compliant

### Why a Digital Public Good?

CRMS is designed as a **public good** to empower law enforcement agencies across Africa without cost barriers, vendor lock-in, or proprietary restrictions. By open-sourcing this system, we enable:

1. **Shared Development** - Countries contribute improvements benefiting all
2. **Transparency** - Open code builds public trust in criminal justice systems
3. **Sovereignty** - Countries control their own data and infrastructure
4. **Affordability** - No licensing fees, reducing financial barriers
5. **Interoperability** - Cross-border cooperation for regional security

---

## ✨ Core Features

### 1. Authentication & Authorization

- **Badge + PIN Authentication** (8-digit PIN, Argon2id hashed)
- **Multi-Factor Authentication** (SMS OTP, TOTP)
- **6 Role Hierarchy**: SuperAdmin, Admin, StationCommander, Officer, EvidenceClerk, Viewer
- **Granular Permissions**: Resource (cases, persons, evidence), Action (CRUD), Scope (own, station, region, national)
- **Account Security**: Lockout after 5 failed attempts, session expiry (15 minutes)


### 2. Case Management

![Case Management Interface](sample_screens/Cases.png)
*Comprehensive case tracking from initial report to prosecution*

- **Case Tracking**: From initial report to prosecution and court
- **Case Status Workflow**: Open → Investigating → Charged → Court → Closed
- **Case Categories**: Theft, assault, fraud, murder, robbery, kidnapping, etc. (country-configurable)
- **Severity Levels**: Minor, major, critical
- **Multi-Station Coordination**: Cases can involve multiple stations
- **Audit Trail**: Every case update is logged

### 3. Person Records

![Vehicle Records Management](sample_screens/vehicle.png)
*Comprehensive person and vehicle record management*

- **National ID Integration**: Supports any national ID system (NIN, Ghana Card, etc.)
- **Biometric Data**: Fingerprints (SHA-256 hashed), photos
- **PII Encryption**: Addresses, phone numbers, emails (AES-256 encrypted)
- **Aliases**: Track known aliases
- **Case Roles**: Suspect, victim, witness, informant
- **Cross-Reference**: Link persons to multiple cases

### 4. Evidence Management

- **QR Code Tracking**: Unique identifiers for physical evidence
- **Chain of Custody**: JSON log of every custody transfer
- **File Storage**: S3-compatible (MinIO/AWS S3), encrypted
- **File Integrity**: SHA-256 hash verification
- **Evidence Types**: Photo, document, video, physical, digital

### 5. Amber Alerts & Wanted Persons

- **Amber Alerts**: Missing children with photos, descriptions, last seen location
- **Wanted Notices**: Fugitives with danger levels, rewards, aliases
- **Public Distribution**: USSD access for citizens
- **Expiry Management**: Auto-expire alerts after set periods

### 6. Background Checks

![Background Check System](sample_screens/BG_check.png)
*Citizen and officer background verification with audit trails*

- **Request Types**: Officer, citizen, employer, visa
- **Citizen Access**: Via USSD (feature phones) or web
- **Redacted Results**: Citizens receive "Clear" or "Record exists - visit station"
- **Officer Access**: Full detailed results with audit logging
- **Certificate Generation**: PDF certificates for clean records

### 7. Offline-First Architecture

![PWA Interface 1](sample_screens/PWA_1.png)
![PWA Interface 2](sample_screens/PWA_2.png)
*Progressive Web App functionality for offline operation*

- **Service Workers**: Cache API responses for offline use
- **IndexedDB**: Store data locally for offline CRUD operations
- **Sync Queue**: Auto-sync when connection restored
- **Conflict Resolution**: Last-write-wins with manual merge for conflicts

### 8. Field Tools (USSD & WhatsApp)

**USSD (Feature Phones):**
- **Background Checks**: `*123*1*NIN#` (country-specific shortcode)
- **Case Status**: `*123*2*CaseNumber#`
- **Wanted Persons**: `*123*3#` (search by name)
- **Works on Feature Phones**: No smartphone or data plan required

**WhatsApp (Smartphones):**
- Send any message to activate the CRMS bot
- Interactive list menus for query selection
- Same features: Wanted, Missing, Background, Vehicle checks
- Officer statistics and audit logging
- 5-minute session timeout for security

---

## 🖼️ Interface Preview

| Dashboard | Case Management | Background Checks |
|-----------|-----------------|-------------------|
| ![Dashboard](sample_screens/Dashboard.png) | ![Cases](sample_screens/Cases.png) | ![BG Check](sample_screens/BG_check.png) |

| Authentication | PWA Features | Vehicle Records |
|----------------|--------------|-----------------|
| ![Login](sample_screens/Login%20Page.png) | ![PWA](sample_screens/PWA_1.png) | ![Vehicle](sample_screens/vehicle.png) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 15+
- **npm** or **yarn**

### Installation

```bash
# Clone repository
git clone https://github.com/PeekTower-HQ/crms.git
cd crms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# Set up database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

Visit `http://localhost:3000`

**Default SuperAdmin credentials** (change immediately after first login):
- **Badge**: `SA-00001`
- **PIN**: `12345678`

### Docker Installation

```bash
# Using Docker Compose (includes PostgreSQL + MinIO + App)
docker-compose up -d

# Access application
http://localhost:3000
```

---

## 📖 Documentation

### Deployment & Configuration
- **[docs/DEPLOYMENT_CUSTOMIZATION.md](docs/DEPLOYMENT_CUSTOMIZATION.md)** - 🌍 **Deploy CRMS for your country** (single JSON file configuration)
- **[MULTI_COUNTRY_DEPLOYMENT.md](MULTI_COUNTRY_DEPLOYMENT.md)** - Multi-country deployment guide

### Development
- **[CLAUDE.md](CLAUDE.md)** - Development guide for Claude Code AI
- **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - 26-week detailed implementation plan
- **[docs/SERVICE_REPOSITORY_ARCHITECTURE.md](docs/SERVICE_REPOSITORY_ARCHITECTURE.md)** - Architecture patterns
- **[docs/CRMS_REQUIREMENTS_SPECIFICATION.md](docs/CRMS_REQUIREMENTS_SPECIFICATION.md)** - Full requirements spec

### Policies & Contribution
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[SECURITY.md](SECURITY.md)** - Security policy
- **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** - Data protection policy

---

## 🏗️ Technology Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** (Server & Client Components)
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** (Radix UI components)

### Backend
- **Next.js API Routes** (serverless functions)
- **Prisma ORM** (type-safe database access)
- **PostgreSQL 15+** (primary database)

### Authentication
- **NextAuth.js 5** (OAuth, credentials provider)
- **Argon2id** (password/PIN hashing)
- **JWT** (stateless sessions)

### Offline & PWA
- **Service Workers** (Workbox)
- **IndexedDB** (Dexie.js for local storage)
- **Progressive Web App** (manifest.json, installable)

### Storage
- **S3-Compatible** (MinIO for self-hosted, AWS S3 for cloud)
- **AES-256 Encryption** (PII data at rest)

### Field Messaging
- **USSD:** Africa's Talking (preferred), Twilio (alternative)
- **WhatsApp:** Whapi.cloud

---

## 🔒 Security

- **Argon2id Password Hashing** (OWASP recommended)
- **AES-256 Encryption** for PII at rest
- **TLS 1.3 Enforcement** for data in transit
- **Comprehensive Audit Logging** (immutable)
- **OWASP Top 10 Compliant**
- **Rate Limiting** (DDoS protection)
- **Input Validation** (Zod schemas)
- **SQL Injection Prevention** (Prisma ORM)
- **XSS Protection** (React auto-escaping)

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 🌍 Multi-Country Deployment

CRMS is designed for deployment in **any African country** with minimal configuration:

### Example Deployments

1. **Sierra Leone** (Pilot) - NIN, English, Leone currency
2. **Ghana** - Ghana Card, English/Twi/Ewe, Cedi currency
3. **Nigeria** - Nigerian NIN, English/Hausa/Yoruba/Igbo, Naira currency
4. **Kenya** - Huduma Namba, English/Swahili, Shilling currency
5. **South Africa** - SA ID, English/Afrikaans/Zulu, Rand currency

### Configuration-Based Customization

Create `config/countries/{country-code}.json`:

```json
{
  "countryCode": "GHA",
  "countryName": "Ghana",
  "nationalIdSystem": {
    "type": "GHANA_CARD",
    "displayName": "Ghana Card",
    "format": "GHA-XXXXXXXXX-X"
  },
  "language": {
    "default": "en",
    "supported": ["en", "tw", "ee"]
  },
  "currency": "GHS",
  "policeStructure": {
    "type": "centralized",
    "levels": ["national", "regional", "district", "station"]
  }
}
```

See [MULTI_COUNTRY_DEPLOYMENT.md](MULTI_COUNTRY_DEPLOYMENT.md) for full deployment guide.

---

## 🤝 Contributing

We welcome contributions from developers, law enforcement agencies, and civil society organizations!

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

1. **Code Contributions** - Bug fixes, features, improvements
2. **Translations** - Add support for new languages
3. **Documentation** - Improve guides, tutorials, API docs
4. **Testing** - Report bugs, test in different environments
5. **Deployment Assistance** - Help other countries deploy CRMS
6. **Use Cases** - Share your deployment experience

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file.

The MIT License enables:
- ✅ Free use by any law enforcement agency
- ✅ Modification and adaptation for local needs
- ✅ Distribution and deployment in any country
- ✅ Commercial support services (while keeping code open)

---

## 🙏 Acknowledgments

- **Prepared for Pilot**: Sierra Leone Police Force (production-ready, awaiting deployment approval)
- **Supported by**: Digital Public Goods Alliance
- **Technology Partners**: [Your partners]
- **Funding**: [Your funders]

---

## 📞 Contact & Support

- **Website**: [https://crms-africa.org](https://crms-africa.org)
- **GitHub**: [https://github.com/PeekTower-HQ/crms](https://github.com/PeekTower-HQ/crms)
- **Issues**: [GitHub Issues](https://github.com/PeekTower-HQ/crms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PeekTower-HQ/crms/discussions)
- **Email**: [support@crms-africa.org](mailto:support@crms-africa.org)

### Deployment Assistance

Need help deploying CRMS in your country? Contact us at [deploy@crms-africa.org](mailto:deploy@crms-africa.org)

---

## 🌟 Star us on GitHub!

If you find this project useful, please give us a star ⭐ to help others discover it!

---

## 📊 Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Foundation & DPG Compliance Setup |
| Phase 2 | ✅ Complete | Authentication & RBAC System |
| Phase 3 | ✅ Complete | Offline-First Architecture |
| Phase 4 | ✅ Complete | Case, Person, Evidence Management |
| Phase 5 | ✅ Complete | Audit Logging & Security |
| Phase 6 | ✅ Complete | Background Checks & Alerts |
| Phase 7 | ✅ Complete | USSD & WhatsApp Integration |
| Phase 8 | ✅ Complete | Dashboards & Reporting |
| Phase 9 | ✅ Complete | PWA Optimization |
| Phase 10 | ✅ Complete | MFA Implementation |
| Phase 11 | ✅ Complete | Testing & QA (144+ test cases) |
| Phase 12 | 🚧 Current Phase | DPG Submission & Multi-Country Deployment Coordination |

**Development Status**: 11/12 phases complete (91%) - Production-ready
**Current Focus**: DPG Accelerator application and pilot partnership building

---

## 🛣️ Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed timeline and milestones.

### Current Phase: DPG Submission & Partnership Building (Q4 2025)

- ✅ Development complete (11/12 phases, 91%)
- ✅ Comprehensive testing (144+ test cases)
- ✅ Documentation complete (200,000+ words)
- 🚧 DPG Accelerator application
- ⏳ Secure pilot country partnerships

### Next Phase: First Pilot Deployments (Q2-Q3 2026, pending approval)

- ⏳ Sierra Leone Police Force (50+ stations, 500+ officers)
- ⏳ Additional pilot country (Ghana/Nigeria)
- ⏳ Deploy within 90 days of partnership confirmation
- ⏳ Measure SDG 16 impact (10,000+ cases, 50,000+ background checks)

### Future: Multi-Country Scale (2027+)

- 📋 5+ countries operational
- 📋 Regional interoperability (ECOWAS, SADC, EAC)
- 📋 1,000+ stations across Africa
- 📋 Continental security cooperation

---

**Built with ❤️ for Africa's law enforcement agencies**

*Empowering justice through open-source technology*
