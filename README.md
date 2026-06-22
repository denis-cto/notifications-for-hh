# Notification Preferences Service

Сервис предпочтений уведомлений: дефолты, пользовательские настройки, глобальные политики, quiet hours. REST API для чтения/изменения настроек и проверки `allow` / `deny`.

**Стек:** TypeScript, NestJS, PostgreSQL, Prisma.

## Запуск (Docker)

```bash
docker compose up --build
```

Сервис: http://localhost:3000  
Проверка: `curl http://localhost:3000/health`

## Запуск локально

**Требования:** Node.js 25, PostgreSQL 16.

```bash
cp .env.example .env
npm install

docker compose up postgres -d   # или свой Postgres

npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

Production-сборка:

```bash
npm run build
npm run start:prod
```

## Тесты

```bash
npm test          # unit (domain)
npm run test:e2e  # e2e (Testcontainers + PostgreSQL)
```

## API (кратко)

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/users/:id/preferences` | Текущие предпочтения |
| POST | `/users/:id/preferences` | Изменить настройки / quiet hours |
| POST | `/evaluate` | Проверить возможность отправки |
| GET/POST | `/admin/policies` | Глобальные политики |
| GET/PUT | `/admin/defaults` | Дефолтные предпочтения |

`notificationType` — отдельно (`marketing` + `email`) или составной (`marketing_email`).

## Архитектура

Hexagonal (ports & adapters):

```
interfaces/http  → REST, DTO
application      → use cases, порты репозиториев
domain           → правила, QuietHours, PreferenceEvaluator
infrastructure   → Prisma, логирование
```

Решение `evaluate`: глобальные политики → предпочтения → quiet hours.  
Идемпотентность: upsert по `(userId, type, channel)` + заголовок `Idempotency-Key`.

## Дальше для продакшена

Auth, audit log, кэш (Redis), события при изменении настроек, OpenAPI, Prometheus-метрики, rate limiting.
