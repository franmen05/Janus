# Etapa 6: Coordinación de Despacho y Transporte

## Context

La operación en Janus ya atraviesa las etapas 1-5 (Documentación → Revisión → Declaración → Valoración → Pago). Al llegar a `PAYMENT_PREPARATION`, el siguiente paso es coordinar el transporte de la carga desde el puerto/almacén hasta el destino final. Actualmente solo existe el estado `IN_TRANSIT` con permisos básicos para que el CARRIER suba un recibo de recepción. Falta toda la infraestructura de: asignación de transportista, seguimiento en tiempo real, evidencia fotográfica, geolocalización, y cierre automático para LCL.

---

## Plan de Implementación

### Fase 1: Backend — Dominio y API

**Nuevo paquete:** `com.janus.dispatch`

#### 1.1 Modelos de dominio

| Archivo | Descripción |
|---------|-------------|
| `dispatch/domain/model/DispatchStatus.java` | Enum: `PENDING_ASSIGNMENT`, `ASSIGNED`, `READY_FOR_PICKUP`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED` |
| `dispatch/domain/model/DispatchEventType.java` | Enum: `CARRIER_ASSIGNED`, `READY_FOR_PICKUP`, `PROGRESS_UPDATE`, `DELAY_REPORTED`, `LEFT_PORT`, `ETA_UPDATE`, `DISCHARGE_PHOTO`, `DELIVERY_DOCUMENT`, `CONTAINER_RETURN_DOCUMENT`, `GEOLOCATION`, `DISPATCH_COMPLETED` |
| `dispatch/domain/model/Dispatch.java` | Entidad JPA: operation (ManyToOne), carrier (ManyToOne User), status, estimatedArrival, notes, completedAt, assignedBy, documentsShared |
| `dispatch/domain/model/DispatchEvent.java` | Entidad JPA: dispatch (ManyToOne), eventType, reportedBy, description, campos de foto (originalName, storedName, filePath, fileSize, mimeType), campos de geolocalización (latitude, longitude, locationDescription) |

#### 1.2 DTOs (Java records)

| DTO | Campos |
|-----|--------|
| `AssignCarrierRequest` | carrierId (Long, @NotNull) |
| `DispatchResponse` | id, operationId, operationRef, carrierId, carrierName, carrierEmail, status, estimatedArrival, notes, documentsShared, completedAt, assignedBy, timestamps |
| `DispatchEventResponse` | id, eventType, reportedBy, description, originalName, fileSize, mimeType, latitude, longitude, locationDescription, createdAt |
| `DispatchChecklistResponse` | items (List<ChecklistItem>), allPassed |
| `ShareDocumentsRequest` | documentIds (List<Long>), message (String?) |

#### 1.3 API Endpoints

```
GET    /api/operations/{operationId}/dispatch              → DispatchResponse
POST   /api/operations/{operationId}/dispatch              → 201 DispatchResponse
PATCH  /api/operations/{operationId}/dispatch/assign       → DispatchResponse
POST   /api/operations/{operationId}/dispatch/share-documents → 200
GET    /api/operations/{operationId}/dispatch/events       → List<DispatchEventResponse>
POST   /api/operations/{operationId}/dispatch/events       → 201 DispatchEventResponse (multipart)
GET    /api/operations/{operationId}/dispatch/events/{id}/download → binary
GET    /api/operations/{operationId}/dispatch/checklist    → DispatchChecklistResponse
POST   /api/operations/{operationId}/dispatch/finalize     → 200
```

#### 1.4 Lógica de negocio (DispatchService)

- **createDispatch**: Crea dispatch con `PENDING_ASSIGNMENT`. Operación debe estar en `PAYMENT_PREPARATION` o `IN_TRANSIT`.
- **assignCarrier**: Valida que el usuario tenga rol CARRIER. Cambia estado a `ASSIGNED`. Envía notificación por email.
- **shareDocuments**: Envía email al carrier con links de descarga de documentos seleccionados. Marca `documentsShared = true`.
- **submitEvent**: Crea DispatchEvent, almacena foto vía StorageService. Auto-transiciona DispatchStatus según eventType. Llama `checkLclAutoCompletion()`.
- **checkLclAutoCompletion**: Para LCL, si existen DISCHARGE_PHOTO + GEOLOCATION + RECEPTION_RECEIPT → auto-cierra dispatch y transiciona operación a CLOSED.
- **getChecklist**: Retorna items según CargoType (FCL requiere DELIVERY_DOCUMENT + CONTAINER_RETURN_DOCUMENT adicionales).
- **finalizeDispatch**: Cierre manual (principalmente FCL). Valida checklist, cierra dispatch, transiciona a CLOSED.

#### 1.5 Reglas de compliance

- `DISPATCH_REQUIRED_FOR_CLOSURE`: IN_TRANSIT → CLOSED requiere dispatch en estado COMPLETED.
- `FCL_DOCUMENTS_REQUIRED`: Para FCL, requiere eventos DELIVERY_DOCUMENT y CONTAINER_RETURN_DOCUMENT.

#### 1.6 Notificaciones

- Extender `NotificationService` con método `sendDocumentSharingNotification()` para enviar links de documentos al carrier por email.
- Diseñar interfaz `NotificationChannel` para futura extensión a WhatsApp/Telegram (solo implementar email por ahora).

#### 1.7 Seguridad del carrier

- El carrier solo puede ver/interactuar con dispatches donde esté asignado.
- Validación en `DispatchResource` con `SecurityHelper`.

---

### Fase 2: Frontend — Componentes Angular

#### 2.1 Modelos y servicio

| Archivo | Descripción |
|---------|-------------|
| `core/models/dispatch.model.ts` | Interfaces: Dispatch, DispatchEvent, DispatchChecklist. Enums: DispatchStatus, DispatchEventType |
| `core/services/dispatch.service.ts` | HttpClient service (patrón de valuation.service.ts) |

#### 2.2 Dispatch Panel Component

`features/operations/dispatch-panel/dispatch-panel.component.ts`

Secciones (acordeón Bootstrap, patrón de valuation-panel):

1. **Asignación de transportista** — Dropdown de usuarios CARRIER, botón asignar, info del carrier asignado, botón compartir documentos. Visible: ADMIN, AGENT.
2. **Timeline de transporte** — Lista cronológica de DispatchEvents con iconos, timestamps, descripciones, fotos descargables, links de mapa para geolocalizaciones. Visible: todos los roles.
3. **Envío de actualizaciones** — Formulario para carrier: selector de tipo de evento, descripción, upload de foto, botón de geolocalización (Browser Geolocation API). Visible: CARRIER (y ADMIN/AGENT).
4. **Checklist de despacho** — Items requeridos según FCL/LCL, indicadores verde/rojo. Visible: ADMIN, AGENT, ACCOUNTING.
5. **Finalizar despacho** — Botón de cierre manual, deshabilitado si checklist no pasa. Visible: ADMIN, AGENT (solo FCL o cuando auto-cierre LCL no se activó).

#### 2.3 Integración en operation-detail

- Agregar tab "Despacho" visible cuando operación está en `PAYMENT_PREPARATION`, `IN_TRANSIT`, o `CLOSED`.
- Visibilidad por rol según reglas existentes del wiki.

#### 2.4 i18n

Agregar claves en `en.json` y `es.json` para: TABS.DISPATCH, DISPATCH.*, DISPATCH_STATUS.*, DISPATCH_EVENT.*, COMPLIANCE.DISPATCH_*.

---

### Fase 3: Verificación

1. Backend: `cd janus-backend && ./gradlew test`
2. Frontend: `cd janus-frontend && npx ng build`
3. Verificar flujo completo: crear dispatch → asignar carrier → enviar documentos → carrier envía eventos → checklist → cierre (auto LCL / manual FCL)

---

## Secuencia de ejecución

1. **Backend Agent** → Fase 1 completa (dominio, API, compliance, notificaciones)
2. **Frontend Agent** → Fase 2 completa (modelos, servicio, componente, integración, i18n)
3. **Verificación** → Tests y build

## Archivos clave de referencia (patrones a seguir)

- `valuation/application/ValuationService.java` — Patrón para checklist y finalización
- `inspection/api/InspectionResource.java` — Patrón para upload multipart de fotos
- `valuation-panel.component.ts` — Patrón para componente con acordeón y secciones
- `compliance/domain/service/rules/ReceptionReceiptRequiredRule.java` — Patrón para reglas de compliance
- `notification/application/NotificationService.java` — Extensión para compartir documentos
