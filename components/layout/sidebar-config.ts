/**
 * CONFIGURACIÓN CENTRALIZADA DEL SIDEBAR
 * Organización por perfil con priorización inteligente
 */

import type { LucideIcon } from 'lucide-react';

export type UserRole = 'super_admin' | 'administrador' | 'gestor' | 'operador' | 'soporte' | 'community_manager';
export type BusinessVertical = 'alquiler_tradicional' | 'str_vacacional' | 'coliving' | 'room_rental' | 'construccion' | 'flipping' | 'servicios_profesionales' | 'comunidades' | 'mixto';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  dataTour?: string;
  badge?: string; // Para mostrar contadores
}

export interface NavSection {
  id: string;
  name: string;
  emoji: string;
  items: NavItem[];
  roles: UserRole[];
  defaultExpanded?: boolean; // Por defecto para TODOS los roles
  expandedByRole?: Partial<Record<UserRole, boolean>>; // Override por rol específico
  priority?: number; // Para ordenamiento (menor = más arriba)
  requiredVertical?: BusinessVertical[]; // Solo visible si empresa tiene esta vertical
}

/**
 * ESTADO INICIAL DE SECCIONES EXPANDIDAS POR ROL
 * Define qué secciones están expandidas por defecto según el perfil del usuario
 */
export const DEFAULT_EXPANDED_BY_ROLE: Record<UserRole, Record<string, boolean>> = {
  super_admin: {
    favorites: true,
    dashboard: true,
    superAdminPlatform: true, // CRÍTICO: Gestión de clientes
    administradorEmpresa: false,
    finanzas: false,
    analytics: false,
    operaciones: false,
    comunicaciones: false,
    documentosLegal: false,
    crmMarketing: false,
    automatizacion: false,
    innovacion: false,
    soporte: false,
    // Verticales colapsadas
    alquilerResidencial: false,
    str: false,
    coLiving: false,
    buildToRent: false,
    flipping: false,
    comercial: false,
    adminFincas: false,
  },
  administrador: {
    favorites: true,
    dashboard: true,
    analytics: true, // CRÍTICO: Toma de decisiones
    finanzas: true, // CRÍTICO: Flujo de caja
    alquilerResidencial: true, // Se ajusta dinámicamente según vertical
    str: false,
    coLiving: false,
    buildToRent: false,
    flipping: false,
    comercial: false,
    adminFincas: false,
    operaciones: false,
    comunicaciones: false,
    documentosLegal: false,
    crmMarketing: false,
    automatizacion: false,
    innovacion: false,
    soporte: false,
    administradorEmpresa: false,
  },
  gestor: {
    favorites: true,
    dashboard: true,
    misPropiedades: true, // CRÍTICO: Cartera asignada
    operaciones: true, // CRÍTICO: Tareas del día
    comunicaciones: true, // CRÍTICO: Coordinación
    gestion: false,
    reportes: false,
    finanzas: false,
    // No ve verticales específicas, solo "Mis Propiedades"
  },
  operador: {
    favorites: true,
    hoy: true, // CRÍTICO: Órdenes del día
    trabajos: true, // CRÍTICO: Backlog
    comunicacion: true, // CRÍTICO: Chat con gestor
    ubicaciones: false,
    reportes: false,
    miPerfil: false,
  },
  soporte: {
    favorites: true,
    dashboard: true,
    tickets: true, // CRÍTICO: Atención al cliente
    comunicacion: true, // CRÍTICO: Chat en vivo
    recursos: true, // CRÍTICO: Base de conocimientos
    clientes: false,
    reportes: false,
    miPerfil: false,
  },
  community_manager: {
    favorites: true,
    dashboard: true,
    comunidad: true, // CRÍTICO: Residentes y eventos
    comunicacion: true, // CRÍTICO: Engagement
    gestion: false,
    reportes: false,
    miPerfil: false,
  },
};

/**
 * ORDEN DE SECCIONES POR ROL
 * Define el orden de renderizado de las secciones según el perfil
 * (menor priority = más arriba)
 */
export const SECTION_ORDER_BY_ROLE: Record<UserRole, string[]> = {
  super_admin: [
    'favorites',
    'dashboard',
    'superAdminPlatform', // Prioridad 1
    'administradorEmpresa',
    'analytics',
    'finanzas',
    'operaciones',
    'comunicaciones',
    'documentosLegal',
    'crmMarketing',
    'automatizacion',
    'innovacion',
    'soporte',
  ],
  administrador: [
    'favorites',
    'dashboard',
    'analytics', // Prioridad 2
    'finanzas', // Prioridad 3
    'verticalPrimaria', // Placeholder dinámico - Prioridad 4
    'alquilerResidencial',
    'str',
    'coLiving',
    'buildToRent',
    'flipping',
    'comercial',
    'adminFincas',
    'operaciones', // Prioridad 5
    'comunicaciones',
    'crmMarketing',
    'documentosLegal',
    'automatizacion',
    'innovacion',
    'soporte',
    'administradorEmpresa', // Al final
  ],
  gestor: [
    'favorites',
    'dashboard',
    'misPropiedades', // Prioridad 1
    'operaciones', // Prioridad 2
    'comunicaciones', // Prioridad 3
    'gestion',
    'reportes',
    'finanzas',
    'miPerfil',
  ],
  operador: [
    'favorites',
    'hoy', // Prioridad 1
    'trabajos', // Prioridad 2
    'comunicacion', // Prioridad 3
    'ubicaciones',
    'reportes',
    'miPerfil',
  ],
  soporte: [
    'favorites',
    'dashboard',
    'tickets', // Prioridad 1
    'comunicacion', // Prioridad 2
    'recursos', // Prioridad 3
    'clientes',
    'reportes',
    'miPerfil',
  ],
  community_manager: [
    'favorites',
    'dashboard',
    'comunidad', // Prioridad 1
    'comunicacion', // Prioridad 2
    'gestion',
    'reportes',
    'miPerfil',
  ],
};

/**
 * NOMBRES DE SECCIONES ADAPTADOS POR ROL
 * Adapta la terminología según el contexto del usuario
 */
export const SECTION_NAMES_BY_ROLE: Record<UserRole, Record<string, string>> = {
  super_admin: {
    dashboard: '🏠 Dashboard Super Admin',
    finanzas: '💰 Facturación B2B',
    operaciones: '⚙️ Operaciones de Plataforma',
  },
  administrador: {
    dashboard: '🏠 Dashboard Ejecutivo',
    alquilerResidencial: '🏘️ Mis Propiedades',
    operaciones: '⚙️ Operaciones',
    finanzas: '💰 Finanzas',
    analytics: '📊 Analytics e IA',
  },
  gestor: {
    dashboard: '🏠 Dashboard Operativo',
    alquilerResidencial: '🏠 Mis Propiedades Asignadas',
    operaciones: '🔧 Operaciones del Día',
    finanzas: '💰 Pagos (Solo Lectura)',
  },
  operador: {
    dashboard: '🏠 Mi Dashboard',
    operaciones: '📋 Órdenes de Trabajo',
    trabajos: '🔧 Mis Trabajos',
    hoy: '📋 Hoy',
  },
  soporte: {
    dashboard: '🏠 Dashboard Soporte',
    comunicacion: '💬 Atención al Cliente',
  },
  community_manager: {
    dashboard: '🏠 Dashboard Comunidad',
    comunicacion: '💬 Engagement',
  },
};

/**
 * MAPEO DE VERTICAL DE NEGOCIO A SECCIÓN
 * Define qué sección del sidebar debe expandirse según la vertical principal de la empresa
 */
export const VERTICAL_TO_SECTION: Record<BusinessVertical, string> = {
  alquiler_tradicional: 'alquilerResidencial',
  str_vacacional: 'str',
  coliving: 'coLiving',
  room_rental: 'coLiving',
  construccion: 'buildToRent',
  flipping: 'flipping',
  servicios_profesionales: 'comercial',
  comunidades: 'adminFincas',
  mixto: 'alquilerResidencial', // Default
};

/**
 * QUICK ACTIONS POR ROL
 * Botones de acción rápida en el header del sidebar
 */
export interface QuickAction {
  label: string;
  href: string;
  icon: string; // Nombre del ícono de lucide-react
  tooltip: string;
}

export const QUICK_ACTIONS_BY_ROLE: Record<UserRole, QuickAction[]> = {
  super_admin: [
    { label: 'Nuevo Cliente', href: '/admin/clientes/nuevo', icon: 'Building2', tooltip: 'Agregar cliente B2B' },
    { label: 'Ver Métricas', href: '/admin/dashboard', icon: 'BarChart2', tooltip: 'Métricas de plataforma' },
  ],
  administrador: [
    { label: 'Nueva Propiedad', href: '/propiedades/nueva', icon: 'Plus', tooltip: 'Agregar propiedad' },
    { label: 'Nuevo Inquilino', href: '/inquilinos/nuevo', icon: 'UserPlus', tooltip: 'Registrar inquilino' },
    { label: 'Ver Reportes', href: '/reportes', icon: 'FileBarChart', tooltip: 'Reportes ejecutivos' },
  ],
  gestor: [
    { label: 'Nueva Tarea', href: '/tareas/nueva', icon: 'Plus', tooltip: 'Crear tarea' },
    { label: 'Reportar Incidencia', href: '/incidencias/nueva', icon: 'AlertCircle', tooltip: 'Reportar problema' },
    { label: 'Agendar Visita', href: '/visitas/nueva', icon: 'Calendar', tooltip: 'Programar visita' },
  ],
  operador: [
    { label: 'Check-in', href: '/operador/check-in', icon: 'Clock', tooltip: 'Registrar entrada' },
    { label: 'Subir Foto', href: '/operador/upload', icon: 'Camera', tooltip: 'Subir evidencia' },
    { label: 'Reportar Problema', href: '/incidencias/nueva', icon: 'AlertCircle', tooltip: 'Reportar incidencia' },
  ],
  soporte: [
    { label: 'Nuevo Ticket', href: '/soporte/tickets/nuevo', icon: 'Plus', tooltip: 'Crear ticket' },
    { label: 'Base de Conocimientos', href: '/knowledge-base', icon: 'BookOpen', tooltip: 'Buscar soluciones' },
  ],
  community_manager: [
    { label: 'Nuevo Anuncio', href: '/anuncios/nuevo', icon: 'Megaphone', tooltip: 'Publicar anuncio' },
    { label: 'Crear Evento', href: '/eventos/nuevo', icon: 'Calendar', tooltip: 'Organizar evento' },
    { label: 'Publicar en RRSS', href: '/dashboard/social-media/nuevo', icon: 'Share2', tooltip: 'Publicar en redes' },
  ],
};

/**
 * HELPER: Obtener estado inicial de secciones expandidas
 */
export function getInitialExpandedSections(role: UserRole, primaryVertical?: BusinessVertical): Record<string, boolean> {
  const baseExpanded = DEFAULT_EXPANDED_BY_ROLE[role] || {};

  // Si es administrador y hay vertical principal, expandirla
  if (role === 'administrador' && primaryVertical) {
    const verticalSection = VERTICAL_TO_SECTION[primaryVertical];
    if (verticalSection) {
      return {
        ...baseExpanded,
        [verticalSection]: true,
        // Colapsar las otras verticales
        ...Object.keys(VERTICAL_TO_SECTION).reduce((acc, v) => {
          const section = VERTICAL_TO_SECTION[v as BusinessVertical];
          if (section !== verticalSection) {
            acc[section] = false;
          }
          return acc;
        }, {} as Record<string, boolean>),
      };
    }
  }

  return baseExpanded;
}

/**
 * HELPER: Obtener nombre de sección adaptado por rol
 */
export function getSectionName(sectionId: string, role: UserRole, defaultName: string): string {
  return SECTION_NAMES_BY_ROLE[role]?.[sectionId] || defaultName;
}

/**
 * HELPER: Obtener orden de secciones por rol
 */
export function getSectionOrder(role: UserRole): string[] {
  return SECTION_ORDER_BY_ROLE[role] || SECTION_ORDER_BY_ROLE.administrador;
}

/**
 * HELPER: Obtener quick actions por rol
 */
export function getQuickActions(role: UserRole): QuickAction[] {
  return QUICK_ACTIONS_BY_ROLE[role] || [];
}
