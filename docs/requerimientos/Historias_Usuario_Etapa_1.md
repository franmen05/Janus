# ÉPICA: ETAPA 1 -- RECEPCIÓN Y VALIDACIÓN DOCUMENTAL

**Objetivo de la etapa:**\
Garantizar que la operación cuente con toda la documentación
obligatoria, validada y correctamente clasificada antes de continuar a
la declaración aduanera.

------------------------------------------------------------------------

# HU-01 -- Crear carpeta documental de operación

**Como** Sistema\
**Quiero** crear automáticamente una carpeta documental al generar una
operación\
**Para** organizar todos los archivos relacionados

## Criterios de Aceptación:

-   Al crear una operación se genera estructura:
    -   /Cliente/Año/Operación/Etapa1
-   Se asigna ID único de operación.
-   La carpeta queda asociada a la base de datos.
-   Se registra en auditoría.

## Reglas de Negocio:

-   No se pueden cargar documentos sin operación creada.
-   Cada operación tiene su propio repositorio aislado.

------------------------------------------------------------------------

# HU-02 -- Cargar documento clasificado

**Como** Agente\
**Quiero** cargar documentos digitales clasificados por tipo\
**Para** mantener orden y facilitar validaciones posteriores

## Criterios de Aceptación:

-   Permite formatos: PDF, JPG, PNG.
-   Campo obligatorio: Tipo de documento.
-   Tipos preconfigurados:
    -   BL
    -   Factura Comercial
    -   Packing List
    -   Certificados
    -   Otros
-   Permite múltiples documentos por tipo.
-   El sistema valida tamaño máximo permitido.
-   El sistema renombra automáticamente el archivo:
    -   IDOperacion_TipoDocumento_Version_Fecha.ext

## Reglas:

-   No se permite documento sin clasificación.
-   No se permite sobrescribir versión anterior (se versiona).

------------------------------------------------------------------------

# HU-03 -- Control de Versiones Documentales

**Como** Sistema\
**Quiero** mantener historial de versiones de cada documento\
**Para** asegurar trazabilidad y evitar pérdida de información

## Criterios:

-   Cada nueva carga del mismo tipo crea versión incremental.
-   Se mantiene acceso a versiones anteriores.
-   Se registra usuario y fecha de carga.
-   No se permite eliminación definitiva (solo inactivación lógica).

------------------------------------------------------------------------

# HU-04 -- Validación de Documentos Obligatorios

**Como** Sistema\
**Quiero** validar que estén cargados todos los documentos obligatorios\
**Para** permitir el avance a la siguiente etapa

## Documentos obligatorios mínimos:

-   BL
-   Factura Comercial
-   Packing List

## Criterios:

-   Si falta alguno, la operación queda en estado: → "Pendiente
    Documentación"
-   Se muestra indicador visual en dashboard.
-   El botón "Avanzar Etapa" permanece bloqueado.
-   El sistema indica específicamente qué documento falta.

------------------------------------------------------------------------

# HU-05 -- Validación básica automática de documentos

**Como** Sistema\
**Quiero** ejecutar validaciones básicas automáticas\
**Para** reducir errores humanos

## Validaciones automáticas:

-   Archivo no corrupto.
-   Archivo legible.
-   Peso del archivo dentro del rango permitido.
-   Coincidencia entre nombre cargado y tipo seleccionado.
-   Fecha del documento válida (no futura).

## Resultado:

-   Documento queda en estado:
    -   VALIDADO
    -   OBSERVADO
    -   REQUIERE REEMPLAZO

------------------------------------------------------------------------

# HU-06 -- Notificación de Recepción Documental

**Como** Cliente\
**Quiero** recibir notificación cuando mi documentación fue recibida\
**Para** confirmar que el proceso inició correctamente

## Criterios:

-   Envío automático por email.
-   Plantilla configurable.
-   Indica:
    -   Número de operación.
    -   Fecha de recepción.
    -   Estado actual.
-   Registro de envío exitoso o fallido.

------------------------------------------------------------------------

# HU-07 -- Indicador de Completitud Documental

**Como** Agente\
**Quiero** visualizar un porcentaje de completitud documental\
**Para** saber cuándo puedo avanzar

## Criterios:

-   Barra de progreso (%).
-   Indicador verde si está 100%.
-   Indicador amarillo si faltan opcionales.
-   Indicador rojo si faltan obligatorios.

------------------------------------------------------------------------

# HU-08 -- Restricción de Edición por Rol

**Como** Administrador\
**Quiero** controlar quién puede cargar, editar o visualizar documentos\
**Para** proteger información sensible

## Criterios:

-   Agente: puede cargar y editar.
-   Cliente: solo visualización.
-   Transportista: sin acceso.
-   Contabilidad: solo lectura.
-   Administrador: control total.

------------------------------------------------------------------------

# HU-09 -- Auditoría de Documentos

**Como** Sistema\
**Quiero** registrar cada acción documental\
**Para** mantener trazabilidad completa

## Se registra:

-   Usuario
-   Fecha
-   IP
-   Acción (carga, edición, visualización)
-   Versión afectada

------------------------------------------------------------------------

# HU-10 -- Bloqueo Automático de Etapa

**Como** Sistema\
**Quiero** impedir el avance si no se cumplen validaciones\
**Para** evitar errores en etapas posteriores

## Condiciones de bloqueo:

-   Documento obligatorio faltante.
-   Documento obligatorio en estado "Observado".
-   Validación automática fallida.

------------------------------------------------------------------------

# Resultado Esperado de Etapa 1

Al finalizar Etapa 1: - Todos los documentos obligatorios están
cargados. - Versiones controladas. - Validaciones básicas aprobadas. -
Cliente notificado. - Operación lista para Etapa 2.
