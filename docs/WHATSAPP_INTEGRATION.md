# WhatsApp Integration Documentation

## Overview

WhatsApp integration for CRMS using the Whapi API, replicating USSD field tool functionality. Officers can check wanted persons, missing persons, background checks, vehicles, and view their stats via WhatsApp.

## Requirements

- **Shared Registration**: Reuse existing USSD phone/PIN system (no new Officer fields)
- **Session TTL**: 5 minutes
- **Interactive UI**: Use WhatsApp list messages for menu navigation

---

## Architecture

Extract core business logic from `USSDService` into a channel-agnostic `FieldCheckService`, then create thin adapter services for both USSD and WhatsApp.

```
                    ┌──────────────────────────────────────────┐
                    │       FieldCheckService (NEW)            │
                    │  (Channel-agnostic business logic)       │
                    │  - checkWanted() → CheckResult           │
                    │  - checkMissing() → CheckResult          │
                    │  - checkBackground() → CheckResult       │
                    │  - checkVehicle() → CheckResult          │
                    │  - getStats() → StatsResult              │
                    │  - authenticateQuickPin()                │
                    │  - checkRateLimit()                      │
                    └────────────────┬─────────────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
              ▼                                             ▼
    ┌─────────────────┐                       ┌─────────────────────┐
    │   USSDService   │                       │  WhatsAppService    │
    │   (Adapter)     │                       │  (Adapter)          │
    │  - CON/END fmt  │                       │  - List/Text fmt    │
    │  - * parsing    │                       │  - Webhook handling │
    └─────────────────┘                       └─────────────────────┘
```

---

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WHATSAPP BOT FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

OFFICER                          WHATSAPP BOT                         SYSTEM
   │                                  │                                  │
   │  1. Sends "Hi" or any message    │                                  │
   │─────────────────────────────────>│                                  │
   │                                  │  Create session (5 min TTL)      │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │  2. Receives List Menu           │                                  │
   │<─────────────────────────────────│                                  │
   │                                  │                                  │
   │  ┌─────────────────────────┐     │                                  │
   │  │ CRMS Field Tools        │     │                                  │
   │  │ Select an option:       │     │                                  │
   │  │                         │     │                                  │
   │  │ [▼ Available Checks]    │     │                                  │
   │  │  • Check Wanted Person  │     │                                  │
   │  │  • Check Missing Person │     │                                  │
   │  │  • Background Check     │     │                                  │
   │  │  • Check Vehicle        │     │                                  │
   │  │  • My Statistics        │     │                                  │
   │  └─────────────────────────┘     │                                  │
   │                                  │                                  │
   │  3. Taps "Check Wanted Person"   │                                  │
   │─────────────────────────────────>│                                  │
   │                                  │  Update session: feature=wanted  │
   │                                  │  currentMenu=awaiting_pin        │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │  4. Receives PIN prompt          │                                  │
   │<─────────────────────────────────│                                  │
   │                                  │                                  │
   │  "🔐 Enter your 4-digit          │                                  │
   │   Quick PIN:"                    │                                  │
   │                                  │                                  │
   │  5. Sends "1234" (Quick PIN)     │                                  │
   │─────────────────────────────────>│                                  │
   │                                  │  Verify PIN via                  │
   │                                  │  FieldCheckService               │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │                                  │  Check rate limit                │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │                                  │  Update session: officerId=xxx   │
   │                                  │  currentMenu=awaiting_search     │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │  6. Receives search prompt       │                                  │
   │<─────────────────────────────────│                                  │
   │                                  │                                  │
   │  "🔍 Enter the NIN to check:"    │                                  │
   │                                  │                                  │
   │  7. Sends "NIN123456789"         │                                  │
   │─────────────────────────────────>│                                  │
   │                                  │  Execute checkWanted()           │
   │                                  │  via FieldCheckService           │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │                                  │  Log query to USSDQueryLog       │
   │                                  │  (channel: "whatsapp")           │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │                                  │  Delete session                  │
   │                                  │─────────────────────────────────>│
   │                                  │                                  │
   │  8. Receives result              │                                  │
   │<─────────────────────────────────│                                  │
   │                                  │                                  │
   │  "⚠️ WANTED PERSON               │                                  │
   │   ─────────────────              │                                  │
   │   Name: John Doe                 │                                  │
   │   Charges: Armed Robbery         │                                  │
   │   Danger Level: HIGH             │                                  │
   │   Warrant: WR-2024-001           │                                  │
   │                                  │                                  │
   │   Reply with any message to      │                                  │
   │   start a new search."           │                                  │
   │                                  │                                  │
   └──────────────────────────────────┴──────────────────────────────────┘
```

---

## Session State Machine

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
         (send menu again)     (1-4 or button tap)           │
              │                      │                       │
              │                      ▼                       │
              │               ┌──────────────┐               │
              └───────────────│  AWAITING    │               │
                              │     PIN      │               │
                              └──────┬───────┘               │
                                     │                       │
                              PIN entered                    │
                                     │                       │
                         ┌───────────┴───────────┐           │
                         │                       │           │
                    PIN Valid              PIN Invalid       │
                         │                       │           │
                         │                       ▼           │
                         │               ┌──────────────┐    │
                         │               │    ERROR     │    │
                         │               │  (End flow)  │    │
                         │               └──────────────┘    │
                         │                                   │
                         ▼                                   │
                  ┌──────────────┐                           │
                  │   AWAITING   │                           │
                  │   SEARCH     │◄──────────────────────────┘
                  └──────┬───────┘         (skip to stats execution)
                         │
                  Search term entered
                         │
                         ▼
                  ┌──────────────┐
                  │   EXECUTE    │
                  │    QUERY     │
                  └──────┬───────┘
                         │
                  Delete session
                         │
                         ▼
                  ┌──────────────┐
                  │   RESULT     │
                  │   SENT       │
                  └──────────────┘
```

---

## Webhook Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WEBHOOK PROCESSING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

     Whapi Server                    CRMS Server                    Redis
          │                              │                            │
          │  POST /api/whatsapp/webhook  │                            │
          │  ─────────────────────────>  │                            │
          │                              │                            │
          │  {                           │                            │
          │    "messages": [{            │                            │
          │      "id": "msg-123",        │                            │
          │      "from": "23276123456",  │                            │
          │      "from_me": false,       │                            │
          │      "type": "text",         │                            │
          │      "text": {               │                            │
          │        "body": "wanted"      │                            │
          │      }                       │                            │
          │    }],                       │                            │
          │    "event": {                │                            │
          │      "type": "messages",     │                            │
          │      "event": "post"         │                            │
          │    }                         │                            │
          │  }                           │                            │
          │                              │                            │
          │                              │  GET whatsapp:session:     │
          │                              │      23276123456           │
          │                              │  ─────────────────────────>│
          │                              │                            │
          │                              │  <─────────────────────────│
          │                              │  (session data or null)    │
          │                              │                            │
          │                              │                            │
          │                              │  [Process based on state]  │
          │                              │                            │
          │                              │                            │
          │                              │  SET whatsapp:session:     │
          │                              │      23276123456           │
          │                              │  TTL: 300 seconds          │
          │                              │  ─────────────────────────>│
          │                              │                            │
          │  <─────────────────────────  │                            │
          │  { "success": true }         │                            │
          │                              │                            │
          │                              │                            │
     ─────┴──────────────────────────────┴────────────────────────────┴─────
                                         │
                                         │  ASYNC: Send response via
                                         │  POST /messages/text or
                                         │  POST /messages/interactive
                                         │
                                         ▼
                                   Whapi API
```

---

## Message Type Examples

### 1. Main Menu (List Interactive)

```json
{
  "to": "23276123456",
  "type": "list",
  "body": {
    "text": "🔍 *CRMS Field Tools*\n\nWelcome, Officer! Select a check type below:"
  },
  "footer": {
    "text": "Sierra Leone Police - CRMS"
  },
  "action": {
    "button": "Select Option",
    "sections": [
      {
        "title": "Person Checks",
        "rows": [
          {
            "id": "wanted",
            "title": "🚨 Wanted Person",
            "description": "Check if person has active warrant"
          },
          {
            "id": "missing",
            "title": "🔎 Missing Person",
            "description": "Check missing/deceased status"
          },
          {
            "id": "background",
            "title": "📋 Background Check",
            "description": "Full criminal record check"
          }
        ]
      },
      {
        "title": "Other Checks",
        "rows": [
          {
            "id": "vehicle",
            "title": "🚗 Vehicle Check",
            "description": "Check stolen vehicle status"
          },
          {
            "id": "stats",
            "title": "📊 My Statistics",
            "description": "View your query statistics"
          }
        ]
      }
    ]
  }
}
```

### 2. PIN Prompt (Text)

```json
{
  "to": "23276123456",
  "body": "🔐 *Authentication Required*\n\nPlease enter your 4-digit Quick PIN:"
}
```

### 3. Search Prompt (Text)

```json
{
  "to": "23276123456",
  "body": "🔍 *Wanted Person Check*\n\nEnter the National Identification Number (NIN) to search:"
}
```

### 4. Result - Wanted Found (Text)

```json
{
  "to": "23276123456",
  "body": "⚠️ *WANTED PERSON ALERT*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* John Doe\n🆔 *NIN:* NIN123456789\n\n⚖️ *Charges:*\n• Armed Robbery\n• Assault\n\n🔴 *Danger Level:* HIGH\n📜 *Warrant:* WR-2024-00123\n\n━━━━━━━━━━━━━━━━━━━━\n_Exercise extreme caution. Contact dispatch immediately._\n\nReply with any message to start a new search."
}
```

### 5. Result - Clear (Text)

```json
{
  "to": "23276123456",
  "body": "✅ *NO ACTIVE WARRANTS*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* Jane Smith\n🆔 *NIN:* NIN987654321\n\n_No criminal record found._\n\nReply with any message to start a new search."
}
```

### 6. Stats Result (Text)

```json
{
  "to": "23276123456",
  "body": "📊 *Your CRMS Statistics*\n━━━━━━━━━━━━━━━━━━━━\n\n📅 *Today:* 5 queries\n📆 *This Week:* 23 queries\n📈 *This Month:* 87 queries\n📊 *All Time:* 342 queries\n\n✅ *Success Rate:* 94.2%\n\n*By Type:*\n• Wanted: 120\n• Missing: 45\n• Background: 98\n• Vehicle: 79\n\nReply with any message to start a new search."
}
```

### 7. Error Messages

```json
// Invalid PIN
{
  "to": "23276123456",
  "body": "❌ *Invalid Quick PIN*\n\nThe PIN you entered is incorrect. Please try again.\n\nReply with any message to restart."
}

// Phone not registered
{
  "to": "23276123456",
  "body": "❌ *Phone Not Registered*\n\nThis phone number is not registered for CRMS access.\n\nPlease contact your station commander to register for USSD/WhatsApp access."
}

// Rate limit exceeded
{
  "to": "23276123456",
  "body": "⚠️ *Daily Limit Reached*\n\nYou have reached your daily query limit (50 queries).\n\nYour limit resets at midnight.\n\nContact your station commander if you need a higher limit."
}

// Session expired
{
  "to": "23276123456",
  "body": "⏱️ *Session Expired*\n\nYour session has timed out due to inactivity.\n\nReply with any message to start a new search."
}
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   INCOMING   │
                              │   MESSAGE    │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   VALIDATE   │
                              │   PAYLOAD    │
                              └──────┬───────┘
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                      Valid                  Invalid
                         │                       │
                         │                       ▼
                         │               ┌──────────────┐
                         │               │  Return 200  │
                         │               │  (ignore)    │
                         │               └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  from_me?    │
                  └──────┬───────┘
                         │
              ┌──────────┴──────────┐
              │                     │
           true                  false
              │                     │
              ▼                     ▼
       ┌──────────────┐     ┌──────────────┐
       │  Return 200  │     │   PROCESS    │
       │  (ignore)    │     │   MESSAGE    │
       └──────────────┘     └──────┬───────┘
                                   │
                                   ▼
                           ┌──────────────┐
                           │   GET/CREATE │
                           │   SESSION    │
                           └──────┬───────┘
                                  │
                      ┌───────────┴───────────┐
                      │                       │
               Session Found           No Session
                      │                       │
                      ▼                       ▼
               ┌──────────────┐       ┌──────────────┐
               │   ROUTE BY   │       │  SEND MAIN   │
               │   STATE      │       │  MENU        │
               └──────┬───────┘       └──────────────┘
                      │
           ┌──────────┼──────────┐
           │          │          │
        main      awaiting   awaiting
           │        pin       search
           │          │          │
           ▼          ▼          ▼
     [Process]   [Validate]  [Execute]
                     │          │
              ┌──────┴──────┐   │
              │             │   │
           Valid       Invalid  │
              │             │   │
              │             ▼   │
              │     ┌──────────────┐
              │     │ SEND ERROR   │
              │     │ + DELETE     │
              │     │ SESSION      │
              │     └──────────────┘
              │
              └─────────────────────────────────────┐
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │  SEND RESULT │
                                             │  + DELETE    │
                                             │  SESSION     │
                                             └──────────────┘
```

---

## Database Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE OPERATIONS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION (authenticateQuickPin)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  SELECT * FROM "Officer"                                                │
   │  WHERE "ussdPhoneNumber" = $1                                          │
   │  INCLUDE: station, role                                                 │
   │                                                                         │
   │  Then: Verify Argon2id hash of Quick PIN                               │
   │                                                                         │
   │  UPDATE "Officer"                                                       │
   │  SET "ussdLastUsed" = NOW()                                            │
   │  WHERE "id" = $1                                                        │
   └─────────────────────────────────────────────────────────────────────────┘

2. RATE LIMIT CHECK (checkRateLimit)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  SELECT "ussdDailyLimit" FROM "Officer" WHERE "id" = $1                │
   │                                                                         │
   │  SELECT COUNT(*) FROM "USSDQueryLog"                                   │
   │  WHERE "officerId" = $1                                                 │
   │  AND "timestamp" >= TODAY_MIDNIGHT                                      │
   └─────────────────────────────────────────────────────────────────────────┘

3. WANTED CHECK (checkWanted)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  SELECT * FROM "Person" WHERE "nin" = $1                               │
   │                                                                         │
   │  SELECT * FROM "WantedPerson"                                          │
   │  WHERE "personId" = $1 AND "status" = 'active'                         │
   └─────────────────────────────────────────────────────────────────────────┘

4. MISSING CHECK (checkMissing)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  SELECT "id", "firstName", "lastName", "isDeceasedOrMissing"           │
   │  FROM "Person" WHERE "nin" = $1                                        │
   └─────────────────────────────────────────────────────────────────────────┘

5. BACKGROUND CHECK (checkBackground)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  SELECT * FROM "Person" WHERE "nin" = $1                               │
   │                                                                         │
   │  SELECT COUNT(*) FROM "CasePerson"                                     │
   │  WHERE "personId" = $1                                                  │
   │                                                                         │
   │  SELECT * FROM "WantedPerson"                                          │
   │  WHERE "personId" = $1 AND "status" = 'active'                         │
   └─────────────────────────────────────────────────────────────────────────┘

6. VEHICLE CHECK (checkVehicle)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  SELECT * FROM "Vehicle"                                                │
   │  WHERE UPPER("licensePlate") = UPPER($1)                               │
   └─────────────────────────────────────────────────────────────────────────┘

7. QUERY LOGGING (logQuery)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  INSERT INTO "USSDQueryLog" (                                          │
   │    "id", "officerId", "phoneNumber", "queryType",                      │
   │    "searchTerm", "resultSummary", "success",                           │
   │    "channel", "timestamp"                                               │
   │  ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'whatsapp', NOW())             │
   └─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   ├── Quick PIN hashed with Argon2id (same as USSD)
   ├── PIN attempts not rate-limited per message (session cleared on failure)
   └── Officer must be ussdEnabled = true

2. AUTHORIZATION
   ├── Only registered phone numbers can authenticate
   ├── Officer account must be active
   └── USSD access must be enabled by admin

3. RATE LIMITING
   ├── Daily query limit per officer (default: 50)
   ├── Fail-closed on rate limit errors
   └── Resets at midnight

4. SESSION SECURITY
   ├── 5-minute TTL (auto-expire)
   ├── Session tied to phone number
   └── Cleared after each query

5. DATA PROTECTION
   ├── No PII in result summaries logged
   ├── Audit trail for all queries
   └── Channel tracked for analytics

6. WEBHOOK SECURITY
   ├── Ignore from_me = true messages
   ├── Validate payload structure
   └── Always return 200 (prevent retry loops)
```

---

## Whapi API Reference

### Base URL
```
https://gate.whapi.cloud
```

### Authentication
```
Authorization: Bearer {WHAPI_TOKEN}
```

### Send Text Message
```
POST /messages/text

{
  "to": "23276123456",
  "body": "Hello, Officer!"
}
```

### Send List Menu (Interactive)
```
POST /messages/interactive

{
  "to": "23276123456",
  "type": "list",
  "body": { "text": "Select option:" },
  "footer": { "text": "CRMS" },
  "action": {
    "button": "Open Menu",
    "sections": [{
      "title": "Section Title",
      "rows": [
        { "id": "opt1", "title": "Option 1", "description": "Description" }
      ]
    }]
  }
}
```

### Webhook Payload (Incoming Message)
```json
{
  "messages": [{
    "id": "msg-id",
    "from": "23276123456",
    "from_me": false,
    "type": "text",
    "chat_id": "23276123456@s.whatsapp.net",
    "timestamp": 1712995245,
    "text": { "body": "user message" },
    "from_name": "John Doe"
  }],
  "event": { "type": "messages", "event": "post" },
  "channel_id": "CHANNEL-ID"
}
```

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/domain/types/fieldcheck.types.ts` | Channel-agnostic result types |
| `src/services/FieldCheckService.ts` | Core business logic (extracted) |
| `src/services/WhatsAppService.ts` | WhatsApp adapter service |
| `src/lib/whatsapp/WhapiClient.ts` | Whapi API client |
| `src/repositories/implementations/WhatsAppSessionRepository.ts` | WhatsApp session storage |
| `src/domain/interfaces/repositories/IWhatsAppSessionRepository.ts` | Session interface |
| `app/api/whatsapp/webhook/route.ts` | Webhook endpoint |

### Modified Files

| File | Changes |
|------|---------|
| `src/services/USSDService.ts` | Refactor to use FieldCheckService |
| `src/di/container.ts` | Register new services |
| `prisma/schema.prisma` | Add channel field to USSDQueryLog |

---

## Environment Variables

Add to `.env`:

```bash
# WhatsApp (Whapi)
WHAPI_TOKEN="your-whapi-bearer-token"
```

---

## Code Reuse Summary

| Component | Reuse Level |
|-----------|-------------|
| Authentication (Quick PIN) | 100% |
| Rate Limiting | 100% |
| Wanted/Missing/Background/Vehicle Checks | 90% |
| Session Management | 80% (same pattern, different TTL) |
| Query Logging | 90% (add channel field) |

**Overall: ~90% business logic reuse**
