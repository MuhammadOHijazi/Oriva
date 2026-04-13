# Requirements Specification

## 1. Purpose

Pill Guardian provides medication schedule management with a connected ESP32 alert channel so missed doses can trigger local alarms and guardian escalation.

## 2. Functional Requirements

### 2.1 Guardian and Patient Profiles
- System must allow create and fetch operations for guardian profile.
- System must allow create and fetch operations for patient profile.

### 2.2 Medication Schedule Management
- System must allow creating, editing, deleting, and listing pill schedules.
- Each schedule must include name, optional description, optional steps, and scheduled time.
- System must allow marking a pill as taken and resetting to pending.

### 2.3 Alarm and Escalation Behavior
- Scheduler must evaluate medication status continuously.
- If a scheduled dose is missed, system must trigger alarm command to ESP32.
- If still missed after reminder interval, system must trigger repeat alarm.
- If still missed after escalation interval, system must issue guardian alert event.

### 2.4 ESP32 Integration
- System must support runtime ESP32 IP configuration through API.
- System must support status checks for current ESP32 connectivity.
- System must support sending device commands (`ALARM_NOW`, `ALARM_REPEAT`, `STOP`, `GUARDIAN_ALERT`).

### 2.5 Frontend Experience
- Dashboard must display medication status and system connection indicators.
- Frontend must poll ESP32/system status at a fixed interval.
- Application must support navigation across dashboard, schedule management, and settings/profile pages.

## 3. Non-Functional Requirements

### 3.1 Reliability
- API startup must fail clearly when database configuration is missing.
- Device command calls must use network timeouts and failure logging.

### 3.2 Observability
- API must emit structured logs with request metadata and status outcomes.
- Connectivity checks and command dispatches must be logged.

### 3.3 Portability
- Local startup must work with default ports when not explicitly set.
- Env contracts must be documented through `.env.example` files.

### 3.4 Security and Data Handling
- Credentials must not be hardcoded in web/server code.
- Sensitive runtime values must be supplied through environment files/variables.

## 4. Runtime Dependencies

- Node.js 24+
- pnpm (via Corepack supported)
- PostgreSQL 16+ (or compatible Postgres instance)
- ESP32 board and Arduino toolchain for hardware validation

## 5. Configuration Requirements

### Required
- `DATABASE_URL` (API and DB tooling)

### Optional with defaults
- API: `PORT=8080`
- Pill Guardian: `PORT=5173`, `BASE_PATH=/`
- Mockup Sandbox: `PORT=8081`, `BASE_PATH=/__mockup`

## 6. Acceptance Criteria

- Frontend and API builds use standard tooling only (Vite, Node, pnpm) without editor-specific plugins.
- API starts and responds on health endpoint and core routes.
- Frontend app starts with documented defaults.
- ESP32 status/configure endpoints function as specified.
- Documentation is sufficient for a reviewer to run and assess the project without hidden setup knowledge.

