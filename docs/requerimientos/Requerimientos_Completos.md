# SISTEMA INTEGRAL DE GESTIÓN ADUANAL

## Documento Completo de Requerimientos Funcionales

Versión 1.0\
Nivel: Especificación Funcional Integral

------------------------------------------------------------------------

# 1. ARQUITECTURA GENERAL

## 1.1 Arquitectura Técnica

-   Aplicación Web (Cliente-Servidor).
-   Backend API REST.
-   Base de datos relacional (PostgreSQL recomendado).
-   Almacenamiento en nube (estructura por Cliente/Año/Operación).
-   Sistema de notificaciones automáticas (Email + APIs mensajería).
-   Control de acceso basado en roles (RBAC).
-   Registro completo de auditoría.

------------------------------------------------------------------------

# 2. MÓDULO PRINCIPAL -- GESTIÓN DE OPERACIONES

## 2.1 Entidad Operación

Campos mínimos: - id_operacion (UUID) - numero_referencia - cliente_id -
tipo_carga (FCL / LCL) - tipo_inspeccion (EXPRESO / VISUAL / FISICA) -
estado_etapa (1--7) - agente_responsable - fecha_creacion -
fecha_cierre - observaciones

## 2.2 Reglas Globales

-   No se puede avanzar de etapa sin cumplir validaciones.
-   Cada cambio de etapa genera auditoría.
-   Cada cambio de etapa genera notificación automática al cliente.

------------------------------------------------------------------------

# 3. ETAPA 1 -- RECEPCIÓN DE DOCUMENTOS

## Requerimientos:

-   Carga de PDF, JPG, PNG.
-   Clasificación obligatoria:
    -   BL
    -   Factura Comercial
    -   Packing List
    -   Certificados
    -   Otros

## Validaciones:

-   Documentos obligatorios requeridos.
-   Control de versiones.
-   Renombrado automático.
-   No se permite avance si falta documento obligatorio.
-   Indicador de completitud documental.
-   Auditoría completa.
-   Notificación automática al cliente.

------------------------------------------------------------------------

# 4. ETAPA 2 -- ELABORACIÓN DE DECLARACIÓN

## Requerimientos:

-   Registro de declaración preliminar.
-   Ingreso de partidas arancelarias.
-   Cálculo automático preliminar de impuestos.
-   Registro método de valoración GATT.
-   Bitácora de modificaciones.

------------------------------------------------------------------------

# 5. ETAPA 3 -- PRESENTACIÓN Y CRUCE CON ADUANA

## Requerimiento crítico:

-   Registrar declaración transmitida.
-   Registrar declaración final emitida por Aduana.
-   Ejecutar cruce automático entre ambas.

## Validaciones automáticas:

-   Diferencias en base imponible.
-   Diferencias en impuestos.
-   Diferencias en partidas.
-   Diferencias en valores FOB/CIF.

## Reglas:

-   Si existen diferencias:
    -   Generar alerta interna.
    -   Bloquear avance hasta validación manual.
-   Notificar automáticamente al cliente.

------------------------------------------------------------------------

# 6. ETAPA 4 -- VALORACIÓN Y REVALIDACIÓN

## Condiciones según inspección:

### EXPRESO:

-   Revalidación total documental.

### VISUAL / FÍSICA:

-   Aplicación obligatoria método GATT.

## Validaciones:

-   BL original verificado.
-   Factura correcta.
-   VUCE aprobado (si aplica).
-   Sin bloqueos en entidades privadas (DPH, DPW, FDA, PORTCOLLECT).
-   Registro cargos locales preliminares.

No se puede avanzar si existe impedimento.

------------------------------------------------------------------------

# 7. ETAPA 5 -- PREPARACIÓN DE PAGOS

## Debe incluir:

-   Impuestos aduaneros.
-   Fletes.
-   Almacenajes.
-   Demoras.
-   Cargos locales.
-   Factura de servicios propios.

## Reglas obligatorias:

-   Todas las facturas escaneadas.
-   Nombre codificado único.
-   Liquidación en cero si aplica.
-   Registro contable si empresa paga por terceros.
-   Integración automática de reembolsos en factura final.

------------------------------------------------------------------------

# 8. ETAPA 6 -- TRANSPORTE

## Selección de transportista:

-   Debe estar registrado y validado.
-   Envío automático de documentos.

## Seguimiento obligatorio:

-   Listo para ingreso.
-   Avances y contratiempos.
-   Salida del puerto.
-   ETA.
-   Fotos de descarga.
-   Geolocalización final.

### Condiciones FCL:

-   Imagen documento entrega.
-   Imagen retorno contenedor.

### Condiciones LCL:

-   Fotos + geolocalización cierran etapa automáticamente.

Tipo de carga definido exclusivamente por agentes internos.

------------------------------------------------------------------------

# 9. ETAPA 7 -- CIERRE Y CONTABILIDAD

## Validaciones finales:

-   Revalidar factura final.
-   Definir condición: Contado o Crédito.

## Integraciones:

-   Envío automático a sistema contable (QuickBooks / Odoo).
-   Archivo automático en nube:
    -   Cliente / Año / Operación.

## Resultado:

-   Estado final: CERRADO.
-   Fecha de cierre registrada.
-   Reporte final descargable.

------------------------------------------------------------------------

# 10. REQUERIMIENTOS TRANSVERSALES

## 10.1 Auditoría

-   Registro usuario.
-   Fecha y hora.
-   IP.
-   Acción realizada.
-   No editable.

## 10.2 Roles del Sistema

-   Administrador
-   Agente
-   Contabilidad
-   Cliente
-   Transportista

## 10.3 Notificaciones

-   Automáticas por cambio de etapa.
-   Plantillas configurables.
-   Registro envío exitoso/fallido.

## 10.4 Dashboard

-   Operaciones activas por etapa.
-   Operaciones bloqueadas.
-   Operaciones con alertas.

## 10.5 Reportes

-   Tiempo promedio por etapa.
-   Indicadores de eficiencia.
-   Incidencias por tipo.
-   Reportes exportables.

------------------------------------------------------------------------

# FIN DEL DOCUMENTO
