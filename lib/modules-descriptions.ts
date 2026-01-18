/**
 * DESCRIPCIONES DETALLADAS DE MÓDULOS - INMOVA 2026
 * 
 * Este archivo contiene información completa sobre cada módulo:
 * - Descripción corta y larga
 * - Funcionalidades principales
 * - Casos de uso
 * - Beneficios clave
 * 
 * Se usa tanto en la landing de precios como en la página de gestión de módulos.
 */

import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  CreditCard,
  Wrench,
  Calendar,
  MessageSquare,
  FolderOpen,
  Bell,
  Settings,
  TrendingUp,
  BarChart3,
  Calculator,
  Briefcase,
  Scale,
  ShieldCheck,
  Smartphone,
  Star,
  Target,
  Zap,
  Image,
  Clock,
  UserCheck,
  Share2,
  Leaf,
  Vote,
  Video,
  Globe,
  Cpu,
  Lock,
  Boxes,
  HeadphonesIcon,
  Paintbrush,
  Code,
  Hotel,
  HardHat,
  Building,
  Store,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleDescription {
  codigo: string;
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string;
  funcionalidades: string[];
  casosDeUso: string[];
  beneficios: string[];
  icon: LucideIcon;
  categoria: 'core' | 'gestion' | 'financiero' | 'comunicacion' | 'avanzado' | 'portales' | 'verticales' | 'premium';
  videoUrl?: string;
  docsUrl?: string;
}

/**
 * Catálogo completo de descripciones de módulos
 */
export const MODULE_DESCRIPTIONS: Record<string, ModuleDescription> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS CORE (Siempre incluidos)
  // ═══════════════════════════════════════════════════════════════════════════
  dashboard: {
    codigo: 'dashboard',
    nombre: 'Dashboard',
    descripcionCorta: 'Panel de control con métricas en tiempo real',
    descripcionLarga: 'Tu centro de operaciones. Visualiza de un vistazo el estado de tu cartera inmobiliaria: ocupación, cobros pendientes, incidencias abiertas, contratos por vencer y mucho más. Personaliza los widgets según tus prioridades.',
    funcionalidades: [
      'Métricas de ocupación en tiempo real',
      'Resumen de cobros y pagos pendientes',
      'Alertas de contratos próximos a vencer',
      'Incidencias y mantenimientos abiertos',
      'Gráficos de evolución de ingresos',
      'Widgets personalizables',
    ],
    casosDeUso: [
      'Revisar el estado general cada mañana',
      'Identificar propiedades con problemas',
      'Priorizar tareas del día',
    ],
    beneficios: [
      'Toma decisiones informadas rápidamente',
      'Detecta problemas antes de que escalen',
      'Ahorra tiempo con información centralizada',
    ],
    icon: LayoutDashboard,
    categoria: 'core',
  },

  edificios: {
    codigo: 'edificios',
    nombre: 'Edificios',
    descripcionCorta: 'Gestión de propiedades y edificios',
    descripcionLarga: 'Organiza tu cartera inmobiliaria de forma jerárquica. Crea edificios, bloques o comunidades y agrupa dentro tus unidades (pisos, locales, garajes). Gestiona elementos comunes, zonas compartidas y documentación del edificio.',
    funcionalidades: [
      'Estructura jerárquica edificio > unidades',
      'Ficha completa de cada propiedad',
      'Gestión de zonas comunes',
      'Documentación centralizada (ITE, certificados)',
      'Historial de mantenimientos',
      'Geolocalización en mapa',
    ],
    casosDeUso: [
      'Gestionar un edificio completo de viviendas',
      'Organizar una cartera de locales comerciales',
      'Administrar comunidades de propietarios',
    ],
    beneficios: [
      'Toda la información de propiedades en un solo lugar',
      'Encuentra documentos al instante',
      'Visión clara de tu patrimonio',
    ],
    icon: Building2,
    categoria: 'core',
  },

  unidades: {
    codigo: 'unidades',
    nombre: 'Unidades',
    descripcionCorta: 'Pisos, locales, garajes y trasteros',
    descripcionLarga: 'Gestiona cada unidad individual: pisos, apartamentos, locales, garajes, trasteros. Registra características, superficie, estado, inventario de mobiliario, contadores y todo lo necesario para su correcta administración.',
    funcionalidades: [
      'Ficha detallada de cada unidad',
      'Características y equipamiento',
      'Inventario de mobiliario',
      'Lectura de contadores',
      'Estado de conservación',
      'Histórico de inquilinos',
      'Galería de fotos',
    ],
    casosDeUso: [
      'Registrar un nuevo piso para alquiler',
      'Documentar el estado antes de una entrada',
      'Gestionar el inventario de un amueblado',
    ],
    beneficios: [
      'Documentación completa para evitar conflictos',
      'Historial para valorar la propiedad',
      'Control total sobre cada activo',
    ],
    icon: Home,
    categoria: 'core',
  },

  inquilinos: {
    codigo: 'inquilinos',
    nombre: 'Inquilinos',
    descripcionCorta: 'Gestión completa de arrendatarios',
    descripcionLarga: 'Base de datos centralizada de todos tus inquilinos. Almacena información de contacto, documentación (DNI, nóminas, avales), historial de pagos, incidencias y comunicaciones. Evalúa la solvencia y mantén un registro completo de cada relación.',
    funcionalidades: [
      'Ficha completa del inquilino',
      'Documentación digitalizada',
      'Historial de pagos y deudas',
      'Comunicaciones registradas',
      'Valoración y notas internas',
      'Múltiples contactos (avalistas, emergencias)',
    ],
    casosDeUso: [
      'Evaluar un candidato antes de alquilar',
      'Consultar el historial de pagos de un inquilino',
      'Buscar datos de contacto rápidamente',
    ],
    beneficios: [
      'Toma mejores decisiones de alquiler',
      'Historial para gestionar impagos',
      'Comunicación organizada',
    ],
    icon: Users,
    categoria: 'core',
  },

  contratos: {
    codigo: 'contratos',
    nombre: 'Contratos',
    descripcionCorta: 'Contratos digitales con firma electrónica',
    descripcionLarga: 'Crea, gestiona y firma contratos de arrendamiento de forma 100% digital. Utiliza plantillas personalizables, genera contratos con los datos del inquilino y la propiedad, firma con validez legal (eIDAS) y recibe alertas de vencimiento.',
    funcionalidades: [
      'Plantillas de contrato personalizables',
      'Generación automática de documentos',
      'Firma digital con validez legal',
      'Alertas de vencimiento y renovación',
      'Histórico de versiones',
      'Anexos y addendas',
    ],
    casosDeUso: [
      'Generar un contrato de alquiler en 2 minutos',
      'Firmar remotamente sin desplazamientos',
      'Renovar contratos automáticamente',
    ],
    beneficios: [
      'Ahorra tiempo con plantillas',
      'Firma sin reuniones presenciales',
      'Nunca olvides una renovación',
    ],
    icon: FileText,
    categoria: 'core',
  },

  pagos: {
    codigo: 'pagos',
    nombre: 'Pagos',
    descripcionCorta: 'Cobro de rentas y gestión de recibos',
    descripcionLarga: 'Automatiza el cobro de rentas. Genera recibos, envía recordatorios, domicilia pagos por SEPA, detecta impagos y gestiona la morosidad. Integración con pasarelas de pago para que tus inquilinos paguen online.',
    funcionalidades: [
      'Generación automática de recibos',
      'Domiciliación bancaria SEPA',
      'Recordatorios automáticos de pago',
      'Detección de impagos',
      'Pago online con tarjeta',
      'Conciliación bancaria',
      'Informes de cobros',
    ],
    casosDeUso: [
      'Cobrar automáticamente el día 1 de cada mes',
      'Enviar recordatorio a inquilinos morosos',
      'Conciliar movimientos bancarios',
    ],
    beneficios: [
      'Reduce la morosidad hasta un 80%',
      'Ahorra horas de trabajo administrativo',
      'Mejora el flujo de caja',
    ],
    icon: CreditCard,
    categoria: 'core',
  },

  mantenimiento: {
    codigo: 'mantenimiento',
    nombre: 'Mantenimiento',
    descripcionCorta: 'Gestión de incidencias y reparaciones',
    descripcionLarga: 'Sistema completo para gestionar el mantenimiento de tus propiedades. Los inquilinos reportan incidencias, asignas técnicos, haces seguimiento y cierras con valoración. Programa mantenimientos preventivos y lleva un historial completo.',
    funcionalidades: [
      'Reporte de incidencias online',
      'Asignación a proveedores',
      'Seguimiento de estado',
      'Fotos y documentación',
      'Mantenimiento preventivo programado',
      'Historial por propiedad',
      'Valoración de proveedores',
    ],
    casosDeUso: [
      'Inquilino reporta una avería desde su móvil',
      'Programar revisión anual de calderas',
      'Evaluar qué proveedor da mejor servicio',
    ],
    beneficios: [
      'Resuelve incidencias más rápido',
      'Mejora la satisfacción del inquilino',
      'Controla los costes de mantenimiento',
    ],
    icon: Wrench,
    categoria: 'core',
  },

  calendario: {
    codigo: 'calendario',
    nombre: 'Calendario',
    descripcionCorta: 'Agenda y programación de eventos',
    descripcionLarga: 'Centraliza todos los eventos importantes: vencimientos de contratos, cobros, visitas, reuniones, mantenimientos programados. Sincroniza con Google Calendar y recibe recordatorios para no olvidar nada.',
    funcionalidades: [
      'Vista mensual, semanal y diaria',
      'Tipos de eventos personalizables',
      'Recordatorios configurables',
      'Sincronización con Google Calendar',
      'Eventos recurrentes',
      'Compartir calendario con equipo',
    ],
    casosDeUso: [
      'Programar una visita con potencial inquilino',
      'Ver todos los vencimientos del mes',
      'Coordinar citas con proveedores',
    ],
    beneficios: [
      'Nunca olvides una fecha importante',
      'Organiza tu tiempo eficientemente',
      'Coordina con tu equipo',
    ],
    icon: Calendar,
    categoria: 'core',
  },

  chat: {
    codigo: 'chat',
    nombre: 'Chat',
    descripcionCorta: 'Mensajería interna con inquilinos',
    descripcionLarga: 'Comunícate con inquilinos, propietarios y proveedores desde la plataforma. Historial de conversaciones vinculado a cada propiedad, adjunta documentos y mantén un registro de todas las comunicaciones.',
    funcionalidades: [
      'Chat en tiempo real',
      'Historial de conversaciones',
      'Adjuntar documentos e imágenes',
      'Notificaciones push',
      'Vinculación a propiedades',
      'Plantillas de respuesta rápida',
    ],
    casosDeUso: [
      'Responder consulta de un inquilino',
      'Enviar recordatorio de pago',
      'Coordinar con un proveedor',
    ],
    beneficios: [
      'Comunicación centralizada y trazable',
      'Responde desde cualquier dispositivo',
      'Evita perder mensajes en WhatsApp',
    ],
    icon: MessageSquare,
    categoria: 'core',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS DE GESTIÓN BÁSICA
  // ═══════════════════════════════════════════════════════════════════════════
  documentos: {
    codigo: 'documentos',
    nombre: 'Documentos',
    descripcionCorta: 'Gestión documental centralizada',
    descripcionLarga: 'Almacena y organiza todos los documentos de tu negocio: contratos, facturas, certificados, actas, correspondencia. Estructura por carpetas, etiqueta, busca y comparte de forma segura.',
    funcionalidades: [
      'Almacenamiento en la nube seguro',
      'Estructura de carpetas personalizable',
      'Etiquetas y búsqueda avanzada',
      'Compartir documentos con enlaces',
      'Versionado de documentos',
      'OCR para búsqueda en PDFs',
    ],
    casosDeUso: [
      'Guardar el certificado energético de cada vivienda',
      'Buscar un contrato antiguo rápidamente',
      'Compartir documentación con un abogado',
    ],
    beneficios: [
      'Encuentra cualquier documento en segundos',
      'Cumple con obligaciones legales de archivo',
      'Accede desde cualquier lugar',
    ],
    icon: FolderOpen,
    categoria: 'gestion',
  },

  notificaciones: {
    codigo: 'notificaciones',
    nombre: 'Notificaciones',
    descripcionCorta: 'Alertas y avisos configurables',
    descripcionLarga: 'Recibe alertas sobre eventos importantes: pagos pendientes, contratos por vencer, incidencias nuevas, mensajes. Configura qué notificaciones quieres recibir y por qué canal (email, app, SMS).',
    funcionalidades: [
      'Notificaciones por email',
      'Notificaciones push en app',
      'Configuración granular',
      'Resumen diario opcional',
      'Alertas urgentes',
      'Historial de notificaciones',
    ],
    casosDeUso: [
      'Recibir alerta cuando un inquilino no paga',
      'Aviso de contrato que vence en 30 días',
      'Notificación de nueva incidencia',
    ],
    beneficios: [
      'Reacciona rápido a situaciones críticas',
      'No te pierdas nada importante',
      'Controla la frecuencia para no saturarte',
    ],
    icon: Bell,
    categoria: 'gestion',
  },

  usuarios: {
    codigo: 'usuarios',
    nombre: 'Usuarios',
    descripcionCorta: 'Gestión de usuarios y permisos',
    descripcionLarga: 'Invita a tu equipo a la plataforma. Asigna roles (administrador, gestor, contable) y permisos específicos. Cada usuario ve solo lo que necesita y todas las acciones quedan registradas.',
    funcionalidades: [
      'Roles predefinidos y personalizables',
      'Permisos por módulo y propiedad',
      'Registro de actividad (audit log)',
      'Autenticación 2FA opcional',
      'Invitación por email',
      'Desactivación temporal',
    ],
    casosDeUso: [
      'Dar acceso de solo lectura al contable',
      'Permitir que un gestor vea solo sus propiedades',
      'Auditar quién hizo qué cambio',
    ],
    beneficios: [
      'Seguridad y control de acceso',
      'Trabajo en equipo organizado',
      'Trazabilidad de cambios',
    ],
    icon: Users,
    categoria: 'gestion',
  },

  configuracion: {
    codigo: 'configuracion',
    nombre: 'Configuración',
    descripcionCorta: 'Ajustes de la plataforma',
    descripcionLarga: 'Personaliza INMOVA según tus necesidades. Configura datos de tu empresa, plantillas, impuestos, métodos de pago, integraciones y preferencias generales.',
    funcionalidades: [
      'Datos de empresa y facturación',
      'Plantillas personalizables',
      'Configuración de impuestos',
      'Métodos de pago aceptados',
      'Integraciones activas',
      'Preferencias de idioma y zona horaria',
    ],
    casosDeUso: [
      'Añadir el logo de tu empresa',
      'Configurar el IVA aplicable',
      'Activar integración con tu banco',
    ],
    beneficios: [
      'Adapta la plataforma a tu negocio',
      'Cumple con requisitos fiscales',
      'Automatiza procesos repetitivos',
    ],
    icon: Settings,
    categoria: 'gestion',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS FINANCIEROS
  // ═══════════════════════════════════════════════════════════════════════════
  reportes: {
    codigo: 'reportes',
    nombre: 'Reportes Financieros',
    descripcionCorta: 'Informes de ingresos, gastos y rentabilidad',
    descripcionLarga: 'Genera informes financieros profesionales: cuenta de resultados por propiedad, rentabilidad, evolución de ingresos, comparativas anuales. Exporta a Excel/PDF para tu contable o inversores.',
    funcionalidades: [
      'Cuenta de resultados por propiedad',
      'Informe de rentabilidad (ROI, yield)',
      'Evolución de ingresos y gastos',
      'Comparativa interanual',
      'Exportación a Excel y PDF',
      'Informes programados por email',
    ],
    casosDeUso: [
      'Presentar rentabilidad a un inversor',
      'Preparar la declaración de IRPF',
      'Analizar qué propiedades son más rentables',
    ],
    beneficios: [
      'Decisiones basadas en datos reales',
      'Ahorra horas preparando informes',
      'Profesionaliza tu gestión',
    ],
    icon: BarChart3,
    categoria: 'financiero',
  },

  gastos: {
    codigo: 'gastos',
    nombre: 'Control de Gastos',
    descripcionCorta: 'Registro y categorización de gastos',
    descripcionLarga: 'Registra todos los gastos asociados a tus propiedades: mantenimiento, suministros, seguros, impuestos, comunidad. Categoriza, adjunta facturas y obtén informes de gastos por propiedad o concepto.',
    funcionalidades: [
      'Registro rápido de gastos',
      'Categorización automática',
      'Adjuntar facturas digitalizadas',
      'Gastos recurrentes automáticos',
      'Informes por categoría y propiedad',
      'Deducibilidad fiscal marcada',
    ],
    casosDeUso: [
      'Registrar la factura del fontanero',
      'Ver cuánto gastas en comunidad al año',
      'Preparar gastos deducibles para Hacienda',
    ],
    beneficios: [
      'Control total de dónde va tu dinero',
      'Maximiza deducciones fiscales',
      'Detecta gastos excesivos',
    ],
    icon: Calculator,
    categoria: 'financiero',
  },

  proveedores: {
    codigo: 'proveedores',
    nombre: 'Proveedores',
    descripcionCorta: 'Base de datos de proveedores de servicios',
    descripcionLarga: 'Gestiona tu red de proveedores: fontaneros, electricistas, pintores, cerrajeros, empresas de limpieza. Almacena contactos, valoraciones, tarifas y asigna trabajos directamente desde incidencias.',
    funcionalidades: [
      'Directorio de proveedores',
      'Categorías y especialidades',
      'Valoraciones y comentarios',
      'Historial de trabajos realizados',
      'Tarifas y presupuestos',
      'Asignación desde incidencias',
    ],
    casosDeUso: [
      'Buscar un fontanero disponible para urgencia',
      'Comparar presupuestos de varios proveedores',
      'Valorar el trabajo de un técnico',
    ],
    beneficios: [
      'Encuentra al proveedor adecuado rápido',
      'Historial para negociar precios',
      'Mejora la calidad del servicio',
    ],
    icon: Briefcase,
    categoria: 'financiero',
  },

  contabilidad: {
    codigo: 'contabilidad',
    nombre: 'Contabilidad Integrada',
    descripcionCorta: 'Conexión con software contable',
    descripcionLarga: 'Sincroniza INMOVA con tu programa de contabilidad: A3, Sage, Holded, Contasimple, Contaplus. Exporta asientos, facturas y movimientos automáticamente. Reduce errores y duplicidades.',
    funcionalidades: [
      'Integración con A3, Sage, Holded',
      'Exportación automática de asientos',
      'Sincronización de facturas',
      'Mapeo de cuentas contables',
      'Conciliación automatizada',
      'Informes para el contable',
    ],
    casosDeUso: [
      'Pasar automáticamente cobros a contabilidad',
      'Generar asientos de facturas recibidas',
      'Cerrar el mes en minutos',
    ],
    beneficios: [
      'Elimina la doble entrada de datos',
      'Reduce errores contables',
      'Cierre mensual más rápido',
    ],
    icon: Calculator,
    categoria: 'financiero',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS AVANZADOS
  // ═══════════════════════════════════════════════════════════════════════════
  analytics: {
    codigo: 'analytics',
    nombre: 'Analytics Avanzado',
    descripcionCorta: 'Análisis predictivo y tendencias',
    descripcionLarga: 'Inteligencia de negocio aplicada a tu cartera. Predicciones de ocupación, detección de tendencias, alertas de riesgo de impago, comparativas con el mercado. Toma decisiones estratégicas con datos.',
    funcionalidades: [
      'Predicción de ocupación',
      'Detección de riesgo de impago',
      'Análisis de tendencias del mercado',
      'Benchmarking con competidores',
      'Dashboards personalizables',
      'Alertas inteligentes',
    ],
    casosDeUso: [
      'Predecir si un inquilino va a dejar de pagar',
      'Comparar rentabilidad con el mercado',
      'Identificar la mejor época para subir rentas',
    ],
    beneficios: [
      'Anticípate a los problemas',
      'Maximiza la rentabilidad',
      'Decisiones basadas en IA',
    ],
    icon: TrendingUp,
    categoria: 'avanzado',
  },

  crm: {
    codigo: 'crm',
    nombre: 'CRM Inmobiliario',
    descripcionCorta: 'Gestión de leads y clientes potenciales',
    descripcionLarga: 'Captura leads de portales (Idealista, Fotocasa), web y redes sociales. Gestiona el embudo de ventas: primer contacto, visita, negociación, cierre. Automatiza seguimientos y no pierdas ninguna oportunidad.',
    funcionalidades: [
      'Captura de leads automática',
      'Pipeline de ventas visual',
      'Automatización de seguimientos',
      'Plantillas de emails y SMS',
      'Scoring de leads con IA',
      'Informes de conversión',
    ],
    casosDeUso: [
      'Gestionar contactos de Idealista automáticamente',
      'Hacer seguimiento de visitas programadas',
      'Analizar qué canales generan más contratos',
    ],
    beneficios: [
      'No pierdas ningún lead',
      'Convierte más visitas en contratos',
      'Mide la efectividad de tu marketing',
    ],
    icon: Target,
    categoria: 'avanzado',
  },

  screening: {
    codigo: 'screening',
    nombre: 'Screening de Inquilinos',
    descripcionCorta: 'Verificación de solvencia y scoring',
    descripcionLarga: 'Evalúa candidatos antes de alquilar. Verificación de identidad, consulta de ficheros de morosidad (ASNEF, RAI), análisis de capacidad de pago, scoring de riesgo. Reduce impagos con datos objetivos.',
    funcionalidades: [
      'Verificación de identidad',
      'Consulta de ficheros de morosidad',
      'Análisis de capacidad de pago',
      'Scoring de riesgo con IA',
      'Informe completo del candidato',
      'Histórico de verificaciones',
    ],
    casosDeUso: [
      'Verificar solvencia antes de firmar contrato',
      'Comparar varios candidatos objetivamente',
      'Detectar documentación fraudulenta',
    ],
    beneficios: [
      'Reduce impagos hasta un 70%',
      'Decisiones objetivas y documentadas',
      'Protege tu inversión',
    ],
    icon: ShieldCheck,
    categoria: 'avanzado',
  },

  valoraciones: {
    codigo: 'valoraciones',
    nombre: 'Valoraciones con IA',
    descripcionCorta: 'Valoración automática de propiedades',
    descripcionLarga: 'Obtén valoraciones instantáneas de tus propiedades usando inteligencia artificial. Compara con precios del mercado, analiza tendencias de la zona, optimiza el precio de alquiler o venta.',
    funcionalidades: [
      'Valoración instantánea con IA',
      'Comparativa con mercado local',
      'Análisis de tendencias de precios',
      'Sugerencia de precio óptimo',
      'Informes de valoración profesionales',
      'Historial de valoraciones',
    ],
    casosDeUso: [
      'Saber a qué precio poner un piso en alquiler',
      'Evaluar si el precio de compra es justo',
      'Presentar valoración a un propietario',
    ],
    beneficios: [
      'Precio óptimo sin esperas',
      'Evita infravaloraciones',
      'Argumenta con datos ante propietarios',
    ],
    icon: Star,
    categoria: 'avanzado',
  },

  publicaciones: {
    codigo: 'publicaciones',
    nombre: 'Publicación Multi-Portal',
    descripcionCorta: 'Publica en Idealista, Fotocasa, Habitaclia...',
    descripcionLarga: 'Publica tus anuncios en múltiples portales inmobiliarios con un solo clic. Sincroniza cambios automáticamente, gestiona leads centralizadamente y analiza qué portales funcionan mejor.',
    funcionalidades: [
      'Publicación en Idealista, Fotocasa, Habitaclia',
      'Sincronización automática de cambios',
      'Gestión centralizada de leads',
      'Estadísticas por portal',
      'Plantillas de anuncios',
      'Fotos optimizadas automáticamente',
    ],
    casosDeUso: [
      'Publicar un piso nuevo en todos los portales',
      'Actualizar precio en todas las plataformas a la vez',
      'Ver qué portal genera más contactos',
    ],
    beneficios: [
      'Ahorra horas de trabajo manual',
      'Máxima visibilidad de tus anuncios',
      'Gestión centralizada de respuestas',
    ],
    icon: Share2,
    categoria: 'avanzado',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS DE PORTALES
  // ═══════════════════════════════════════════════════════════════════════════
  portal_inquilino: {
    codigo: 'portal_inquilino',
    nombre: 'Portal del Inquilino',
    descripcionCorta: 'Área privada de autoservicio para inquilinos',
    descripcionLarga: 'Ofrece a tus inquilinos un portal donde consultar contratos, descargar recibos, pagar online, reportar incidencias y comunicarse contigo. Reduce llamadas y emails repetitivos.',
    funcionalidades: [
      'Acceso con credenciales propias',
      'Consulta de contrato y documentos',
      'Descarga de recibos de pago',
      'Pago online de rentas',
      'Reporte de incidencias con fotos',
      'Chat con el propietario/gestor',
    ],
    casosDeUso: [
      'Inquilino descarga su recibo de pago',
      'Reporta una avería desde el móvil',
      'Consulta las condiciones de su contrato',
    ],
    beneficios: [
      'Reduce consultas repetitivas un 60%',
      'Mejora la satisfacción del inquilino',
      'Servicio 24/7 sin tu intervención',
    ],
    icon: Smartphone,
    categoria: 'portales',
  },

  portal_propietario: {
    codigo: 'portal_propietario',
    nombre: 'Portal del Propietario',
    descripcionCorta: 'Área privada para propietarios que gestionas',
    descripcionLarga: 'Si gestionas propiedades de terceros, ofrece a tus clientes propietarios un portal donde ver el estado de sus propiedades, informes de rentabilidad, documentación y comunicarse contigo.',
    funcionalidades: [
      'Vista de sus propiedades',
      'Informes de rentabilidad',
      'Estado de inquilinos y pagos',
      'Documentación accesible',
      'Historial de mantenimientos',
      'Comunicación con el gestor',
    ],
    casosDeUso: [
      'Propietario consulta si se ha cobrado la renta',
      'Descarga informe anual de rentabilidad',
      'Revisa facturas de reparaciones',
    ],
    beneficios: [
      'Transparencia total con tus clientes',
      'Diferénciate como gestor profesional',
      'Reduce consultas de propietarios',
    ],
    icon: Building,
    categoria: 'portales',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS PREMIUM
  // ═══════════════════════════════════════════════════════════════════════════
  tours_virtuales: {
    codigo: 'tours_virtuales',
    nombre: 'Tours Virtuales 360°',
    descripcionCorta: 'Visitas virtuales inmersivas',
    descripcionLarga: 'Crea tours virtuales 360° de tus propiedades. Integración con Matterport y otras plataformas. Permite a los interesados recorrer la vivienda sin desplazarse, filtrando visitas no cualificadas.',
    funcionalidades: [
      'Integración con Matterport',
      'Visualización 360° interactiva',
      'Etiquetas informativas',
      'Compartir por enlace',
      'Estadísticas de visualización',
      'Embeber en portales y web',
    ],
    casosDeUso: [
      'Mostrar un piso a candidatos del extranjero',
      'Reducir visitas presenciales no cualificadas',
      'Destacar anuncios en portales',
    ],
    beneficios: [
      'Filtra candidatos antes de la visita',
      'Diferénciate de la competencia',
      'Ahorra tiempo en visitas',
    ],
    icon: Video,
    categoria: 'premium',
  },

  pricing_dinamico: {
    codigo: 'pricing_dinamico',
    nombre: 'Pricing Dinámico con IA',
    descripcionCorta: 'Optimización de precios con Machine Learning',
    descripcionLarga: 'Maximiza tus ingresos con precios inteligentes. El algoritmo analiza demanda, estacionalidad, competencia y eventos locales para sugerir el precio óptimo en cada momento, especialmente útil para alquiler vacacional.',
    funcionalidades: [
      'Análisis de demanda en tiempo real',
      'Sugerencias de precio diarias',
      'Factores: temporada, eventos, competencia',
      'Automatización de cambios de precio',
      'Simulador de ingresos',
      'Informes de optimización',
    ],
    casosDeUso: [
      'Subir precio automáticamente en temporada alta',
      'Ajustar precio cuando hay un evento en la ciudad',
      'Competir dinámicamente con Airbnb',
    ],
    beneficios: [
      'Aumenta ingresos hasta un 30%',
      'Optimiza ocupación automáticamente',
      'No pierdas oportunidades de mercado',
    ],
    icon: TrendingUp,
    categoria: 'premium',
  },

  iot: {
    codigo: 'iot',
    nombre: 'Smart Buildings / IoT',
    descripcionCorta: 'Edificios inteligentes con sensores y cerraduras',
    descripcionLarga: 'Conecta tus propiedades con dispositivos IoT: cerraduras inteligentes para check-in autónomo, termostatos para eficiencia energética, sensores de humo, agua y movimiento. Automatiza y controla remotamente.',
    funcionalidades: [
      'Cerraduras inteligentes (Yale, Nuki, TTLock)',
      'Termostatos conectados',
      'Sensores de humo y CO2',
      'Detección de fugas de agua',
      'Control remoto desde app',
      'Alertas en tiempo real',
    ],
    casosDeUso: [
      'Check-in autónomo sin entrega de llaves',
      'Ajustar calefacción entre huéspedes',
      'Detectar una fuga antes de que cause daños',
    ],
    beneficios: [
      'Ahorra en gestión presencial',
      'Reduce costes energéticos',
      'Previene siniestros costosos',
    ],
    icon: Cpu,
    categoria: 'premium',
  },

  esg: {
    codigo: 'esg',
    nombre: 'ESG y Sostenibilidad',
    descripcionCorta: 'Huella de carbono y certificaciones verdes',
    descripcionLarga: 'Gestiona la sostenibilidad de tu cartera inmobiliaria. Calcula la huella de carbono, gestiona certificaciones energéticas, prepara informes CSRD, identifica mejoras de eficiencia energética.',
    funcionalidades: [
      'Cálculo de huella de carbono',
      'Gestión de certificados energéticos',
      'Informes CSRD/SFDR',
      'Sugerencias de mejora energética',
      'Seguimiento de consumos',
      'Dashboard de sostenibilidad',
    ],
    casosDeUso: [
      'Calcular emisiones de tu cartera',
      'Preparar informe de sostenibilidad anual',
      'Identificar edificios menos eficientes',
    ],
    beneficios: [
      'Cumple con normativa ESG',
      'Atrae inversores responsables',
      'Reduce costes energéticos',
    ],
    icon: Leaf,
    categoria: 'premium',
  },

  blockchain: {
    codigo: 'blockchain',
    nombre: 'Blockchain y Tokenización',
    descripcionCorta: 'Inversión fraccionada y Smart Contracts',
    descripcionLarga: 'Tokeniza propiedades para inversión fraccionada. Usa Smart Contracts para automatizar distribución de rentas. Accede a un nuevo modelo de financiación inmobiliaria con tecnología blockchain.',
    funcionalidades: [
      'Tokenización de propiedades',
      'Inversión fraccionada',
      'Smart Contracts automáticos',
      'Distribución de rentas a token holders',
      'Marketplace de tokens inmobiliarios',
      'Trazabilidad inmutable',
    ],
    casosDeUso: [
      'Vender participaciones de un edificio',
      'Automatizar reparto de rentas a inversores',
      'Captar financiación alternativa',
    ],
    beneficios: [
      'Nuevo modelo de financiación',
      'Liquidez para activos ilíquidos',
      'Transparencia total con inversores',
    ],
    icon: Boxes,
    categoria: 'premium',
  },

  whitelabel_basic: {
    codigo: 'whitelabel_basic',
    nombre: 'White-Label Básico',
    descripcionCorta: 'Tu marca y colores en la plataforma',
    descripcionLarga: 'Personaliza INMOVA con tu identidad corporativa. Añade tu logo, colores corporativos, y personaliza los emails y documentos que envías a inquilinos y propietarios.',
    funcionalidades: [
      'Logo personalizado',
      'Colores corporativos',
      'Emails con tu marca',
      'Documentos personalizados',
      'Favicon personalizado',
      'Pie de página personalizado',
    ],
    casosDeUso: [
      'Que los inquilinos vean tu marca, no INMOVA',
      'Enviar contratos con tu logo',
      'Profesionalizar tu imagen',
    ],
    beneficios: [
      'Refuerza tu marca',
      'Imagen más profesional',
      'Diferenciación de competidores',
    ],
    icon: Paintbrush,
    categoria: 'premium',
  },

  whitelabel_full: {
    codigo: 'whitelabel_full',
    nombre: 'White-Label Completo',
    descripcionCorta: 'Tu dominio, app y emails totalmente personalizados',
    descripcionLarga: 'Lleva la personalización al máximo: tu propio dominio (ej: gestion.tuempresa.com), app móvil con tu marca en App Store y Google Play, emails desde tu dominio. INMOVA desaparece completamente.',
    funcionalidades: [
      'Dominio propio',
      'App móvil personalizada',
      'Emails desde tu dominio',
      'Sin menciones a INMOVA',
      'Soporte de onboarding',
      'Actualizaciones automáticas',
    ],
    casosDeUso: [
      'Ofrecer una plataforma propia a tus clientes',
      'Crear una app con tu marca',
      'Escalar tu negocio de gestión',
    ],
    beneficios: [
      'Tu propia plataforma sin desarrollar',
      'Máxima profesionalización',
      'Escalabilidad inmediata',
    ],
    icon: Globe,
    categoria: 'premium',
  },

  api_access: {
    codigo: 'api_access',
    nombre: 'Acceso API REST',
    descripcionCorta: 'Integraciones personalizadas vía API',
    descripcionLarga: 'Conecta INMOVA con cualquier sistema mediante nuestra API REST. Automatiza procesos, sincroniza datos con tu ERP, CRM o herramientas internas. Documentación completa y soporte técnico.',
    funcionalidades: [
      'API REST documentada',
      'Autenticación OAuth 2.0',
      'Webhooks para eventos',
      'Rate limits generosos',
      'Sandbox de pruebas',
      'Soporte técnico dedicado',
    ],
    casosDeUso: [
      'Sincronizar propiedades con tu ERP',
      'Automatizar reportes personalizados',
      'Integrar con tu web de captación',
    ],
    beneficios: [
      'Automatización total',
      'Integración con cualquier sistema',
      'Flexibilidad máxima',
    ],
    icon: Code,
    categoria: 'premium',
  },

  dedicated_support: {
    codigo: 'dedicated_support',
    nombre: 'Soporte Dedicado',
    descripcionCorta: 'Account manager y soporte 24/7',
    descripcionLarga: 'Un account manager dedicado a tu cuenta. Soporte prioritario 24/7, formación mensual para tu equipo, revisiones trimestrales de tu uso de la plataforma, y acceso anticipado a nuevas funcionalidades.',
    funcionalidades: [
      'Account manager dedicado',
      'Soporte 24/7 prioritario',
      'Formación mensual',
      'Revisiones trimestrales',
      'Acceso anticipado a betas',
      'Canal directo de comunicación',
    ],
    casosDeUso: [
      'Resolver dudas complejas rápidamente',
      'Formar nuevos empleados',
      'Optimizar el uso de la plataforma',
    ],
    beneficios: [
      'Nunca te quedas bloqueado',
      'Maximiza el ROI de INMOVA',
      'Relación de socio, no proveedor',
    ],
    icon: HeadphonesIcon,
    categoria: 'premium',
  },

  seguridad_compliance: {
    codigo: 'seguridad_compliance',
    nombre: 'Seguridad y Compliance',
    descripcionCorta: 'Verificación biométrica, GDPR y detección de fraude',
    descripcionLarga: 'Máxima seguridad para tu negocio. Verificación biométrica de identidad, cumplimiento automático de GDPR, detección de fraude en documentos, auditoría de accesos y cifrado avanzado.',
    funcionalidades: [
      'Verificación biométrica de identidad',
      'Cumplimiento GDPR automático',
      'Detección de documentos fraudulentos',
      'Auditoría completa de accesos',
      'Cifrado de datos sensibles',
      'Alertas de seguridad',
    ],
    casosDeUso: [
      'Verificar que el DNI es auténtico',
      'Cumplir con GDPR sin esfuerzo',
      'Detectar nóminas falsificadas',
    ],
    beneficios: [
      'Protege tu negocio del fraude',
      'Cumplimiento legal garantizado',
      'Tranquilidad total',
    ],
    icon: Lock,
    categoria: 'premium',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS VERTICALES (Alquiler Vacacional, Coliving, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  str_listings: {
    codigo: 'str_listings',
    nombre: 'STR - Anuncios',
    descripcionCorta: 'Gestión de anuncios de alquiler vacacional',
    descripcionLarga: 'Gestiona tus anuncios de Airbnb, Booking, Vrbo desde un solo lugar. Sincroniza calendarios, precios y contenido. Optimiza tus listings para más reservas.',
    funcionalidades: [
      'Sincronización con Airbnb, Booking, Vrbo',
      'Calendario unificado',
      'Gestión de precios por canal',
      'Optimización de descripciones',
      'Fotos y contenido centralizado',
      'Estadísticas de rendimiento',
    ],
    casosDeUso: [
      'Gestionar 5 pisos en Airbnb y Booking',
      'Evitar overbookings con calendario único',
      'Optimizar títulos para más visibilidad',
    ],
    beneficios: [
      'Un solo lugar para todo',
      'Evita dobles reservas',
      'Más visibilidad = más reservas',
    ],
    icon: Hotel,
    categoria: 'verticales',
  },

  str_bookings: {
    codigo: 'str_bookings',
    nombre: 'STR - Reservas',
    descripcionCorta: 'Gestión de reservas de alquiler vacacional',
    descripcionLarga: 'Centraliza todas las reservas de tus canales. Gestiona check-in/check-out, comunica con huéspedes, automatiza mensajes, genera informes de ocupación.',
    funcionalidades: [
      'Vista unificada de reservas',
      'Gestión de check-in/check-out',
      'Comunicación con huéspedes',
      'Mensajes automáticos',
      'Informes de ocupación',
      'Historial de huéspedes',
    ],
    casosDeUso: [
      'Ver todas las reservas de la semana',
      'Enviar instrucciones de check-in automáticas',
      'Analizar ocupación mensual',
    ],
    beneficios: [
      'Control total de reservas',
      'Comunicación automatizada',
      'Menos trabajo manual',
    ],
    icon: Calendar,
    categoria: 'verticales',
  },

  str_channels: {
    codigo: 'str_channels',
    nombre: 'STR - Channel Manager',
    descripcionCorta: 'Sincronización avanzada con OTAs',
    descripcionLarga: 'Channel manager profesional para sincronizar disponibilidad, precios y contenido con todos los canales de distribución. Conexión API directa con Airbnb, Booking.com, Vrbo, Expedia y más.',
    funcionalidades: [
      'Sincronización en tiempo real',
      'Conexión API directa con OTAs',
      'Gestión de tarifas por canal',
      'Promociones y ofertas',
      'Informes por canal',
      'Alertas de sincronización',
    ],
    casosDeUso: [
      'Actualizar precio en todos los canales al instante',
      'Crear una oferta de última hora',
      'Ver qué canal genera más ingresos',
    ],
    beneficios: [
      'Sincronización instantánea',
      'Maximiza distribución',
      'Análisis de canales',
    ],
    icon: Share2,
    categoria: 'verticales',
  },

  room_rental: {
    codigo: 'room_rental',
    nombre: 'Alquiler por Habitaciones',
    descripcionCorta: 'Gestión de pisos compartidos',
    descripcionLarga: 'Especializado para alquiler por habitaciones y coliving. Gestiona inquilinos individuales en pisos compartidos, zonas comunes, gastos compartidos, matching de compañeros.',
    funcionalidades: [
      'Gestión de habitaciones individuales',
      'Zonas comunes compartidas',
      'División de gastos',
      'Matching de compañeros',
      'Contratos individuales por habitación',
      'Inventario compartido',
    ],
    casosDeUso: [
      'Gestionar un piso de 4 habitaciones',
      'Dividir gastos de agua y luz',
      'Encontrar compañero compatible para una vacante',
    ],
    beneficios: [
      'Herramienta específica para compartir',
      'Gestión justa de gastos',
      'Menos conflictos entre inquilinos',
    ],
    icon: Users,
    categoria: 'verticales',
  },

  flipping_projects: {
    codigo: 'flipping_projects',
    nombre: 'House Flipping',
    descripcionCorta: 'Gestión de proyectos de rehabilitación',
    descripcionLarga: 'Para inversores en house flipping. Gestiona la compra, rehabilitación y venta de propiedades. Controla presupuestos, cronogramas, proveedores y analiza la rentabilidad de cada flip.',
    funcionalidades: [
      'Pipeline de proyectos',
      'Control de presupuesto vs real',
      'Cronograma de obra',
      'Gestión de proveedores',
      'Análisis de rentabilidad (ROI)',
      'Documentación del proyecto',
    ],
    casosDeUso: [
      'Gestionar 3 flips simultáneos',
      'Controlar que la reforma no se pase de presupuesto',
      'Calcular la rentabilidad real después de vender',
    ],
    beneficios: [
      'Control total del proyecto',
      'Maximiza beneficios',
      'Aprende de cada operación',
    ],
    icon: HardHat,
    categoria: 'verticales',
  },

  construction_projects: {
    codigo: 'construction_projects',
    nombre: 'Proyectos de Construcción',
    descripcionCorta: 'Gestión de obra nueva y promociones',
    descripcionLarga: 'Para promotores inmobiliarios. Gestiona proyectos de obra nueva desde la concepción hasta la entrega. Control de fases, licencias, comercialización, entregas de llaves.',
    funcionalidades: [
      'Fases del proyecto',
      'Gestión de licencias',
      'Comercialización de unidades',
      'Control de costes de obra',
      'Entregas de llaves',
      'Documentación técnica',
    ],
    casosDeUso: [
      'Gestionar una promoción de 20 viviendas',
      'Controlar el estado de licencias',
      'Comercializar unidades antes de finalizar obra',
    ],
    beneficios: [
      'Visión integral del proyecto',
      'Control de toda la cadena',
      'Profesionalización de la promoción',
    ],
    icon: Building,
    categoria: 'verticales',
  },

  alquiler_comercial: {
    codigo: 'alquiler_comercial',
    nombre: 'Alquiler Comercial',
    descripcionCorta: 'Gestión de locales y oficinas',
    descripcionLarga: 'Especializado para locales comerciales, oficinas y naves. Contratos complejos, escalado de rentas, traspasos, fianzas elevadas, IVA, adaptaciones de local.',
    funcionalidades: [
      'Contratos comerciales complejos',
      'Escalado de rentas (IPC, fijo)',
      'Gestión de traspasos',
      'Fianzas y avales bancarios',
      'Facturación con IVA',
      'Adaptaciones de local',
    ],
    casosDeUso: [
      'Gestionar un local con renta escalable',
      'Tramitar un traspaso de negocio',
      'Facturar con IVA a empresas',
    ],
    beneficios: [
      'Contratos adaptados a comercial',
      'Facturación correcta',
      'Gestión de operaciones complejas',
    ],
    icon: Store,
    categoria: 'verticales',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS DE COMUNIDAD / COLIVING
  // ═══════════════════════════════════════════════════════════════════════════
  votaciones: {
    codigo: 'votaciones',
    nombre: 'Votaciones Digitales',
    descripcionCorta: 'Juntas y votaciones online',
    descripcionLarga: 'Organiza juntas de propietarios o comunidades de forma digital. Crea votaciones, recoge votos online, calcula mayorías automáticamente, genera actas. Ideal para administradores de fincas.',
    funcionalidades: [
      'Creación de votaciones',
      'Voto online seguro',
      'Cálculo automático de mayorías',
      'Generación de actas',
      'Delegación de voto',
      'Historial de votaciones',
    ],
    casosDeUso: [
      'Votar una derrama de forma online',
      'Aprobar presupuesto de la comunidad',
      'Tomar decisiones sin reunirse presencialmente',
    ],
    beneficios: [
      'Juntas más ágiles',
      'Mayor participación',
      'Decisiones documentadas',
    ],
    icon: Vote,
    categoria: 'avanzado',
  },

  ai_assistant: {
    codigo: 'ai_assistant',
    nombre: 'Asistente IA',
    descripcionCorta: 'Chatbot inteligente para consultas',
    descripcionLarga: 'Un asistente virtual con IA que responde consultas de inquilinos 24/7, ayuda a redactar comunicaciones, genera informes y sugiere acciones basándose en tus datos.',
    funcionalidades: [
      'Chatbot 24/7 para inquilinos',
      'Redacción asistida de textos',
      'Resumen de situación por propiedad',
      'Sugerencias proactivas',
      'Respuestas en múltiples idiomas',
      'Integración con el chat interno',
    ],
    casosDeUso: [
      'Inquilino pregunta horarios de la piscina a las 3am',
      'Redactar un email de reclamación de impago',
      'Obtener resumen ejecutivo de una propiedad',
    ],
    beneficios: [
      'Atención 24/7 sin esfuerzo',
      'Comunicaciones más profesionales',
      'Ahorra tiempo en tareas repetitivas',
    ],
    icon: MessageSquare,
    categoria: 'premium',
  },

  galerias: {
    codigo: 'galerias',
    nombre: 'Galerías Multimedia',
    descripcionCorta: 'Fotos y vídeos de propiedades',
    descripcionLarga: 'Gestiona las fotos y vídeos de tus propiedades de forma organizada. Antes/después de reformas, estado de entradas, inspecciones. Etiqueta, ordena y comparte fácilmente.',
    funcionalidades: [
      'Galería ilimitada por propiedad',
      'Etiquetas y categorías',
      'Antes/después de reformas',
      'Vídeos e imágenes 360°',
      'Compartir por enlace',
      'Descarga masiva',
    ],
    casosDeUso: [
      'Documentar el estado antes de una entrada',
      'Mostrar fotos de reforma a un propietario',
      'Compartir galería con potencial comprador',
    ],
    beneficios: [
      'Todo organizado y accesible',
      'Evidencia documental',
      'Presentaciones profesionales',
    ],
    icon: Image,
    categoria: 'gestion',
  },

  recordatorios_auto: {
    codigo: 'recordatorios_auto',
    nombre: 'Recordatorios Automáticos',
    descripcionCorta: 'Notificaciones programadas',
    descripcionLarga: 'Automatiza recordatorios para ti y tus inquilinos: pagos próximos, revisiones de ITV de garajes, caducidad de certificados, vencimientos de contratos. Configura una vez, olvídate para siempre.',
    funcionalidades: [
      'Recordatorios de pago a inquilinos',
      'Alertas de vencimiento de documentos',
      'Revisiones programadas',
      'Personalización de mensajes',
      'Múltiples canales (email, SMS, push)',
      'Programación flexible',
    ],
    casosDeUso: [
      'Recordar pago 3 días antes del vencimiento',
      'Alertar de caducidad de certificado energético',
      'Notificar renovación de seguro',
    ],
    beneficios: [
      'Menos impagos',
      'Cumplimiento de obligaciones',
      'Trabajo automatizado',
    ],
    icon: Clock,
    categoria: 'gestion',
  },
};

/**
 * Obtiene la descripción completa de un módulo
 */
export function getModuleDescription(codigo: string): ModuleDescription | undefined {
  return MODULE_DESCRIPTIONS[codigo];
}

/**
 * Obtiene módulos por categoría
 */
export function getModulesByCategory(categoria: ModuleDescription['categoria']): ModuleDescription[] {
  return Object.values(MODULE_DESCRIPTIONS).filter(m => m.categoria === categoria);
}

/**
 * Obtiene todos los módulos ordenados por categoría
 */
export function getAllModulesGroupedByCategory(): Record<string, ModuleDescription[]> {
  const grouped: Record<string, ModuleDescription[]> = {};
  
  for (const module of Object.values(MODULE_DESCRIPTIONS)) {
    if (!grouped[module.categoria]) {
      grouped[module.categoria] = [];
    }
    grouped[module.categoria].push(module);
  }
  
  return grouped;
}

/**
 * Categorías con información visual
 */
export const CATEGORY_INFO: Record<string, { nombre: string; descripcion: string; color: string }> = {
  core: {
    nombre: 'Módulos Esenciales',
    descripcion: 'Funcionalidades básicas incluidas en todos los planes',
    color: 'bg-blue-100 text-blue-800',
  },
  gestion: {
    nombre: 'Gestión Básica',
    descripcion: 'Herramientas para la gestión diaria de propiedades',
    color: 'bg-green-100 text-green-800',
  },
  financiero: {
    nombre: 'Financiero',
    descripcion: 'Control de ingresos, gastos y contabilidad',
    color: 'bg-purple-100 text-purple-800',
  },
  comunicacion: {
    nombre: 'Comunicación',
    descripcion: 'Herramientas de comunicación con inquilinos y equipo',
    color: 'bg-orange-100 text-orange-800',
  },
  avanzado: {
    nombre: 'Funcionalidades Avanzadas',
    descripcion: 'IA, analytics y herramientas para profesionales',
    color: 'bg-red-100 text-red-800',
  },
  portales: {
    nombre: 'Portales de Acceso',
    descripcion: 'Áreas privadas para inquilinos y propietarios',
    color: 'bg-indigo-100 text-indigo-800',
  },
  verticales: {
    nombre: 'Verticales de Negocio',
    descripcion: 'Módulos específicos para cada tipo de negocio',
    color: 'bg-teal-100 text-teal-800',
  },
  premium: {
    nombre: 'Premium',
    descripcion: 'Funcionalidades avanzadas para maximizar resultados',
    color: 'bg-amber-100 text-amber-800',
  },
};
