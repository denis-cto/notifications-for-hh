# Notification Preferences Service

Single source of truth for notification delivery preferences. Manages default settings, per-user overrides, global policies, and quiet hours; exposes REST API to read/update preferences and evaluate whether a notification may be sent.

## Quick start (Docker)

```bash
docker compose up --build
```

Service: `http://localhost:3000`

## Local development

### Prerequisites

- Node.js 25
- PostgreSQL 16 (or use Docker for Postgres only)

### Setup

```bash
cp .env.example .env
npm install

# Start Postgres (optional if using local instance)
docker compose up postgres -d

# Run migrations and seed
npx prisma migrate deploy
npm run prisma:seed

# Start dev server
npm run start:dev
```

## API

### Get user preferences

```bash
curl http://localhost:3000/users/user-1/preferences
```

### Update preferences

```bash
curl -X POST http://localhost:3000/users/user-1/preferences \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: optional-unique-key" \
  -d '{
    "preferences": [
      { "notificationType": "marketing", "channel": "email", "enabled": false }
    ],
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00",
      "timezone": "Europe/Berlin"
    }
  }'
```

### Evaluate notification delivery

```bash
curl -X POST http://localhost:3000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "notificationType": "marketing",
    "channel": "sms",
    "region": "EU",
    "datetime": "2026-05-21T10:00:00Z"
  }'
```

Example response:

```json
{
  "decision": "deny",
  "reason": "blocked_by_global_policy",
  "explanation": "blocked_by_global_policy"
}
```

## Tests

```bash
# Unit tests
npm test

# E2E tests (uses Testcontainers + PostgreSQL)
npm run test:e2e
```

E2E covers all required scenarios:

1. Default preferences for new users
2. User preference changes
3. Quiet hours blocking
4. Global regional policies
5. Idempotent updates

## Architecture

Hexagonal (ports & adapters) layering:

```
interfaces/http     → REST controllers, DTO validation
application         → PreferencesService, EvaluateService, repository ports
domain              → Pure types, QuietHours VO, rule-based PreferenceEvaluator
infrastructure      → Prisma repositories, logging, metrics seam
```

### Decision engine

Evaluation runs as a **Chain of Responsibility** with fixed precedence:

1. **Global policies** (region/type/channel wildcards)
2. **User/default preferences**
3. **Quiet hours** (marketing blocked; transactional/security bypass)

New users are not pre-created — defaults are merged lazily from `default_preferences` + `user_preferences`.

### Idempotency

- **State-based**: upserts on `(userId, type, channel)` — repeated identical updates converge
- **HTTP header**: optional `Idempotency-Key` stored in DB for command deduplication

### Observability

Structured logs (`nestjs-pino`):

- `event=preference_changed` — user preference updates
- `event=notification_decision` — allow/deny decisions with reason

`MetricsRecorder` port with no-op implementation; wire `prom-client` counters (`decisions_total{decision,reason}`) and histogram (`evaluate_duration_ms`) for production.

## Production next steps

- Authentication/authorization (admin vs user-scoped endpoints)
- Audit log for preference changes
- Cache layer for effective preferences (Redis)
- Event publishing (outbox pattern) on preference changes
- OpenAPI/Swagger documentation
- Prometheus metrics + distributed tracing
- Policy versioning and soft-delete
- Rate limiting and input sanitization hardening
