🏛️ Épica: Valoración Aduanera y Blindaje de la Declaración
Descripción: Como Gerente de Aduanas, quiero asegurar que el expediente cuente con todas las validaciones documentales, aprobaciones externas y la correcta aplicación del método de valoración GATT, para evitar contingencias fiscales y proceder con la liquidación de manera segura y trazable.

🏷️ Historias de Usuario
HU1: Verificación Documental Dinámica (BL y Factura)
Como Analista de Aduanas,
quiero visualizar un checklist documental adaptado al tipo de carga,
para verificar formalmente la estructura de la factura (FOB, Incoterm) y confirmar la existencia o endoso del BL original.

Criterios de Aceptación (BDD):

Escenario 1: Validación de BL marítimo.

Dado que el expediente corresponde a un flete marítimo,

Cuando el analista ingresa a la vista de validación,

Entonces el sistema debe exigir obligatoriamente la confirmación de "BL Original en físico" o "Endoso registrado".

Escenario 2: Cambio de estado.

Dado que falta al menos un documento obligatorio,

Cuando el analista guarda el progreso,

Entonces el estado del trámite debe mantenerse como "Documentación en revisión".

HU2: Gestión de Aprobaciones de Entidades Externas
Como Coordinador del Despacho,
quiero registrar el estado de los permisos de entidades reguladoras (VUCE, FDA, DPH) y los pagos de cargos locales,
para garantizar que no existan impedimentos de terceros para la liberación de la carga.

Criterios de Aceptación (BDD):

Escenario 1: Bloqueo por permisos externos.

Dado que la carga requiere aprobación de la FDA o VUCE,

Cuando el permiso se marca como "En trámite",

Entonces el sistema debe cambiar el estado a "Pendiente por aprobación externa" y deshabilitar el botón de "Completar Valoración".

Escenario 2: Registro de cargos locales.

Dado que el puerto (ej. DPW) generó cobros de almacenaje,

Cuando el usuario adjunta el comprobante,

Entonces el sistema debe habilitar una casilla de verificación de "Cargos Locales Validados".

HU3: Aplicación Obligatoria del Método de Valoración GATT
Como Analista de Aduanas,
quiero acceder al módulo de valoración del Artículo 1 del GATT,
para declarar vínculos comerciales, comisiones o gastos no facturados si la mercancía fue sujeta a inspección.

Criterios de Aceptación (BDD):

Escenario 1: Activación condicional del módulo GATT.

Dado que en la etapa anterior se registró una inspección "Física" o "Visual",

Cuando el usuario ingresa a la etapa de Valoración,

Entonces el formulario del Método GATT debe desplegarse como de llenado obligatorio.

Escenario 2: Ajustes de valor.

Dado que el analista detecta gastos de transporte no reflejados,

Cuando ingresa el monto en el campo "Ajustes al Valor de Transacción",

Entonces el sistema debe recalcular la base imponible y solicitar una justificación obligatoria.

HU4: Revalidación Integral y Trazabilidad de Auditoría
Como Auditor o Gerente,
quiero que el sistema exija una revisión final y registre cada acción realizada en esta etapa,
para asegurar la calidad de la declaración y mantener un historial de cara a las autoridades aduaneras.

Criterios de Aceptación (BDD):

Escenario 1: Cierre de etapa exitoso.

Dado que el checklist documental, los permisos externos y la valoración GATT (si aplica) están completos,

Cuando el analista hace clic en "Finalizar Valoración",

Entonces el estado cambia a "Valoración completada" y se abre la etapa de Liquidación.

Escenario 2: Trazabilidad de acciones.

Dado que un usuario modifica cualquier dato de la valoración o valida un documento,

Cuando se guarda el cambio,

Entonces el sistema debe crear un registro inmutable en el historial que contenga: Nombre del Usuario, Fecha/Hora exacta, Campo modificado, Valor anterior y Valor nuevo.