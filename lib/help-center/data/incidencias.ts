import type { HelpArticle } from '../types';

export const incidenciasArticles: HelpArticle[] = [
  {
    id: 'inc-001',
    slug: 'gestionar-solucionar-incidencia',
    title: 'Cómo gestionar y solucionar una incidencia',
    excerpt:
      'Guía paso a paso para gestionar y resolver incidencias de mantenimiento desde la creación hasta el cierre.',
    content: `## Flujo completo de una incidencia

Una incidencia pasa por varias etapas: **creada**, **asignada**, **en curso**, **resuelta** y **cerrada**.

## Pasos para gestionar una incidencia

1. **Recibir la incidencia**: Revisa el reporte del inquilino o la solicitud interna.
2. **Clasificar**: Asigna categoría (fontanería, electricidad, etc.) y nivel de urgencia.
3. **Asignar proveedor**: Selecciona un proveedor disponible o crea una orden de trabajo.
4. **Seguimiento**: Mantén comunicación con el inquilino y el proveedor.
5. **Verificar resolución**: Confirma que el trabajo se ha completado correctamente.
6. **Cerrar**: Cierra la incidencia y archiva la documentación.

## Consejos

- Usa la **clasificación IA** para categorizar automáticamente.
- Documenta con fotos antes y después.
- Genera el parte de incidencia para firma del inquilino.`,
    collection: 'incidencias',
    tags: ['incidencias', 'mantenimiento', 'gestión'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['inc-002', 'inc-003', 'inc-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'inc-002',
    slug: 'reporte-inquilino-incidencia',
    title: 'Cómo reporta un inquilino una incidencia',
    excerpt:
      'Proceso para que los inquilinos reporten incidencias desde el portal o la app.',
    content: `## Acceso al reporte

Los inquilinos pueden reportar incidencias desde:
- **Portal del inquilino**: Sección "Incidencias" → "Nueva incidencia"
- **App móvil**: Menú principal → Reportar incidencia

## Datos que debe incluir el reporte

- **Descripción**: Qué ocurre y dónde.
- **Ubicación**: Habitación o zona afectada.
- **Fotos**: Recomendado adjuntar imágenes del problema.
- **Urgencia**: El inquilino puede indicar si es urgente.

## Flujo del reporte

1. El inquilino completa el formulario.
2. Recibe confirmación por email.
3. La incidencia aparece en tu panel de gestión.
4. El inquilino recibe actualizaciones por email y en el portal.

**Consejo**: Activa notificaciones push para que los inquilinos reciban avisos en tiempo real.`,
    collection: 'incidencias',
    tags: ['incidencias', 'inquilinos', 'portal'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['inc-001', 'inc-003', 'por-003'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'inc-003',
    slug: 'asignar-incidencias-proveedores',
    title: 'Asignar incidencias a proveedores',
    excerpt:
      'Cómo asignar órdenes de trabajo a proveedores y gestionar su ejecución.',
    content: `## Asignación de proveedores

Desde el detalle de una incidencia puedes:
1. **Buscar proveedores**: Filtra por categoría, zona y disponibilidad.
2. **Enviar solicitud**: El proveedor recibe la orden en su portal.
3. **Gestionar presupuestos**: Recibe y aprueba presupuestos.
4. **Seguimiento**: Consulta el estado en tiempo real.

## Portal del proveedor

Los proveedores acceden a sus órdenes en el **Portal del proveedor**, donde pueden:
- Ver detalles de la incidencia
- Aceptar o rechazar
- Enviar presupuestos
- Marcar como completada

## Mejores prácticas

- Mantén una **lista de proveedores preferidos** por categoría.
- Usa la **valoración** de trabajos anteriores para elegir.
- Define **SLAs** para tiempos de respuesta esperados.`,
    collection: 'incidencias',
    tags: ['incidencias', 'proveedores', 'órdenes de trabajo'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['inc-001', 'inc-004', 'por-007'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'inc-004',
    slug: 'gastos-repercutibles',
    title: 'Cobrar gastos repercutibles de incidencias',
    excerpt:
      'Cómo repercutir al inquilino los gastos de mantenimiento que le corresponden.',
    content: `## ¿Qué son los gastos repercutibles?

Son aquellos causados por el **mal uso** o **negligencia** del inquilino (ej. atascos por vertidos incorrectos, daños por mascotas).

## Proceso de repercusión

1. **Identificar responsabilidad**: Documenta que el daño es imputable al inquilino.
2. **Obtener presupuesto**: Solicita presupuesto al proveedor.
3. **Comunicar al inquilino**: Envía el importe y la justificación.
4. **Generar recibo**: Crea un recibo de repercusión en la sección de pagos.
5. **Cobro**: El inquilino puede pagar desde su portal o por transferencia.

## Documentación necesaria

- Fotos del daño
- Parte de incidencia firmado
- Presupuesto del proveedor
- Cláusula del contrato que permite la repercusión

**Importante**: Revisa siempre el contrato para asegurar que la repercusión está contemplada.`,
    collection: 'incidencias',
    tags: ['incidencias', 'gastos', 'repercusión', 'cobros'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['inc-003', 'inc-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'inc-005',
    slug: 'reabrir-incidencia',
    title: 'Reabrir una incidencia cerrada',
    excerpt:
      'Cómo reabrir una incidencia que fue cerrada por error o si el problema persiste.',
    content: `## Cuándo reabrir

- El problema **no se resolvió** correctamente.
- Se cerró por **error** antes de tiempo.
- Aparece un **nuevo problema** relacionado con la misma incidencia.

## Pasos para reabrir

1. Entra en la incidencia cerrada.
2. Haz clic en **"Reabrir incidencia"** (menú de acciones).
3. Indica el **motivo** de la reapertura.
4. La incidencia vuelve al estado "En curso".

## Consideraciones

- Se conserva el **historial** completo de la incidencia.
- Las **notificaciones** se reactivan.
- El **SLA** se reinicia desde la reapertura.

Si el mismo proveedor debe volver, puedes asignarlo directamente desde el historial.`,
    collection: 'incidencias',
    tags: ['incidencias', 'reabrir', 'estados'],
    difficulty: 'beginner',
    estimatedReadTime: 2,
    relatedArticles: ['inc-001', 'inc-008'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'inc-006',
    slug: 'descargar-firmar-partes',
    title: 'Descargar y firmar partes de incidencia',
    excerpt:
      'Generación de partes de incidencia en PDF y proceso de firma digital.',
    content: `## Generar el parte de incidencia

El parte documenta el trabajo realizado y puede incluir:
- Descripción del problema
- Trabajo ejecutado
- Materiales utilizados
- Firma del inquilino (conformidad)
- Firma del proveedor

## Descargar en PDF

1. Abre la incidencia resuelta.
2. Clic en **"Generar parte"**.
3. Descarga el PDF generado automáticamente.

## Firma digital

- **Inquilino**: Recibe enlace para firmar desde el portal o por email.
- **Proveedor**: Firma al marcar la incidencia como completada.
- **Firma electrónica**: Integrado con Signaturit/DocuSign para validez legal.

El parte firmado se archiva en la ficha de la incidencia y en el expediente del contrato.`,
    collection: 'incidencias',
    tags: ['incidencias', 'partes', 'firma digital', 'PDF'],
    difficulty: 'intermediate',
    estimatedReadTime: 3,
    relatedArticles: ['inc-001', 'inc-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'inc-007',
    slug: 'clasificacion-ia-incidencias',
    title: 'Clasificación automática de incidencias con IA',
    excerpt:
      'Usa la inteligencia artificial para clasificar incidencias por categoría, urgencia y coste estimado.',
    content: `## ¿Cómo funciona?

Al crear o recibir una incidencia, nuestro sistema de **IA** analiza:
- La **descripción** del problema
- Las **fotos** adjuntas (si las hay)
- El **historial** de incidencias similares

## Resultado de la clasificación

La IA sugiere automáticamente:
- **Categoría**: Fontanería, electricidad, climatización, estructural, etc.
- **Urgencia**: Baja, media, alta o crítica.
- **Coste estimado**: Rango en euros.
- **Tipo de proveedor**: Fontanero, electricista, etc.

## Ventajas

- **Ahorro de tiempo**: No clasificas manualmente.
- **Asignación más rápida**: Filtra proveedores por categoría sugerida.
- **Priorización**: Las urgentes se destacan automáticamente.
- **Mejora continua**: El modelo aprende de tus correcciones.

Puedes **modificar** la clasificación sugerida en cualquier momento.`,
    collection: 'incidencias',
    tags: ['incidencias', 'IA', 'clasificación', 'automatización'],
    difficulty: 'advanced',
    estimatedReadTime: 5,
    relatedArticles: ['inc-001', 'inc-003', 'aca-003'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'inc-008',
    slug: 'slas-tiempos-respuesta',
    title: 'SLAs y tiempos de respuesta',
    excerpt:
      'Configuración y seguimiento de los tiempos de respuesta para incidencias.',
    content: `## ¿Qué son los SLAs?

Los **Service Level Agreements** definen los tiempos máximos para:
- **Primera respuesta**: Tiempo hasta contactar al inquilino.
- **Asignación**: Tiempo hasta asignar un proveedor.
- **Resolución**: Tiempo hasta cerrar la incidencia.

## Configuración por urgencia

Puedes definir SLAs diferentes según la urgencia:
- **Crítica**: Respuesta en 2h, resolución en 24h.
- **Alta**: Respuesta en 4h, resolución en 48h.
- **Media**: Respuesta en 24h, resolución en 5 días.
- **Baja**: Respuesta en 48h, resolución en 10 días.

## Seguimiento

El dashboard muestra:
- Incidencias **dentro** del SLA (verde)
- Incidencias **en riesgo** (amarillo)
- Incidencias **fuera** del SLA (rojo)

Recibe **alertas** cuando una incidencia se acerca al límite del SLA.`,
    collection: 'incidencias',
    tags: ['incidencias', 'SLA', 'tiempos', 'métricas'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['inc-001', 'inc-003', 'inc-005'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
];
