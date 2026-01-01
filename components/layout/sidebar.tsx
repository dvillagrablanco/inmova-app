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
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import logger, { logError } from '@/lib/logger';
import { safeLocalStorage } from '@/lib/safe-storage';
import { toggleMobileMenu, closeMobileMenu } from '@/lib/mobile-menu';

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
  '/redes-sociales': 'redes_sociales',
  '/admin/dashboard': 'admin_dashboard',
  '/admin/clientes': 'gestion_clientes',
  '/admin/planes': 'admin_planes',
  '/admin/facturacion-b2b': 'admin_facturacion_b2b',
  '/admin/personalizacion': 'admin_personalizacion',
  '/admin/activity': 'admin_activity',
  '/admin/alertas': 'admin_alertas',
  '/admin/portales-externos': 'admin_portales_externos',
  '/admin/aprobaciones': 'admin_aprobaciones',
  '/admin/reportes-programados': 'admin_reportes_programados',
  '/admin/importar': 'admin_importar',
  '/admin/ocr-import': 'admin_ocr_import',
  '/api-docs': 'api_docs',
  '/admin/configuracion': 'configuracion',
  '/admin/usuarios': 'usuarios',
  '/admin/modulos': 'configuracion',
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
};

// Módulos core que siempre deben mostrarse (esCore: true)
const CORE_MODULES = [
  'dashboard',
  'edificios',
  'unidades',
  'inquilinos',
  'contratos',
  'pagos',
  'mantenimiento',
  'calendario',
  'chat',
  'proveedores',
  'gastos',
  'tareas',
  'candidatos',
  'notificaciones',
  'incidencias',
  'ocr',
  'documentos',
  'reportes',
  'bi',
  'analytics',
  'crm',
  'anuncios',
  'votaciones',
  'reuniones',
  'reservas',
  'valoraciones',
  'publicaciones',
  'screening',
  'galerias',
  'certificaciones',
  'seguros',
  'inspecciones',
  'visitas',
  'ordenes_trabajo',
  'firma_digital',
  'legal',
  'open_banking',
  'marketplace',
  'sms',
  'room_rental',
  'community_management',
  'esg',
  'iot',
  'blockchain',
  'tours_virtuales',
  'economia_circular',
  'auditoria',
  'seguridad_compliance',
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
  'api_docs',
  'configuracion', // Agregado para que siempre se muestre la configuración de empresa
  'usuarios', // Agregado para que siempre se muestre la gestión de usuarios
  // Verticales - siempre visibles según rol
  'flipping_projects',
  'construction_projects',
  'professional_projects',
  'str_listings',
  'str_bookings',
  'str_channels',
  'str_advanced',
  'str_housekeeping',
  'admin_fincas',
  'admin_sales_team',
  'admin_portales_externos',
];

// ============================================================================
// NUEVA ORGANIZACIÓN MEJORADA - BASADA EN VERTICALES Y HERRAMIENTAS HORIZONTALES
// ============================================================================

// 1. INICIO - Dashboard Principal
const dashboardNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
    dataTour: 'dashboard-link',
  },
  {
    name: 'Inicio',
    href: '/dashboard',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
];

// 2. VERTICALES DE NEGOCIO - Agrupadas por modelo de negocio

// 2.1 ALQUILER RESIDENCIAL TRADICIONAL
const alquilerResidencialItems = [
  {
    name: 'Edificios',
    href: '/edificios',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'edificios-menu',
  },
  {
    name: 'Unidades',
    href: '/unidades',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'unidades-menu',
  },
  {
    name: 'Garajes y Trasteros',
    href: '/garajes-trasteros',
    icon: Car,
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
    name: 'Screening Inquilinos',
    href: '/screening',
    icon: UserCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Valoraciones Propiedades',
    href: '/valoraciones',
    icon: Award,
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
  {
    name: 'Seguros',
    href: '/seguros',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.2 STR - SHORT TERM RENTALS (Airbnb, Booking, etc.)
const strNavItems = [
  {
    name: 'Dashboard STR',
    href: '/str',
    icon: Hotel,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Anuncios y Listados',
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
    name: 'Channel Manager',
    href: '/str/channels',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Pricing Dinámico',
    href: '/str/pricing',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Gestión de Reviews',
    href: '/str/reviews',
    icon: Star,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Limpieza y Housekeeping',
    href: '/str-housekeeping',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'STR Avanzado',
    href: '/str-advanced',
    icon: Sparkles,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.3 CO-LIVING / ALQUILER POR HABITACIONES
const coLivingNavItems = [
  {
    name: 'Room Rental',
    href: '/room-rental',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Comunidad Social',
    href: '/comunidad-social',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor', 'community_manager'],
  },
  {
    name: 'Reservas Espacios Comunes',
    href: '/reservas',
    icon: CalendarCheck,
    roles: ['super_admin', 'administrador', 'gestor', 'operador', 'community_manager'],
  },
];

// 2.4 BUILD-TO-RENT / CONSTRUCCIÓN
const buildToRentNavItems = [
  {
    name: 'Proyectos Construcción',
    href: '/construction/projects',
    icon: HardHat,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Gantt y Cronograma',
    href: '/construction/gantt',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Control de Calidad',
    href: '/construction/quality-control',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Proveedores',
    href: '/proveedores',
    icon: Package,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Órdenes de Trabajo',
    href: '/ordenes-trabajo',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.5 HOUSE FLIPPING
const flippingNavItems = [
  {
    name: 'Dashboard Flipping',
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
    name: 'Calculadora ROI',
    href: '/flipping/calculator',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Comparador de Propiedades',
    href: '/flipping/comparator',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Timeline de Proyectos',
    href: '/flipping/timeline',
    icon: Clock,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.6 COMERCIAL
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

// 2.7 ADMINISTRADOR DE FINCAS / COMUNIDADES
const adminFincasItems = [
  {
    name: 'Portal Admin Fincas',
    href: '/comunidades',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Anuncios Comunidad',
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
    name: 'Reuniones y Actas',
    href: '/reuniones',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Cuotas y Derramas',
    href: '/comunidades/cuotas',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Fondos de Reserva',
    href: '/comunidades/fondos',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Finanzas Comunidad',
    href: '/comunidades/finanzas',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// ============================================================================
// 3. HERRAMIENTAS HORIZONTALES - Aplicables a todas las verticales
// ============================================================================

// 3.1 FINANZAS Y CONTABILIDAD
const finanzasNavItems = [
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
    name: 'Facturación',
    href: '/facturacion',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Contabilidad',
    href: '/contabilidad',
    icon: BarChart2,
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
const analyticsNavItems = [
  {
    name: 'Business Intelligence',
    href: '/bi',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
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
    name: 'Asistente IA',
    href: '/asistente-ia',
    icon: Sparkles,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.3 OPERACIONES Y MANTENIMIENTO
const operacionesNavItems = [
  {
    name: 'Mantenimiento',
    href: '/mantenimiento',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Mantenimiento Preventivo',
    href: '/mantenimiento-preventivo',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Tareas',
    href: '/tareas',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Incidencias',
    href: '/incidencias',
    icon: AlertCircle,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Calendario',
    href: '/calendario',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Visitas y Showings',
    href: '/visitas',
    icon: CalendarCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.4 COMUNICACIONES
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
    name: 'Redes Sociales',
    href: '/redes-sociales',
    icon: Share2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Publicaciones',
    href: '/publicaciones',
    icon: Megaphone,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.5 DOCUMENTOS Y LEGAL
const documentosLegalNavItems = [
  {
    name: 'Documentos',
    href: '/documentos',
    icon: Folder,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'OCR Documentos',
    href: '/ocr',
    icon: Scan,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Firma Digital',
    href: '/firma-digital',
    icon: FileSignature,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Legal y Compliance',
    href: '/legal',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Seguridad & Compliance',
    href: '/seguridad-compliance',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Auditoría',
    href: '/auditoria',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Plantillas',
    href: '/plantillas',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.6 CRM Y MARKETING
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
    name: 'Marketplace',
    href: '/marketplace',
    icon: ShoppingCart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Galerías',
    href: '/galerias',
    icon: Folder,
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
const automatizacionNavItems = [
  {
    name: 'Automatización',
    href: '/automatizacion',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Workflows',
    href: '/workflows',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Recordatorios',
    href: '/recordatorios',
    icon: Bell,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.8 INNOVACIÓN Y SOSTENIBILIDAD
const innovacionNavItems = [
  {
    name: 'ESG & Sostenibilidad',
    href: '/esg',
    icon: Sparkles,
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
const administradorEmpresaItems = [
  {
    name: 'Configuración Empresa',
    href: '/admin/configuracion',
    icon: Settings,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Usuarios y Permisos',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Módulos Activos',
    href: '/admin/modulos',
    icon: Package,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Personalización (Branding)',
    href: '/admin/personalizacion',
    icon: Palette,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Aprobaciones',
    href: '/admin/aprobaciones',
    icon: CheckSquare,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Reportes Programados',
    href: '/admin/reportes-programados',
    icon: Clock,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Importar Datos',
    href: '/admin/importar',
    icon: Upload,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Legal y Cumplimiento',
    href: '/admin/legal',
    icon: Shield,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Sugerencias',
    href: '/admin/sugerencias',
    icon: MessageCircle,
    roles: ['administrador', 'super_admin'],
  },
];

// 5.2 SUPER ADMIN - GESTIÓN DE PLATAFORMA
const superAdminPlatformItems = [
  {
    name: 'Dashboard Super Admin',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin'],
  },
  {
    name: 'Gestión de Clientes (B2B)',
    href: '/admin/clientes',
    icon: Building2,
    roles: ['super_admin'],
  },
  {
    name: 'Planes y Facturación B2B',
    href: '/admin/planes',
    icon: DollarSign,
    roles: ['super_admin'],
  },
  {
    name: 'Facturación B2B',
    href: '/admin/facturacion-b2b',
    icon: FileText,
    roles: ['super_admin'],
  },
  {
    name: 'Partners y Aliados',
    href: '/admin/partners',
    icon: Briefcase,
    roles: ['super_admin'],
  },
  {
    name: 'Integraciones Contables',
    href: '/admin/integraciones-contables',
    icon: Package,
    roles: ['super_admin'],
  },
  {
    name: 'Marketplace Admin',
    href: '/admin/marketplace',
    icon: ShoppingCart,
    roles: ['super_admin'],
  },
  {
    name: 'Plantillas SMS',
    href: '/admin/plantillas-sms',
    icon: MessageCircle,
    roles: ['super_admin'],
  },
  {
    name: 'Firma Digital Config',
    href: '/admin/firma-digital',
    icon: FileSignature,
    roles: ['super_admin'],
  },
  {
    name: 'OCR Import Config',
    href: '/admin/ocr-import',
    icon: Scan,
    roles: ['super_admin'],
  },
  {
    name: 'Actividad de Sistema',
    href: '/admin/activity',
    icon: Activity,
    roles: ['super_admin'],
  },
  {
    name: 'Alertas de Sistema',
    href: '/admin/alertas',
    icon: Bell,
    roles: ['super_admin'],
  },
  {
    name: 'Salud del Sistema',
    href: '/admin/salud-sistema',
    icon: Activity,
    roles: ['super_admin'],
  },
  {
    name: 'Métricas de Uso',
    href: '/admin/metricas-uso',
    icon: BarChart2,
    roles: ['super_admin'],
  },
  {
    name: 'Seguridad y Logs',
    href: '/admin/seguridad',
    icon: Shield,
    roles: ['super_admin'],
  },
  {
    name: 'Backup y Restauración',
    href: '/admin/backup-restore',
    icon: Upload,
    roles: ['super_admin'],
  },
  {
    name: 'Portales Externos',
    href: '/admin/portales-externos',
    icon: Zap,
    roles: ['super_admin'],
  },
  {
    name: 'Documentación API',
    href: '/api-docs',
    icon: Code,
    roles: ['super_admin'],
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    favorites: true,
    dashboard: true,
    // Verticales
    alquilerResidencial: true,
    str: false,
    coLiving: false,
    buildToRent: false,
    flipping: false,
    comercial: false,
    adminFincas: false,
    // Herramientas Horizontales
    finanzas: true,
    analytics: false,
    operaciones: true,
    comunicaciones: false,
    documentosLegal: false,
    crmMarketing: false,
    automatizacion: false,
    innovacion: false,
    soporte: false,
    // Roles específicos
    operador: true,
    // Administración
    administradorEmpresa: false,
    superAdminPlatform: true,
  });

  // Cargar estado expandido desde localStorage de forma segura
  useEffect(() => {
    try {
      const storedExpanded = safeLocalStorage.getItem('sidebar_expanded_sections');
      if (storedExpanded) {
        setExpandedSections(JSON.parse(storedExpanded));
      }
    } catch (error) {
      logger.error('Error loading expanded sections:', error);
      // Continuar con estado por defecto
    }
  }, []);

  // Persistir posición de scroll de forma segura
  useEffect(() => {
    try {
      const sidebar = document.querySelector('[data-sidebar-nav]');
      if (sidebar) {
        const savedScroll = safeLocalStorage.getItem('sidebar_scroll_position');
        if (savedScroll) {
          sidebar.scrollTop = parseInt(savedScroll, 10);
        }

        const handleScroll = () => {
          try {
            safeLocalStorage.setItem('sidebar_scroll_position', sidebar.scrollTop.toString());
          } catch (err) {
            // Ignorar errores de storage
          }
        };

        sidebar.addEventListener('scroll', handleScroll);
        return () => sidebar.removeEventListener('scroll', handleScroll);
      }
    } catch (error) {
      logger.error('Error setting up scroll persistence:', error);
    }
  }, []);

  // Cargar módulos activos de la empresa
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
  }, []);

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
  const filterItems = (items: any[]) => {
    // Validación: Si no hay rol o módulos aún no cargados, retornar vacío
    if (!role || !modulesLoaded) return [];

    // Validación: Si items no es un array válido
    if (!Array.isArray(items) || items.length === 0) return [];

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

      return activeModules.includes(moduleCode);
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

  // Verticales de Negocio
  const filteredAlquilerResidencialItems = filterItems(alquilerResidencialItems);
  const filteredStrItems = filterItems(strNavItems);
  const filteredCoLivingItems = filterItems(coLivingNavItems);
  const filteredBuildToRentItems = filterItems(buildToRentNavItems);
  const filteredFlippingItems = filterItems(flippingNavItems);
  const filteredComercialItems = filterItems(comercialNavItems);
  const filteredAdminFincasItems = filterItems(adminFincasItems);

  // Herramientas Horizontales
  const filteredFinanzasItems = filterItems(finanzasNavItems);
  const filteredAnalyticsItems = filterItems(analyticsNavItems);
  const filteredOperacionesItems = filterItems(operacionesNavItems);
  const filteredComunicacionesItems = filterItems(comunicacionesNavItems);
  const filteredDocumentosLegalItems = filterItems(documentosLegalNavItems);
  const filteredCrmMarketingItems = filterItems(crmMarketingNavItems);
  const filteredAutomatizacionItems = filterItems(automatizacionNavItems);
  const filteredInnovacionItems = filterItems(innovacionNavItems);
  const filteredSoporteItems = filterItems(soporteNavItems);

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
    ...comercialNavItems,
    ...adminFincasItems,
    // Herramientas Horizontales
    ...finanzasNavItems,
    ...analyticsNavItems,
    ...operacionesNavItems,
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
          "fixed top-0 left-0 z-[90] h-screen w-[85vw] max-w-[320px] sm:w-64 lg:w-64",
          "bg-black text-white overflow-hidden transition-transform duration-300 ease-in-out",
          // Desktop: siempre visible
          "lg:translate-x-0",
          // Mobile: toggle con menu
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
                      <NavItem key={item.href} item={item} showFavoriteButton={false} />
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
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VERTICALES DE NEGOCIO - Separador visual */}
            {(filteredAlquilerResidencialItems.length > 0 ||
              filteredStrItems.length > 0 ||
              filteredCoLivingItems.length > 0 ||
              filteredBuildToRentItems.length > 0 ||
              filteredFlippingItems.length > 0 ||
              filteredComercialItems.length > 0 ||
              filteredAdminFincasItems.length > 0) && (
              <div className="px-2 py-3 mb-2 border-t border-gray-800">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  📊 Verticales de Negocio
                </h3>
              </div>
            )}

            {/* Alquiler Residencial Tradicional */}
            {filteredAlquilerResidencialItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('alquilerResidencial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏘️ Alquiler Residencial</span>
                  {expandedSections.alquilerResidencial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.alquilerResidencial && (
                  <div className="space-y-1 mt-1">
                    {filteredAlquilerResidencialItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STR - Short Term Rentals */}
            {filteredStrItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('str')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏖️ STR / Airbnb</span>
                  {expandedSections.str ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.str && (
                  <div className="space-y-1 mt-1">
                    {filteredStrItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Co-Living */}
            {filteredCoLivingItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('coLiving')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏘️ Co-Living</span>
                  {expandedSections.coLiving ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.coLiving && (
                  <div className="space-y-1 mt-1">
                    {filteredCoLivingItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Build-to-Rent / Construcción */}
            {filteredBuildToRentItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('buildToRent')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏗️ Build-to-Rent</span>
                  {expandedSections.buildToRent ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.buildToRent && (
                  <div className="space-y-1 mt-1">
                    {filteredBuildToRentItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* House Flipping */}
            {filteredFlippingItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('flipping')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🔨 House Flipping</span>
                  {expandedSections.flipping ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.flipping && (
                  <div className="space-y-1 mt-1">
                    {filteredFlippingItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comercial */}
            {filteredComercialItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('comercial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏢 Comercial</span>
                  {expandedSections.comercial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.comercial && (
                  <div className="space-y-1 mt-1">
                    {filteredComercialItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Administrador de Fincas */}
            {filteredAdminFincasItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('adminFincas')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏢 Admin de Fincas</span>
                  {expandedSections.adminFincas ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.adminFincas && (
                  <div className="space-y-1 mt-1">
                    {filteredAdminFincasItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HERRAMIENTAS HORIZONTALES - Separador visual */}
            {(filteredFinanzasItems.length > 0 ||
              filteredAnalyticsItems.length > 0 ||
              filteredOperacionesItems.length > 0 ||
              filteredComunicacionesItems.length > 0) && (
              <div className="px-2 py-3 mb-2 border-t border-gray-800">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  🛠️ Herramientas Horizontales
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
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CRM y Marketing */}
            {filteredCrmMarketingItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('crmMarketing')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>👥 CRM y Marketing</span>
                  {expandedSections.crmMarketing ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.crmMarketing && (
                  <div className="space-y-1 mt-1">
                    {filteredCrmMarketingItems.map((item) => (
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
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
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUPER ADMIN - GESTIÓN DE PLATAFORMA (Solo Super Admin) */}
            {filteredSuperAdminPlatformItems.length > 0 && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    ⚡ Super Admin - Plataforma
                  </h3>
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('superAdminPlatform')}
                    className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-indigo-300 uppercase hover:text-white transition-colors"
                  >
                    <span>🔧 Gestión de Plataforma</span>
                    {expandedSections.superAdminPlatform ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedSections.superAdminPlatform && (
                    <div className="space-y-1 mt-1">
                      {filteredSuperAdminPlatformItems.map((item) => (
                        <NavItem key={item.href} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ADMINISTRACIÓN DE EMPRESA (Admin y Super Admin) */}
            {filteredAdministradorEmpresaItems.length > 0 && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    ⚙️ Configuración Empresa
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
                        <NavItem key={item.href} item={item} />
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
