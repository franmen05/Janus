# 📦 ETAPA 3 – Control, Trazabilidad y Cumplimiento

## 🎯 Objetivo

Implementar trazabilidad completa, auditoría legal, control documental versionado, validaciones automáticas, dashboard operativo y control granular de permisos.

---

# 🧩 ÉPICA 3.1 – Trazabilidad Completa del Expediente

---

## 📝 Historia 3.1.1 – Línea de Tiempo del Expediente

**Como** agente aduanal  
**Quiero** visualizar una línea de tiempo completa del expediente  
**Para** entender qué ocurrió, cuándo y quién lo realizó  

### ✅ Criterios de Aceptación

- Se muestra una línea de tiempo ordenada cronológicamente.
- Cada evento incluye:
  - Tipo de evento
  - Usuario responsable
  - Fecha y hora (UTC - Instant)
  - Estado anterior → nuevo estado (si aplica)
- Se registran al menos los siguientes eventos:
  - Creación de expediente
  - Cambio de estado
  - Carga de documento
  - Nueva versión de documento
  - Aprobación / Rechazo
  - Comentarios agregados
- No se permite modificar eventos históricos.
- Los eventos pueden filtrarse por tipo.

---

## 📝 Historia 3.1.2 – Bitácora Inmutable (Auditoría Legal)

**Como** administrador  
**Quiero** que todas las acciones críticas queden registradas  
**Para** cumplir con auditorías y requisitos legales  

### ✅ Criterios de Aceptación

- Toda acción crítica genera un registro automático en auditoría.
- Acciones auditables:
  - Cambio de estado
  - Eliminación lógica
  - Modificación de datos clave
  - Aprobación / Rechazo
  - Sustitución de documento
- El registro contiene:
  - Usuario
  - Fecha y hora
  - Acción realizada
  - Datos anteriores (snapshot)
  - Datos nuevos (snapshot)
- La bitácora:
  - No puede editarse
  - No puede eliminarse
  - Solo es accesible en modo lectura
- Debe estar indexada por expediente y fecha.

---

# 📄 ÉPICA 3.2 – Control Documental Avanzado

---

## 📝 Historia 3.2.1 – Versionado de Documentos

**Como** agente  
**Quiero** que cada nueva carga de documento genere una nueva versión  
**Para** mantener historial sin perder información  

### ✅ Criterios de Aceptación

- Un documento puede tener múltiples versiones.
- Solo una versión puede estar marcada como activa.
- Las versiones anteriores:
  - No pueden modificarse
  - Permanecen accesibles para consulta
- Cada versión muestra:
  - Número de versión
  - Fecha de carga
  - Usuario que la subió
  - Motivo del cambio
- El sistema conserva el historial completo.

---

## 📝 Historia 3.2.2 – Validación Automática de Documentación Requerida

**Como** sistema  
**Quiero** validar que todos los documentos obligatorios estén presentes  
**Para** evitar que el expediente avance incompleto  

### ✅ Criterios de Aceptación

- Cada tipo de trámite define su lista de documentos obligatorios.
- El sistema calcula porcentaje de completitud.
- Si falta un documento obligatorio:
  - Se muestra advertencia visual
  - Se bloquea el cambio a estado "En revisión"
- Se muestra listado de documentos faltantes.

---

# 🔎 ÉPICA 3.3 – Motor de Validaciones de Cumplimiento

---

## 📝 Historia 3.3.1 – Validaciones por Tipo de Trámite

**Como** agente  
**Quiero** que el sistema valide reglas automáticas  
**Para** reducir errores y rechazos  

### ✅ Criterios de Aceptación

- Las reglas dependen del tipo de trámite.
- Las validaciones se ejecutan antes de cambiar de estado.
- Si una regla falla:
  - Se bloquea el avance
  - Se muestra mensaje claro de error
- Ejemplos de reglas:
  - Régimen "Importación definitiva" requiere factura comercial.
  - Si valor declarado supera límite → documento adicional obligatorio.
  - País restringido → alerta obligatoria.
- Las reglas pueden configurarse sin recompilar el sistema.

---

# 📊 ÉPICA 3.4 – Dashboard Operativo

---

## 📝 Historia 3.4.1 – Dashboard Gerencial

**Como** gerente  
**Quiero** visualizar métricas operativas  
**Para** tomar decisiones estratégicas  

### ✅ Criterios de Aceptación

- Se muestran indicadores en tiempo real:
  - Expedientes por estado
  - Expedientes vencidos
  - Tiempo promedio por trámite
  - Tasa de rechazo
  - Productividad por usuario
- Permite filtrado por:
  - Fecha
  - Tipo de trámite
  - Usuario
- Los datos deben cargarse en menos de 3 segundos.
- Las consultas deben estar optimizadas.

---

# 🔐 ÉPICA 3.5 – Control de Permisos Granular

---

## 📝 Historia 3.5.1 – Gestión de Permisos por Rol

**Como** administrador  
**Quiero** definir permisos específicos por rol  
**Para** controlar acciones críticas  

### ✅ Criterios de Aceptación

- El sistema permite crear roles personalizados.
- Cada rol puede asignarse a múltiples usuarios.
- Los permisos incluyen:
  - Crear expediente
  - Editar expediente
  - Aprobar
  - Rechazar
  - Eliminar lógico
  - Ver auditoría
- Si un usuario no tiene permiso:
  - La acción no se muestra en UI
  - El backend bloquea la acción
- El sistema valida permisos en cada endpoint sensible.

---

# 🧠 ÉPICA 3.6 – Alertas Inteligentes

---

## 📝 Historia 3.6.1 – Alertas por Inactividad

**Como** sistema  
**Quiero** generar alertas automáticas  
**Para** evitar retrasos operativos  

### ✅ Criterios de Aceptación

- Si un expediente está en "En revisión" por más de 48 horas sin actividad:
  - Se genera alerta automática.
- Si la fecha límite está próxima (≤ 24h):
  - Se genera alerta preventiva.
- Las alertas:
  - Se muestran en dashboard
  - Pueden enviarse por email
- Cada alerta queda registrada en la bitácora.

---

# ✅ Resultado Esperado de la Etapa 3

- Trazabilidad completa
- Auditoría legal inmutable
- Control documental versionado
- Validaciones automáticas configurables
- Dashboard gerencial
- Seguridad basada en roles
- Sistema de alertas inteligentes