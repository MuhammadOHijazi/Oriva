# Demo Runbook

## 1. Objective

Run the full Pill Guardian stack and validate core user and device flows end to end.

## 2. Pre-flight

1. Install dependencies:
   - `corepack pnpm install --ignore-scripts`
2. Copy env templates:
   - `artifacts/api-server/.env.example` -> `artifacts/api-server/.env`
   - `artifacts/pill-guardian/.env.example` -> `artifacts/pill-guardian/.env`
   - `artifacts/mockup-sandbox/.env.example` -> `artifacts/mockup-sandbox/.env`
3. Set `DATABASE_URL` in API env file.

## 3. Start services

### API server
- Command: `corepack pnpm --filter @workspace/api-server run start`
- Expected: server log reports listening on configured/default port.

### Pill Guardian frontend
- Command: `corepack pnpm --filter @workspace/pill-guardian run dev`
- Expected: Vite dev server starts on configured/default port.

### Mockup sandbox (optional during demo)
- Command: `corepack pnpm --filter @workspace/mockup-sandbox run dev`
- Expected: sandbox loads at configured base path.

## 4. API smoke checks

- `GET /api/healthz` -> success response
- `GET /api/esp32/status` -> returns `connected` and `ip` fields
- `GET /api/pills` -> returns list payload

## 5. Functional walkthrough

1. Create guardian profile.
2. Create patient profile.
3. Create at least one pill schedule.
4. Mark pill as taken and verify status update.
5. Reset a pill and verify state transition.
6. Configure ESP32 IP via API and check status endpoint.

## 6. ESP32 validation path

1. Flash firmware from `esp32/pill-guardian.ino`.
2. Set WiFi and backend WS URL in sketch.
3. Confirm device reachable from backend.
4. Trigger schedule event and verify alarm command flow.

## 7. Troubleshooting notes

- If API fails at startup, verify `DATABASE_URL`.
- If dependency install fails on Windows shell scripts, rerun with `--ignore-scripts`.
- If frontend pathing is wrong, verify `BASE_PATH` values.
- If ESP32 status is disconnected, verify device IP/network and endpoint reachability.

