# Acciones por Etapa de Operación

Documentación de referencia del flujo de operaciones aduaneras en Janus: estados, transiciones, acciones disponibles, reglas de compliance y permisos por rol.

---

## 1\. Diagrama de Estados

```
DRAFT
  ├──→ DOCUMENTATION_COMPLETE
  │       ├──→ IN_REVIEW
  │       │       ├──→ PRELIQUIDATION_REVIEW (sub-estado de IN_REVIEW)
  │       │       │       ├──→ ANALYST_ASSIGNED (sub-estado de IN_REVIEW)
  │       │       │       │       └──→ DECLARATION_IN_PROGRESS
  │       │       │       │               └──→ SUBMITTED_TO_CUSTOMS
  │       │       │       │                       └──→ VALUATION_REVIEW
  │       │       │       │                               ├──→ PENDING_EXTERNAL_APPROVAL ──→ (vuelve a VALUATION_REVIEW)
  │       │       │       │                               └──→ PAYMENT_PREPARATION
  │       │       │       │                                       └──→ IN_TRANSIT
  │       │       │       │                                               └──→ CLOSED ✓
  │       │       │       ├──→ DECLARATION_IN_PROGRESS (directo, salta ANALYST_ASSIGNED)
  │       │       │       └──→ PENDING_CORRECTION ──→ (vuelve a IN_REVIEW)
  │       │       └──→ PENDING_CORRECTION ──→ (vuelve a IN_REVIEW)
  │       └──→ CANCELLED ✗
  └──→ CANCELLED ✗

  * Todos los estados (excepto CLOSED y CANCELLED) pueden transicionar a CANCELLED
```

### Los 14 estados en orden

| # | Estado | Etiqueta (ES) | Etiqueta (EN) | Paso en barra de progreso | Descripción |
| --- | --- | --- | --- | --- | --- |
| 1 | `DRAFT` | Borrador | Draft | **Borrador** | Borrador inicial |
| 2 | `DOCUMENTATION_COMPLETE` | Documentación Completa | Documentation Complete | **Docs** | Documentación completa |
| 3 | `IN_REVIEW` | En Revisión | In Review | **Revisión Interna** | En revisión interna |
| 4 | `PENDING_CORRECTION` | Pendiente de Corrección | Pending Correction | Revisión Interna _(sub-estado)_ | Pendiente de corrección |
| 5 | `PRELIQUIDATION_REVIEW` | Revisión de Preliquidación | Preliquidation Review | Revisión Interna _(sub-estado)_ | Revisión de preliquidación |
| 6 | `ANALYST_ASSIGNED` | Analista Asignado | Analyst Assigned | Revisión Interna _(sub-estado)_ | Analista asignado |
| 7 | `DECLARATION_IN_PROGRESS` | Declaración en Proceso | Declaration in Progress | **Declaración** | Declaración en progreso |
| 8 | `SUBMITTED_TO_CUSTOMS` | Presentado a Aduanas | Submitted to Customs | **Presentado** | Enviado a aduanas |
| 9 | `VALUATION_REVIEW` | Revisión de Valoración | Valuation Review | **Valoración** | Revisión de valoración |
| 10 | `PENDING_EXTERNAL_APPROVAL` | Pendiente Aprobación Externa | Pending External Approval | Valoración _(sub-estado)_ | Aprobación externa pendiente |
| 11 | `PAYMENT_PREPARATION` | Preparación de Pago | Payment Preparation | **Pago** | Preparación de pago |
| 12 | `IN_TRANSIT` | En Tránsito | In Transit | **Tránsito** | En tránsito |
| 13 | `CLOSED` | Cerrado | Closed | **Cerrado** | Cerrada (terminal) |
| 14 | `CANCELLED` | Cancelado | Cancelled | _(barra roja)_ | Cancelada (terminal) |

> **Nota:** La barra de progreso muestra 9 pasos visibles. Los estados 3-6 se agrupan bajo "Revisión Interna" y el estado 10 se agrupa bajo "Valoración", mostrando un badge con el sub-estado específico.

---

## 2\. Transiciones Válidas

| Desde | Hacia |
| --- | --- |
| DRAFT | DOCUMENTATION\_COMPLETE, CANCELLED |
| DOCUMENTATION\_COMPLETE | IN\_REVIEW, CANCELLED |
| IN\_REVIEW | PRELIQUIDATION\_REVIEW, PENDING\_CORRECTION, CANCELLED |
| PENDING\_CORRECTION | IN\_REVIEW, CANCELLED |
| PRELIQUIDATION\_REVIEW | ANALYST\_ASSIGNED, DECLARATION\_IN\_PROGRESS, PENDING\_CORRECTION, CANCELLED |
| ANALYST\_ASSIGNED | DECLARATION\_IN\_PROGRESS, CANCELLED |
| DECLARATION\_IN\_PROGRESS | SUBMITTED\_TO\_CUSTOMS, CANCELLED |
| SUBMITTED\_TO\_CUSTOMS | VALUATION\_REVIEW, CANCELLED |
| VALUATION\_REVIEW | PENDING\_EXTERNAL\_APPROVAL, PAYMENT\_PREPARATION, CANCELLED |
| PENDING\_EXTERNAL\_APPROVAL | VALUATION\_REVIEW, CANCELLED |
| PAYMENT\_PREPARATION | IN\_TRANSIT, CANCELLED |
| IN\_TRANSIT | CLOSED, CANCELLED |
| CLOSED | _(sin transiciones)_ |
| CANCELLED | _(sin transiciones)_ |

---

## 3\. Acciones por Etapa

### DRAFT

| Acción | Roles | Notas |
| --- | --- | --- |
| Crear operación | ADMIN, AGENT | Estado inicial. MARITIME+FCL requiere containerNumber; BL CONSOLIDATED requiere childBlNumber |
| Editar operación | ADMIN, AGENT | Todos los campos editables |
| Eliminar operación | ADMIN, AGENT | **Único estado que permite eliminar** |
| Subir documentos | ADMIN, AGENT | Cualquier tipo de documento |
| Eliminar documentos | ADMIN, AGENT | Soft delete |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver historial | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Cambiar estado → DOCUMENTATION\_COMPLETE | ADMIN, AGENT | Requiere regla COMPLETENESS\_REQUIRED |
| Cambiar estado → CANCELLED | ADMIN, AGENT | Sin validación de compliance |

**Regla de compliance para avanzar a DOCUMENTATION\_COMPLETE:**

*   `COMPLETENESS_REQUIRED` — Todos los documentos obligatorios para el modo de transporte deben estar presentes (por defecto: BL, COMMERCIAL\_INVOICE, PACKING\_LIST)
*   `HIGH_VALUE_ADDITIONAL_DOC` — Operaciones MARITIME requieren un documento CERTIFICATE

---

### DOCUMENTATION\_COMPLETE

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Cambiar BL Availability | ADMIN, AGENT | — |
| Cambiar estado → IN\_REVIEW | ADMIN, AGENT | Sin reglas adicionales |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

---

### IN\_REVIEW

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Registrar declaración preliminar | ADMIN, AGENT | — |
| Panel de revisión: avanzar a preliquidación | ADMIN, AGENT | Botón en UI |
| Panel de revisión: enviar a corrección | ADMIN, AGENT | Botón en UI |
| Cambiar estado → PRELIQUIDATION\_REVIEW | ADMIN, AGENT | Requiere regla INTERNAL\_REVIEW\_COMPLETE |
| Cambiar estado → PENDING\_CORRECTION | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Regla de compliance para avanzar a PRELIQUIDATION\_REVIEW:**

*   `INTERNAL_REVIEW_COMPLETE` — Completitud de documentos debe ser 100%
*   `BL_ORIGINAL_NOT_AVAILABLE` — BL debe ser ORIGINAL o ENDORSED

---

### PENDING\_CORRECTION

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/reemplazar documentos | ADMIN, AGENT | Para corregir observaciones |
| Eliminar documentos | ADMIN, AGENT | — |
| Panel de revisión: retornar a revisión | ADMIN, AGENT | Alerta "Awaiting correction" visible |
| Cambiar estado → IN\_REVIEW | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

---

### PRELIQUIDATION\_REVIEW

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Generar preliquidación | ADMIN, AGENT | Calcula CIF, base imponible, impuestos |
| Aprobar técnicamente declaración | ADMIN, AGENT | Se deshabilita si ya aprobada |
| Rechazar declaración | ADMIN, AGENT | Limpia todas las aprobaciones. **Auto-transiciona a PENDING\_CORRECTION** |
| Enviar a corrección | ADMIN, AGENT | — |
| Cambiar estado → ANALYST\_ASSIGNED | ADMIN, AGENT | Requiere regla PRELIQUIDATION\_APPROVED |
| Cambiar estado → DECLARATION\_IN\_PROGRESS | ADMIN, AGENT | Transición directa (salta ANALYST\_ASSIGNED) |
| Cambiar estado → PENDING\_CORRECTION | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Regla de compliance para avanzar a ANALYST\_ASSIGNED o DECLARATION\_IN\_PROGRESS:**

*   `PRELIQUIDATION_APPROVED` — Debe existir al menos una declaración con aprobación técnica
*   `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### ANALYST\_ASSIGNED

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Trabajar en declaración | ADMIN, AGENT | — |
| Panel de revisión: proceder a declaración | ADMIN, AGENT | Botón en UI |
| Cambiar estado → DECLARATION\_IN\_PROGRESS | ADMIN, AGENT | Requiere COMMERCIAL\_INVOICE\_REQUIRED (para CATEGORY\_1) |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Auto-asignación:** Si no hay agente asignado, el sistema asigna automáticamente al agente con menos carga.

**Regla de compliance para avanzar a DECLARATION\_IN\_PROGRESS:**

*   `COMMERCIAL_INVOICE_REQUIRED` — Operaciones CATEGORY\_1 requieren factura comercial con status VALIDATED
*   `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### DECLARATION\_IN\_PROGRESS

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Registrar declaración final | ADMIN, AGENT | — |
| Editar declaración | ADMIN, AGENT | — |
| Agregar líneas arancelarias | ADMIN, AGENT | — |
| Ejecutar cruce (preliminar vs final) | ADMIN, AGENT | Compara declaraciones, genera resultado MATCH o DISCREPANCY |
| Resolver discrepancia de cruce | ADMIN, AGENT | Solo si estado es DISCREPANCY |
| Registrar DUA | ADMIN, AGENT | Asignar número de DUA |
| **Aprobar final declaración** | **ADMIN, CLIENT** | Requiere aprobación técnica previa **y cruce aduanero aprobado** (MATCH o RESOLVED). **Auto-transiciona a SUBMITTED\_TO\_CUSTOMS** |
| **Enviar a DGA** | ADMIN, AGENT | **Auto-transiciona a SUBMITTED\_TO\_CUSTOMS**. Notifica al cliente |
| Cambiar estado → SUBMITTED\_TO\_CUSTOMS | ADMIN, AGENT | Requiere FINAL\_APPROVAL\_REQUIRED y BL\_ORIGINAL\_NOT\_AVAILABLE |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Prerequisitos para aprobar final declaración:**

*   Aprobación técnica existente (`TECHNICAL_APPROVAL_REQUIRED`)
*   Cruce aduanero completado con estado MATCH o RESOLVED (`CROSSING_NOT_APPROVED`)

**Reglas de compliance para avanzar a SUBMITTED\_TO\_CUSTOMS:**

*   `FINAL_APPROVAL_REQUIRED` — Aprobación final requerida
*   `DECLARATION_NUMBER_REQUIRED` — La declaración preliminar debe tener número de declaración asignado
*   `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### SUBMITTED\_TO\_CUSTOMS

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| **Establecer tipo de inspección** | ADMIN, AGENT | EXPRESO, VISUAL, FISICA |
| Subir fotos de inspección | ADMIN, AGENT | Solo si tipo es VISUAL o FISICA (no EXPRESO) |
| Agregar gastos de inspección | ADMIN, AGENT | — |
| Editar/eliminar gastos | ADMIN, AGENT | — |
| Cambiar estado → VALUATION\_REVIEW | ADMIN, AGENT | Requiere reglas de compliance |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Auto-transición:** Si tipo de inspección = EXPRESO → avanza automáticamente a VALUATION\_REVIEW.

**Reglas de compliance para avanzar a VALUATION\_REVIEW:**

*   `INSPECTION_TYPE_REQUIRED` — Tipo de inspección debe estar definido
*   `CROSSING_RESOLVED` — Discrepancias de cruce resueltas
*   `BL_VERIFIED_FOR_VALUATION` — BL con status VALIDATED
*   `PHYSICAL_INSPECTION_GATT` — Para CATEGORY\_3: todos los documentos deben estar VALIDATED
*   `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### VALUATION\_REVIEW

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Ver checklist de valoración | ADMIN, AGENT, ACCOUNTING | 9 ítems de verificación |
| Completar formulario GATT Art. 1 | ADMIN, AGENT | Solo si inspección es VISUAL o FISICA |
| Crear permisos externos | ADMIN, AGENT | Auto-transiciona a PENDING\_EXTERNAL\_APPROVAL si hay permisos EN\_TRAMITE |
| Editar/eliminar permisos | ADMIN, AGENT | — |
| Validar cargos locales | ADMIN, AGENT | Toggle de validación |
| Subir fotos de inspección | ADMIN, AGENT | Si tipo es VISUAL o FISICA |
| Agregar/editar/eliminar gastos | ADMIN, AGENT | — |
| **Finalizar valoración** | ADMIN, AGENT | **Auto-transiciona a PAYMENT\_PREPARATION**. Requiere GATT completado si aplica |
| Cambiar estado → PENDING\_EXTERNAL\_APPROVAL | ADMIN, AGENT | — |
| Cambiar estado → PAYMENT\_PREPARATION | ADMIN, AGENT | Requiere reglas de compliance |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Checklist de valoración (9 ítems):**

1.  BL validado
2.  Disponibilidad de BL confirmada (solo MARITIME)
3.  Factura comercial presente
4.  Valor FOB declarado
5.  Incoterm definido
6.  Packing list presente
7.  GATT completado (si inspección VISUAL/FISICA)
8.  Permisos externos resueltos
9.  Cargos locales validados (si aplica)

**Reglas de compliance para avanzar a PAYMENT\_PREPARATION:**

*   `CROSSING_RESOLVED` — El cruce debe haberse realizado y las discrepancias resueltas
*   `GATT_FORM_REQUIRED` — Formulario GATT completado (si inspección VISUAL/FISICA)
*   `EXTERNAL_PERMITS_CLEARED` — Sin permisos en estado EN\_TRAMITE
*   `LOCAL_CHARGES_VALIDATED` — Cargos locales validados (si existe recibo)
*   `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### PENDING\_EXTERNAL\_APPROVAL

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Subir/eliminar documentos | ADMIN, AGENT | — |
| Actualizar permisos externos | ADMIN, AGENT | Cambiar estado de permisos |
| Eliminar permisos externos | ADMIN, AGENT | Auto-regresa a VALUATION\_REVIEW si todos resueltos |
| Completar formulario GATT | ADMIN, AGENT | — |
| Validar cargos locales | ADMIN, AGENT | — |
| Cambiar estado → VALUATION\_REVIEW | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Auto-transición:** Cuando todos los permisos dejan de estar EN\_TRAMITE → regresa automáticamente a VALUATION\_REVIEW.

---

### PAYMENT\_PREPARATION

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Ver inspección (solo lectura) | ADMIN, AGENT, ACCOUNTING, CLIENT | Tab visible pero sin acciones de edición |
| Ver valoración (solo lectura) | ADMIN, AGENT, ACCOUNTING | — |
| Cambiar estado → IN\_TRANSIT | ADMIN, AGENT | — |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

---

### IN\_TRANSIT

| Acción | Roles | Notas |
| --- | --- | --- |
| Editar operación | ADMIN, AGENT | — |
| Ver inspección (solo lectura) | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver valoración (solo lectura) | ADMIN, AGENT, ACCOUNTING | — |
| **Subir comprobante de recepción** | ADMIN, AGENT, CARRIER | Tab Recepción visible. Tipo de documento: RECEPTION\_RECEIPT |
| Descargar comprobante de recepción | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Cambiar estado → CLOSED | ADMIN, AGENT | Establece `closedAt` automáticamente. Requiere regla `RECEPTION_RECEIPT_REQUIRED` |
| Cambiar estado → CANCELLED | ADMIN, AGENT | — |

**Regla de compliance para avanzar a CLOSED:**

*   `RECEPTION_RECEIPT_REQUIRED` — Debe existir un comprobante de recepción subido
*   `BL_ORIGINAL_NOT_AVAILABLE` — BL disponible

---

### CLOSED (Terminal)

| Acción | Roles | Notas |
| --- | --- | --- |
| Ver operación | ADMIN, AGENT, ACCOUNTING, CLIENT | Solo lectura |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver historial | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver inspección | ADMIN, AGENT, ACCOUNTING, CLIENT | Solo lectura |
| Ver valoración | ADMIN, AGENT, ACCOUNTING | Solo lectura |
| Ver recepción | ADMIN, AGENT, CARRIER | Solo lectura (no se puede subir) |
| **No se puede editar, eliminar ni cambiar estado** | — | — |

---

### CANCELLED (Terminal)

| Acción | Roles | Notas |
| --- | --- | --- |
| Ver operación | ADMIN, AGENT, ACCOUNTING, CLIENT | Solo lectura |
| Descargar documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| Ver historial | ADMIN, AGENT, ACCOUNTING, CLIENT | — |
| **No se puede editar, eliminar ni cambiar estado** | — | Inspección y valoración no visibles en UI |

---

## 4\. Permisos por Rol

### ADMIN — Acceso completo

*   Crear, editar, eliminar operaciones
*   Cambiar estado (todas las transiciones)
*   Subir, descargar, eliminar documentos (ve documentos eliminados)
*   Crear, editar, aprobar (técnica + final), rechazar declaraciones
*   Registrar DUA, enviar a DGA
*   Establecer tipo de inspección, subir fotos, gestionar gastos
*   Gestionar permisos externos, formulario GATT, finalizar valoración
*   **Ver tab de auditoría** (exclusivo)
*   Ver historial completo

### AGENT — Gestión operativa

*   Crear, editar, eliminar operaciones (mismas restricciones que ADMIN)
*   Cambiar estado (todas las transiciones)
*   Subir, descargar, eliminar documentos
*   Crear, editar, aprobar (solo técnica), rechazar declaraciones
*   **No puede aprobar final** (requiere ADMIN o CLIENT)
*   Registrar DUA, enviar a DGA
*   Establecer tipo de inspección, subir fotos, gestionar gastos
*   Gestionar permisos externos, formulario GATT, finalizar valoración
*   **No ve tab de auditoría**

### ACCOUNTING — Solo lectura ampliada

*   Ver listado de operaciones
*   Ver detalle de operación
*   Descargar documentos
*   Ver declaraciones (solo lectura)
*   Ver gastos de inspección (solo lectura)
*   Ver checklist de valoración, permisos, formulario GATT (solo lectura)
*   Ver historial
*   **No puede crear, editar, eliminar ni cambiar estado de nada**

### CLIENT — Solo lectura limitada + aprobación final

*   Ver **sus propias operaciones** (filtrado por clientId)
*   Descargar documentos
*   Ver fotos de inspección
*   Ver declaraciones y resultado de cruce
*   **Aprobar final declaración** (en estado DECLARATION\_IN\_PROGRESS, requiere cruce aprobado)
*   Ver historial
*   **No puede subir documentos**
*   **No ve valoración ni auditoría**

### CARRIER — Transporte y recepción

*   Ver detalle de operación (`GET /api/operations/{id}`)
*   Cambiar estado de operación (transiciones permitidas)
*   Ver transiciones permitidas
*   **Subir comprobante de recepción** (RECEPTION\_RECEIPT en estado IN\_TRANSIT)
*   En frontend: ve tabs de Info, Comentarios, Historial y **Recepción** (en IN\_TRANSIT/CLOSED)
*   **No ve tabs de Documentos, Declaraciones, Valoración ni Auditoría**

---

## 5\. Transiciones Automáticas

Estas acciones disparan cambios de estado automáticos sin intervención manual:

| Acción | Estado actual | Transiciona a | Condición |
| --- | --- | --- | --- |
| Aprobar final declaración | DECLARATION\_IN\_PROGRESS | SUBMITTED\_TO\_CUSTOMS | Requiere cruce aprobado (MATCH/RESOLVED) |
| Rechazar declaración | PRELIQUIDATION\_REVIEW | PENDING\_CORRECTION | — |
| Enviar a DGA | DECLARATION\_IN\_PROGRESS | SUBMITTED\_TO\_CUSTOMS | — |
| Establecer inspección EXPRESO | SUBMITTED\_TO\_CUSTOMS | VALUATION\_REVIEW | Tipo = EXPRESO |
| Crear permiso EN\_TRAMITE | VALUATION\_REVIEW | PENDING\_EXTERNAL\_APPROVAL | Hay permisos bloqueantes |
| Resolver todos los permisos | PENDING\_EXTERNAL\_APPROVAL | VALUATION\_REVIEW | No quedan permisos EN\_TRAMITE |
| Finalizar valoración | VALUATION\_REVIEW | PAYMENT\_PREPARATION | Checklist completo |
| Cerrar operación | IN\_TRANSIT → CLOSED | — | Establece `closedAt` automáticamente |
| Asignar analista | → ANALYST\_ASSIGNED | — | Si no hay agente, asigna el de menor carga |

---

## 6\. Reglas de Compliance

Resumen de todas las reglas que bloquean transiciones de estado:

| Regla | Aplica al transicionar a | Condición | Código de error |
| --- | --- | --- | --- |
| COMPLETENESS\_REQUIRED | DOCUMENTATION\_COMPLETE | Documentos obligatorios presentes (BL, factura, packing list) | `MISSING_DOC_[TIPO]` |
| HIGH\_VALUE\_ADDITIONAL\_DOC | DOCUMENTATION\_COMPLETE | Operaciones MARITIME requieren CERTIFICATE | `HIGH_VALUE_CERT_REQUIRED` |
| INTERNAL\_REVIEW\_COMPLETE | PRELIQUIDATION\_REVIEW | Completitud de documentos = 100% | `INCOMPLETE_DOCS` |
| BL\_ORIGINAL\_NOT\_AVAILABLE | PAYMENT\_PREPARATION, IN\_TRANSIT, CLOSED | BL debe ser ORIGINAL o ENDORSED | `BL_ORIGINAL_NOT_AVAILABLE` |
| PRELIQUIDATION\_APPROVED | ANALYST\_ASSIGNED | Aprobación técnica | `NO_DECLARATION`, `MISSING_TECHNICAL_APPROVAL` |
| FINAL\_APPROVAL\_REQUIRED | SUBMITTED\_TO\_CUSTOMS | Aprobación final (ADMIN o CLIENT) | `MISSING_FINAL_APPROVAL` |
| DECLARATION\_NUMBER\_REQUIRED | SUBMITTED\_TO\_CUSTOMS | Declaración preliminar con número asignado | `DECLARATION_NUMBER_MISSING` |
| COMMERCIAL\_INVOICE\_REQUIRED | DECLARATION\_IN\_PROGRESS | CATEGORY\_1: factura comercial VALIDATED | `INVOICE_NOT_VALIDATED` |
| INSPECTION\_TYPE\_REQUIRED | VALUATION\_REVIEW | Tipo de inspección definido | `INSPECTION_TYPE_MISSING` |
| CROSSING\_RESOLVED | PAYMENT\_PREPARATION, VALUATION\_REVIEW | Cruce realizado y discrepancias resueltas | `CROSSING_NOT_PERFORMED`, `CROSSING_UNRESOLVED` |
| BL\_VERIFIED\_FOR\_VALUATION | VALUATION\_REVIEW | BL con status VALIDATED | `BL_NOT_VALIDATED` |
| PHYSICAL\_INSPECTION\_GATT | VALUATION\_REVIEW | CATEGORY\_3: todos los documentos VALIDATED | `PHYSICAL_ALL_DOCS_VALIDATED` |
| GATT\_FORM\_REQUIRED | PAYMENT\_PREPARATION | GATT completado si inspección VISUAL/FISICA | `GATT_FORM_INCOMPLETE` |
| EXTERNAL\_PERMITS\_CLEARED | PAYMENT\_PREPARATION | Sin permisos EN\_TRAMITE | `PERMITS_PENDING` |
| LOCAL\_CHARGES\_VALIDATED | PAYMENT\_PREPARATION | Cargos locales validados (si aplica) | `LOCAL_CHARGES_NOT_VALIDATED` |
| RECEPTION\_RECEIPT\_REQUIRED | CLOSED | Comprobante de recepción subido | `RECEPTION_RECEIPT_REQUIRED` |

> **Nota:** La transición a CANCELLED **no ejecuta** validación de compliance.

---

## 7\. Visibilidad de Tabs en Frontend

| Tab | Roles con acceso | Condición de estado |
| --- | --- | --- |
| Información | Todos | Siempre |
| Documentos | ADMIN, AGENT, ACCOUNTING, CLIENT | Siempre (excepto CARRIER) |
| Declaraciones | ADMIN, AGENT, ACCOUNTING, CLIENT | Siempre |
| Comentarios | Todos | Siempre |
| Panel de revisión | ADMIN, AGENT (+ CLIENT en DECLARATION\_IN\_PROGRESS) | IN\_REVIEW, PENDING\_CORRECTION, PRELIQUIDATION\_REVIEW, ANALYST\_ASSIGNED, DECLARATION\_IN\_PROGRESS |
| Inspección | Todos (sin restricción de rol) | SUBMITTED\_TO\_CUSTOMS → CLOSED (o si inspectionType definido) |
| Valoración | Todos (sin restricción de rol) | VALUATION\_REVIEW → CLOSED |
| Recepción | ADMIN, AGENT, CARRIER | IN\_TRANSIT, CLOSED |
| Historial | Todos | Siempre |
| Auditoría | **ADMIN solamente** | Siempre |

---

## 8\. Estados que Permiten Subida de Documentos

Los siguientes estados permiten subir y eliminar documentos:

*   DRAFT
*   DOCUMENTATION\_COMPLETE
*   IN\_REVIEW
*   PENDING\_CORRECTION
*   PRELIQUIDATION\_REVIEW
*   ANALYST\_ASSIGNED
*   DECLARATION\_IN\_PROGRESS
*   SUBMITTED\_TO\_CUSTOMS
*   VALUATION\_REVIEW
*   PENDING\_EXTERNAL\_APPROVAL

**No permiten:** PAYMENT\_PREPARATION, IN\_TRANSIT, CLOSED, CANCELLED

**Excepción:** CARRIER puede subir RECEPTION\_RECEIPT en estado IN\_TRANSIT (vía tab Recepción)

---

_Actualizado: 2026-03-12_  
_Fuente: código de janus-backend (Resources, Services, ComplianceRules) y janus-frontend (components)_