# Pill Guardian Monorepo

This repository contains a medication reminder system with a web dashboard, API services, and ESP32 integration for physical alerting.

## What is included

- `artifacts/api-server`: Express API + scheduler + ESP32 command endpoints
- `artifacts/pill-guardian`: Main React dashboard used by patient/guardian operators
- `artifacts/mockup-sandbox`: UI preview sandbox used during design iteration
- `lib/db`: Drizzle schema and PostgreSQL integration
- `lib/api-spec`, `lib/api-zod`, `lib/api-client-react`: API contract and generated types/hooks
- `esp32/pill-guardian.ino`: Firmware sketch for ESP32-based alarm device

## Quick start

1. Install dependencies
   - `corepack pnpm install --ignore-scripts`
2. Create env files from examples
   - `artifacts/api-server/.env.example` -> `artifacts/api-server/.env`
   - `artifacts/pill-guardian/.env.example` -> `artifacts/pill-guardian/.env`
   - `artifacts/mockup-sandbox/.env.example` -> `artifacts/mockup-sandbox/.env`
   - `lib/db/.env.example` -> `lib/db/.env` (for DB tooling)
3. Provide a reachable PostgreSQL `DATABASE_URL`
4. Start services
   - API: `corepack pnpm --filter @workspace/api-server run start`
   - App: `corepack pnpm --filter @workspace/pill-guardian run dev`
   - Sandbox (optional): `corepack pnpm --filter @workspace/mockup-sandbox run dev`

## Environment variables

### API (`artifacts/api-server`)
- `PORT` (default `8080`)
- `DATABASE_URL` (required)

### Pill Guardian frontend (`artifacts/pill-guardian`)
- `PORT` (default `5173`)
- `BASE_PATH` (default `/`)

### Mockup sandbox (`artifacts/mockup-sandbox`)
- `PORT` (default `8081`)
- `BASE_PATH` (default `/__mockup`)

## ESP32 default flow

1. Flash `esp32/pill-guardian.ino` to your device.
2. Set `SSID`, `PASSWORD`, and `WS_URL` in the sketch.
3. Configure the ESP32 IP from the app/API.
4. Verify status through `GET /api/esp32/status`.

## Core API routes

- Guardian: `GET/POST /api/guardian`
- Patient: `GET/POST /api/patient`
- Pills: `GET/POST/PUT/DELETE /api/pills`
- Pill state: `POST /api/pills/:id/taken`, `POST /api/pills/:id/reset`
- ESP32: `POST /api/esp32/configure`, `DELETE /api/esp32/configure`, `GET /api/esp32/status`

## Documentation

- Requirements: `REQUIREMENTS.md`
- Operations runbook: `RUNBOOK.md`

