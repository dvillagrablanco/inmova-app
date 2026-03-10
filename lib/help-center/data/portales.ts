import type { HelpArticle } from '../types';

export const portalesArticles: HelpArticle[] = [
  {
    id: 'por-001',
    slug: 'portal-inquilino-acceso-funcionalidades',
    title: 'Portal del inquilino — Acceso y funcionalidades',
    excerpt:
      'Descripción del portal de autoservicio para inquilinos: acceso, menú principal y funciones disponibles.',
    content: `## Acceso al portal

Los inquilinos acceden con su **email** y **contraseña** tras recibir la invitación. La URL del portal es personalizada para tu empresa.

## Funcionalidades principales

- **Dashboard**: Resumen de su contrato, próximos pagos y estado de incidencias.
- **Pagos**: Consultar recibos, historial y realizar pagos.
- **Incidencias**: Reportar nuevas y seguir el estado de las existentes.
- **Documentos**: Contrato, recibos y comunicaciones.
- **Chat**: Comunicación directa con el gestor.
- **Perfil**: Actualizar datos de contacto.

## Navegación

El portal es **responsive** y funciona en móvil, tablet y ordenador. Los inquilinos reciben notificaciones por email cuando hay novedades importantes.`,
    collection: 'portales',
    tags: ['portales', 'inquilinos', 'acceso'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['por-002', 'por-003', 'por-004', 'por-010'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-002',
    slug: 'portal-inquilino-pagos-recibos',
    title: 'Portal del inquilino — Pagos y recibos',
    excerpt:
      'Cómo los inquilinos consultan sus pagos, descargan recibos y realizan pagos desde el portal.',
    content: `## Consultar pagos

En la sección **Pagos** el inquilino ve:
- Próximos vencimientos
- Historial de pagos realizados
- Estado (pendiente, pagado, impagado)
- Importe y concepto

## Descargar recibos

Cada pago tiene un recibo en PDF descargable. El inquilino puede:
- Descargar el recibo individual
- Solicitar un **resumen anual** para la declaración de la renta
- Ver el desglose (alquiler, gastos, etc.)

## Realizar pagos

Si tienes activada la **pasarela de pagos** (Stripe):
- Pago con tarjeta
- Domiciliación bancaria (SEPA)
- Pago único o recurrente

Los pagos se registran automáticamente y el recibo se genera al confirmar.`,
    collection: 'portales',
    tags: ['portales', 'inquilinos', 'pagos', 'recibos'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['por-001', 'por-010', 'aca-002'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-003',
    slug: 'portal-inquilino-reportar-incidencias',
    title: 'Portal del inquilino — Reportar incidencias',
    excerpt:
      'Proceso para que los inquilinos reporten incidencias de mantenimiento desde su portal.',
    content: `## Nueva incidencia

Desde **Incidencias** → **Reportar incidencia**, el inquilino completa:
- **Descripción**: Qué ocurre y dónde.
- **Ubicación**: Habitación o zona del inmueble.
- **Fotos**: Adjuntar imágenes (recomendado).
- **Urgencia**: Indicar si es urgente o no.

## Seguimiento

Tras enviar el reporte:
- Recibe **confirmación** por email.
- Puede ver el **estado** en tiempo real (creada, asignada, en curso, resuelta).
- Recibe **notificaciones** cuando hay actualizaciones.
- Puede **añadir comentarios** o fotos adicionales.

## Historial

El inquilino accede al historial completo de incidencias de su contrato, incluyendo las cerradas.`,
    collection: 'portales',
    tags: ['portales', 'inquilinos', 'incidencias'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['por-001', 'inc-002', 'por-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-004',
    slug: 'portal-inquilino-chat-comunicacion',
    title: 'Portal del inquilino — Chat y comunicación',
    excerpt:
      'Sistema de mensajería entre inquilinos y gestores en el portal.',
    content: `## Chat integrado

El portal incluye un **chat** para comunicación directa con el gestor asignado o el equipo de soporte.

## Funcionalidades

- Mensajes en **tiempo real**
- Historial de conversaciones
- Notificaciones cuando hay mensajes nuevos
- Adjuntar archivos (documentos, fotos)

## Cuándo usar el chat

- Dudas sobre el contrato o pagos
- Consultas sobre incidencias
- Solicitar documentación
- Cualquier comunicación no urgente

**Nota**: Para emergencias (fugas, cortes de luz, etc.) el inquilino debe usar el teléfono de urgencias que le hayas facilitado.`,
    collection: 'portales',
    tags: ['portales', 'inquilinos', 'chat', 'comunicación'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['por-001', 'por-003', 'por-012'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-005',
    slug: 'portal-propietario-dashboard-rentabilidad',
    title: 'Portal del propietario — Dashboard de rentabilidad',
    excerpt:
      'Panel del propietario con métricas de rentabilidad, ocupación y rendimiento.',
    content: `## Acceso al dashboard

El propietario ve un **resumen ejecutivo** con:
- **Rentabilidad bruta y neta** del periodo
- **Ocupación** actual y media
- **Ingresos** vs gastos
- **ROI** del inmueble (si aplica)

## Métricas por inmueble

Para cada propiedad:
- Alquiler cobrado vs pendiente
- Gastos de comunidad, IBI, seguros
- Incidencias abiertas
- Próximos vencimientos

## Gráficos y tendencias

- Evolución de ingresos mensuales
- Comparativa año anterior
- Proyección de liquidación

El propietario puede **exportar** los datos en PDF o Excel para su contabilidad.`,
    collection: 'portales',
    tags: ['portales', 'propietarios', 'rentabilidad', 'dashboard'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['por-006', 'por-010', 'aca-008'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-006',
    slug: 'portal-propietario-informes-mensuales',
    title: 'Portal del propietario — Informes mensuales',
    excerpt:
      'Informes automáticos que reciben los propietarios cada mes.',
    content: `## Contenido del informe mensual

Cada mes el propietario recibe un **informe en PDF** con:
- Resumen de cobros del mes
- Gastos repercutidos
- Estado de incidencias
- Liquidación a cuenta
- Próximos vencimientos

## Personalización

Puedes configurar:
- **Frecuencia**: Mensual, trimestral o a demanda
- **Formato**: PDF, Excel o ambos
- **Contenido**: Incluir o excluir secciones
- **Idioma**: Español o inglés

## Acceso histórico

El propietario puede descargar informes de **meses anteriores** desde su portal, en la sección Documentos → Informes.`,
    collection: 'portales',
    tags: ['portales', 'propietarios', 'informes', 'liquidaciones'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['por-005', 'aca-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-007',
    slug: 'portal-proveedor-gestion-ordenes',
    title: 'Portal del proveedor — Gestión de órdenes de trabajo',
    excerpt:
      'Cómo los proveedores reciben, aceptan y gestionan órdenes de trabajo.',
    content: `## Recepción de órdenes

Cuando asignas una incidencia a un proveedor, recibe:
- **Notificación** por email
- **Orden de trabajo** en su portal con todos los detalles

## En el portal del proveedor

El proveedor puede:
- Ver **detalles** de la incidencia (descripción, fotos, ubicación)
- **Aceptar** o **rechazar** la orden
- Enviar **presupuesto** si es necesario
- Indicar **fecha estimada** de realización
- Marcar como **completada** cuando termine
- Subir **fotos** del trabajo realizado

## Estados visibles

- Pendiente de aceptación
- Aceptada / En curso
- Completada
- Cancelada

El proveedor recibe recordatorios si la orden lleva días sin actualizar.`,
    collection: 'portales',
    tags: ['portales', 'proveedores', 'órdenes de trabajo'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['por-008', 'por-009', 'inc-003'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-008',
    slug: 'portal-proveedor-presupuestos-facturas',
    title: 'Portal del proveedor — Presupuestos y facturas',
    excerpt:
      'Proceso para que los proveedores envíen presupuestos y facturas desde su portal.',
    content: `## Enviar presupuesto

Cuando la incidencia requiere presupuesto previo:
1. El proveedor accede a la orden en su portal
2. Completa el **formulario de presupuesto**: descripción del trabajo, materiales, importe
3. Puede adjuntar **PDF** con el presupuesto detallado
4. Envía para tu **aprobación**

## Aprobación

Tú revisas el presupuesto y puedes:
- **Aprobar**: El proveedor puede proceder
- **Rechazar**: Con motivo, el proveedor puede enviar uno nuevo
- **Solicitar cambios**: El proveedor modifica y reenvía

## Facturación

Tras completar el trabajo, el proveedor puede:
- Subir la **factura** en PDF
- Indicar el **importe** y **referencia**
- La factura se vincula a la incidencia para tu contabilidad`,
    collection: 'portales',
    tags: ['portales', 'proveedores', 'presupuestos', 'facturas'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['por-007', 'inc-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-009',
    slug: 'portal-proveedor-resenas-valoraciones',
    title: 'Portal del proveedor — Reseñas y valoraciones',
    excerpt:
      'Sistema de valoración de proveedores tras completar trabajos.',
    content: `## Cómo funciona

Cuando cierras una incidencia, puedes **valorar** al proveedor:
- Puntuación de 1 a 5 estrellas
- Comentario opcional
- Valoración por criterios: puntualidad, calidad, comunicación

## Visibilidad para el proveedor

El proveedor ve en su portal:
- Su **puntuación media**
- Número de trabajos valorados
- Comentarios recibidos (si los permites)
- Evolución de su valoración en el tiempo

## Uso interno

Las valoraciones te ayudan a:
- **Priorizar** proveedores bien valorados en futuras asignaciones
- **Identificar** problemas recurrentes
- **Renovar** o no contratos con proveedores`,
    collection: 'portales',
    tags: ['portales', 'proveedores', 'reseñas', 'valoraciones'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['por-007', 'inc-003'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-010',
    slug: 'invitar-inquilinos-propietarios-proveedores',
    title: 'Invitar a inquilinos, propietarios y proveedores a sus portales',
    excerpt:
      'Proceso para enviar invitaciones y dar acceso a los diferentes portales.',
    content: `## Invitar inquilinos

1. Crea el **contrato** del inquilino
2. En la ficha del contrato, clic en **"Invitar al portal"**
3. El inquilino recibe un **email** con enlace de activación
4. Define su contraseña y accede

**Alternativa**: Invitación masiva desde Contratos → Acciones → Invitar a portales.

## Invitar propietarios

1. En la ficha del **propietario** o del **inmueble**
2. Clic en **"Invitar al portal del propietario"**
3. El propietario recibe el email de activación

## Invitar proveedores

1. En **Proveedores** → Añadir proveedor
2. Marca **"Acceso al portal"**
3. El proveedor recibe credenciales por email

**Nota**: Puedes reenviar invitaciones si han expirado (válidas 7 días por defecto).`,
    collection: 'portales',
    tags: ['portales', 'invitaciones', 'acceso'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['por-001', 'por-005', 'por-007'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-011',
    slug: 'marketplace-servicios-inquilinos',
    title: 'Marketplace de servicios para inquilinos',
    excerpt:
      'Catálogo de servicios adicionales que los inquilinos pueden contratar.',
    content: `## ¿Qué es el marketplace?

Un **catálogo de servicios** que ofreces a los inquilinos: limpieza, mudanza, seguro de hogar, wifi, etc.

## Configuración

1. Define los **servicios** disponibles y precios
2. Asocia **proveedores** a cada servicio
3. Los inquilinos ven el catálogo en su portal

## Contratación por el inquilino

- Navega por categorías
- Consulta precios y descripciones
- Añade al carrito
- Paga online o solicita presupuesto
- Recibe confirmación y seguimiento

## Gestión

- Las solicitudes llegan a tu panel
- Puedes asignar al proveedor preferido
- Facturación integrada con el contrato
- Opción de **comisión** por servicio contratado`,
    collection: 'portales',
    tags: ['portales', 'marketplace', 'servicios', 'inquilinos'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['por-001', 'por-002'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'por-012',
    slug: 'chatbot-ia-portales',
    title: 'Chatbot IA en portales',
    excerpt:
      'Asistente virtual con IA que responde dudas frecuentes en los portales.',
    content: `## Funcionalidad

Un **chatbot** disponible 24/7 en los portales que responde:
- Preguntas sobre pagos y recibos
- Estado de incidencias
- Información del contrato
- Horarios y procedimientos
- Derivación a humano si no puede resolver

## Configuración

Puedes personalizar:
- **Saludo** y tono de las respuestas
- **Temas** que conoce (basado en tu base de conocimiento)
- **Escalación**: Cuándo derivar al gestor
- **Idioma**: Español, inglés, etc.

## Ventajas

- Reduce consultas repetitivas
- Atención inmediata fuera de horario
- El inquilino obtiene respuestas sin esperar
- Mejora la satisfacción del usuario`,
    collection: 'portales',
    tags: ['portales', 'chatbot', 'IA', 'soporte'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['por-004', 'inc-007'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
];
