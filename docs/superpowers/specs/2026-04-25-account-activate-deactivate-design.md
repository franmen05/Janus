# Activar / Inactivar cuentas

**Fecha:** 2026-04-25
**Estado:** Aprobado

## Contexto

El campo `Account.active` ya existe en la entidad y default es `true`. El listado muestra el badge "Active/Inactive", pero **no hay endpoint ni UI** para cambiar el estado. Esta spec añade la capacidad de activar/inactivar cuentas y refleja la inactividad en los selectores de cuentas usados al crear operaciones.

## Decisiones

| # | Decisión | Elegida |
|---|---|---|
| 1 | Ubicación del botón | Solo en la fila del listado |
| 2 | Permisos | Solo `ADMIN` |
| 3 | Confirmación al inactivar | Modal de confirmación (activar es directo) |
| 4 | Efecto de inactivar | Se oculta del listado por defecto + se oculta de selectores en operaciones nuevas |

## Backend (`janus-backend`)

### Endpoint nuevo

```
PATCH /api/accounts/{id}/active
Path Params: id (Long)
Request Body: { "active": boolean }
Response Body: AccountResponse
Auth: @RolesAllowed("ADMIN")
Status Codes: 200 OK, 404 Not Found
```

### Cambios en listado

- `GET /api/accounts` añade query param opcional `activeOnly` (Boolean, default `false` — sin filtrar)
- `AccountRepository.findPaginated(search, page, size, activeOnly)` agrega cláusula `AND active = true` cuando `activeOnly=true`
- `AccountRepository.countFiltered(search, activeOnly)` análogo

### Servicio

- `AccountService.setActive(id, active, username)` — actualiza `account.active`, dispara `AuditEvent` con detalle `"Account activated: <name>"` o `"Account deactivated: <name>"`
- No se modifican `create`, `update`, `addPartner`, `removePartner`

### DTOs

- Nuevo record `SetAccountActiveRequest(boolean active)` en `com.janus.account.api.dto`
- `AccountResponse.active` ya existe — sin cambios

### Tests backend

- `AccountResourceTest` (o crear si no existe): PATCH activa, PATCH inactiva, 404, 403 si no es ADMIN
- `AccountServiceTest`: filtro `activeOnly` reduce resultados, `setActive` dispara audit

## Frontend (`janus-frontend`)

### `account-list.component.ts`

- **Botones por fila** (visibles solo si `authService.hasRole(['ADMIN'])`):
  - Si `account.active`: botón rojo `ACCOUNTS.DEACTIVATE` → abre modal de confirmación
  - Si `!account.active`: botón verde `ACCOUNTS.ACTIVATE` → llama servicio directo
- **Toggle "Mostrar inactivas"** en el header del card (junto al search):
  - Checkbox Bootstrap, default OFF
  - Cambia llama `loadAccounts()` con `activeOnly = !showInactive`
- **Modal de confirmación**: usar componente existente si hay `confirm-dialog`; si no, modal Bootstrap inline siguiendo patrón del proyecto
- **Toast / feedback**: usar el patrón existente del proyecto al completar (revisar `account-list.component` y otros para reutilizar el toast service si existe)

### `account.service.ts`

- `getAll(page, size, search?, activeOnly?)` — añade param opcional
- `setActive(id, active): Observable<Account>` — `PATCH /api/accounts/{id}/active`

### Selectores de cuentas en otras pantallas

Cambiar a `getAll(0, 9999, undefined, true)` (solo activas):
- `operation-form.component.ts:391` y `:456`
- `payment-panel.component.ts:467`
- `inspection-panel.component.ts:157`

Operaciones existentes que ya referencian una cuenta inactivada **siguen mostrando la cuenta correctamente** porque `findById` no filtra por `active`.

### i18n (`en.json` + `es.json`)

```
ACCOUNTS.DEACTIVATE                    → "Deactivate" / "Inactivar"
ACCOUNTS.ACTIVATE                      → "Activate" / "Activar"
ACCOUNTS.SHOW_INACTIVE                 → "Show inactive" / "Mostrar inactivas"
ACCOUNTS.CONFIRM_DEACTIVATE_TITLE      → "Deactivate account" / "Inactivar cuenta"
ACCOUNTS.CONFIRM_DEACTIVATE_MESSAGE    → "Are you sure you want to deactivate {{name}}?" / "¿Seguro que deseas inactivar {{name}}?"
ACCOUNTS.DEACTIVATED_SUCCESS           → "Account deactivated" / "Cuenta inactivada"
ACCOUNTS.ACTIVATED_SUCCESS             → "Account activated" / "Cuenta activada"
```

## Pruebas funcionales (Playwright)

Se ejecutan después de la implementación con la Functional Testing Agent.

| Cambio | Áreas afectadas | Tests |
|---|---|---|
| Botón inactivar/activar | Listado de cuentas | Inactivar muestra modal → confirma → badge cambia a "Inactive"; con filtro OFF la cuenta desaparece. Activar cambia badge a "Active" sin modal |
| Filtro "Mostrar inactivas" | Listado | Toggle ON muestra inactivas; OFF las oculta |
| Permisos | Listado como AGENT | El botón Inactivar/Activar **no se renderiza** |
| Selector de cuentas | Nueva operación, payment-panel, inspection-panel | Cuenta inactivada NO aparece en los dropdowns |
| Operación existente | Detalle de operación cuya cuenta fue inactivada | Sigue mostrando la cuenta correctamente |

## Fuera de alcance

- Borrado físico de cuentas
- Inactivar contactos individuales (`AccountContact`)
- Bulk activar/inactivar
- Histórico de cambios de estado más allá del audit event existente
