# CRMS Documentation

Welcome to the **Criminal Record Management System (CRMS)** documentation. CRMS is a pan-African Digital Public Good designed for law enforcement agencies across the African continent.

![CRMS Dashboard](images/Dashboard.png)

## Quick Links

| Getting Started | For Developers | For Deployers |
|-----------------|----------------|---------------|
| [Requirements Spec](CRMS_REQUIREMENTS_SPECIFICATION.md) | [Architecture Guide](SERVICE_REPOSITORY_ARCHITECTURE.md) | [Deployment Guide](DEPLOYMENT_CUSTOMIZATION.md) |
| [DPG Compliance](DPG_COMPLIANCE.md) | [Testing Guide](TESTING_GUIDE.md) | [Country Configuration](COUNTRY_CONFIG_IMPLEMENTATION.md) |

## About CRMS

CRMS is a **reusable, configurable open-source platform** that any African country can deploy with configuration-based customization. Key features include:

- **Offline-First Architecture** - Works in low-connectivity environments (2G/3G)
- **Multi-Channel Access** - Web, PWA, USSD (feature phones), WhatsApp
- **Role-Based Access Control** - 6-tier permission system
- **Comprehensive Audit Logging** - Immutable trails for all actions
- **End-to-End Encryption** - AES-256 for PII at rest

## Core Features

### Authentication

Secure badge + PIN authentication with multi-factor authentication support.

![Login Page](images/Login%20Page.png)

### Case Management

Track investigations from initial report through to prosecution and court proceedings.

![Case Management](images/Cases.png)

### Background Checks

Citizen and officer background verification with appropriate access controls.

![Background Checks](images/BG_check.png)

### Vehicle & Person Records

Comprehensive records management for persons and vehicles involved in cases.

![Vehicle Records](images/vehicle.png)

## Documentation Sections

### Architecture & Development
Learn about the service-repository pattern, field channels architecture, and how to extend CRMS.

### Deployment & Configuration
Deploy CRMS in your country using configuration files - no code changes required.

### Features & Integrations
Detailed guides for WhatsApp integration, USSD setup, and PWA capabilities.

### Testing & Security
Testing guides, security checklists, and performance optimization.

### DPG Compliance
How CRMS meets all 9 Digital Public Good indicators.

## Target Deployment

**Pilot Country:** Sierra Leone Police Force (seeking partnership)

**Multi-Country Ready:** Ghana, Nigeria, Kenya, South Africa, and any other African country.

## Getting Help

- **GitHub Issues:** [Report bugs or request features](https://github.com/PeekTower-HQ/crms/issues)
- **GitHub Discussions:** [Ask questions](https://github.com/PeekTower-HQ/crms/discussions)
- **Deployment Assistance:** deploy@crms-africa.org

---

*Built for Africa's law enforcement agencies - Empowering justice through open-source technology*
