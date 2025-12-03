/**
 * CONFIGURACIONES DE ONBOARDING PERSONALIZADAS POR MODELO DE NEGOCIO
 * Este archivo define los tours de onboarding adaptados a cada tipo de usuario
 */

export type ModeloNegocio = 
  | 'alquiler_tradicional'
  | 'room_rental'
  | 'str'
  | 'flipping'
  | 'construccion'
  | 'profesional'
  | 'comunidades'
  | 'general';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: { label: string; route: string };
  icon: string;
  videoUrl?: string;
  helpArticle?: string;
}

export const ONBOARDING_ALQUILER_TRADICIONAL: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a INMOVA!',
    description: 'Vamos a configurar tu sistema de gestión de alquileres. Este proceso tomará solo 3 minutos y te ayudará a digitalizar completamente tu negocio.',
    icon: '🎉'
  },
  {
    id: 'import_option',
    title: '¿Tienes datos existentes?',
    description: 'Si ya gestionas propiedades, podemos importar tus datos desde Excel o CSV. Si prefieres, también puedes empezar desde cero con datos de ejemplo.',
    icon: '📂',
    action: { label: 'Configurar importación', route: '/admin/importar' }
  },
  {
    id: 'buildings',
    title: 'Paso 1: Crea tu primera propiedad',
    description: 'Una propiedad puede ser un edificio completo, una casa o cualquier inmueble. Después podrás añadir unidades (apartamentos, locales, etc.) dentro de ella.',
    action: { label: 'Crear propiedad con asistente', route: '/edificios/nuevo?wizard=true' },
    icon: '🏢',
    videoUrl: '/videos/crear-primera-propiedad.mp4'
  },
  {
    id: 'units',
    title: 'Paso 2: Define tus unidades',
    description: 'Las unidades son los espacios alquilables (apartamentos, locales, oficinas). Cada unidad puede tener su propio contrato e inquilino.',
    action: { label: 'Ver unidades', route: '/unidades' },
    icon: '🏠'
  },
  {
    id: 'contracts',
    title: 'Paso 3: Crea contratos',
    description: 'Usa nuestras plantillas predefinidas para generar contratos profesionales en segundos. Puedes personalizarlas según tus necesidades.',
    action: { label: 'Crear primer contrato', route: '/contratos/nuevo?template=true' },
    icon: '📝'
  },
  {
    id: 'payments',
    title: 'Paso 4: Configura cobros automáticos',
    description: 'Automatiza el seguimiento de pagos, envía recordatorios y genera recibos automáticamente. Puedes integrar Stripe, transferencias o efectivo.',
    action: { label: 'Configurar pagos', route: '/pagos?setup=true' },
    icon: '💳'
  },
  {
    id: 'dashboard',
    title: '¡Todo listo! Tu panel ya funciona',
    description: 'Desde el dashboard verás tus KPIs, ingresos, ocupación y alertas. Explora los 88 módulos disponibles para personalizar tu experiencia.',
    action: { label: 'Ir al Dashboard', route: '/dashboard' },
    icon: '📊'
  }
];

export const ONBOARDING_ROOM_RENTAL: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al módulo de Alquiler por Habitaciones!',
    description: 'Vamos a configurar tu sistema para gestionar pisos compartidos o coliving. Incluye prorrateo automático de gastos y gestión de convivencia.',
    icon: '🏚️'
  },
  {
    id: 'shared_home',
    title: 'Paso 1: Crea tu vivienda compartida',
    description: 'Define la vivienda que vas a compartir. Indica cuántas habitaciones tiene y qué zonas comunes se comparten (cocina, baño, salón).',
    action: { label: 'Crear vivienda compartida', route: '/room-rental?wizard=shared-home' },
    icon: '🏠'
  },
  {
    id: 'rooms',
    title: 'Paso 2: Define cada habitación',
    description: 'Crea una ficha para cada habitación con su precio mensual, características (baño privado, exterior, etc.) y fotos.',
    action: { label: 'Añadir habitaciones', route: '/room-rental?wizard=rooms' },
    icon: '🚪'
  },
  {
    id: 'expense_split',
    title: 'Paso 3: Configura prorrateo de gastos',
    description: 'Define cómo se reparten los gastos comunes (luz, agua, internet). Puedes hacerlo por igual, por porcentaje o personalizado.',
    action: { label: 'Configurar prorrateo', route: '/room-rental?wizard=expenses' },
    icon: '🧠',
    videoUrl: '/videos/prorrateo-gastos.mp4'
  },
  {
    id: 'house_rules',
    title: 'Paso 4: Normas de convivencia',
    description: 'Establece las reglas de la vivienda (horarios, limpieza, visitas). Usa nuestra plantilla predefinida o crea la tuya propia.',
    action: { label: 'Definir normas', route: '/room-rental?wizard=rules' },
    icon: '📋'
  },
  {
    id: 'dashboard',
    title: '¡Listo para alquilar habitaciones!',
    description: 'Tu sistema de coliving está configurado. Ahora puedes publicar las habitaciones disponibles y gestionar inquilinos de forma sencilla.',
    action: { label: 'Ver dashboard Room Rental', route: '/room-rental' },
    icon: '✅'
  }
];

export const ONBOARDING_STR: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al Channel Manager STR!',
    description: 'Vamos a centralizar la gestión de tus alquileres vacacionales. Podrás sincronizar Airbnb, Booking y otras plataformas en un solo lugar.',
    icon: '🏝️'
  },
  {
    id: 'existing_listings',
    title: '¿Ya tienes anuncios activos?',
    description: 'Si ya tienes propiedades en Airbnb, Booking u otras plataformas, podemos importarlas automáticamente. Si no, te ayudaremos a crear tus primeros anuncios.',
    action: { label: 'Conectar mis cuentas', route: '/str?wizard=connect' },
    icon: '🔗'
  },
  {
    id: 'channel_connection',
    title: 'Paso 1: Conecta tus canales',
    description: 'Sincroniza tus cuentas de Airbnb, Booking, Expedia y VRBO. La sincronización es bidireccional y en tiempo real.',
    action: { label: 'Conectar canales', route: '/str/channels?wizard=true' },
    icon: '🌐',
    videoUrl: '/videos/conectar-channel-manager.mp4'
  },
  {
    id: 'import_listings',
    title: 'Paso 2: Importar anuncios existentes',
    description: 'Detectaremos automáticamente tus anuncios actuales y los importaremos con toda su información (fotos, descripción, precios, calendarios).',
    action: { label: 'Importar anuncios', route: '/str/listings?import=true' },
    icon: '📎'
  },
  {
    id: 'dynamic_pricing',
    title: 'Paso 3: Activa precios dinámicos',
    description: 'Usa nuestro motor de pricing para ajustar automáticamente tus tarifas según demanda, temporada y competencia. Maximiza tus ingresos sin esfuerzo.',
    action: { label: 'Configurar pricing', route: '/str?wizard=pricing' },
    icon: '💰',
    helpArticle: '/docs/pricing-dinamico'
  },
  {
    id: 'dashboard',
    title: '¡Tu Channel Manager está activo!',
    description: 'Ahora puedes gestionar todas tus reservas, calendarios y precios desde un solo panel. Revisa tus métricas (RevPAR, ADR, ocupación) en tiempo real.',
    action: { label: 'Ver dashboard STR', route: '/str' },
    icon: '🚀'
  }
];

export const ONBOARDING_FLIPPING: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al módulo de House Flipping!',
    description: 'Vamos a configurar tu primer proyecto de inversión inmobiliaria. Haré el seguimiento completo: compra, reforma, venta y ROI.',
    icon: '💹'
  },
  {
    id: 'project_creation',
    title: 'Paso 1: Define tu proyecto',
    description: 'Introduce los datos básicos de la propiedad: precio de compra, ubicación, metros cuadrados y estado actual. Te mostraremos el precio/m² del mercado.',
    action: { label: 'Crear proyecto flipping', route: '/flipping?wizard=new-project' },
    icon: '🏠'
  },
  {
    id: 'budget',
    title: 'Paso 2: Presupuesto de reforma',
    description: 'Calcula el coste de la reforma por categorías (estructura, instalaciones, acabados). Te mostraremos benchmarks de €/m² típicos.',
    action: { label: 'Calcular presupuesto', route: '/flipping?wizard=budget' },
    icon: '🛠️',
    videoUrl: '/videos/calcular-presupuesto-reforma.mp4'
  },
  {
    id: 'sale_projection',
    title: 'Paso 3: Proyección de venta',
    description: 'Estima el precio de venta objetivo y el plazo previsto. Calcularemos el ROI y TIR en tiempo real mientras introduces los datos.',
    action: { label: 'Proyectar venta', route: '/flipping?wizard=sale' },
    icon: '🎯'
  },
  {
    id: 'financing',
    title: 'Paso 4: Financiación',
    description: '¿Cómo vas a financiar el proyecto? Define si usas capital propio, hipoteca, inversores o un modelo mixto. Ajustaremos la TIR.',
    action: { label: 'Configurar financiación', route: '/flipping?wizard=financing' },
    icon: '🏦'
  },
  {
    id: 'dashboard',
    title: '¡Proyecto creado y validado!',
    description: 'Tu proyecto de flipping está configurado. Ahora podrás hacer seguimiento de costes, plazos y ROI. Recibirás alertas si algo se desvía.',
    action: { label: 'Ver dashboard Flipping', route: '/flipping' },
    icon: '✅'
  }
];

export const ONBOARDING_CONSTRUCCION: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al módulo de Construcción!',
    description: 'Vamos a configurar tu proyecto de obra nueva o rehabilitación integral. Gestiona permisos, fases, agentes y viabilidad financiera.',
    icon: '🏗️'
  },
  {
    id: 'project_type',
    title: 'Paso 1: Tipo de proyecto',
    description: 'Define si es obra nueva residencial, terciaria, rehabilitación o promoción. Generaremos automáticamente el checklist de permisos necesarios.',
    action: { label: 'Configurar proyecto', route: '/construction?wizard=type' },
    icon: '📋'
  },
  {
    id: 'permits',
    title: 'Paso 2: Gestión de permisos',
    description: 'Te mostraremos todos los permisos y licencias necesarias con plazos estimados. Recibirás alertas antes de que caduquen.',
    action: { label: 'Ver checklist permisos', route: '/construction?wizard=permits' },
    icon: '📄',
    helpArticle: '/docs/permisos-construccion'
  },
  {
    id: 'agents',
    title: 'Paso 3: Añadir agentes',
    description: 'Registra a arquitecto, aparejador, constructor, gestoría y demás profesionales. Podrás asignarles tareas y hacer seguimiento.',
    action: { label: 'Añadir agentes', route: '/construction?wizard=agents' },
    icon: '👥'
  },
  {
    id: 'phases',
    title: 'Paso 4: Definir fases de obra',
    description: 'Planifica las fases del proyecto (cimentación, estructura, cerramientos, instalaciones, acabados). Incluye duración y presupuesto por fase.',
    action: { label: 'Planificar fases', route: '/construction?wizard=phases' },
    icon: '📆'
  },
  {
    id: 'dashboard',
    title: '¡Proyecto de construcción configurado!',
    description: 'Ya puedes gestionar tu obra desde el dashboard. Visualiza el Gantt, controla costes y recibe alertas de hitos críticos.',
    action: { label: 'Ver dashboard Construcción', route: '/construction' },
    icon: '✅'
  }
];

export const ONBOARDING_PROFESIONAL: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al módulo Profesional!',
    description: 'Configura tu sistema de facturación por horas para servicios de arquitectura, ingeniería o asesoría inmobiliaria.',
    icon: '💼'
  },
  {
    id: 'services',
    title: 'Paso 1: Define tus servicios',
    description: 'Crea tu catálogo de servicios con tarifas por hora o proyecto. Ejemplos: "Diseño arquitectónico", "Dirección de obra", "Asesoría legal".',
    action: { label: 'Crear servicios', route: '/professional?wizard=services' },
    icon: '📋'
  },
  {
    id: 'time_tracking',
    title: 'Paso 2: Time tracking',
    description: 'Activa el timer integrado para registrar horas trabajadas en cada proyecto. También puedes usar la app móvil.',
    action: { label: 'Configurar timer', route: '/professional?wizard=timer' },
    icon: '⏱️',
    videoUrl: '/videos/time-tracking.mp4'
  },
  {
    id: 'recurring_billing',
    title: 'Paso 3: Facturación recurrente',
    description: 'Configura facturación automática mensual para clientes con retainer. Las facturas se generarán y enviarán solas.',
    action: { label: 'Configurar facturación', route: '/professional?wizard=billing' },
    icon: '💳'
  },
  {
    id: 'portfolio',
    title: 'Paso 4: Crea tu portfolio público',
    description: 'Genera una web pública con tus proyectos, testimonios y formulario de contacto. Ideal para captar nuevos clientes.',
    action: { label: 'Crear portfolio', route: '/professional?wizard=portfolio' },
    icon: '🌐'
  },
  {
    id: 'dashboard',
    title: '¡Tu negocio profesional está listo!',
    description: 'Ahora puedes gestionar proyectos, facturar clientes y hacer seguimiento de tu rentabilidad. ¡Manos a la obra!',
    action: { label: 'Ver dashboard Profesional', route: '/professional' },
    icon: '✅'
  }
];

export const ONBOARDING_COMUNIDADES: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al módulo de Gestión de Comunidades!',
    description: 'Configura la administración de fincas: copropietarios, juntas, votaciones, derramas y espacios comunes.',
    icon: '🏛️'
  },
  {
    id: 'community_setup',
    title: 'Paso 1: Datos de la comunidad',
    description: 'Registra la finca (dirección, número de propietarios, CIF de la comunidad) y los espacios comunes (piscina, gimnasio, salón social).',
    action: { label: 'Crear comunidad', route: '/comunidad?wizard=setup' },
    icon: '🏛️'
  },
  {
    id: 'owners',
    title: 'Paso 2: Copropietarios',
    description: 'Añade los copropietarios con sus coeficientes de propiedad. Estos coeficientes se usarán para calcular derramas y cuotas.',
    action: { label: 'Añadir copropietarios', route: '/comunidad?wizard=owners' },
    icon: '👥'
  },
  {
    id: 'meetings',
    title: 'Paso 3: Convocar junta',
    description: 'Usa el asistente para convocar juntas (ordinarias o extraordinarias) con plantillas legales predefinidas. Envío automático certificado.',
    action: { label: 'Convocar junta', route: '/reuniones?wizard=true' },
    icon: '📅',
    videoUrl: '/videos/convocar-junta.mp4'
  },
  {
    id: 'voting',
    title: 'Paso 4: Sistema de votaciones',
    description: 'Activa votación electrónica para que los propietarios voten desde su móvil. Cálculo automático de mayorías y generación de actas.',
    action: { label: 'Configurar votaciones', route: '/votaciones?setup=true' },
    icon: '☑️'
  },
  {
    id: 'dashboard',
    title: '¡Comunidad configurada!',
    description: 'Tu sistema de gestión de comunidades está listo. Gestiona juntas, derramas, espacios comunes y comunicaciones desde un solo lugar.',
    action: { label: 'Ver dashboard Comunidades', route: '/dashboard' },
    icon: '✅'
  }
];

export const ONBOARDING_GENERAL: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a INMOVA! 👋',
    description: 'Te vamos a guiar en tus primeros pasos. Este tour te tomará solo 2 minutos y te ayudará a aprovechar al máximo todas las funcionalidades.',
    icon: '🎉'
  },
  {
    id: 'buildings',
    title: 'Paso 1: Crea tu primer edificio',
    description: 'Empieza registrando las propiedades que gestionas. Un edificio puede tener múltiples unidades (apartamentos, locales, etc.).',
    action: { label: 'Crear Edificio', route: '/edificios/nuevo' },
    icon: '🏢'
  },
  {
    id: 'units',
    title: 'Paso 2: Añade unidades',
    description: 'Registra los apartamentos, locales o habitaciones dentro de cada edificio. Cada unidad puede tener su propio contrato e inquilino.',
    action: { label: 'Ver Unidades', route: '/unidades' },
    icon: '🏠'
  },
  {
    id: 'tenants',
    title: 'Paso 3: Gestiona inquilinos',
    description: 'Añade los datos de tus inquilinos. Puedes vincularlos a contratos, ver su historial y comunicarte con ellos.',
    action: { label: 'Ver Inquilinos', route: '/inquilinos' },
    icon: '👥'
  },
  {
    id: 'dashboard',
    title: 'Tu Dashboard está listo',
    description: 'Desde el dashboard verás todos tus KPIs, alertas y métricas importantes. ¡También puedes explorar los 88 módulos disponibles!',
    action: { label: 'Ir al Dashboard', route: '/dashboard' },
    icon: '📊'
  }
];

export function getOnboardingSteps(modelo: ModeloNegocio): OnboardingStep[] {
  switch (modelo) {
    case 'alquiler_tradicional':
      return ONBOARDING_ALQUILER_TRADICIONAL;
    case 'room_rental':
      return ONBOARDING_ROOM_RENTAL;
    case 'str':
      return ONBOARDING_STR;
    case 'flipping':
      return ONBOARDING_FLIPPING;
    case 'construccion':
      return ONBOARDING_CONSTRUCCION;
    case 'profesional':
      return ONBOARDING_PROFESIONAL;
    case 'comunidades':
      return ONBOARDING_COMUNIDADES;
    case 'general':
    default:
      return ONBOARDING_GENERAL;
  }
}

export function getModeloFromUserPreferences(user: any): ModeloNegocio {
  // Lógica para detectar modelo de negocio preferido del usuario
  // Puede basarse en módulos activos, tipo de empresa, etc.
  
  if (user?.preferences?.modeloNegocio) {
    return user.preferences.modeloNegocio as ModeloNegocio;
  }
  
  // Si no hay preferencia, usar general
  return 'general';
}
