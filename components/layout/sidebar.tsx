'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useBranding } from '@/lib/hooks/useBranding';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  CreditCard,
  Wrench,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Star,
  Hotel,
  TrendingUp,
  HardHat,
  Briefcase,
  Sparkles,
  Calendar,
  MessageSquare,
  Folder,
  BarChart2,
  Package,
  Euro,
  ClipboardList,
  UserCheck,
  HeadphonesIcon,
  Bell,
  AlertCircle,
  FileSignature,
  ShoppingCart,
  CalendarCheck,
  Users2,
  MessageCircle,
  CheckSquare,
  Eye,
  Shield,
  Megaphone,
  Vote,
  Car,
  Award,
  UserPlus,
  Code,
  Activity,
  Palette,
  Upload,
  DollarSign,
  Clock,
  Zap,
  BookOpen,
  Scan,
  Share2,
  User,
  Loader2,
  Tag,
  ShoppingBag,
  Bot,
  Brain,
  Calculator,
  MapPin,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import logger, { logError } from '@/lib/logger';
import { safeLocalStorage } from '@/lib/safe-storage';
import { toggleMobileMenu, closeMobileMenu } from '@/lib/mobile-menu';
import {
  getInitialExpandedSections,
  getSectionName,
  getSectionOrder,
  type UserRole,
  type BusinessVertical,
} from './sidebar-config';
import { CompanySelector } from './CompanySelector';
import { useSelectedCompany } from '@/lib/hooks/admin/useSelectedCompany';

// Mapeo de rutas a códigos de módulos para sistema modular
const ROUTE_TO_MODULE: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/edificios': 'edificios',
  '/unidades': 'unidades',
  '/garajes-trasteros': 'unidades',
  '/inquilinos': 'inquilinos',
  '/contratos': 'contratos',
  '/pagos': 'pagos',
  '/mantenimiento': 'mantenimiento',
  '/dashboard/servicios': 'servicios',
  '/calendario': 'calendario',
  '/chat': 'chat',
  '/bi': 'bi',
  '/reportes': 'reportes',
  '/documentos': 'documentos',
  '/room-rental': 'room_rental',
  '/proveedores': 'proveedores',
  '/gastos': 'gastos',
  '/tareas': 'tareas',
  '/candidatos': 'candidatos',
  '/crm': 'crm',
  '/notificaciones': 'notificaciones',
  '/incidencias': 'incidencias',
  '/ocr': 'ocr',
  '/onboarding/documents': 'ia_documental',
  '/onboarding/review': 'ia_documental',
  '/redes-sociales': 'redes_sociales',
  '/dashboard/social-media': 'redes_sociales',
  '/propiedades': 'gestion_inmobiliaria',
  '/admin/dashboard': 'admin_dashboard',
  '/admin/clientes': 'gestion_clientes',
  '/admin/planes': 'admin_planes',
  '/admin/ewoorker-planes': 'admin_ewoorker_planes',
  '/admin/cupones': 'admin_cupones',
  '/admin/facturacion-b2b': 'admin_facturacion_b2b',
  '/admin/personalizacion': 'admin_personalizacion',
  '/admin/activity': 'admin_activity',
  '/admin/alertas': 'admin_alertas',
  '/admin/portales-externos': 'admin_portales_externos',
  '/admin/aprobaciones': 'admin_aprobaciones',
  '/admin/reportes-programados': 'admin_reportes_programados',
  '/admin/importar': 'admin_importar',
  '/admin/ocr-import': 'admin_ocr_import',
  '/admin/system-logs': 'admin_logs',
  '/admin/onboarding': 'admin_onboarding',
  '/admin/notificaciones-masivas': 'admin_notificaciones',
  '/api-docs': 'api_docs',
  '/admin/configuracion': 'configuracion',
  '/admin/usuarios': 'usuarios',
  '/admin/modulos': 'configuracion',
  '/empresa/modulos': 'configuracion',
  '/admin/sales-team': 'admin_sales_team',
  '/analytics': 'analytics',
  '/str/listings': 'str_listings',
  '/str-housekeeping': 'str_housekeeping',
  '/str/bookings': 'str_bookings',
  '/str/channels': 'str_channels',
  '/str-advanced': 'str_advanced',
  '/str-advanced/channel-manager': 'str_advanced',
  '/str-advanced/revenue': 'str_advanced',
  '/str-advanced/housekeeping': 'str_advanced',
  '/str-advanced/guest-experience': 'str_advanced',
  '/str-advanced/legal': 'str_advanced',
  '/flipping/projects': 'flipping_projects',
  '/construction/projects': 'construction_projects',
  '/construccion/proyectos': 'construccion_projects',
  '/construccion': 'construccion_dashboard',
  // eWoorker - Marketplace de Trabajadores
  '/ewoorker': 'ewoorker',
  '/ewoorker/dashboard': 'ewoorker',
  '/ewoorker/panel': 'ewoorker',
  '/ewoorker/trabajadores': 'ewoorker',
  '/ewoorker/asignaciones': 'ewoorker',
  '/ewoorker/obras': 'ewoorker',
  '/ewoorker/contratos': 'ewoorker',
  '/ewoorker/pagos': 'ewoorker',
  '/ewoorker/analytics': 'ewoorker',
  '/ewoorker/empresas': 'ewoorker',
  '/ewoorker/compliance': 'ewoorker',
  '/ewoorker/leaderboard': 'ewoorker',
  '/ewoorker/admin-socio': 'ewoorker',
  '/ewoorker/perfil': 'ewoorker',
  '/ewoorker/landing': 'ewoorker',
  '/professional/projects': 'professional_projects',
  '/anuncios': 'anuncios',
  '/votaciones': 'votaciones',
  '/reuniones': 'reuniones',
  '/reservas': 'reservas',
  '/admin-fincas': 'admin_fincas',
  '/admin-fincas/comunidades': 'admin_fincas',
  '/admin-fincas/facturas': 'admin_fincas',
  '/admin-fincas/libro-caja': 'admin_fincas',
  '/admin-fincas/informes': 'admin_fincas',
  // Media Estancia (dentro de alquiler residencial)
  '/media-estancia': 'media_estancia',
  '/media-estancia/calendario': 'media_estancia',
  '/media-estancia/scoring': 'media_estancia',
  '/media-estancia/analytics': 'media_estancia',
  '/media-estancia/configuracion': 'media_estancia',
  '/valoraciones': 'valoraciones',
  '/publicaciones': 'publicaciones',
  '/screening': 'screening',
  '/galerias': 'galerias',
  '/certificaciones': 'certificaciones',
  '/seguros': 'seguros',
  '/inspecciones': 'inspecciones',
  '/visitas': 'visitas',
  '/ordenes-trabajo': 'ordenes_trabajo',
  '/firma-digital': 'firma_digital',
  '/legal': 'legal',
  '/open-banking': 'open_banking',
  '/marketplace': 'marketplace',
  '/sms': 'sms',
  '/dashboard/community': 'community_management',
  '/esg': 'esg',
  '/iot': 'iot',
  '/blockchain': 'blockchain',
  '/tours-virtuales': 'tours_virtuales',
  '/economia-circular': 'economia_circular',
  '/auditoria': 'auditoria',
  '/seguridad-compliance': 'seguridad_compliance',
  // Alquiler Comercial - Oficinas, Locales, Naves, Coworking
  '/comercial': 'alquiler_comercial',
  '/comercial/oficinas': 'alquiler_comercial',
  '/comercial/locales': 'alquiler_comercial',
  '/comercial/naves': 'alquiler_comercial',
  '/comercial/coworking': 'alquiler_comercial',
  '/comercial/contratos': 'alquiler_comercial',
  '/comercial/leads': 'alquiler_comercial',
  '/comercial/pagos': 'alquiler_comercial',
  '/comercial/visitas': 'alquiler_comercial',
  '/comercial/analytics': 'alquiler_comercial',
  '/comercial/espacios': 'alquiler_comercial',
  // Student Housing
  '/student-housing': 'student_housing',
  '/student-housing/dashboard': 'student_housing',
  '/student-housing/residentes': 'student_housing',
  '/student-housing/habitaciones': 'student_housing',
  '/student-housing/aplicaciones': 'student_housing',
  '/student-housing/actividades': 'student_housing',
  '/student-housing/pagos': 'student_housing',
  '/student-housing/mantenimiento': 'student_housing',
  // Viajes Corporativos
  '/viajes-corporativos': 'viajes_corporativos',
  '/viajes-corporativos/dashboard': 'viajes_corporativos',
  '/viajes-corporativos/bookings': 'viajes_corporativos',
  '/viajes-corporativos/guests': 'viajes_corporativos',
  '/viajes-corporativos/expense-reports': 'viajes_corporativos',
  '/viajes-corporativos/policies': 'viajes_corporativos',
  // Vivienda Social
  '/vivienda-social': 'vivienda_social',
  '/vivienda-social/dashboard': 'vivienda_social',
  '/vivienda-social/applications': 'vivienda_social',
  '/vivienda-social/eligibility': 'vivienda_social',
  '/vivienda-social/compliance': 'vivienda_social',
  '/vivienda-social/reporting': 'vivienda_social',
  // Real Estate Developer
  '/real-estate-developer': 'real_estate_developer',
  '/real-estate-developer/dashboard': 'real_estate_developer',
  '/real-estate-developer/projects': 'real_estate_developer',
  '/real-estate-developer/sales': 'real_estate_developer',
  '/real-estate-developer/marketing': 'real_estate_developer',
  '/real-estate-developer/commercial': 'real_estate_developer',
  // Workspace
  '/workspace': 'workspace',
  '/workspace/dashboard': 'workspace',
  '/workspace/coworking': 'workspace',
  '/workspace/booking': 'workspace',
  '/workspace/members': 'workspace',
  // Warehouse
  '/warehouse': 'warehouse',
  '/warehouse/inventory': 'warehouse',
  '/warehouse/locations': 'warehouse',
  '/warehouse/movements': 'warehouse',
};

// Módulos core que siempre deben mostrarse (esCore: true)
// NOTA: Esta lista debe ser mínima para que el filtrado por plan funcione correctamente
const CORE_MODULES = [
  // Core - Funcionalidades básicas que toda empresa necesita
  'dashboard',
  'edificios',
  'unidades',
  'inquilinos',
  'contratos',
  'pagos',
  'mantenimiento',
  'calendario',
  'chat',
  'notificaciones',
  // Administración - Siempre visible para roles admin
  'configuracion',
  'usuarios',
  // Admin plataforma - Solo para super_admin
  'gestion_clientes',
  'admin_dashboard',
  'admin_planes',
  'admin_facturacion_b2b',
  'admin_personalizacion',
  'admin_activity',
  'admin_alertas',
  'admin_aprobaciones',
  'admin_reportes_programados',
  'admin_importar',
  'admin_sales_team',
  'admin_portales_externos',
  'api_docs',
];

// ============================================================================
// NUEVA ORGANIZACIÓN MEJORADA - BASADA EN VERTICALES Y HERRAMIENTAS HORIZONTALES
// ============================================================================

// 1. INICIO - Dashboard Principal
// NOTA: Para super_admin, el dashboard de plataforma está en superAdminPlatformItems
const dashboardNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['administrador', 'gestor', 'operador'], // super_admin usa /admin/dashboard
    dataTour: 'dashboard-link',
  },
];

// 2. VERTICALES DE NEGOCIO - Agrupadas por modelo de negocio

// ============================================================================
// 2.1 ALQUILER RESIDENCIAL - SIMPLIFICADO (Ene 2026)
// Fusiones: Screening+Verificación → en Candidatos
//          2x Garantías → 1 Garantías
//          2x Valoración IA → 1 Valoración IA
//          2x Inspecciones → 1 Inspecciones
// Resultado: 18 items → 10 items (-44%)
// ============================================================================
const alquilerResidencialItems = [
  {
    name: 'Dashboard',
    href: '/traditional-rental',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'alquiler-dashboard',
  },
  {
    name: 'Propiedades',
    href: '/propiedades',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'propiedades-menu',
  },
  {
    name: 'Edificios',
    href: '/edificios',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Inquilinos',
    href: '/inquilinos',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'inquilinos-menu',
  },
  {
    name: 'Contratos',
    href: '/contratos',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'contratos-menu',
  },
  {
    name: 'Candidatos',
    href: '/candidatos',
    icon: UserPlus,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Garantías',
    href: '/warranty-management',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Valoración IA',
    href: '/valoracion-ia',
    icon: Brain,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Inspecciones',
    href: '/inspecciones',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Certificaciones',
    href: '/certificaciones',
    icon: Award,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.2 STR - SHORT TERM RENTALS - SIMPLIFICADO (9→6 items)
const strNavItems = [
  {
    name: 'Dashboard',
    href: '/str',
    icon: Hotel,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Propiedades',
    href: '/str/listings',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reservas',
    href: '/str/bookings',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Revenue',
    href: '/str/channels',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Housekeeping',
    href: '/str-housekeeping',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reviews',
    href: '/str/reviews',
    icon: Star,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.3 CO-LIVING - SIMPLIFICADO (9→6 items)
// Fusión: Comunidad Social+Gestión → Comunidad, 2x Reservas → 1
const coLivingNavItems = [
  {
    name: 'Habitaciones',
    href: '/room-rental',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Propiedades',
    href: '/coliving/propiedades',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Comunidad',
    href: '/coliving/comunidad',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor', 'community_manager'],
  },
  {
    name: 'Matching',
    href: '/coliving/emparejamiento',
    icon: UserCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Eventos',
    href: '/coliving/eventos',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor', 'community_manager'],
  },
  {
    name: 'Reservas',
    href: '/coliving/reservas',
    icon: CalendarCheck,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
];

// 2.4 CONSTRUCCIÓN (antes BUILD-TO-RENT)
// Incluye ewoorker como subplataforma marketplace
const buildToRentNavItems = [
  {
    name: 'Proyectos',
    href: '/construction/projects',
    icon: HardHat,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Control de Calidad',
    href: '/construction/quality-control',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Órdenes de Trabajo',
    href: '/ordenes-trabajo',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'eWoorker (Marketplace)',
    href: '/ewoorker',
    icon: Package,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.5 HOUSE FLIPPING
// AMPLIADO: Incluye timeline de proyectos
const flippingNavItems = [
  {
    name: 'Dashboard',
    href: '/flipping/dashboard',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Proyectos',
    href: '/flipping/projects',
    icon: Folder,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Timeline',
    href: '/flipping/timeline',
    icon: Clock,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Calculadora ROI',
    href: '/flipping/calculator',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Análisis Mercado',
    href: '/flipping/comparator',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.5.1 CONSTRUCCIÓN
// Gestión de proyectos de construcción, reformas y rehabilitaciones
// AMPLIADO: Incluye Gantt, licitaciones, obras y proyectos de renovación
const construccionNavItems = [
  {
    name: 'Dashboard',
    href: '/construccion',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Proyectos',
    href: '/construccion/proyectos',
    icon: HardHat,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Diagrama Gantt',
    href: '/construction/gantt',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Obras',
    href: '/obras',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Licitaciones',
    href: '/licitaciones',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Proyectos Renovación',
    href: '/proyectos-renovacion',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Órdenes de Trabajo',
    href: '/ordenes-trabajo',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Control de Calidad',
    href: '/construction/quality-control',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.5.2 EWOORKER - Plataforma de Trabajadores
// Marketplace de profesionales para obras y mantenimiento
const ewoorkerNavItems = [
  {
    name: 'Dashboard',
    href: '/ewoorker/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Panel eWoorker',
    href: '/ewoorker/panel',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Trabajadores',
    href: '/ewoorker/trabajadores',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Asignaciones',
    href: '/ewoorker/asignaciones',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Obras',
    href: '/ewoorker/obras',
    icon: HardHat,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Contratos',
    href: '/ewoorker/contratos',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Pagos',
    href: '/ewoorker/pagos',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Analytics',
    href: '/ewoorker/analytics',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Empresas',
    href: '/ewoorker/empresas',
    icon: Building2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Compliance',
    href: '/ewoorker/compliance',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Leaderboard',
    href: '/ewoorker/leaderboard',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Admin Socio',
    href: '/ewoorker/admin-socio',
    icon: Settings,
    roles: ['super_admin'],
  },
];

// 2.6 COMERCIAL (Servicios Profesionales)
const comercialNavItems = [
  {
    name: 'Servicios Profesionales',
    href: '/professional/projects',
    icon: Briefcase,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Clientes Comerciales',
    href: '/professional/clients',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Facturación Comercial',
    href: '/professional/invoicing',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.6.1 ALQUILER COMERCIAL (Oficinas, Locales, Naves, Coworking)
// AMPLIADO: Incluye garajes, salas reuniones, retail, hospitality
const alquilerComercialNavItems = [
  {
    name: 'Dashboard Comercial',
    href: '/comercial',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-comercial-dashboard',
  },
  {
    name: 'Oficinas',
    href: '/comercial/oficinas',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-comercial-oficinas',
  },
  {
    name: 'Locales',
    href: '/comercial/locales',
    icon: Star,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-comercial-locales',
  },
  {
    name: 'Naves Industriales',
    href: '/comercial/naves',
    icon: Package,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-comercial-naves',
  },
  {
    name: 'Coworking',
    href: '/comercial/coworking',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-comercial-coworking',
  },
  {
    name: 'Espacios Coworking',
    href: '/espacios-coworking',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Garajes y Trasteros',
    href: '/garajes-trasteros',
    icon: Car,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Salas de Reuniones',
    href: '/salas-reuniones',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Retail',
    href: '/retail',
    icon: ShoppingBag,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Hospitality',
    href: '/hospitality',
    icon: Hotel,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Contratos Comerciales',
    href: '/comercial/contratos',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Leads Comerciales',
    href: '/comercial/leads',
    icon: UserPlus,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.7 ADMINISTRADOR DE FINCAS / COMUNIDADES
// AMPLIADO: Incluye todas las sub-páginas de comunidades
const adminFincasItems = [
  {
    name: 'Comunidades',
    href: '/comunidades',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Cuotas',
    href: '/comunidades/cuotas',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Fondos Reserva',
    href: '/comunidades/fondos',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Actas',
    href: '/comunidades/actas',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Cumplimiento',
    href: '/comunidades/cumplimiento',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Portal Presidente',
    href: '/comunidades/presidente',
    icon: User,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Renovaciones',
    href: '/comunidades/renovaciones',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Anuncios',
    href: '/anuncios',
    icon: Megaphone,
    roles: ['super_admin', 'administrador', 'gestor', 'community_manager'],
  },
  {
    name: 'Votaciones',
    href: '/votaciones',
    icon: Vote,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reuniones',
    href: '/reuniones',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Finanzas',
    href: '/comunidades/finanzas',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.8 STUDENT HOUSING - Residencias de estudiantes
const studentHousingNavItems = [
  {
    name: 'Dashboard',
    href: '/student-housing/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Residentes',
    href: '/student-housing/residentes',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Habitaciones',
    href: '/student-housing/habitaciones',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Aplicaciones',
    href: '/student-housing/aplicaciones',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Actividades',
    href: '/student-housing/actividades',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Pagos',
    href: '/student-housing/pagos',
    icon: CreditCard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Mantenimiento',
    href: '/student-housing/mantenimiento',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.9 VIAJES CORPORATIVOS - Corporate Travel Management
const viajesCorporativosNavItems = [
  {
    name: 'Dashboard',
    href: '/viajes-corporativos/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reservas',
    href: '/viajes-corporativos/bookings',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Huéspedes',
    href: '/viajes-corporativos/guests',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Informes Gastos',
    href: '/viajes-corporativos/expense-reports',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Políticas',
    href: '/viajes-corporativos/policies',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
];

// 2.10 VIVIENDA SOCIAL - Social Housing Management
const viviendaSocialNavItems = [
  {
    name: 'Dashboard',
    href: '/vivienda-social/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Solicitudes',
    href: '/vivienda-social/applications',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Elegibilidad',
    href: '/vivienda-social/eligibility',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Compliance',
    href: '/vivienda-social/compliance',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Reportes',
    href: '/vivienda-social/reporting',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.11 REAL ESTATE DEVELOPER - Promotores Inmobiliarios
const realEstateDeveloperNavItems = [
  {
    name: 'Dashboard',
    href: '/real-estate-developer/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Proyectos',
    href: '/real-estate-developer/projects',
    icon: Folder,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Ventas',
    href: '/real-estate-developer/sales',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Marketing',
    href: '/real-estate-developer/marketing',
    icon: Megaphone,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Comercial',
    href: '/real-estate-developer/commercial',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.12 WORKSPACE - Gestión de Espacios de Trabajo
const workspaceNavItems = [
  {
    name: 'Dashboard',
    href: '/workspace/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Coworking',
    href: '/workspace/coworking',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reservas',
    href: '/workspace/booking',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Miembros',
    href: '/workspace/members',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.13 WAREHOUSE - Gestión de Almacenes
const warehouseNavItems = [
  {
    name: 'Dashboard',
    href: '/warehouse',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Inventario',
    href: '/warehouse/inventory',
    icon: Package,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Ubicaciones',
    href: '/warehouse/locations',
    icon: MapPin,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Movimientos',
    href: '/warehouse/movements',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// ============================================================================
// 3. HERRAMIENTAS HORIZONTALES - Aplicables a todas las verticales
// ============================================================================

// 3.1 FINANZAS Y CONTABILIDAD
// AMPLIADO: Incluye contabilidad, BI, estadísticas, finanzas, presupuestos
const finanzasNavItems = [
  {
    name: 'Panel Finanzas',
    href: '/finanzas',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Pagos',
    href: '/pagos',
    icon: CreditCard,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'pagos-menu',
  },
  {
    name: 'Gastos',
    href: '/gastos',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Contabilidad',
    href: '/contabilidad',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'BI / Business Intelligence',
    href: '/bi',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Estadísticas',
    href: '/estadisticas',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Presupuestos',
    href: '/presupuestos',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Facturación',
    href: '/facturacion',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Open Banking',
    href: '/open-banking',
    icon: CreditCard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.2 ANALYTICS E INTELIGENCIA
// AMPLIADO: Incluye reportes financieros, operacionales y informes
const analyticsNavItems = [
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reportes Financieros',
    href: '/reportes/financieros',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reportes Operacionales',
    href: '/reportes/operacionales',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Informes',
    href: '/informes',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Asistente IA',
    href: '/asistente-ia',
    icon: Sparkles,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.3 OPERACIONES - SIMPLIFICADO (12→7 items)
// Fusión: 2x Mantenimiento→1, 2x Incidencias→1, Planificación+Calendario→1
const operacionesNavItems = [
  {
    name: 'Mantenimiento',
    href: '/mantenimiento',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Incidencias',
    href: '/incidencias',
    icon: AlertCircle,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Tareas',
    href: '/tareas',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Calendario',
    href: '/calendario',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Visitas',
    href: '/visitas',
    icon: CalendarCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Limpieza',
    href: '/servicios-limpieza',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Servicios',
    href: '/dashboard/servicios',
    icon: ShoppingBag,
    roles: ['super_admin', 'administrador', 'gestor', 'inquilino', 'propietario'],
  },
];

// 3.3.1 HERRAMIENTAS DE INVERSIÓN (NUEVO - Basado en ZONA3)
// Calculadoras, contratos y recursos para inversores
const herramientasInversionNavItems = [
  {
    name: 'Herramientas',
    href: '/dashboard/herramientas',
    icon: Calculator,
    roles: ['super_admin', 'administrador', 'gestor', 'propietario'],
    badge: 'Nuevo',
    subItems: [
      { name: 'Calculadora Rentabilidad', href: '/dashboard/herramientas?tool=rental-yield', icon: Calculator },
      { name: 'Calculadora Hipoteca', href: '/dashboard/herramientas?tool=mortgage', icon: Building2 },
      { name: 'Gastos Compraventa', href: '/dashboard/herramientas?tool=transaction-costs', icon: DollarSign },
    ],
  },
];

// 3.4 COMUNICACIONES - SIMPLIFICADO (7→4 items)
// Fusión: Todas las notificaciones en una sola entrada
const comunicacionesNavItems = [
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Notificaciones',
    href: '/notificaciones',
    icon: Bell,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'SMS',
    href: '/sms',
    icon: MessageCircle,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Social',
    href: '/dashboard/social-media',
    icon: Share2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.5 DOCUMENTOS Y LEGAL - SIMPLIFICADO (11→6 items)
// Fusión: IA+OCR→IA Documental, 2x Plantillas→1, 2x Compliance→1
const documentosLegalNavItems = [
  {
    name: 'IA Documental',
    href: '/onboarding/documents',
    icon: Bot,
    roles: ['super_admin', 'administrador', 'gestor'],
    badge: 'IA',
  },
  {
    name: 'Documentos',
    href: '/documentos',
    icon: Folder,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Plantillas',
    href: '/plantillas',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Firma Digital',
    href: '/firma-digital',
    icon: FileSignature,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Compliance',
    href: '/legal',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Seguros',
    href: '/seguros',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.6 CRM Y MARKETING - SIMPLIFICADO (14→7 items)
// Fusión: Múltiples agentes → Red Agentes, Tours+Galerías → Tours
const crmMarketingNavItems = [
  {
    name: 'CRM',
    href: '/crm',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Portal Comercial',
    href: '/portal-comercial',
    icon: Briefcase,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Promociones',
    href: '/promociones',
    icon: Tag,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reviews',
    href: '/reviews',
    icon: Star,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Red Agentes',
    href: '/red-agentes',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Marketplace',
    href: '/marketplace',
    icon: ShoppingCart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Tours Virtuales',
    href: '/tours-virtuales',
    icon: Eye,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.7 AUTOMATIZACIÓN Y WORKFLOWS
// AMPLIADO: Incluye panel de automatización, sincronización
const automatizacionNavItems = [
  {
    name: 'Panel Automatización',
    href: '/automatizacion',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Resumen Automatización',
    href: '/automatizacion/resumen',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Workflows',
    href: '/workflows',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Sincronización',
    href: '/sincronizacion',
    icon: Share2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Sincronización Avanzada',
    href: '/sincronizacion-avanzada',
    icon: Share2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Recordatorios',
    href: '/recordatorios',
    icon: Bell,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.8 INNOVACIÓN Y SOSTENIBILIDAD
// AMPLIADO: Incluye energía, puntos carga EV, huerto urbano, instalaciones deportivas
const innovacionNavItems = [
  {
    name: 'ESG & Sostenibilidad',
    href: '/esg',
    icon: Sparkles,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Energía',
    href: '/energia',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Energía Solar',
    href: '/energia-solar',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Puntos de Carga EV',
    href: '/puntos-carga',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'IoT & Smart Homes',
    href: '/iot',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Blockchain & Tokenización',
    href: '/blockchain',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Economía Circular',
    href: '/economia-circular',
    icon: Activity,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Huertos Urbanos',
    href: '/economia-circular/huertos',
    icon: Activity,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Gestión Residuos',
    href: '/economia-circular/residuos',
    icon: Activity,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Huerto Urbano',
    href: '/huerto-urbano',
    icon: Activity,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Instalaciones Deportivas',
    href: '/instalaciones-deportivas',
    icon: Activity,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.9 SOPORTE Y AYUDA
const soporteNavItems = [
  {
    name: 'Soporte',
    href: '/soporte',
    icon: HeadphonesIcon,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Base de Conocimientos',
    href: '/knowledge-base',
    icon: BookOpen,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Sugerencias',
    href: '/sugerencias',
    icon: MessageCircle,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
];

// ============================================================================
// 4. MÓDULOS ESPECÍFICOS POR ROL
// ============================================================================

// 4.1 OPERADOR DE CAMPO
const operadorNavItems = [
  {
    name: 'Dashboard Operador',
    href: '/operador/dashboard',
    icon: LayoutDashboard,
    roles: ['operador'],
  },
  {
    name: 'Órdenes del Día',
    href: '/operador/dashboard',
    icon: ClipboardList,
    roles: ['operador'],
  },
  {
    name: 'Historial de Trabajos',
    href: '/operador/work-orders/history',
    icon: Clock,
    roles: ['operador'],
  },
  {
    name: 'Historial Mantenimiento',
    href: '/operador/maintenance-history',
    icon: Wrench,
    roles: ['operador'],
  },
];

// ============================================================================
// 5. ADMINISTRACIÓN Y CONFIGURACIÓN
// ============================================================================

// 5.1 ADMINISTRADOR - GESTIÓN DE EMPRESA
// Incluye configuración, usuarios, módulos, integraciones y herramientas
const administradorEmpresaItems = [
  // === CONFIGURACIÓN BÁSICA ===
  {
    name: 'Configuración',
    href: '/admin/configuracion',
    icon: Settings,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Módulos',
    href: '/empresa/modulos',
    icon: Package,
    roles: ['administrador', 'super_admin', 'propietario'],
  },
  {
    name: 'Branding',
    href: '/admin/personalizacion',
    icon: Palette,
    roles: ['administrador', 'super_admin'],
  },
  // === HERRAMIENTAS E INTEGRACIONES DE EMPRESA ===
  {
    name: 'Herramientas e Integraciones',
    href: '/admin/herramientas-empresa',
    icon: Wrench,
    roles: ['administrador', 'super_admin'],
    subItems: [
      { name: 'Mis Integraciones', href: '/admin/herramientas-empresa?tab=propias', icon: Wrench },
      { name: 'Servicios Inmova', href: '/admin/herramientas-empresa?tab=compartidas', icon: Share2 },
    ],
  },
  // === HERRAMIENTAS ===
  {
    name: 'Aprobaciones',
    href: '/admin/aprobaciones',
    icon: CheckSquare,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Importar Datos',
    href: '/admin/importar',
    icon: Upload,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'OCR Import',
    href: '/admin/ocr-import',
    icon: Scan,
    roles: ['administrador', 'super_admin'],
  },
  // === GESTIÓN FISCAL ===
  {
    name: 'Impuestos',
    href: '/admin/impuestos',
    icon: Euro,
    roles: ['administrador', 'super_admin'],
    badge: '💰',
    subItems: [
      { name: 'Resumen Fiscal', href: '/admin/impuestos', icon: FileBarChart },
      { name: 'Obligaciones', href: '/admin/impuestos?tab=obligaciones', icon: FileText },
      { name: 'IBI Inmuebles', href: '/admin/impuestos?tab=inmuebles', icon: Home },
      { name: 'Calendario', href: '/admin/impuestos?tab=calendario', icon: Calendar },
      { name: 'Calculadora', href: '/admin/impuestos?tab=modelos', icon: Calculator },
    ],
  },
];

// 5.2 SUPER ADMIN - GESTIÓN DE PLATAFORMA
// ESTRUCTURA REORGANIZADA:
// 1. NEGOCIO: Dashboard, Clientes B2B (+ Config empresa seleccionada), Billing, Partners, Legal
// 2. MONITOREO: Actividad, Alertas, Salud, Métricas, Reportes, Seguridad+Backup+Usuarios
// 3. INTEGRACIONES DE INMOVA: Servicios Conectados (Stripe, AWS, etc.), API Docs
// 4. COMUNICACIONES: Plantillas SMS, Plantillas Email

interface SubItem {
  name: string;
  href: string;
  icon?: any; // Icono opcional para subItems
}

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  badge?: string;
  subItems?: SubItem[];
  dataTour?: string;
}

// =====================================================
// SUPER ADMIN - GESTIÓN DE LA PLATAFORMA INMOVA
// =====================================================
// Organización MEJORADA (Auditoría Ene 2026):
// 1. OVERVIEW: Dashboard con acciones rápidas
// 2. CLIENTES: Gestión, Onboarding, Comparador
// 3. FACTURACIÓN: Planes, Add-ons, B2B, Cupones
// 4. ECOSYSTEM: Partners, Marketplace, Integraciones
// 5. MONITOREO: Actividad, Salud, Alertas, Logs
// 6. SEGURIDAD: Alertas, Usuarios, Backup, Auditoría
// 7. CONFIGURACIÓN: Módulos, White-label, Portales
// 8. COMUNICACIONES: Email, SMS, Notificaciones Masivas
// 9. HERRAMIENTAS: Import, OCR, Firma, Legal, Limpieza
// 10. SOPORTE: Sugerencias, Aprobaciones

// ============================================================================
// SIDEBAR SUPER ADMIN - ESTRUCTURA SIMPLIFICADA (Ene 2026)
// ============================================================================
// Fusiones realizadas para mejorar UX:
// - Partners + Ventas → "Comercial B2B"
// - Monitoreo + Seguridad → "Sistema"
// - Integraciones + API Docs → "Integraciones"
// - IA simplificada (menos submenús)
// ============================================================================

const superAdminPlatformItems: SidebarItem[] = [
  // ========== 1. DASHBOARD ==========
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin'],
  },

  // ========== 2. CLIENTES (Gestión de Empresas B2B) ==========
  {
    name: 'Clientes',
    href: '/admin/clientes',
    icon: Building2,
    roles: ['super_admin'],
    subItems: [
      { name: 'Empresas', href: '/admin/clientes', icon: Building2 },
      { name: 'Comparar', href: '/admin/clientes/comparar', icon: BarChart2 },
      { name: 'Onboarding', href: '/admin/onboarding', icon: UserPlus },
    ],
  },

  // ========== 3. FACTURACIÓN ==========
  {
    name: 'Facturación',
    href: '/admin/planes',
    icon: DollarSign,
    roles: ['super_admin'],
    subItems: [
      { name: 'Planes', href: '/admin/planes', icon: Package },
      { name: 'Add-ons', href: '/admin/addons', icon: Zap },
      { name: 'B2B', href: '/admin/facturacion-b2b', icon: FileText },
      { name: 'Cupones', href: '/admin/cupones', icon: Tag },
    ],
  },

  // ========== 4. COMERCIAL B2B (FUSIÓN: Partners + Ventas) ==========
  {
    name: 'Comercial B2B',
    href: '/admin/partners',
    icon: TrendingUp,
    roles: ['super_admin'],
    subItems: [
      { name: 'Partners', href: '/admin/partners', icon: Share2 },
      { name: 'Equipo Ventas', href: '/admin/sales-team', icon: Users },
      { name: 'Red Agentes', href: '/red-agentes', icon: Users2 },
      { name: 'Comisiones', href: '/admin/partners/comisiones', icon: DollarSign },
      { name: 'Invitaciones', href: '/admin/partners/invitaciones', icon: UserPlus },
    ],
  },

  // ========== 5. MARKETPLACE ==========
  {
    name: 'Marketplace',
    href: '/admin/marketplace',
    icon: ShoppingBag,
    roles: ['super_admin'],
    subItems: [
      { name: 'Proveedores', href: '/admin/marketplace/proveedores', icon: Users },
      { name: 'Servicios', href: '/admin/marketplace', icon: ShoppingCart },
      { name: 'Categorías', href: '/admin/marketplace/categorias', icon: Folder },
    ],
  },

  // ========== 6. INTEGRACIONES (FUSIÓN: Integraciones + API Docs) ==========
  {
    name: 'Integraciones',
    href: '/admin/integraciones',
    icon: Code,
    roles: ['super_admin'],
    subItems: [
      { name: 'Todas', href: '/admin/integraciones', icon: Code },
      { name: 'API Docs', href: '/api-docs', icon: BookOpen },
      { name: 'Webhooks', href: '/admin/webhooks', icon: Zap },
    ],
  },

  // ========== 7. SISTEMA (FUSIÓN: Monitoreo + Seguridad) ==========
  {
    name: 'Sistema',
    href: '/admin/activity',
    icon: Activity,
    roles: ['super_admin'],
    subItems: [
      { name: 'Actividad', href: '/admin/activity', icon: Activity },
      { name: 'Salud', href: '/admin/salud-sistema', icon: CheckSquare },
      { name: 'Alertas', href: '/admin/alertas', icon: Bell },
      { name: 'Seguridad', href: '/admin/seguridad', icon: Shield },
      { name: 'Logs', href: '/admin/system-logs', icon: FileText },
      { name: 'Backup', href: '/admin/backup-restore', icon: Upload },
    ],
  },

  // ========== 8. CONFIGURACIÓN ==========
  {
    name: 'Configuración',
    href: '/admin/configuracion',
    icon: Settings,
    roles: ['super_admin'],
    subItems: [
      { name: 'Personalización', href: '/admin/personalizacion', icon: Palette },
      { name: 'Mantenimiento', href: '/admin/limpieza', icon: Wrench },
    ],
  },

  // ========== 9. COMUNICACIONES ==========
  {
    name: 'Comunicaciones',
    href: '/admin/plantillas-email',
    icon: MessageSquare,
    roles: ['super_admin'],
    subItems: [
      { name: 'Email', href: '/admin/plantillas-email', icon: FileText },
      { name: 'SMS', href: '/admin/plantillas-sms', icon: MessageCircle },
      { name: 'Masivas', href: '/admin/notificaciones-masivas', icon: Bell },
      { name: 'Reportes', href: '/admin/reportes-programados', icon: FileBarChart },
    ],
  },

  // ========== 10. INTELIGENCIA ARTIFICIAL (SIMPLIFICADA) ==========
  {
    name: 'IA',
    href: '/admin/ai-agents',
    icon: Bot,
    roles: ['super_admin'],
    badge: 'IA',
    subItems: [
      { name: 'Agentes IA', href: '/admin/ai-agents', icon: Bot },
      { name: 'Community Manager', href: '/admin/community-manager', icon: Users2 },
      { name: 'Canva Studio', href: '/admin/canva', icon: Palette },
    ],
  },

  // ========== 11. SOPORTE ==========
  {
    name: 'Soporte',
    href: '/admin/sugerencias',
    icon: HeadphonesIcon,
    roles: ['super_admin'],
    subItems: [
      { name: 'Sugerencias', href: '/admin/sugerencias', icon: MessageSquare },
      { name: 'Aprobaciones', href: '/admin/aprobaciones', icon: CheckSquare },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void; // Callback cuando se navega a una ruta (útil para cerrar modals en mobile)
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { role } = usePermissions();
  const { appName, logo } = useBranding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [primaryVertical, setPrimaryVertical] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hook para empresa seleccionada (Super Admin)
  const { selectedCompany, selectCompany: handleCompanySelect } = useSelectedCompany();

  // Módulos activos de la empresa seleccionada (para Super Admin)
  const [selectedCompanyModules, setSelectedCompanyModules] = useState<string[]>([]);

  // Cargar vertical principal de la empresa
  useEffect(() => {
    async function loadCompanyVertical() {
      try {
        const res = await fetch('/api/company/vertical');
        if (res.ok) {
          const data = await res.json();
          setPrimaryVertical(data.vertical);
        }
      } catch (error) {
        logger.error('Error loading company vertical:', error);
      }
    }
    loadCompanyVertical();
  }, []);

  // Inicializar estado expandido basado en rol y vertical
  useEffect(() => {
    if (!role || isInitialized) return;

    try {
      // Intentar cargar preferencias del usuario desde localStorage
      const storedExpanded = safeLocalStorage.getItem('sidebar_expanded_sections');

      if (storedExpanded) {
        // Usuario tiene preferencias guardadas
        setExpandedSections(JSON.parse(storedExpanded));
      } else {
        // Primera vez: usar configuración por defecto según rol
        const initialState = getInitialExpandedSections(
          role as UserRole,
          primaryVertical as BusinessVertical
        );
        setExpandedSections(initialState);
      }

      setIsInitialized(true);
    } catch (error) {
      logger.error('Error initializing expanded sections:', error);
      // Fallback a estado vacío (todo colapsado)
      setExpandedSections({
        favorites: true,
        dashboard: true,
      });
      setIsInitialized(true);
    }
  }, [role, primaryVertical, isInitialized]);

  // Persistir posición de scroll de forma segura - mejorado para restaurar después de navegación
  useEffect(() => {
    try {
      const sidebar = document.querySelector('[data-sidebar-nav]');
      if (sidebar) {
        // Restaurar scroll con un pequeño delay para asegurar que el DOM está listo
        const restoreScroll = () => {
          const savedScroll = safeLocalStorage.getItem('sidebar_scroll_position');
          if (savedScroll) {
            const scrollValue = parseInt(savedScroll, 10);
            // Usar requestAnimationFrame para asegurar que el scroll se aplica después del render
            requestAnimationFrame(() => {
              sidebar.scrollTop = scrollValue;
            });
          }
        };

        // Restaurar inmediatamente y también después de un pequeño delay
        restoreScroll();
        const timeoutId = setTimeout(restoreScroll, 100);

        const handleScroll = () => {
          try {
            safeLocalStorage.setItem('sidebar_scroll_position', sidebar.scrollTop.toString());
          } catch (err) {
            // Ignorar errores de storage
          }
        };

        sidebar.addEventListener('scroll', handleScroll);
        return () => {
          sidebar.removeEventListener('scroll', handleScroll);
          clearTimeout(timeoutId);
        };
      }
    } catch (error) {
      logger.error('Error setting up scroll persistence:', error);
    }
  }, [pathname]); // Añadir pathname como dependencia para restaurar después de navegación

  // Cargar módulos activos de la empresa del usuario actual
  useEffect(() => {
    async function loadActiveModules() {
      try {
        const res = await fetch('/api/modules/active');
        if (res.ok) {
          const data = await res.json();
          setActiveModules(data.activeModules || data || []);
        }
      } catch (error) {
        logger.error('Error loading active modules:', error);
      } finally {
        setModulesLoaded(true);
      }
    }
    loadActiveModules();

    // Escuchar evento de actualización de módulos
    const handleModulesUpdate = () => {
      logger.info('Módulos actualizados, recargando sidebar...');
      loadActiveModules();
    };
    window.addEventListener('modules-updated', handleModulesUpdate);
    
    return () => {
      window.removeEventListener('modules-updated', handleModulesUpdate);
    };
  }, []);

  // Cargar módulos de la empresa seleccionada (Solo para Super Admin)
  useEffect(() => {
    async function loadSelectedCompanyModules() {
      if (!selectedCompany || role !== 'super_admin') {
        setSelectedCompanyModules([]);
        return;
      }

      try {
        const res = await fetch(`/api/modules/active?companyId=${selectedCompany.id}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedCompanyModules(data.activeModules || []);
          logger.info('Módulos de empresa seleccionada cargados', {
            companyId: selectedCompany.id,
            modulesCount: data.activeModules?.length || 0,
          });
        }
      } catch (error) {
        logger.error('Error loading selected company modules:', error);
        setSelectedCompanyModules([]);
      }
    }
    loadSelectedCompanyModules();
  }, [selectedCompany, role]);

  // Cargar favoritos desde localStorage de forma segura
  useEffect(() => {
    try {
      const storedFavorites = safeLocalStorage.getItem('sidebar_favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      logger.error('Error loading favorites:', error);
      // Continuar con favoritos vacíos
    }
  }, []);

  // Prevenir scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Agregar clase para prevenir scroll
      document.body.classList.add('sidebar-open');

      // Guardar el scroll actual
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;

      return () => {
        // Remover clase y restaurar scroll
        document.body.classList.remove('sidebar-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobileMenuOpen]);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Guardar favoritos en localStorage de forma segura
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    try {
      safeLocalStorage.setItem('sidebar_favorites', JSON.stringify(newFavorites));
    } catch (error) {
      logger.error('Error saving favorites:', error);
      // Los favoritos siguen funcionando en memoria
    }
  };

  // Toggle favorito
  const toggleFavorite = (href: string) => {
    const newFavorites = favorites.includes(href)
      ? favorites.filter((f) => f !== href)
      : [...favorites, href];
    saveFavorites(newFavorites);
  };

  // Filtrar items según rol y módulos activos
  const filterItems = (items: any[], useSelectedCompanyModules: boolean = false) => {
    // Validación: Si no hay rol o módulos aún no cargados, retornar vacío
    if (!role || !modulesLoaded) return [];

    // Validación: Si items no es un array válido
    if (!Array.isArray(items) || items.length === 0) return [];

    // Determinar qué módulos usar para filtrar
    // Si es super_admin con empresa seleccionada y useSelectedCompanyModules es true,
    // usar los módulos de la empresa seleccionada
    const modulesToCheck =
      useSelectedCompanyModules &&
      role === 'super_admin' &&
      selectedCompany &&
      selectedCompanyModules.length > 0
        ? selectedCompanyModules
        : activeModules;

    let filtered = items.filter((item) => {
      // Validación: item debe tener roles
      if (!item || !Array.isArray(item.roles)) return false;

      // Verificar permisos de rol
      if (!item.roles.includes(role)) return false;

      // Verificar si el módulo está activo
      const moduleCode = ROUTE_TO_MODULE[item.href];
      if (!moduleCode) return true; // Si no hay mapeo, mostrar por defecto

      // Los módulos core siempre se muestran (esCore: true)
      if (CORE_MODULES.includes(moduleCode)) return true;

      return modulesToCheck.includes(moduleCode);
    });

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return item && item.name && item.name.toLowerCase().includes(query);
      });
    }

    return filtered;
  };

  // Filtrar items por rol y módulos activos
  const filteredDashboardItems = filterItems(dashboardNavItems);

  // Verticales de Negocio - Usar módulos de empresa seleccionada si hay una (Super Admin)
  const useCompanyModules = role === 'super_admin' && !!selectedCompany;
  const filteredAlquilerResidencialItems = filterItems(alquilerResidencialItems, useCompanyModules);
  const filteredStrItems = filterItems(strNavItems, useCompanyModules);
  const filteredCoLivingItems = filterItems(coLivingNavItems, useCompanyModules);
  const filteredBuildToRentItems = filterItems(buildToRentNavItems, useCompanyModules);
  const filteredFlippingItems = filterItems(flippingNavItems, useCompanyModules);
  const filteredConstruccionItems = filterItems(construccionNavItems, useCompanyModules);
  const filteredEwoorkerItems = filterItems(ewoorkerNavItems, useCompanyModules);
  const filteredComercialItems = filterItems(comercialNavItems, useCompanyModules);
  const filteredAlquilerComercialItems = filterItems(alquilerComercialNavItems, useCompanyModules);
  const filteredAdminFincasItems = filterItems(adminFincasItems, useCompanyModules);
  const filteredStudentHousingItems = filterItems(studentHousingNavItems, useCompanyModules);
  const filteredViajesCorporativosItems = filterItems(viajesCorporativosNavItems, useCompanyModules);
  const filteredViviendaSocialItems = filterItems(viviendaSocialNavItems, useCompanyModules);
  const filteredRealEstateDeveloperItems = filterItems(realEstateDeveloperNavItems, useCompanyModules);
  const filteredWorkspaceItems = filterItems(workspaceNavItems, useCompanyModules);
  const filteredWarehouseItems = filterItems(warehouseNavItems, useCompanyModules);

  // Herramientas Horizontales - Usar módulos de empresa seleccionada si hay una (Super Admin)
  const filteredFinanzasItems = filterItems(finanzasNavItems, useCompanyModules);
  const filteredAnalyticsItems = filterItems(analyticsNavItems, useCompanyModules);
  const filteredOperacionesItems = filterItems(operacionesNavItems, useCompanyModules);
  const filteredHerramientasInversionItems = filterItems(herramientasInversionNavItems, useCompanyModules);
  const filteredComunicacionesItems = filterItems(comunicacionesNavItems, useCompanyModules);
  const filteredDocumentosLegalItems = filterItems(documentosLegalNavItems, useCompanyModules);
  const filteredCrmMarketingItems = filterItems(crmMarketingNavItems, useCompanyModules);
  const filteredAutomatizacionItems = filterItems(automatizacionNavItems, useCompanyModules);
  const filteredInnovacionItems = filterItems(innovacionNavItems, useCompanyModules);
  const filteredSoporteItems = filterItems(soporteNavItems, useCompanyModules);

  // Roles Específicos
  const filteredOperadorItems = filterItems(operadorNavItems);

  // Administración
  const filteredAdministradorEmpresaItems = filterItems(administradorEmpresaItems);
  const filteredSuperAdminPlatformItems = filterItems(superAdminPlatformItems);

  // Obtener items favoritos de todas las secciones
  const allItems = [
    ...dashboardNavItems,
    // Verticales
    ...alquilerResidencialItems,
    ...strNavItems,
    ...coLivingNavItems,
    ...buildToRentNavItems,
    ...flippingNavItems,
    ...construccionNavItems,
    ...comercialNavItems,
    ...alquilerComercialNavItems,
    ...adminFincasItems,
    // Herramientas Horizontales
    ...finanzasNavItems,
    ...analyticsNavItems,
    ...operacionesNavItems,
    ...herramientasInversionNavItems,
    ...comunicacionesNavItems,
    ...documentosLegalNavItems,
    ...crmMarketingNavItems,
    ...automatizacionNavItems,
    ...innovacionNavItems,
    ...soporteNavItems,
    // Roles específicos
    ...operadorNavItems,
    // Administración
    ...administradorEmpresaItems,
    ...superAdminPlatformItems,
  ];

  // Validación: Filtrar favoritos de forma segura
  const favoriteItems =
    favorites.length > 0 && allItems.length > 0
      ? allItems.filter((item) => {
          try {
            return (
              item && item.href && favorites.includes(item.href) && filterItems([item]).length > 0
            );
          } catch (error) {
            logger.error('Error filtering favorite item:', error);
            return false;
          }
        })
      : [];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newState = { ...prev, [section]: !prev[section] };
      try {
        safeLocalStorage.setItem('sidebar_expanded_sections', JSON.stringify(newState));
      } catch (error) {
        logger.error('Error saving expanded sections:', error);
        // Las secciones siguen funcionando en memoria
      }
      return newState;
    });
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Componente reutilizable para nav items con favoritos
  const NavItem = ({
    item,
    showFavoriteButton = true,
  }: {
    item: any;
    showFavoriteButton?: boolean;
  }) => {
    const isActive = pathname?.startsWith(item.href) ?? false;
    const isFavorite = favorites.includes(item.href);

    return (
      <div className="relative group">
        <Link
          href={item.href}
          prefetch={true}
          onClick={() => {
            // Cerrar el menú móvil
            setIsMobileMenuOpen(false);
            onNavigate?.();
          }}
          data-tour={item.dataTour || undefined}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm',
            isActive
              ? 'bg-white text-black font-medium'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <item.icon size={18} />
          <span className="flex-1">{item.name}</span>
        </Link>
        {showFavoriteButton && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(item.href);
            }}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10',
              isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
            )}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    );
  };

  // Componente para nav items con submenús (Super Admin)
  // Ahora acepta companyId opcional para parametrizar URLs
  const NavItemWithSubs = ({ 
    item, 
    companyId 
  }: { 
    item: SidebarItem; 
    companyId?: string;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Función para añadir companyId a URLs
    const appendCompanyId = (href: string): string => {
      if (!companyId) return href;
      return href.includes('?')
        ? `${href}&companyId=${companyId}`
        : `${href}?companyId=${companyId}`;
    };
    
    const itemHref = appendCompanyId(item.href);
    const isActive = pathname?.startsWith(item.href) ?? false;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    // Auto-expandir si algún subitem está activo
    useEffect(() => {
      if (hasSubItems && item.subItems?.some((sub) => pathname?.startsWith(sub.href))) {
        setIsExpanded(true);
      }
    }, [pathname, hasSubItems, item.subItems]);

    if (!hasSubItems) {
      return <NavItem item={{ ...item, href: itemHref }} showFavoriteButton={false} />;
    }

    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm w-full',
            isActive
              ? 'bg-gray-800 text-white font-medium'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <item.icon size={18} />
          <span className="flex-1 text-left">{item.name}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1 border-l border-gray-700 pl-2">
            {item.subItems?.map((subItem) => {
              const subItemHref = appendCompanyId(subItem.href);
              const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href);
              return (
                <Link
                  key={subItem.href}
                  href={subItemHref}
                  prefetch={true}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate?.();
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-xs',
                    isSubActive
                      ? 'bg-white text-black font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  {subItem.icon ? (
                    <subItem.icon size={14} className="opacity-70" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                  )}
                  {subItem.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button - Fixed en la parte superior izquierda */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-[100] p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-2xl hover:shadow-indigo-600/90 active:scale-95 transition-all duration-200 border-2 border-white/30 backdrop-blur-md touch-manipulation flex items-center justify-center"
        style={{ backgroundColor: 'rgba(79, 70, 229, 0.95)', minWidth: '52px', minHeight: '52px' }}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? (
          <X size={26} strokeWidth={2.5} />
        ) : (
          <Menu size={26} strokeWidth={2.5} />
        )}
      </button>

      {/* Overlay for mobile - Cubre toda la pantalla excepto el botón */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Visible en desktop, toggle en mobile */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-[90] h-screen w-[85vw] max-w-[320px] sm:w-64 lg:w-64',
          'bg-black text-white overflow-hidden transition-transform duration-300 ease-in-out',
          // Desktop: siempre visible
          'lg:translate-x-0',
          // Mobile: toggle con menu
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          maxHeight: '100vh',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
        aria-label="Navegación principal"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="relative w-full h-12">
              <Image src={logo} alt={appName} fill className="object-contain" priority />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{appName}</p>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                type="text"
                placeholder="Buscar página..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-400 hover:text-white mt-2 transition-colors"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>

          {/* Navigation - Mejorado para scroll en móviles */}
          <nav
            className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain"
            data-sidebar-nav
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
            }}
          >
            {/* Favorites Section */}
            {favoriteItems.length > 0 && !searchQuery && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('favorites')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Star size={14} fill="currentColor" className="text-yellow-400" />
                    <span>Favoritos</span>
                  </div>
                  {expandedSections.favorites ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.favorites && (
                  <div className="space-y-1 mt-1">
                    {favoriteItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Section */}
            {filteredDashboardItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('dashboard')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏠 Inicio</span>
                  {expandedSections.dashboard ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.dashboard && (
                  <div className="space-y-1 mt-1">
                    {filteredDashboardItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SUPER ADMIN - GESTIÓN DE PLATAFORMA (PRIMERO para Super Admin) */}
            {/* ============================================================== */}
            {filteredSuperAdminPlatformItems.length > 0 && role === 'super_admin' && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    ⚡ Gestión de Plataforma
                  </h3>
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('superAdminPlatform')}
                    className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-indigo-300 uppercase hover:text-white transition-colors"
                  >
                    <span>🌐 Plataforma Global</span>
                    {expandedSections.superAdminPlatform ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedSections.superAdminPlatform && (
                    <div className="space-y-1 mt-1">
                      {filteredSuperAdminPlatformItems.map((item) => (
                        <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* SELECTOR DE EMPRESA Y GESTIÓN (Para Super Admin) */}
            {/* ============================================================== */}
            {role === 'super_admin' && filteredAdministradorEmpresaItems.length > 0 && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    🏢 Gestión de Empresas
                  </h3>
                  <p className="text-[9px] text-gray-500 mt-1">
                    Selecciona una empresa para configurar
                  </p>
                </div>

                {/* Selector de Empresa */}
                <div className="mb-4 px-2">
                  <CompanySelector
                    onCompanyChange={(company) => {
                      // Auto-expandir la sección cuando se selecciona empresa
                      if (company) {
                        setExpandedSections((prev) => ({
                          ...prev,
                          administradorEmpresa: true,
                        }));
                      }
                    }}
                  />
                </div>

                {/* Gestión de Empresa - Solo visible cuando hay empresa seleccionada */}
                {selectedCompany && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection('administradorEmpresa')}
                      className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-emerald-300 uppercase hover:text-white transition-colors"
                    >
                      <span>
                        ⚙️ Configurar: {selectedCompany.nombre.substring(0, 15)}
                        {selectedCompany.nombre.length > 15 ? '...' : ''}
                      </span>
                      {expandedSections.administradorEmpresa ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {expandedSections.administradorEmpresa && (
                      <div className="space-y-1 mt-1">
                        {filteredAdministradorEmpresaItems.map((item) => (
                          <NavItemWithSubs
                            key={item.href}
                            item={item as SidebarItem}
                            companyId={selectedCompany.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje cuando no hay empresa seleccionada */}
                {!selectedCompany && (
                  <div className="mx-2 mb-4 p-3 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                    <p className="text-xs text-gray-400 text-center">
                      Selecciona una empresa para ver las opciones de configuración
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ============================================================== */}
            {/* EXPLOTACIÓN DE ACTIVOS (Inversión/Rendimiento) */}
            {/* ============================================================== */}
            {(filteredAlquilerResidencialItems.length > 0 ||
              filteredStrItems.length > 0 ||
              filteredCoLivingItems.length > 0 ||
              filteredBuildToRentItems.length > 0 ||
              filteredFlippingItems.length > 0 ||
              filteredComercialItems.length > 0 ||
              filteredAlquilerComercialItems.length > 0 ||
              filteredWarehouseItems.length > 0 ||
              filteredViviendaSocialItems.length > 0) &&
              (role === 'administrador' || (role === 'super_admin' && selectedCompany)) && (
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      selectedCompany ? 'text-blue-400' : 'text-gray-500'
                    )}
                  >
                    💰 Explotación de Activos
                  </h3>
                  <p className="text-[8px] text-gray-500 mt-0.5">Inversión / Rendimiento</p>
                  {/* Mostrar empresa seleccionada para Super Admin */}
                  {role === 'super_admin' && selectedCompany && (
                    <p className="text-[9px] text-blue-500 mt-1">
                      Empresa: {selectedCompany.nombre}
                    </p>
                  )}
                </div>
              )}

            {/* 1. LIVING RESIDENCIAL (Alquiler + Coliving + Student Housing) */}
            {(filteredAlquilerResidencialItems.length > 0 || filteredCoLivingItems.length > 0 || filteredStudentHousingItems.length > 0) && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('alquilerResidencial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏠 Living Residencial</span>
                  {expandedSections.alquilerResidencial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.alquilerResidencial && (
                  <div className="space-y-1 mt-1">
                    {/* Alquiler Tradicional */}
                    {filteredAlquilerResidencialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Coliving / Habitaciones */}
                    {filteredCoLivingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">Coliving</div>
                    )}
                    {filteredCoLivingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Student Housing */}
                    {filteredStudentHousingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">Student Housing</div>
                    )}
                    {filteredStudentHousingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. ALQUILER TURÍSTICO CORTA ESTANCIA (STR) */}
            {filteredStrItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('str')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏖️ Alquiler Turístico (STR)</span>
                  {expandedSections.str ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.str && (
                  <div className="space-y-1 mt-1">
                    {filteredStrItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Coliving y Student Housing en Living Residencial, Workspace en Comercial */}

            {/* 4. CONSTRUCCIÓN / PROMOCIÓN */}
            {(filteredBuildToRentItems.length > 0 || filteredFlippingItems.length > 0 || filteredConstruccionItems.length > 0 || filteredEwoorkerItems.length > 0 || filteredRealEstateDeveloperItems.length > 0) && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('construccion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏗️ Construcción / Promoción</span>
                  {expandedSections.construccion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.construccion && (
                  <div className="space-y-1 mt-1">
                    {/* Proyectos de Obra */}
                    {filteredConstruccionItems.length > 0 && (
                      <div className="ml-2 mt-1 mb-1 text-[9px] text-gray-500 uppercase">Obra Nueva / Reformas</div>
                    )}
                    {filteredConstruccionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredBuildToRentItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Flipping */}
                    {filteredFlippingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">House Flipping</div>
                    )}
                    {filteredFlippingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Promociones Inmobiliarias */}
                    {filteredRealEstateDeveloperItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">Promociones</div>
                    )}
                    {filteredRealEstateDeveloperItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* eWoorker - Marketplace B2B */}
                    {filteredEwoorkerItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-amber-500 uppercase">🔧 eWoorker (B2B)</div>
                    )}
                    {filteredEwoorkerItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. INMUEBLES COMERCIALES (Oficinas + Locales + Naves/Logística + Workspace) */}
            {(filteredComercialItems.length > 0 || filteredAlquilerComercialItems.length > 0 || filteredWarehouseItems.length > 0 || filteredWorkspaceItems.length > 0) && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('comercial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏢 Inmuebles Comerciales</span>
                  {expandedSections.comercial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.comercial && (
                  <div className="space-y-1 mt-1">
                    {/* Servicios Profesionales */}
                    {filteredComercialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Oficinas, Locales, Naves */}
                    {filteredAlquilerComercialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Naves y Logística */}
                    {filteredWarehouseItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">Logística / Almacenes</div>
                    )}
                    {filteredWarehouseItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Workspace / Coworking */}
                    {filteredWorkspaceItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">Workspace</div>
                    )}
                    {filteredWorkspaceItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SERVICIOS DE ADMINISTRACIÓN (B2C/Servicio) */}
            {/* ============================================================== */}
            {filteredAdminFincasItems.length > 0 &&
              (role === 'administrador' || (role === 'super_admin' && selectedCompany)) && (
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      selectedCompany ? 'text-purple-400' : 'text-gray-500'
                    )}
                  >
                    🤝 Servicios de Administración
                  </h3>
                  <p className="text-[8px] text-gray-500 mt-0.5">B2C / Servicio</p>
                </div>
              )}

            {/* COMUNIDADES DE PROPIETARIOS */}
            {filteredAdminFincasItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('adminFincas')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏘️ Comunidades de Propietarios</span>
                  {expandedSections.adminFincas ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.adminFincas && (
                  <div className="space-y-1 mt-1">
                    {filteredAdminFincasItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Viajes Corporativos - ELIMINADO (No es PropTech) */}

            {/* 7. VIVIENDA SOCIAL / RESIDENCIAS */}
            {filteredViviendaSocialItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('viviendaSocial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏛️ Vivienda Social / Residencias</span>
                  {expandedSections.viviendaSocial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.viviendaSocial && (
                  <div className="space-y-1 mt-1">
                    {filteredViviendaSocialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Estructura simplificada:
                - Living: Alquiler + Coliving + Student Housing
                - Comercial: Oficinas + Locales + Naves + Logística + Workspace
                - Construcción: Obra + Flipping + Promociones + eWoorker */}

            {/* HERRAMIENTAS HORIZONTALES - Separador visual */}
            {(filteredFinanzasItems.length > 0 ||
              filteredAnalyticsItems.length > 0 ||
              filteredOperacionesItems.length > 0 ||
              filteredComunicacionesItems.length > 0) && (
              <div className="px-2 py-3 mb-2 border-t border-gray-800">
                <h3
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    role === 'super_admin' && selectedCompany ? 'text-emerald-400' : 'text-gray-500'
                  )}
                >
                  🛠️ Herramientas
                  {role === 'super_admin' && selectedCompany && (
                    <span className="text-emerald-500 normal-case font-normal ml-1">
                      ({selectedCompany.nombre.substring(0, 12)}
                      {selectedCompany.nombre.length > 12 ? '...' : ''})
                    </span>
                  )}
                </h3>
              </div>
            )}

            {/* Finanzas */}
            {filteredFinanzasItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('finanzas')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>💰 Finanzas</span>
                  {expandedSections.finanzas ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.finanzas && (
                  <div className="space-y-1 mt-1">
                    {filteredFinanzasItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics */}
            {filteredAnalyticsItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('analytics')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>📊 Analytics e IA</span>
                  {expandedSections.analytics ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.analytics && (
                  <div className="space-y-1 mt-1">
                    {filteredAnalyticsItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Operaciones */}
            {filteredOperacionesItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('operaciones')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>⚙️ Operaciones</span>
                  {expandedSections.operaciones ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.operaciones && (
                  <div className="space-y-1 mt-1">
                    {filteredOperacionesItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Herramientas de Inversión (NUEVO) */}
            {filteredHerramientasInversionItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('herramientasInversion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🧮 Inversión</span>
                  {expandedSections.herramientasInversion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.herramientasInversion && (
                  <div className="space-y-1 mt-1">
                    {filteredHerramientasInversionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comunicaciones */}
            {filteredComunicacionesItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('comunicaciones')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>💬 Comunicaciones</span>
                  {expandedSections.comunicaciones ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.comunicaciones && (
                  <div className="space-y-1 mt-1">
                    {filteredComunicacionesItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documentos y Legal */}
            {filteredDocumentosLegalItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('documentosLegal')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>📄 Documentos y Legal</span>
                  {expandedSections.documentosLegal ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.documentosLegal && (
                  <div className="space-y-1 mt-1">
                    {filteredDocumentosLegalItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CRM INMOBILIARIO (Herramienta Horizontal) */}
            {filteredCrmMarketingItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('crmMarketing')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>📇 CRM Inmobiliario</span>
                  {expandedSections.crmMarketing ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.crmMarketing && (
                  <div className="space-y-1 mt-1">
                    {filteredCrmMarketingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Automatización */}
            {filteredAutomatizacionItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('automatizacion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>⚡ Automatización</span>
                  {expandedSections.automatizacion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.automatizacion && (
                  <div className="space-y-1 mt-1">
                    {filteredAutomatizacionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Innovación */}
            {filteredInnovacionItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('innovacion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🚀 Innovación</span>
                  {expandedSections.innovacion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.innovacion && (
                  <div className="space-y-1 mt-1">
                    {filteredInnovacionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Soporte */}
            {filteredSoporteItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('soporte')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🎧 Soporte</span>
                  {expandedSections.soporte ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.soporte && (
                  <div className="space-y-1 mt-1">
                    {filteredSoporteItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OPERADOR DE CAMPO - Solo visible para operadores */}
            {filteredOperadorItems.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    👷 Operador de Campo
                  </h3>
                </div>
                <button
                  onClick={() => toggleSection('operador')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>Dashboard Operador</span>
                  {expandedSections.operador ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.operador && (
                  <div className="space-y-1 mt-1">
                    {filteredOperadorItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADMINISTRACIÓN DE EMPRESA (Solo para Administrador - NO Super Admin) */}
            {/* Gestión de Empresa - Visible para administrador y super_admin */}
            {filteredAdministradorEmpresaItems.length > 0 && (role === 'administrador' || role === 'super_admin') && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    ⚙️ Configuración de Mi Empresa
                  </h3>
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('administradorEmpresa')}
                    className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                  >
                    <span>🏢 Gestión de Empresa</span>
                    {expandedSections.administradorEmpresa ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedSections.administradorEmpresa && (
                    <div className="space-y-1 mt-1">
                      {filteredAdministradorEmpresaItems.map((item) => (
                        <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* No results message */}
            {searchQuery && favoriteItems.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">No se encontraron páginas</p>
                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
              </div>
            )}
          </nav>

          {/* User Info & Logout - Mejorado con validaciones */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            {sessionStatus === 'loading' ? (
              /* Loading skeleton */
              <div className="px-4 py-3 bg-gray-800 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ) : session?.user ? (
              <>
                {/* User Profile Card */}
                <Link
                  href="/perfil"
                  className="block px-4 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
                  data-testid="user-menu"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'Usuario'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        (session.user.name || session.user.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session.user.name || 'Usuario'}
                      </p>
                      {session.user.email && (
                        <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                      )}
                      {session.user.role && (
                        <p className="text-[10px] text-indigo-400 uppercase mt-0.5 font-semibold">
                          {session.user.role
                            .replace('_', ' ')
                            .replace('super admin', 'Super Admin')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Settings Link */}
                <Link
                  href="/configuracion"
                  data-tour="configuracion-link"
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
                >
                  <Settings size={18} />
                  <span className="text-sm">Configuración</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-red-300 transition-all duration-200"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Cerrar Sesión</span>
                </button>
              </>
            ) : sessionStatus === 'unauthenticated' ? (
              /* Redirect to login if not authenticated */
              <div className="px-4 py-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 text-center">No autenticado</p>
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  Iniciar Sesión
                </Button>
              </div>
            ) : (
              /* Fallback genérico */
              <div className="px-4 py-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <p className="text-xs text-gray-400">Cargando...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
