# Field Channels Architecture

## Overview

CRMS provides field officers with mobile access to criminal record queries through two complementary channels:

- **USSD**: For officers with feature phones (no smartphone/data required)
- **WhatsApp**: For officers with smartphones (richer UI, interactive menus)

Both channels share **~90% of business logic** through the channel-agnostic `FieldCheckService`.

---

## Architecture Diagram

```
                    ┌──────────────────────────────────────────┐
                    │       FieldCheckService                  │
                    │  (Channel-agnostic business logic)       │
                    │                                          │
                    │  • checkWantedPerson(nin)                │
                    │  • checkMissingPerson(nin)               │
                    │  • checkBackground(nin)                  │
                    │  • checkVehicle(licensePlate)            │
                    │  • getStatistics(officerId)              │
                    │  • verifyOfficerPin(phone, pin)          │
                    │  • checkRateLimit(officerId)             │
                    └────────────────┬─────────────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
              ▼                                             ▼
    ┌─────────────────┐                       ┌─────────────────────┐
    │   USSDService   │                       │  WhatsAppService    │
    │   (Adapter)     │                       │  (Adapter)          │
    │                 │                       │                     │
    │  • CON/END fmt  │                       │  • List/Button UI   │
    │  • * menu nav   │                       │  • Webhook handling │
    │  • Text parsing │                       │  • Session state    │
    └────────┬────────┘                       └──────────┬──────────┘
             │                                           │
             ▼                                           ▼
    ┌─────────────────┐                       ┌─────────────────────┐
    │   USSDSession   │                       │  WhatsAppSession    │
    │   Repository    │                       │  Repository         │
    │   (Redis/DB)    │                       │  (PostgreSQL)       │
    └─────────────────┘                       └─────────────────────┘
```

---

## Component Details

### 1. FieldCheckService

**Location:** `src/services/FieldCheckService.ts`

The core business logic service that provides channel-agnostic query execution:

```typescript
export class FieldCheckService {
  // Authentication
  async findOfficerByPhone(phone: string): Promise<OfficerInfo | null>
  async verifyOfficerPin(phone: string, pin: string): Promise<boolean>
  async isChannelEnabled(officerId: string, channel: 'ussd' | 'whatsapp'): Promise<boolean>

  // Rate Limiting
  async checkRateLimit(officerId: string): Promise<RateLimitResult>

  // Query Operations
  async checkWantedPerson(nin: string, officerId: string): Promise<WantedCheckResult>
  async checkMissingPerson(nin: string, officerId: string): Promise<MissingCheckResult>
  async checkBackground(nin: string, officerId: string): Promise<BackgroundCheckResult>
  async checkVehicle(licensePlate: string, officerId: string): Promise<VehicleCheckResult>
  async getStatistics(officerId: string): Promise<StatisticsResult>
}
```

**Key Features:**
- All queries are logged to `USSDQueryLog` with channel field
- Audit trails for compliance
- Automatic rate limit tracking
- Consistent result formats across channels

### 2. WhatsAppService

**Location:** `src/services/whatsapp_service.ts`

Thin adapter that handles WhatsApp-specific concerns:

- Webhook payload parsing
- State machine management (MAIN_MENU → AWAITING_SEARCH → AWAITING_PIN → RESULT_SENT)
- Interactive list message formatting
- Session TTL management (5 minutes)

### 3. WhatsAppSession Repository

**Location:** `src/repositories/implementations/WhatsAppSessionRepository.ts`

PostgreSQL-backed session storage:

```typescript
interface WhatsAppSession {
  id: string
  phoneNumber: string        // E.164 format (+232...)
  officerId: string | null   // Set after PIN verification
  state: WhatsAppSessionState
  selectedQueryType: string | null
  searchTerm: string | null
  pinAttempts: number
  expiresAt: DateTime
  lastActivityAt: DateTime
}
```

---

## Channel Comparison

| Feature | USSD | WhatsApp |
|---------|------|----------|
| **Device** | Feature phone | Smartphone |
| **Network** | 2G/3G/GSM | Data/WiFi |
| **UI** | Text menus | Interactive lists |
| **Session TTL** | 180 seconds | 300 seconds |
| **Provider** | Africa's Talking / Twilio | Whapi.cloud |
| **Authentication** | Same (Quick PIN) | Same (Quick PIN) |
| **Rate Limit** | Same (50/day) | Same (50/day) |
| **Query Types** | 5 (wanted, missing, bg, vehicle, stats) | 5 (same) |

---

## Shared Components

### Authentication

Both channels use the same authentication flow:
1. Officer registers phone number via admin dashboard
2. Officer sets 4-digit Quick PIN (hashed with Argon2id)
3. Channel verifies phone → prompts for PIN → validates hash

### Rate Limiting

- Default: 50 queries per officer per day
- Configurable per officer by admin
- Tracked in `USSDQueryLog` table
- Same limits apply to both channels

### Query Logging

All queries logged to `USSDQueryLog`:

```sql
INSERT INTO "USSDQueryLog" (
  "id", "officerId", "phoneNumber", "queryType",
  "searchTerm", "resultSummary", "success",
  "channel",  -- 'ussd' or 'whatsapp'
  "timestamp"
) VALUES (...)
```

### Audit Trails

All queries create entries in `AuditLog`:
- Entity type: `field_check`
- Action: `query`
- Details: query type, search term, result summary

---

## State Machine (WhatsApp)

```
                              ┌──────────────┐
                              │   NO SESSION │
                              │   (Initial)  │
                              └──────┬───────┘
                                     │
                          Any message received
                                     │
                                     ▼
                              ┌──────────────┐
                              │     MAIN     │
              ┌───────────────│    MENU      │───────────────┐
              │               └──────────────┘               │
              │                      │                       │
         Invalid input          Valid selection         "stats" selected
         (send menu again)     (wanted/missing/etc.)         │
              │                      │                       │
              └──────────────────────│                       │
                                     ▼                       │
                              ┌──────────────┐               │
                              │  AWAITING    │               │
                              │   SEARCH     │               │
                              └──────┬───────┘               │
                                     │                       │
                              NIN/Plate entered              │
                                     │                       │
                                     ▼                       │
                              ┌──────────────┐               │
                              │  AWAITING    │◄──────────────┘
                              │     PIN      │
                              └──────┬───────┘
                                     │
                              PIN entered (4 digits)
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                    PIN Valid              PIN Invalid
                         │                (max 3 attempts)
                         │                       │
                         ▼                       ▼
                  ┌──────────────┐       ┌──────────────┐
                  │   RESULT     │       │    ERROR     │
                  │   SENT       │       │  (End flow)  │
                  └──────────────┘       └──────────────┘
```

---

## Adding a New Channel

To add support for a new channel (e.g., SMS, Telegram):

### 1. Create Session Type

```typescript
// src/domain/types/SmsSession.ts
export interface SmsSession {
  id: string
  phoneNumber: string
  officerId: string | null
  state: SmsSessionState
  // ... channel-specific fields
}
```

### 2. Create Repository Interface

```typescript
// src/domain/interfaces/repositories/ISmsSessionRepository.ts
export interface ISmsSessionRepository {
  findByPhoneNumber(phone: string): Promise<SmsSession | null>
  create(data: CreateSmsSessionDto): Promise<SmsSession>
  update(phone: string, data: UpdateSmsSessionDto): Promise<SmsSession>
  delete(phone: string): Promise<void>
}
```

### 3. Implement Repository

```typescript
// src/repositories/implementations/SmsSessionRepository.ts
export class SmsSessionRepository implements ISmsSessionRepository {
  // Implement CRUD operations
}
```

### 4. Create Adapter Service

```typescript
// src/services/SmsService.ts
export class SmsService {
  constructor(
    private fieldCheckService: FieldCheckService,
    private sessionRepo: ISmsSessionRepository
  ) {}

  async handleIncomingMessage(phone: string, text: string): Promise<string> {
    // 1. Get or create session
    // 2. Route based on state
    // 3. Call FieldCheckService for queries
    // 4. Format response for SMS
  }
}
```

### 5. Create API Endpoint

```typescript
// app/api/sms/route.ts
export async function POST(request: NextRequest) {
  const { phone, text } = await parseWebhook(request)
  const response = await container.smsService.handleIncomingMessage(phone, text)
  return sendSmsResponse(response)
}
```

### 6. Register in DI Container

```typescript
// src/di/container.ts
this.smsSessionRepository = new SmsSessionRepository(this.prismaClient)
this.smsService = new SmsService(this.fieldCheckService, this.smsSessionRepository)
```

---

## Code Reuse Summary

| Component | USSD | WhatsApp | Reuse |
|-----------|------|----------|-------|
| PIN Authentication | ✅ | ✅ | 100% |
| Rate Limiting | ✅ | ✅ | 100% |
| Wanted Check | ✅ | ✅ | 90% |
| Missing Check | ✅ | ✅ | 90% |
| Background Check | ✅ | ✅ | 90% |
| Vehicle Check | ✅ | ✅ | 90% |
| Statistics | ✅ | ✅ | 90% |
| Query Logging | ✅ | ✅ | 100% |
| Audit Logging | ✅ | ✅ | 100% |

**Overall: ~90% business logic shared between channels**

---

## Security Considerations

### Session Security
- Sessions tied to phone number (E.164 format)
- Auto-expire after TTL (USSD: 180s, WhatsApp: 300s)
- Cleared after query execution
- Max 3 PIN attempts before lockout

### Authentication
- Quick PIN hashed with Argon2id
- Officer must be `ussdEnabled = true` for channel access
- Phone number must be registered in system

### Rate Limiting
- Per-officer daily limits (default: 50)
- Fail-closed on rate limit errors
- Resets at midnight local time

### Data Protection
- No PII stored in session data
- Query results not persisted
- Audit trail for all access

---

## Environment Configuration

```bash
# USSD
USSD_API_KEY="your-api-key"
USSD_USERNAME="sandbox"
USSD_SHORTCODE="*123#"

# WhatsApp
WHAPI_URL="https://gate.whapi.cloud"
WHAPI_TOKEN="your-whapi-bearer-token"

# Feature Flags
ENABLE_USSD="true"
ENABLE_WHATSAPP="true"
```

---

## File Structure

```
src/
├── domain/
│   ├── interfaces/
│   │   ├── repositories/
│   │   │   └── IWhatsAppSessionRepository.ts
│   │   └── services/
│   │       └── IFieldCheckService.ts
│   └── types/
│       └── WhatsAppSession.ts
│
├── repositories/
│   └── implementations/
│       └── WhatsAppSessionRepository.ts
│
├── services/
│   ├── FieldCheckService.ts          # Shared business logic
│   ├── whatsapp_service.ts           # WhatsApp adapter
│   └── whatsapp_helpers/
│       ├── handle_auth.ts
│       ├── handle_wanted_person_check.ts
│       ├── handle_missing_person_check.ts
│       ├── handle_bg_summary.ts
│       ├── handle_vehicle_check.ts
│       ├── handle_stats.ts
│       └── whapi_message_template.ts
│
└── di/
    └── container.ts                   # DI registration

lib/
└── whapi.ts                          # Whapi API client

app/api/
├── ussd/
│   └── route.ts                      # USSD webhook
└── whatsapp/
    └── route.ts                      # WhatsApp webhook
```

---

## Related Documentation

- [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md) - Detailed WhatsApp implementation
- [SERVICE_REPOSITORY_ARCHITECTURE.md](./SERVICE_REPOSITORY_ARCHITECTURE.md) - General architecture patterns
- [USSD_ACTIVATION_IMPLEMENTATION.md](./USSD_ACTIVATION_IMPLEMENTATION.md) - USSD officer activation flow
