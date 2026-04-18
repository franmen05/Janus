# Warehouse: Inactivar y Eliminar

**Fecha:** 2026-04-17

## Contexto

Los almacenes (Warehouse) necesitan soporte para ser inactivados (soft-disable) o eliminados. Las operaciones referencian almacenes via FK, por lo que la eliminación debe ser condicional.

También se requiere que el campo `paisOrigen` sea un select de países.

## Decisiones de diseño

- **Inactivación:** campo `boolean active = true` (igual que `User.active`)
- **Borrado:** físico, solo permitido si el almacén no tiene operaciones referenciadas; error 409 si las tiene
- **Roles:** ADMIN y SUPERVISOR para ambas acciones (igual que crear/editar)
- **País de Origen:** `<select>` reutilizando el endpoint `/api/ports/catalog/countries`

## Modelo de datos

```sql
-- V5__add_warehouse_active_field.sql
ALTER TABLE depositos ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
```

## API

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/warehouses?includeInactive=true` | Lista todos (activos + inactivos) | ADMIN, SUPERVISOR, AGENT |
| PATCH | `/api/warehouses/{id}/toggle-active` | Alterna activo/inactivo | ADMIN, SUPERVISOR |
| DELETE | `/api/warehouses/{id}` | Elimina si no tiene operaciones | ADMIN, SUPERVISOR |

**Error codes:**
- `WAREHOUSE_HAS_OPERATIONS` — 409 cuando se intenta eliminar un almacén con operaciones

## Frontend

### Lista de almacenes
- Toggle "Mostrar inactivos" (default: ocultos)
- Filas inactivas: grisadas + badge "Inactivo"
- Botón **Inactivar / Activar** por fila
- Botón **Eliminar** por fila (el backend rechaza con error si tiene operaciones)

### País de Origen
- Cambiar input de texto a `<select>` cargado desde `/api/ports/catalog/countries`
- Muestra nombre del país, envía código ISO

### i18n (ambos idiomas)
- `WAREHOUSES.INACTIVATE` / `WAREHOUSES.ACTIVATE`
- `WAREHOUSES.DELETE`
- `WAREHOUSES.SHOW_INACTIVE`
- `WAREHOUSES.INACTIVE_BADGE`
- `ERRORS.WAREHOUSE_HAS_OPERATIONS`
