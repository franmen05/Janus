# 📌 Etapa 2 -- Gestión y Seguimiento del Expediente Aduanal

## 🎯 Objetivo

Permitir que el agente aduanal o empresa importadora/exportadora pueda
dar seguimiento completo al expediente, actualizar estados manualmente y
visualizar el progreso de cada operación sin necesidad de un BPM formal.

------------------------------------------------------------------------

# 🧾 Historia de Usuario Principal

**Como** agente aduanal\
**Quiero** gestionar y actualizar el estado de cada expediente de
importación/exportación\
**Para** tener visibilidad clara del avance del trámite y mantener
informado al cliente.

------------------------------------------------------------------------

# 📚 Contexto

En la Etapa 1 se creó el expediente con datos básicos y documentos
iniciales.

En esta etapa el expediente evoluciona a través de distintas fases
operativas (validación, pago, despacho, liberación, etc.).

No se utilizará BPM, por lo que:

-   Los estados serán manejados por reglas simples.
-   El flujo será controlado por lógica de negocio.
-   Se evitarán automatismos complejos innecesarios.

------------------------------------------------------------------------

# 🔄 Estados del Expediente

1.  BORRADOR\
2.  DOCUMENTACIÓN COMPLETA\
3.  EN VALIDACIÓN\
4.  PAGO DE IMPUESTOS\
5.  EN DESPACHO\
6.  LIBERADO\
7.  CERRADO\
8.  CANCELADO

------------------------------------------------------------------------

# 📌 Historias de Usuario Derivadas

## 1️⃣ Cambio de Estado

**Como** agente aduanal\
**Quiero** cambiar el estado del expediente manualmente\
**Para** reflejar el avance real del trámite.

### Criterios de aceptación:

-   No se puede saltar estados sin permiso especial.
-   Se registra fecha y usuario que realizó el cambio.
-   El sistema guarda historial de estados.

------------------------------------------------------------------------

## 2️⃣ Historial del Expediente

**Como** agente aduanal\
**Quiero** ver el historial de cambios del expediente\
**Para** auditar el proceso en caso de revisión o conflicto.

### Criterios de aceptación:

-   Se muestra línea de tiempo.
-   Incluye usuario, fecha y comentario opcional.
-   No se puede editar el historial.

------------------------------------------------------------------------

## 3️⃣ Notificación al Cliente

**Como** empresa importadora/exportadora\
**Quiero** recibir notificación cuando cambie el estado del expediente\
**Para** estar informado del avance sin llamar al agente.

### Criterios de aceptación:

-   Envío de email automático.
-   Plantilla configurable.
-   Se registra que la notificación fue enviada.

------------------------------------------------------------------------

## 4️⃣ Visualización de Progreso

**Como** usuario del sistema\
**Quiero** ver un indicador visual del avance del expediente\
**Para** entender rápidamente en qué etapa está.

### Criterios de aceptación:

-   Barra de progreso basada en estados.
-   Indicador claro del estado actual.
-   Color diferenciado para cancelado o detenido.

------------------------------------------------------------------------

# 🏗 Reglas de Negocio

-   Un expediente en estado **CERRADO** o **CANCELADO** no puede
    modificarse.
-   No se puede eliminar un expediente con estados posteriores a
    **BORRADOR**.
-   Cada transición debe quedar auditada.
-   Los documentos pueden agregarse hasta el estado **EN DESPACHO**.

------------------------------------------------------------------------

# 📊 Resultado Esperado

Al finalizar esta etapa el sistema debe permitir:

-   Trazabilidad completa del expediente.
-   Control manual del flujo sin BPM.
-   Auditoría básica.
-   Comunicación automática con cliente.
-   Visualización clara del avance.
