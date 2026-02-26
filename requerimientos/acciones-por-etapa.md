# Acciones por Etapa de Operación

Documentación de referencia del flujo de operaciones aduaneras en Janus: estados, transiciones, acciones disponibles, reglas de compliance y permisos por rol.

---

## 1. Diagrama de Estados

```
DRAFT
  ├──→ DOCUMENTATION_COMPLETE
  │       ├──→ IN_REVIEW
  │       │       ├──→ PRELIQUIDATION_REVIEW
  │       │       │       ├──→ ANALYST_ASSIGNED
  │       │       │       │       └──→ DECLARATION_IN_PROGRESS
  │       │       │       │               └──→ SUBMITTED_TO_CUSTOMS
  │       │       │       │                       └──→ VALUATION_REVIEW
  │       │       │       │                               ├──→ PENDING_EXTERNAL_APPROVAL ──→ (vuelve a VALUATION_REVIEW)
  │       │       │       │                               └──→ PAYMENT_PREPARATION
  │       │       │       │                                       └──→ IN_TRANSIT
  │       │       │       │                                               └──→ CLOSED ✓
  │       │       │       └──→ PENDING_CORRECTION ──→ (vuelve a IN_REVIEW)
  │       │       └──→ PENDING_CORRECTION ──→ (vuelve a IN_REVIEW)
  │       └──→ CANCELLED ✗
  └──→ CANCELLED ✗

  * Todos los estados (excepto CLOSED y CANCELLED) pueden transicionar a CANCELLED
```

### Los 14 estados en orden

| # | Estado | Descripción |
|---|--------|-------------|
| 1 | `DRAFT` | Borrador inicial |
| 2 | `DOCUMENTATION_COMPLETE` | Documentación completa |
| 3 | `IN_REVIEW` | En revisión interna |
| 4 | `PENDING_CORRECTION` | Pendiente de corrección |
| 5 | `PRELIQUIDATION_REVIEW` | Revisión de preliquidación |
| 6 | `ANALYST_ASSIGNED` | Analista asignado |
| 7 | `DECLARATION_IN_PROGRESS` | Declaración en progreso |
| 8 | `SUBMITTED_TO_CUSTOMS` | Enviado a aduanas |
| 9 | `VALUATION_REVIEW` | Revisión de valoración |
| 10 | `PENDING_EXTERNAL_APPROVAL` | Aprobación externa pendiente |
| 11 | `PAYMENT_PREPARATION` | Preparación de pago |
| 12 | `IN_TRANSIT` | En tránsito |
| 13 | `CLOSED` | Cerrada (terminal) |
| 14 | `CANCELLED` | Cancelada (terminal) |

---

## 2. Transiciones Válidas

| Desde | Hacia |
|-------|-------|
| DRAFT | DOCUMENTATION_COMPLETE, CANCELLED |
| DOCUMENTATION_COMPLETE | IN_REVIEW, CANCELLED |
| IN_REVIEW | PRELIQUIDATION_REVIEW, PENDING_CORRECTION, CANCELLED |
| PENDING_CORRECTION | IN_REVIEW, CANCELLED |
| PRELIQUIDATION_REVIEW | ANALYST_ASSIGNED, PENDING_CORRECTION, CANCELLED |
| ANALYST_ASSIGNED | DECLARATION_IN_PROGRESS, CANCELLED |
| DECLARATION_IN_PROGRESS | SUBMITTED_TO_CUSTOMS, CANCELLED |
| SUBMITTED_TO_CUSTOMS | VALUATION_REVIEW, CANCELLED |
| VALUATION_REVIEW | PENDING_EXTERNAL_APPROVAL, PAYMENT_PREPARATION, CANCELLED |
| PENDING_EXTERNAL_APPROVAL | VALUATION_REVIEW, CANCELLED |
| PAYMENT_PREPARATION | IN_TRANSIT, CANCELLED |
| IN_TRANSIT | CLOSED, CANCELLED |
| CLOSED | _(sin transiciones)_ |
| CANCELLED | _(sin transiciones)_ |

---

## 3. Acciones por Etapa

### DRAFT

| Acción | Roles | Notas |
|--------|-------|-------|
| Crear operación | ADMIN, AGENT | Estado inicial. MARITIME+FCL requiere containerNumber; BL CONSOLIDATED requiere childBlNumber |
| Editar operación | ADMIN, AGENT | Todos los campos editables |
| Eliminar operación | ADMIN, AGENT | **Único estado que permite eliminar** |
| Subir documentos | ADMIN, AGENT | Cualquier tipo de documento |
| Eliminar documentos | ADMIN, AGENT | Soft delete |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver historial | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Cambiar estado → DOCUMENTATION_COMPLETE | ADMIN, AGENT | Requiere regla COMPLETENESS_REQUIRED |
| Cambiar estado → CANCELLED | ADMIN, AGENT | Sin validación de compliance |

**Regla de compliance para avanzar a DOCUMENTATION_COMPLETE:**
- `COMPLETENESS_REQUIRED` — Todos los documentos obligatorios para el modo de transporte deben estar presentes (por defecto: BL, COMMERCIAL_INVOICE, PACKING_LIST)
- `HIGH_VALUE_ADDITIONAL_DOC` — Operaciones MARITIME requieren un documento CERTIFICATE

---

### DOCUMENTATION_COMPLETE

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Cambiar BL Availability | ADMIN, AGENT | — |
| Cambiar estado → IN_REVIEW | ADMIN, AGENT | Sin reglas adicionales |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

---

### IN_REVIEW

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Registrar declaración preliminar | ADMIN, AGENT | — |
| Panel de revisión: avanzar a preliquidación | ADMIN, AGENT | Botón en UI |
| Panel de revisión: enviar a corrección | ADMIN, AGENT | Botón en UI |
| Cambiar estado → PRELIQUIDATION_REVIEW | ADMIN, AGENT | Requiere regla INTERNAL_REVIEW_COMPLETE |
| Cambiar estado → PENDING_CORRECTION | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Regla de compliance para avanzar a PRELIQUIDATION_REVIEW:**
- `INTERNAL_REVIEW_COMPLETE` — Completitud de documentos debe ser 100%
- `BL_ORIGINAL_NOT_AVAILABLE` — BL debe ser ORIGINAL o ENDORSED

---

### PENDING_CORRECTION

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/reemplazar documentos | ADMIN, AGENT | Para corregir observaciones |
| Eliminar documentos | ADMIN, AGENT | — |
| Panel de revisión: retornar a revisión | ADMIN, AGENT | Alerta "Awaiting correction" visible |
| Cambiar estado → IN_REVIEW | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

---

### PRELIQUIDATION_REVIEW

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Generar preliquidación | ADMIN, AGENT | Calcula CIF, base imponible, impuestos |
| Aprobar técnicamente declaración | ADMIN, AGENT | Se deshabilita si ya aprobada |
| **Aprobar final declaración** | **ADMIN solamente** | Requiere aprobación técnica previa. **Auto-transiciona a ANALYST_ASSIGNED** |
| Rechazar declaración | ADMIN, AGENT | Limpia todas las aprobaciones. **Auto-transiciona a PENDING_CORRECTION** |
| Enviar a corrección | ADMIN, AGENT | — |
| Cambiar estado → ANALYST_ASSIGNED | ADMIN, AGENT | Requiere regla PRELIQUIDATION_APPROVED |
| Cambiar estado → PENDING_CORRECTION | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Regla de compliance para avanzar a ANALYST_ASSIGNED:**
- `PRELIQUIDATION_APPROVED` — Debe existir al menos una declaración con aprobación técnica Y aprobación final (ADMIN)
- `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### ANALYST_ASSIGNED

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Trabajar en declaración | ADMIN, AGENT | — |
| Panel de revisión: proceder a declaración | ADMIN, AGENT | Botón en UI |
| Cambiar estado → DECLARATION_IN_PROGRESS | ADMIN, AGENT | Requiere COMMERCIAL_INVOICE_REQUIRED (para CATEGORY_1) |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Auto-asignación:** Si no hay agente asignado, el sistema asigna automáticamente al agente con menos carga.

**Regla de compliance para avanzar a DECLARATION_IN_PROGRESS:**
- `COMMERCIAL_INVOICE_REQUIRED` — Operaciones CATEGORY_1 requieren factura comercial con status VALIDATED
- `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### DECLARATION_IN_PROGRESS

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Registrar declaración final | ADMIN, AGENT | — |
| Editar declaración | ADMIN, AGENT | — |
| Agregar líneas arancelarias | ADMIN, AGENT | — |
| Ejecutar cruce (preliminar vs final) | ADMIN, AGENT | Compara declaraciones, genera resultado MATCH o DISCREPANCY |
| Resolver discrepancia de cruce | ADMIN, AGENT | Solo si estado es DISCREPANCY |
| Registrar DUA | ADMIN, AGENT | Asignar número de DUA |
| **Enviar a DGA** | ADMIN, AGENT | **Auto-transiciona a SUBMITTED_TO_CUSTOMS**. Notifica al cliente |
| Cambiar estado → SUBMITTED_TO_CUSTOMS | ADMIN, AGENT | Requiere BL_ORIGINAL_NOT_AVAILABLE |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Regla de compliance para avanzar a SUBMITTED_TO_CUSTOMS:**
- `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### SUBMITTED_TO_CUSTOMS

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| **Establecer tipo de inspección** | ADMIN, AGENT | EXPRESO, VISUAL, FISICA |
| Subir fotos de inspección | ADMIN, AGENT | Solo si tipo es VISUAL o FISICA (no EXPRESO) |
| Agregar gastos de inspección | ADMIN, AGENT | — |
| Editar/eliminar gastos | ADMIN, AGENT | — |
| Cambiar estado → VALUATION_REVIEW | ADMIN, AGENT | Requiere reglas de compliance |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Auto-transición:** Si tipo de inspección = EXPRESO → avanza automáticamente a VALUATION_REVIEW.

**Reglas de compliance para avanzar a VALUATION_REVIEW:**
- `INSPECTION_TYPE_REQUIRED` — Tipo de inspección debe estar definido
- `CROSSING_RESOLVED` — Discrepancias de cruce resueltas
- `BL_VERIFIED_FOR_VALUATION` — BL con status VALIDATED
- `PHYSICAL_INSPECTION_GATT` — Para CATEGORY_3: todos los documentos deben estar VALIDATED
- `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### VALUATION_REVIEW

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Ver checklist de valoración | ADMIN, AGENT, ACCOUNTING | 9 ítems de verificación |
| Completar formulario GATT Art. 1 | ADMIN, AGENT | Solo si inspección es VISUAL o FISICA |
| Crear permisos externos | ADMIN, AGENT | Auto-transiciona a PENDING_EXTERNAL_APPROVAL si hay permisos EN_TRAMITE |
| Editar/eliminar permisos | ADMIN, AGENT | — |
| Validar cargos locales | ADMIN, AGENT | Toggle de validación |
| Subir fotos de inspección | ADMIN, AGENT | Si tipo es VISUAL o FISICA |
| Agregar/editar/eliminar gastos | ADMIN, AGENT | — |
| **Finalizar valoración** | ADMIN, AGENT | **Auto-transiciona a PAYMENT_PREPARATION**. Requiere GATT completado si aplica |
| Cambiar estado → PENDING_EXTERNAL_APPROVAL | ADMIN, AGENT | — |
| Cambiar estado → PAYMENT_PREPARATION | ADMIN, AGENT | Requiere reglas de compliance |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Checklist de valoración (9 ítems):**
1. BL validado
2. Disponibilidad de BL confirmada (solo MARITIME)
3. Factura comercial presente
4. Valor FOB declarado
5. Incoterm definido
6. Packing list presente
7. GATT completado (si inspección VISUAL/FISICA)
8. Permisos externos resueltos
9. Cargos locales validados (si aplica)

**Reglas de compliance para avanzar a PAYMENT_PREPARATION:**
- `GATT_FORM_REQUIRED` — Formulario GATT completado (si inspección VISUAL/FISICA)
- `EXTERNAL_PERMITS_CLEARED` — Sin permisos en estado EN_TRAMITE
- `LOCAL_CHARGES_VALIDATED` — Cargos locales validados (si existe recibo)
- `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### PENDING_EXTERNAL_APPROVAL

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Actualizar permisos externos | ADMIN, AGENT | Cambiar estado de permisos |
| Eliminar permisos externos | ADMIN, AGENT | Auto-regresa a VALUATION_REVIEW si todos resueltos |
| Completar formulario GATT | ADMIN, AGENT | — |
| Validar cargos locales | ADMIN, AGENT | — |
| Cambiar estado → VALUATION_REVIEW | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Auto-transición:** Cuando todos los permisos dejan de estar EN_TRAMITE → regresa automáticamente a VALUATION_REVIEW.

---

### PAYMENT_PREPARATION

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Ver inspección (solo lectura) | ADMIN, AGENT, ACCOUNTING, CLIENT | Tab visible pero sin acciones de edición |
| Ver valoración (solo lectura) | ADMIN, AGENT, ACCOUNTING | — |
| Cambiar estado → IN_TRANSIT | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

---

### IN_TRANSIT

| Acción | Roles | Notas |
|--------|-------|-------|
| Editar operación | ADMIN, AGENT | — |
| Ver inspección (solo lectura) | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver valoración (solo lectura) | ADMIN, AGENT, ACCOUNTING | — |
| Cambiar estado → CLOSED | ADMIN, AGENT | Establece `closedAt` automáticamente |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

---

### CLOSED (Terminal)

| Acción | Roles | Notas |
|--------|-------|-------|
| Ver operación | ADMIN, AGENT, ACCOUNTING, CLIENT | Solo lectura |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver historial | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver inspección | ADMIN, AGENT, ACCOUNTING, CLIENT | Solo lectura |
| Ver valoración | ADMIN, AGENT, ACCOUNTING | Solo lectura |
| **No se puede editar, eliminar ni cambiar estado** | — | — |

---

### CANCELLED (Terminal)

| Acción | Roles | Notas |
|--------|-------|-------|
| Ver operación | ADMIN, AGENT, ACCOUNTING, CLIENT | Solo lectura |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver historial | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| **No se puede editar, eliminar ni cambiar estado** | — | Inspección y valoración no visibles en UI |

---

## 4. Permisos por Rol

### ADMIN — Acceso completo

- Crear, editar, eliminar operaciones
- Cambiar estado (todas las transiciones)
- Subir, descargar, eliminar documentos (ve documentos eliminados)
- Crear, editar, aprobar (técnica + final), rechazar declaraciones
- Registrar DUA, enviar a DGA
- Establecer tipo de inspección, subir fotos, gestionar gastos
- Gestionar permisos externos, formulario GATT, finalizar valoración
- **Ver tab de auditoría** (exclusivo)
- Ver historial completo

### AGENT — Gestión operativa

- Crear, editar, eliminar operaciones (mismas restricciones que ADMIN)
- Cambiar estado (todas las transiciones)
- Subir, descargar, eliminar documentos
- Crear, editar, aprobar (solo técnica), rechazar declaraciones
- **No puede aprobar final** (requiere ADMIN)
- Registrar DUA, enviar a DGA
- Establecer tipo de inspección, subir fotos, gestionar gastos
- Gestionar permisos externos, formulario GATT, finalizar valoración
- **No ve tab de auditoría**

### ACCOUNTING — Solo lectura ampliada

- Ver listado de operaciones
- Ver detalle de operación
- Descargar documentos
- Ver declaraciones (solo lectura)
- Ver gastos de inspección (solo lectura)
- Ver checklist de valoración, permisos, formulario GATT (solo lectura)
- Ver historial
- **No puede crear, editar, eliminar ni cambiar estado de nada**

### CLIENT — Solo lectura limitada

- Ver **sus propias operaciones** (filtrado por clientId)
- Descargar documentos
- Ver fotos de inspección
- Ver resultado de cruce
- Ver historial
- **No puede subir documentos**
- **No ve declaraciones, valoración ni auditoría**

### CARRIER — Acceso mínimo

- **No aparece en ningún @RolesAllowed de los endpoints principales**
- En frontend: solo ve tabs de Comentarios e Historial
- No puede descargar documentos
- No puede ver ningún detalle operativo

---

## 5. Transiciones Automáticas

Estas acciones disparan cambios de estado automáticos sin intervención manual:

| Acción | Estado actual | Transiciona a | Condición |
|--------|-------------|---------------|-----------|
| Aprobar final declaración | PRELIQUIDATION_REVIEW | ANALYST_ASSIGNED | — |
| Rechazar declaración | PRELIQUIDATION_REVIEW | PENDING_CORRECTION | — |
| Enviar a DGA | DECLARATION_IN_PROGRESS | SUBMITTED_TO_CUSTOMS | — |
| Establecer inspección EXPRESO | SUBMITTED_TO_CUSTOMS | VALUATION_REVIEW | Tipo = EXPRESO |
| Crear permiso EN_TRAMITE | VALUATION_REVIEW | PENDING_EXTERNAL_APPROVAL | Hay permisos bloqueantes |
| Resolver todos los permisos | PENDING_EXTERNAL_APPROVAL | VALUATION_REVIEW | No quedan permisos EN_TRAMITE |
| Finalizar valoración | VALUATION_REVIEW | PAYMENT_PREPARATION | Checklist completo |
| Cerrar operación | IN_TRANSIT → CLOSED | — | Establece `closedAt` automáticamente |
| Asignar analista | → ANALYST_ASSIGNED | — | Si no hay agente, asigna el de menor carga |

---

## 6. Reglas de Compliance

Resumen de todas las reglas que bloquean transiciones de estado:

| Regla | Aplica al transicionar a | Condición | Código de error |
|-------|--------------------------|-----------|-----------------|
| COMPLETENESS_REQUIRED | DOCUMENTATION_COMPLETE | Documentos obligatorios presentes (BL, factura, packing list) | `MISSING_DOC_[TIPO]` |
| HIGH_VALUE_ADDITIONAL_DOC | DOCUMENTATION_COMPLETE | Operaciones MARITIME requieren CERTIFICATE | `HIGH_VALUE_CERT_REQUIRED` |
| INTERNAL_REVIEW_COMPLETE | PRELIQUIDATION_REVIEW | Completitud de documentos = 100% | `INCOMPLETE_DOCS` |
| BL_ORIGINAL_NOT_AVAILABLE | PRELIQUIDATION_REVIEW → CLOSED | BL debe ser ORIGINAL o ENDORSED | `BL_ORIGINAL_NOT_AVAILABLE` |
| PRELIQUIDATION_APPROVED | ANALYST_ASSIGNED | Aprobación técnica + aprobación final ADMIN | `NO_DECLARATION`, `MISSING_TECHNICAL_APPROVAL`, `MISSING_FINAL_APPROVAL` |
| COMMERCIAL_INVOICE_REQUIRED | DECLARATION_IN_PROGRESS | CATEGORY_1: factura comercial VALIDATED | `INVOICE_NOT_VALIDATED` |
| INSPECTION_TYPE_REQUIRED | VALUATION_REVIEW | Tipo de inspección definido | `INSPECTION_TYPE_MISSING` |
| CROSSING_RESOLVED | VALUATION_REVIEW | Discrepancias de cruce resueltas | `CROSSING_UNRESOLVED` |
| BL_VERIFIED_FOR_VALUATION | VALUATION_REVIEW | BL con status VALIDATED | `BL_NOT_VALIDATED` |
| PHYSICAL_INSPECTION_GATT | VALUATION_REVIEW | CATEGORY_3: todos los documentos VALIDATED | `PHYSICAL_ALL_DOCS_VALIDATED` |
| GATT_FORM_REQUIRED | PAYMENT_PREPARATION | GATT completado si inspección VISUAL/FISICA | `GATT_FORM_INCOMPLETE` |
| EXTERNAL_PERMITS_CLEARED | PAYMENT_PREPARATION | Sin permisos EN_TRAMITE | `PERMITS_PENDING` |
| LOCAL_CHARGES_VALIDATED | PAYMENT_PREPARATION | Cargos locales validados (si aplica) | `LOCAL_CHARGES_NOT_VALIDATED` |

> **Nota:** La transición a CANCELLED **no ejecuta** validación de compliance.

---

## 7. Visibilidad de Tabs en Frontend

| Tab | Roles con acceso | Condición de estado |
|-----|-----------------|---------------------|
| Información | Todos | Siempre |
| Documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | Siempre (excepto CARRIER) |
| Declaraciones | ADMIN, AGENT, ACCOUNTING | Siempre |
| Comentarios | Todos | Siempre |
| Panel de revisión | ADMIN, AGENT | IN_REVIEW, PENDING_CORRECTION, PRELIQUIDATION_REVIEW, ANALYST_ASSIGNED |
| Inspección | ADMIN, AGENT, ACCOUNTING, CLIENT | SUBMITTED_TO_CUSTOMS → CLOSED (o si inspectionType definido) |
| Valoración | ADMIN, AGENT, ACCOUNTING | VALUATION_REVIEW → CLOSED |
| Historial | ADMIN, AGENT, ACCOUNTING, CLIENT | Siempre |
| Auditoría | **ADMIN solamente** | Siempre |

---

## 8. Estados que Permiten Subida de Documentos

Los siguientes estados permiten subir y eliminar documentos:

- DRAFT
- DOCUMENTATION_COMPLETE
- IN_REVIEW
- PENDING_CORRECTION
- PRELIQUIDATION_REVIEW
- ANALYST_ASSIGNED
- DECLARATION_IN_PROGRESS
- SUBMITTED_TO_CUSTOMS
- VALUATION_REVIEW
- PENDING_EXTERNAL_APPROVAL

**No permiten:** PAYMENT_PREPARATION, IN_TRANSIT, CLOSED, CANCELLED

---

*Generado: 2026-02-26*
*Fuente: código de janus-backend (Resources, Services, ComplianceRules) y janus-frontend (components)*
