import React from 'react';
import { Step } from 'react-joyride';

// Tipo local para BusinessVertical (replica el enum de Prisma)
export type BusinessVertical =
  | 'alquiler_tradicional'
  | 'str_vacacional'
  | 'coliving'
  | 'construccion'
  | 'flipping'
  | 'servicios_profesionales'
  | 'mixto';

// Definición de tours por vertical
export interface OnboardingStep extends Step {
  target: string;
  content: React.ReactNode | string;
  disableBeacon?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
}

export interface VerticalTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  setupActions: SetupAction[];
}

export interface SetupAction {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  completed: boolean;
  weight: number; // Peso para calcular % de completitud
}

// Tours específicos por vertical
export const VERTICAL_TOURS: Record<BusinessVertical, VerticalTour> = {
  alquiler_tradicional: {
    id: 'alquiler_tradicional',
    name: 'Alquiler Tradicional',
    description: 'Configuración inicial para gestión de alquileres tradicionales',
    steps: [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-indigo-600">¡Bienvenido a INMOVA!</h3>
            <p className="text-sm">
              Te guiaremos paso a paso para configurar tu plataforma de alquiler tradicional.
            </p>
            <p className="text-sm font-medium">Duración estimada: 5 minutos</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="edificios-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 1: Crear tu primer edificio</h4>
            <p className="text-sm">Comienza registrando las propiedades que gestionas.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="unidades-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 2: Añadir unidades</h4>
            <p className="text-sm">Define las unidades o apartamentos dentro de tus edificios.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="inquilinos-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 3: Registrar inquilinos</h4>
            <p className="text-sm">Gestiona los datos de tus inquilinos de forma centralizada.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="contratos-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 4: Crear contratos</h4>
            <p className="text-sm">
              Formaliza la relación con tus inquilinos mediante contratos digitales.
            </p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="dashboard-link"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">¡Perfecto!</h4>
            <p className="text-sm">
              Ahora puedes ver todas tus métricas en tiempo real en el dashboard.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Tip: Completa las acciones sugeridas para un setup óptimo.
            </p>
          </div>
        ),
        placement: 'bottom',
      },
    ],
    setupActions: [
      {
        id: 'crear_edificio',
        title: 'Crear primer edificio',
        description: 'Registra tu primera propiedad',
        route: '/edificios/nuevo',
        icon: 'Building2',
        completed: false,
        weight: 25,
      },
      {
        id: 'anadir_unidades',
        title: 'Añadir unidades',
        description: 'Define al menos 3 unidades',
        route: '/unidades/nuevo',
        icon: 'Home',
        completed: false,
        weight: 20,
      },
      {
        id: 'registrar_inquilino',
        title: 'Registrar inquilino',
        description: 'Añade tu primer inquilino',
        route: '/inquilinos/nuevo',
        icon: 'Users',
        completed: false,
        weight: 20,
      },
      {
        id: 'crear_contrato',
        title: 'Crear contrato',
        description: 'Genera tu primer contrato',
        route: '/contratos/nuevo',
        icon: 'FileText',
        completed: false,
        weight: 20,
      },
      {
        id: 'configurar_pagos',
        title: 'Configurar pagos',
        description: 'Establece recordatorios de pago',
        route: '/pagos',
        icon: 'CreditCard',
        completed: false,
        weight: 15,
      },
    ],
  },

  coliving: {
    id: 'coliving',
    name: 'Coliving',
    description: 'Configuración para espacios de co-living',
    steps: [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-purple-600">¡Bienvenido a INMOVA Coliving!</h3>
            <p className="text-sm">
              Configuraremos tu espacio de coliving con todas las herramientas necesarias.
            </p>
            <p className="text-sm font-medium">Duración estimada: 6 minutos</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="room-rental-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 1: Configurar habitaciones</h4>
            <p className="text-sm">Gestiona habitaciones individuales y áreas comunes.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="espacios-comunes-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 2: Definir espacios comunes</h4>
            <p className="text-sm">Configura salas de estar, cocinas compartidas, etc.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="comunidad-social-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 3: Activar comunidad social</h4>
            <p className="text-sm">
              Fomenta la interacción entre residents con herramientas sociales.
            </p>
          </div>
        ),
        placement: 'right',
      },
    ],
    setupActions: [
      {
        id: 'configurar_habitaciones',
        title: 'Configurar habitaciones',
        description: 'Define las habitaciones disponibles',
        route: '/room-rental',
        icon: 'Home',
        completed: false,
        weight: 30,
      },
      {
        id: 'definir_reglas',
        title: 'Definir reglas de convivencia',
        description: 'Establece normas claras',
        route: '/room-rental',
        icon: 'FileText',
        completed: false,
        weight: 20,
      },
      {
        id: 'espacios_comunes',
        title: 'Gestionar espacios comunes',
        description: 'Configura áreas compartidas',
        route: '/reservas',
        icon: 'Users',
        completed: false,
        weight: 20,
      },
      {
        id: 'activar_comunidad',
        title: 'Activar comunidad social',
        description: 'Habilita el módulo social',
        route: '/comunidad-social',
        icon: 'MessageCircle',
        completed: false,
        weight: 30,
      },
    ],
  },

  str_vacacional: {
    id: 'str_vacacional',
    name: 'Alquiler Turístico (STR)',
    description: 'Configuración para alquileres de corta estancia',
    steps: [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-pink-600">¡Bienvenido a INMOVA STR!</h3>
            <p className="text-sm">
              Configuraremos tu gestión de alquileres turísticos con channel manager integrado.
            </p>
            <p className="text-sm font-medium">Duración estimada: 7 minutos</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="str-listings-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 1: Crear anuncios</h4>
            <p className="text-sm">Configura tus propiedades para plataformas turísticas.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="str-channels-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 2: Sincronizar canales</h4>
            <p className="text-sm">Conecta con Airbnb, Booking.com y más.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="str-pricing-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 3: Precios dinámicos</h4>
            <p className="text-sm">Optimiza tus tarifas con IA.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="str-housekeeping-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 4: Gestión de limpieza</h4>
            <p className="text-sm">Coordina el servicio entre reservas.</p>
          </div>
        ),
        placement: 'right',
      },
    ],
    setupActions: [
      {
        id: 'crear_listings',
        title: 'Crear anuncios',
        description: 'Configura tus primeros anuncios',
        route: '/str/listings',
        icon: 'Home',
        completed: false,
        weight: 25,
      },
      {
        id: 'conectar_canales',
        title: 'Conectar canales',
        description: 'Integra con Airbnb/Booking',
        route: '/str/channels',
        icon: 'Link',
        completed: false,
        weight: 30,
      },
      {
        id: 'configurar_precios',
        title: 'Configurar precios dinámicos',
        description: 'Activa pricing inteligente',
        route: '/str/pricing',
        icon: 'DollarSign',
        completed: false,
        weight: 20,
      },
      {
        id: 'setup_limpieza',
        title: 'Setup de limpieza',
        description: 'Gestiona el housekeeping',
        route: '/str-housekeeping',
        icon: 'ClipboardList',
        completed: false,
        weight: 15,
      },
      {
        id: 'calendario_reservas',
        title: 'Calendario de reservas',
        description: 'Sincroniza disponibilidad',
        route: '/str/bookings',
        icon: 'Calendar',
        completed: false,
        weight: 10,
      },
    ],
  },

  flipping: {
    id: 'flipping',
    name: 'House Flipping',
    description: 'Gestión de proyectos de compra-reforma-venta',
    steps: [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-orange-600">¡Bienvenido a INMOVA Flipping!</h3>
            <p className="text-sm">Gestiona tus proyectos de inversión inmobiliaria end-to-end.</p>
            <p className="text-sm font-medium">Duración estimada: 5 minutos</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="flipping-projects-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 1: Crear proyecto</h4>
            <p className="text-sm">Define los detalles de tu inversión.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="gastos-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 2: Registrar gastos</h4>
            <p className="text-sm">Controla todos los costes del proyecto.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="valoraciones-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 3: Valoración de propiedad</h4>
            <p className="text-sm">Estima el valor post-reforma.</p>
          </div>
        ),
        placement: 'right',
      },
    ],
    setupActions: [
      {
        id: 'crear_proyecto',
        title: 'Crear proyecto',
        description: 'Define tu primer proyecto de flipping',
        route: '/flipping/projects',
        icon: 'Hammer',
        completed: false,
        weight: 30,
      },
      {
        id: 'registrar_compra',
        title: 'Registrar compra',
        description: 'Documenta la adquisición',
        route: '/flipping/projects',
        icon: 'ShoppingCart',
        completed: false,
        weight: 20,
      },
      {
        id: 'planificar_reforma',
        title: 'Planificar reforma',
        description: 'Define scope y presupuesto',
        route: '/flipping/projects',
        icon: 'Wrench',
        completed: false,
        weight: 25,
      },
      {
        id: 'valoracion_final',
        title: 'Valoración post-reforma',
        description: 'Estima el ARV (After Repair Value)',
        route: '/valoraciones',
        icon: 'TrendingUp',
        completed: false,
        weight: 25,
      },
    ],
  },

  construccion: {
    id: 'construccion',
    name: 'Construcción/Desarrollo',
    description: 'Gestión de proyectos de construcción',
    steps: [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-blue-600">¡Bienvenido a INMOVA Construction!</h3>
            <p className="text-sm">
              Gestiona proyectos de construcción desde la planificación hasta la entrega.
            </p>
            <p className="text-sm font-medium">Duración estimada: 6 minutos</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="construction-projects-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 1: Crear proyecto</h4>
            <p className="text-sm">Define la obra y sus fases.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="proveedores-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 2: Gestionar proveedores</h4>
            <p className="text-sm">Coordina con contratistas y suppliers.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="inspecciones-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 3: Programar inspecciones</h4>
            <p className="text-sm">Garantiza la calidad en cada fase.</p>
          </div>
        ),
        placement: 'right',
      },
    ],
    setupActions: [
      {
        id: 'crear_proyecto_construccion',
        title: 'Crear proyecto',
        description: 'Inicia tu proyecto de construcción',
        route: '/construction/projects',
        icon: 'Building',
        completed: false,
        weight: 30,
      },
      {
        id: 'anadir_proveedores',
        title: 'Añadir proveedores',
        description: 'Registra contractors clave',
        route: '/proveedores',
        icon: 'Users',
        completed: false,
        weight: 20,
      },
      {
        id: 'planificar_fases',
        title: 'Planificar fases',
        description: 'Define milestones del proyecto',
        route: '/construction/projects',
        icon: 'GitBranch',
        completed: false,
        weight: 25,
      },
      {
        id: 'setup_inspecciones',
        title: 'Setup de inspecciones',
        description: 'Programa quality checks',
        route: '/inspecciones',
        icon: 'ClipboardCheck',
        completed: false,
        weight: 25,
      },
    ],
  },

  servicios_profesionales: {
    id: 'servicios_profesionales',
    name: 'Servicios Profesionales',
    description: 'Para arquitectos, topógrafos y consultores',
    steps: [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-teal-600">¡Bienvenido a INMOVA Professional!</h3>
            <p className="text-sm">
              Gestiona proyectos profesionales y clientes de forma eficiente.
            </p>
            <p className="text-sm font-medium">Duración estimada: 5 minutos</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="professional-projects-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 1: Crear proyecto</h4>
            <p className="text-sm">Define los detalles del encargo.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="crm-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 2: Gestionar clientes (CRM)</h4>
            <p className="text-sm">Mantén el pipeline de proyectos organizado.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: '[data-tour="documentos-menu"]',
        content: (
          <div className="space-y-2">
            <h4 className="font-semibold">Paso 3: Gestión documental</h4>
            <p className="text-sm">Centraliza planos, informes y contratos.</p>
          </div>
        ),
        placement: 'right',
      },
    ],
    setupActions: [
      {
        id: 'crear_proyecto_professional',
        title: 'Crear proyecto',
        description: 'Inicia tu primer proyecto',
        route: '/professional/projects',
        icon: 'Briefcase',
        completed: false,
        weight: 30,
      },
      {
        id: 'setup_crm',
        title: 'Configurar CRM',
        description: 'Importa o crea leads',
        route: '/crm',
        icon: 'Users',
        completed: false,
        weight: 25,
      },
      {
        id: 'organizar_documentos',
        title: 'Organizar documentos',
        description: 'Estructura tu sistema de archivos',
        route: '/documentos',
        icon: 'FolderOpen',
        completed: false,
        weight: 20,
      },
      {
        id: 'configurar_facturacion',
        title: 'Configurar facturación',
        description: 'Establece honorarios y pagos',
        route: '/contabilidad',
        icon: 'Receipt',
        completed: false,
        weight: 25,
      },
    ],
  },

  mixto: {
    id: 'mixto',
    name: 'Modelo Mixto',
    description: 'Configuración para múltiples verticales de negocio',
    steps: [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Bienvenido a INMOVA - Modelo Mixto</h3>
            <p className="text-sm">
              Has seleccionado un modelo mixto. Esta configuración te permite gestionar múltiples
              tipos de propiedades y negocios inmobiliarios.
            </p>
            <p className="text-sm font-medium">Duración estimada: 5 minutos</p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
    ],
    setupActions: [
      {
        id: 'crear_primera_propiedad',
        title: 'Crear primera propiedad',
        description: 'Añade tu primera propiedad al sistema',
        route: '/inmuebles',
        icon: 'Building',
        completed: false,
        weight: 40,
      },
      {
        id: 'configurar_usuarios',
        title: 'Configurar usuarios',
        description: 'Invita a tu equipo y asigna roles',
        route: '/configuracion/usuarios',
        icon: 'Users',
        completed: false,
        weight: 30,
      },
      {
        id: 'configurar_facturacion',
        title: 'Configurar facturación',
        description: 'Establece tus preferencias de facturación',
        route: '/contabilidad',
        icon: 'Receipt',
        completed: false,
        weight: 30,
      },
    ],
  },
};

// Función para obtener el tour del usuario según su vertical
export function getUserVerticalTour(vertical?: BusinessVertical | null): VerticalTour | null {
  if (!vertical) return null;
  return VERTICAL_TOURS[vertical] || null;
}

// Función para calcular el progreso del setup
export function calculateSetupProgress(actions: SetupAction[]): number {
  if (actions.length === 0) return 0;

  const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0);
  const completedWeight = actions
    .filter((action) => action.completed)
    .reduce((sum, action) => sum + action.weight, 0);

  return Math.round((completedWeight / totalWeight) * 100);
}

// Función para obtener la siguiente acción recomendada
export function getNextRecommendedAction(actions: SetupAction[]): SetupAction | null {
  const incompleteActions = actions.filter((action) => !action.completed);
  if (incompleteActions.length === 0) return null;

  // Retornar la acción incompleta con mayor peso
  return incompleteActions.sort((a, b) => b.weight - a.weight)[0];
}
