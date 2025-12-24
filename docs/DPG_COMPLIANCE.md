# Digital Public Good Compliance

CRMS (Criminal Record Management System) is designed as a Digital Public Good (DPG) in alignment with the Digital Public Goods Standard. This document details how CRMS meets all 9 DPG indicators.

## What is a Digital Public Good?

Digital Public Goods are open-source software, open data, open AI models, open standards, and open content that adhere to privacy and other applicable laws and best practices, do no harm by design, and help attain the UN Sustainable Development Goals (SDGs).

---

## Indicator 1: Relevance to Sustainable Development Goals

**Requirement:** The project must demonstrate relevance to one or more of the 17 UN Sustainable Development Goals.

**How CRMS Meets This:**

CRMS directly supports **SDG 16: Peace, Justice and Strong Institutions**, specifically:

- **Target 16.3** (Equal access to justice): CRMS provides standardized case management ensuring fair and transparent handling of criminal records across all stations, regardless of location or resources.

- **Target 16.6** (Effective, accountable institutions): Comprehensive audit logging tracks every action taken in the system, creating accountability. Role-based access control ensures officers only access data appropriate to their role.

- **Target 16.a** (Strengthen national institutions): CRMS is designed for national-scale deployment, helping countries build robust criminal justice infrastructure with modern technology.

**Impact Potential:**
- Reduces case processing delays through digitization
- Eliminates lost or misplaced records
- Enables data-driven policing and resource allocation
- Provides citizens with faster background check services

---

## Indicator 2: Use of Approved Open License

**Requirement:** The project must use an open license approved by the Open Source Initiative (OSI) for software.

**How CRMS Meets This:**

CRMS is released under the **MIT License**, one of the most permissive OSI-approved licenses.

The MIT License allows:
- Free use by any law enforcement agency worldwide
- Modification and adaptation for local needs
- Distribution and deployment in any country
- Commercial support services while keeping code open
- No requirement to disclose modifications

This license choice maximizes adoption potential across African countries with varying legal frameworks and resource levels.

---

## Indicator 3: Clear Ownership

**Requirement:** The project must have clear ownership with documented copyright and trademark information.

**How CRMS Meets This:**

- **Copyright Holder:** PeekTower HQ
- **Repository:** github.com/PeekTower-HQ/crms
- **License File:** MIT License included in repository root
- **Contribution Model:** Open contribution via GitHub pull requests with clear contribution guidelines
- **Governance:** Maintainer-led open source project with documented contribution and code review processes

All source code includes appropriate license headers and the project maintains a clear chain of ownership for all contributions.

---

## Indicator 4: Platform Independence

**Requirement:** The project must not rely on proprietary or closed-source components that would create vendor lock-in.

**How CRMS Meets This:**

CRMS is built entirely on open standards and can be self-hosted:

**Database:**
- PostgreSQL (open source) - no proprietary database required
- Standard SQL with Prisma ORM for portability

**Runtime:**
- Node.js (open source)
- Next.js framework (open source, MIT licensed)

**Deployment:**
- Docker support for containerized deployment
- Can run on any Linux server, cloud provider, or on-premises
- No dependency on specific cloud services (AWS, Azure, GCP all supported)

**Storage:**
- S3-compatible storage (MinIO for self-hosted, or any S3-compatible service)
- No vendor-specific storage requirements

**Authentication:**
- Self-contained authentication system
- No dependency on external identity providers

Countries can deploy CRMS on their own infrastructure with complete control over their data.

---

## Indicator 5: Documentation

**Requirement:** The project must have comprehensive documentation including source code documentation, functional requirements, and use case documentation.

**How CRMS Meets This:**

CRMS includes extensive documentation:

**Technical Documentation:**
- Architecture guide explaining service-repository pattern
- API documentation for all 77+ endpoints
- Database schema documentation with 23 models
- Security implementation details

**Deployment Documentation:**
- Step-by-step installation guide
- Docker deployment instructions
- Environment configuration reference
- Country-specific customization guide

**User Documentation:**
- Feature guides for case management, evidence tracking, background checks
- USSD and WhatsApp integration guides
- PWA and offline functionality documentation

**Developer Documentation:**
- Contributing guidelines
- Code style and patterns guide
- Testing guide with 144+ test cases documented

Total documentation exceeds 200,000 words across 40+ documents.

---

## Indicator 6: Mechanism for Extracting Data

**Requirement:** The project must provide mechanisms for extracting data in non-proprietary formats.

**How CRMS Meets This:**

CRMS supports data extraction through multiple mechanisms:

**API-Based Export:**
- RESTful APIs return data in JSON format
- Pagination support for large datasets
- Filtered exports by date range, station, case status, etc.

**Database Export:**
- Standard PostgreSQL backup and export tools
- Prisma migrations enable schema portability
- SQL-based data extraction for reporting

**Report Generation:**
- Dashboard data exportable to CSV
- Background check certificates in PDF format
- Audit logs exportable for compliance review

**Data Portability:**
- No proprietary data formats used
- All data stored in standard PostgreSQL tables
- Country configuration in JSON format
- Evidence files stored with standard MIME types

Countries maintain full ownership and portability of their data at all times.

---

## Indicator 7: Adherence to Privacy and Applicable Laws

**Requirement:** The project must demonstrate adherence to relevant privacy laws and regulations.

**How CRMS Meets This:**

CRMS is designed with privacy compliance as a core requirement:

**Data Protection Standards:**
- GDPR-aligned privacy practices
- Malabo Convention compliance (African Union data protection framework)
- Configurable for country-specific data protection laws

**Technical Privacy Measures:**
- AES-256 encryption for personally identifiable information (PII) at rest
- TLS 1.3 encryption for all data in transit
- Field-level encryption for sensitive data (addresses, phone numbers, emails)
- Biometric data stored as one-way hashes (SHA-256)

**Access Control:**
- Role-based access control with 6 permission levels
- Scope-based data access (own records, station, region, national)
- Session management with automatic timeout
- Multi-factor authentication support

**Audit & Accountability:**
- Immutable audit logs for all data access and modifications
- Audit records include who, what, when, where, and why
- Retention policies configurable per jurisdiction

**Data Minimization:**
- Citizens receive redacted background check results ("Clear" or "Record exists")
- Full details only accessible to authorized officers with audit logging

---

## Indicator 8: Adherence to Standards and Best Practices

**Requirement:** The project must follow industry standards and best practices.

**How CRMS Meets This:**

**Security Standards:**
- OWASP Top 10 compliance for web application security
- Argon2id password hashing (OWASP recommended)
- Input validation using Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection through React's automatic escaping
- CSRF protection on all state-changing operations

**API Standards:**
- RESTful API design principles
- JSON:API compatible response formats
- HTTP status codes used correctly
- Rate limiting for DDoS protection

**Authentication Standards:**
- JWT-based session management
- OAuth 2.0 compatible patterns
- Secure cookie handling

**Code Quality:**
- TypeScript for type safety
- ESLint for code quality enforcement
- Comprehensive test coverage (144+ test cases)
- Continuous integration practices

**Accessibility:**
- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast UI options

---

## Indicator 9: Do No Harm by Design

**Requirement:** The project must demonstrate consideration for privacy, security, and potential misuse, with appropriate safeguards.

**How CRMS Meets This:**

**Privacy by Design:**
- Minimal data collection principle - only necessary information collected
- Purpose limitation - data used only for stated criminal justice purposes
- Data retention policies to prevent indefinite storage
- Right to access and correction mechanisms

**Security by Design:**
- Defense in depth with multiple security layers
- Principle of least privilege for all access
- Secure defaults - security features enabled out of the box
- Regular security audit capabilities through comprehensive logging

**Preventing Misuse:**
- Audit trails make unauthorized access detectable and traceable
- Role separation prevents any single user from having unchecked power
- Station commanders can only access their jurisdiction's data
- National-level access requires highest authorization level

**Safeguards for Vulnerable Populations:**
- Amber Alert system for missing children includes safeguards against false reports
- Background check results for citizens are appropriately redacted
- Witness and informant identities can be protected in case records

**Offline Considerations:**
- Offline data cached securely on authorized devices only
- Automatic sync with conflict resolution prevents data corruption
- Device loss procedures documented for security incidents

**Content Moderation:**
- Evidence uploads validated for file type and size
- Audit logging of all uploaded content
- Chain of custody tracking for evidence integrity

**Accountability Mechanisms:**
- Every action attributable to a specific officer
- Supervisory review capabilities built into permission structure
- Export capabilities for external oversight and auditing

---

## Summary

CRMS meets all 9 Digital Public Goods Standard indicators:

| Indicator | Status |
|-----------|--------|
| 1. SDG Relevance | SDG 16 - Peace, Justice, Strong Institutions |
| 2. Open License | MIT License (OSI-approved) |
| 3. Clear Ownership | PeekTower HQ, documented governance |
| 4. Platform Independence | Fully self-hostable, no vendor lock-in |
| 5. Documentation | 200,000+ words, comprehensive coverage |
| 6. Data Extraction | JSON APIs, PostgreSQL exports, CSV reports |
| 7. Privacy & Laws | GDPR, Malabo Convention, encryption, access control |
| 8. Standards & Best Practices | OWASP, REST, TypeScript, accessibility |
| 9. Do No Harm | Privacy by design, audit trails, safeguards |

CRMS is designed from the ground up as a Digital Public Good, prioritizing openness, security, privacy, and adaptability for deployment across diverse African contexts.
