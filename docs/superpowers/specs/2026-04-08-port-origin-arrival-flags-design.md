# Port Origin/Arrival Flags

## Problem

All ports appear in both the arrival and origin port selects in the operation form. Users need to indicate which ports serve as origin ports, arrival ports, or both, and the operation form should filter accordingly.

## Design

### Backend Changes

**Entity: `Port.java`**
- Add `boolean originPort` (default `true`)
- Add `boolean arrivalPort` (default `true`)

**Migration:** Existing ports default to `true`/`true` to preserve current behavior.

**DTOs:**
- `CreatePortRequest` — add `originPort` (boolean), `arrivalPort` (boolean)
- `PortResponse` — add `originPort`, `arrivalPort`

**API:**
- `GET /api/ports` — existing endpoint, add optional query param `type` (`origin` | `arrival`)
  - `?type=origin` → returns ports where `originPort=true`
  - `?type=arrival` → returns ports where `arrivalPort=true`
  - No param → returns all ports (current behavior)

**Validation:** None — a port can exist without either flag marked. It simply won't appear in operation form selects.

**Seed data:** Update `import.sql` to include the new fields.

### Frontend — Port Management (`/ports`)

**Port form (create/edit):**
- Two independent checkboxes: "Puerto de origen" / "Puerto de arribo"
- Default: both checked for new ports
- No validation — both can be unchecked

**Port list table:**
- New column "Tipo" with badges:
  - `[Origen]` if `originPort=true`
  - `[Arribo]` if `arrivalPort=true`
  - Both badges if both are true
  - Empty if neither

### Frontend — Operation Form

- Arrival port select: calls `portService.getAll()` with `?type=arrival`
- Origin port select: calls `portService.getAll()` with `?type=origin`

### Frontend — Port Model & Service

- `Port` interface: add `originPort: boolean`, `arrivalPort: boolean`
- `CreatePortRequest` interface: add `originPort: boolean`, `arrivalPort: boolean`
- `PortService`: add optional `type` parameter to `getAll()`

### i18n Keys

**English (`en.json`):**
- `PORTS.ORIGIN_PORT`: "Origin Port"
- `PORTS.ARRIVAL_PORT`: "Arrival Port"
- `PORTS.TYPE`: "Type"
- `PORTS.BADGE_ORIGIN`: "Origin"
- `PORTS.BADGE_ARRIVAL`: "Arrival"

**Spanish (`es.json`):**
- `PORTS.ORIGIN_PORT`: "Puerto de Origen"
- `PORTS.ARRIVAL_PORT`: "Puerto de Arribo"
- `PORTS.TYPE`: "Tipo"
- `PORTS.BADGE_ORIGIN`: "Origen"
- `PORTS.BADGE_ARRIVAL`: "Arribo"
