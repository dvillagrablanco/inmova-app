import { prisma } from './db';

/**
 * CATÁLOGO DE MÓDULOS DISPONIBLES
 * Cada módulo tiene:
 * - codigo: identificador único
 * - nombre: nombre visible
 * - descripcion: descripción del módulo
 * - categoria: agrupación lógica
 * - icono: icono de Lucide React
 * - ruta: ruta en la aplicación
 * - requiereModulos: módulos prerequisitos
 * - tiersIncluido: en qué planes está disponible
 * - esCore: si es un módulo esencial (siempre activo)
 */
export const MODULOS_CATALOGO = [
  // === MÓDULOS CORE (Siempre activos) ===
  {
    codigo: 'dashboard',
    nombre: 'Dashboard',
    descripcion: 'Panel principal con métricas y KPIs',
    categoria: 'core',
    icono: 'LayoutDashboard',
    ruta: '/dashboard',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 1
  },
  {
    codigo: 'edificios',
    nombre: 'Gestión de Edificios',
    descripcion: 'Administración de propiedades y edificios',
    categoria: 'core',
    icono: 'Building2',
    ruta: '/edificios',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 2
  },
  {
    codigo: 'unidades',
    nombre: 'Gestión de Unidades',
    descripcion: 'Administración de unidades y espacios',
    categoria: 'core',
    icono: 'Home',
    ruta: '/unidades',
    requiereModulos: ['edificios'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 3
  },
  {
    codigo: 'inquilinos',
    nombre: 'Gestión de Inquilinos',
    descripcion: 'Administración de inquilinos y arrendatarios',
    categoria: 'core',
    icono: 'Users',
    ruta: '/inquilinos',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 4
  },
  {
    codigo: 'contratos',
    nombre: 'Gestión de Contratos',
    descripcion: 'Administración de contratos de arrendamiento',
    categoria: 'core',
    icono: 'FileText',
    ruta: '/contratos',
    requiereModulos: ['inquilinos', 'unidades'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 5
  },
  {
    codigo: 'pagos',
    nombre: 'Gestión de Pagos',
    descripcion: 'Control de pagos y rentas',
    categoria: 'core',
    icono: 'CreditCard',
    ruta: '/pagos',
    requiereModulos: ['contratos'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 6
  },

  // === MÓDULOS DE GESTIÓN BÁSICA ===
  {
    codigo: 'documentos',
    nombre: 'Gestión Documental',
    descripcion: 'Almacenamiento y organización de documentos',
    categoria: 'gestion',
    icono: 'Folder',
    ruta: '/documentos',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 10
  },
  {
    codigo: 'mantenimiento',
    nombre: 'Mantenimiento',
    descripcion: 'Solicitudes y seguimiento de mantenimiento',
    categoria: 'gestion',
    icono: 'Wrench',
    ruta: '/mantenimiento',
    requiereModulos: ['edificios'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 11
  },
  {
    codigo: 'proveedores',
    nombre: 'Gestión de Proveedores',
    descripcion: 'Administración de proveedores de servicios',
    categoria: 'gestion',
    icono: 'UsersRound',
    ruta: '/proveedores',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 12
  },
  {
    codigo: 'gastos',
    nombre: 'Gestión de Gastos',
    descripcion: 'Control de gastos operativos',
    categoria: 'gestion',
    icono: 'DollarSign',
    ruta: '/gastos',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 13
  },

  // === MÓDULOS FINANCIEROS ===
  {
    codigo: 'reportes',
    nombre: 'Reportes Financieros',
    descripcion: 'Reportes y análisis financiero',
    categoria: 'financiero',
    icono: 'FileBarChart',
    ruta: '/reportes',
    requiereModulos: ['pagos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 20
  },
  {
    codigo: 'contabilidad',
    nombre: 'Contabilidad',
    descripcion: 'Módulo de contabilidad integrada',
    categoria: 'financiero',
    icono: 'DollarSign',
    ruta: '/contabilidad',
    requiereModulos: ['pagos', 'gastos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 21
  },
  {
    codigo: 'analytics',
    nombre: 'Analytics & Predicciones',
    descripcion: 'Análisis predictivo y estadísticas',
    categoria: 'financiero',
    icono: 'BarChart2',
    ruta: '/analytics',
    requiereModulos: ['pagos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 22
  },
  {
    codigo: 'bi',
    nombre: 'Business Intelligence',
    descripcion: 'Dashboard de BI con visualizaciones avanzadas',
    categoria: 'financiero',
    icono: 'LineChart',
    ruta: '/bi',
    requiereModulos: ['pagos', 'gastos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 23
  },

  // === MÓDULOS DE COMUNICACIÓN ===
  {
    codigo: 'notificaciones',
    nombre: 'Notificaciones',
    descripcion: 'Sistema de notificaciones internas',
    categoria: 'comunicacion',
    icono: 'Bell',
    ruta: '/notificaciones',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 30
  },
  {
    codigo: 'chat',
    nombre: 'Chat con Inquilinos',
    descripcion: 'Sistema de mensajería con inquilinos',
    categoria: 'comunicacion',
    icono: 'MessageSquare',
    ruta: '/chat',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 31
  },
  {
    codigo: 'sms',
    nombre: 'Mensajes SMS',
    descripcion: 'Envío de mensajes SMS',
    categoria: 'comunicacion',
    icono: 'MessageSquare',
    ruta: '/sms',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 32
  },

  // === MÓDULOS AVANZADOS ===
  {
    codigo: 'crm',
    nombre: 'CRM',
    descripcion: 'Gestión de relaciones con clientes',
    categoria: 'avanzado',
    icono: 'TrendingUp',
    ruta: '/crm',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 40
  },
  {
    codigo: 'legal',
    nombre: 'Gestión Legal',
    descripcion: 'Administración legal y cumplimiento',
    categoria: 'avanzado',
    icono: 'Gavel',
    ruta: '/legal',
    requiereModulos: ['contratos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 41
  },
  {
    codigo: 'marketplace',
    nombre: 'Marketplace',
    descripcion: 'Mercado de servicios y proveedores',
    categoria: 'avanzado',
    icono: 'Store',
    ruta: '/marketplace',
    requiereModulos: ['proveedores'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 42
  },
  {
    codigo: 'mantenimiento_pro',
    nombre: 'Mantenimiento Profesional',
    descripcion: 'Sistema avanzado de mantenimiento con predicciones',
    categoria: 'avanzado',
    icono: 'FileBarChart',
    ruta: '/mantenimiento-pro',
    requiereModulos: ['mantenimiento'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 43
  },
  {
    codigo: 'calendario',
    nombre: 'Calendario Unificado',
    descripcion: 'Calendario con eventos y programaciones',
    categoria: 'avanzado',
    icono: 'Calendar',
    ruta: '/calendario',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 44
  },
  {
    codigo: 'valoraciones',
    nombre: 'Valoraciones de Propiedades',
    descripcion: 'Sistema de valoración de propiedades',
    categoria: 'avanzado',
    icono: 'TrendingUp',
    ruta: '/valoraciones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 45
  },
  {
    codigo: 'publicaciones',
    nombre: 'Publicaciones Multi-portal',
    descripcion: 'Gestión de anuncios en múltiples portales',
    categoria: 'avanzado',
    icono: 'Share2',
    ruta: '/publicaciones',
    requiereModulos: ['unidades'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 46
  },
  {
    codigo: 'screening',
    nombre: 'Screening de Candidatos',
    descripcion: 'Sistema de verificación de candidatos',
    categoria: 'avanzado',
    icono: 'Shield',
    ruta: '/screening',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 47
  },
  {
    codigo: 'energia',
    nombre: 'Gestión de Energía',
    descripcion: 'Control y análisis de consumo energético',
    categoria: 'avanzado',
    icono: 'Zap',
    ruta: '/energia',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 48
  },

  // === MÓDULOS COMUNITARIOS (FASE 3-4) ===
  {
    codigo: 'incidencias',
    nombre: 'Incidencias Comunitarias',
    descripcion: 'Gestión de incidencias de la comunidad',
    categoria: 'comunidad',
    icono: 'AlertTriangle',
    ruta: '/incidencias',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 50
  },
  {
    codigo: 'votaciones',
    nombre: 'Votaciones Comunitarias',
    descripcion: 'Sistema de votaciones para juntas',
    categoria: 'comunidad',
    icono: 'Vote',
    ruta: '/votaciones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 51
  },
  {
    codigo: 'anuncios',
    nombre: 'Anuncios y Avisos',
    descripcion: 'Tablero de anuncios comunitarios',
    categoria: 'comunidad',
    icono: 'Megaphone',
    ruta: '/anuncios',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 52
  },
  {
    codigo: 'reuniones',
    nombre: 'Actas de Reuniones',
    descripcion: 'Gestión de reuniones y actas',
    categoria: 'comunidad',
    icono: 'Users',
    ruta: '/reuniones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 53
  },
  {
    codigo: 'reservas',
    nombre: 'Reserva de Espacios Comunes',
    descripcion: 'Sistema de reservas de espacios comunitarios',
    categoria: 'comunidad',
    icono: 'Calendar',
    ruta: '/reservas',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 54
  },
  {
    codigo: 'galerias',
    nombre: 'Galerías Multimedia',
    descripcion: 'Galerías de fotos y tours virtuales',
    categoria: 'comunidad',
    icono: 'ImageIcon',
    ruta: '/galerias',
    requiereModulos: ['unidades'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 55
  },

  // === MÓDULOS DE PORTALES ===
  {
    codigo: 'portal_inquilino',
    nombre: 'Portal del Inquilino',
    descripcion: 'Portal de autoservicio para inquilinos',
    categoria: 'portales',
    icono: 'UserCheck',
    ruta: '/portal-inquilino',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 60
  },
  {
    codigo: 'portal_propietario',
    nombre: 'Portal del Propietario',
    descripcion: 'Portal para propietarios de inmuebles',
    categoria: 'portales',
    icono: 'Briefcase',
    ruta: '/portal-propietario',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 61
  },
  {
    codigo: 'portal_proveedor',
    nombre: 'Portal del Proveedor',
    descripcion: 'Portal para proveedores de servicios',
    categoria: 'portales',
    icono: 'Briefcase',
    ruta: '/portal-proveedor',
    requiereModulos: ['proveedores'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 62
  },

  // === MÓDULOS DE ADMINISTRACIÓN ===
  {
    codigo: 'usuarios',
    nombre: 'Gestión de Usuarios',
    descripcion: 'Administración de usuarios del sistema',
    categoria: 'admin',
    icono: 'Users',
    ruta: '/admin/usuarios',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 70
  },
  {
    codigo: 'configuracion',
    nombre: 'Configuración General',
    descripcion: 'Configuración de la empresa',
    categoria: 'admin',
    icono: 'Settings',
    ruta: '/admin/configuracion',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 71
  },
  {
    codigo: 'auditoria',
    nombre: 'Auditoría y Seguridad',
    descripcion: 'Registro de auditoría y seguridad',
    categoria: 'admin',
    icono: 'Shield',
    ruta: '/auditoria',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 72
  },
];

/**
 * DEFINICIÓN DE PACKS DE SUSCRIPCIÓN
 */
export const SUBSCRIPTION_PACKS = [
  {
    tier: 'basico',
    nombre: 'Plan Básico',
    descripcion: 'Ideal para pequeñas inmobiliarias o propietarios individuales',
    precioMensual: 29.99,
    maxUsuarios: 3,
    maxPropiedades: 20,
    modulosIncluidos: [
      'dashboard',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'documentos',
      'mantenimiento',
      'notificaciones',
      'usuarios',
      'configuracion'
    ],
    caracteristicas: [
      'Hasta 3 usuarios',
      'Hasta 20 propiedades',
      'Gestión básica de propiedades',
      'Control de pagos y contratos',
      'Almacenamiento de documentos',
      'Soporte por email'
    ]
  },
  {
    tier: 'profesional',
    nombre: 'Plan Profesional',
    descripcion: 'Para inmobiliarias en crecimiento con necesidades avanzadas',
    precioMensual: 79.99,
    maxUsuarios: 10,
    maxPropiedades: 100,
    modulosIncluidos: [
      ...[
        'dashboard',
        'edificios',
        'unidades',
        'inquilinos',
        'contratos',
        'pagos',
        'documentos',
        'mantenimiento',
        'notificaciones',
        'usuarios',
        'configuracion'
      ],
      'proveedores',
      'gastos',
      'reportes',
      'chat',
      'calendario',
      'incidencias',
      'anuncios',
      'reservas',
      'galerias',
      'portal_inquilino'
    ],
    caracteristicas: [
      'Hasta 10 usuarios',
      'Hasta 100 propiedades',
      'Todos los módulos del Plan Básico',
      'Gestión de proveedores y gastos',
      'Reportes financieros',
      'Chat con inquilinos',
      'Portal del inquilino',
      'Calendario unificado',
      'Espacios comunes y reservas',
      'Soporte prioritario'
    ]
  },
  {
    tier: 'empresarial',
    nombre: 'Plan Empresarial',
    descripcion: 'Solución completa para grandes inmobiliarias',
    precioMensual: 149.99,
    maxUsuarios: -1, // Ilimitado
    maxPropiedades: -1, // Ilimitado
    modulosIncluidos: MODULOS_CATALOGO.map(m => m.codigo), // Todos los módulos
    caracteristicas: [
      'Usuarios ilimitados',
      'Propiedades ilimitadas',
      'Todos los módulos disponibles',
      'Business Intelligence',
      'Analytics y predicciones',
      'CRM avanzado',
      'Gestión legal',
      'Marketplace',
      'Screening de candidatos',
      'Mantenimiento predictivo',
      'Múltiples portales (inquilino, propietario, proveedor)',
      'Auditoría y seguridad',
      'Soporte 24/7',
      'API personalizada'
    ]
  }
];

/**
 * Verifica si un módulo está activo para una empresa
 */
export async function isModuleActiveForCompany(
  companyId: string,
  moduloCodigo: string
): Promise<boolean> {
  // Verificar si el módulo es core (siempre activo)
  const moduloDefinicion = MODULOS_CATALOGO.find(m => m.codigo === moduloCodigo);
  if (moduloDefinicion?.esCore) {
    return true;
  }

  // Verificar si el módulo está activo en CompanyModule
  const companyModule = await prisma.companyModule.findUnique({
    where: {
      companyId_moduloCodigo: {
        companyId,
        moduloCodigo
      }
    }
  });

  return companyModule?.activo || false;
}

/**
 * Obtiene todos los módulos activos de una empresa
 */
export async function getActiveModulesForCompany(companyId: string): Promise<string[]> {
  // Obtener módulos core (siempre activos)
  const coreModules = MODULOS_CATALOGO
    .filter(m => m.esCore)
    .map(m => m.codigo);

  // Obtener módulos activados manualmente
  const activeModules = await prisma.companyModule.findMany({
    where: {
      companyId,
      activo: true
    },
    select: {
      moduloCodigo: true
    }
  });

  const activatedModules = activeModules.map(m => m.moduloCodigo);

  // Combinar y eliminar duplicados
  return Array.from(new Set([...coreModules, ...activatedModules]));
}

/**
 * Activa un módulo para una empresa
 */
export async function activateModuleForCompany(
  companyId: string,
  moduloCodigo: string,
  activadoPor: string
): Promise<void> {
  await prisma.companyModule.upsert({
    where: {
      companyId_moduloCodigo: {
        companyId,
        moduloCodigo
      }
    },
    update: {
      activo: true,
      activadoPor,
      updatedAt: new Date()
    },
    create: {
      companyId,
      moduloCodigo,
      activo: true,
      activadoPor
    }
  });
}

/**
 * Desactiva un módulo para una empresa
 */
export async function deactivateModuleForCompany(
  companyId: string,
  moduloCodigo: string
): Promise<void> {
  // No se pueden desactivar módulos core
  const moduloDefinicion = MODULOS_CATALOGO.find(m => m.codigo === moduloCodigo);
  if (moduloDefinicion?.esCore) {
    throw new Error('No se pueden desactivar módulos esenciales');
  }

  await prisma.companyModule.update({
    where: {
      companyId_moduloCodigo: {
        companyId,
        moduloCodigo
      }
    },
    data: {
      activo: false,
      updatedAt: new Date()
    }
  });
}

/**
 * Inicializa los módulos según el plan de suscripción
 */
export async function initializeModulesForCompany(
  companyId: string,
  tier: 'basico' | 'profesional' | 'empresarial',
  activadoPor: string
): Promise<void> {
  const pack = SUBSCRIPTION_PACKS.find(p => p.tier === tier);
  if (!pack) {
    throw new Error(`Plan de suscripción no encontrado: ${tier}`);
  }

  // Activar todos los módulos del pack
  for (const moduloCodigo of pack.modulosIncluidos) {
    await activateModuleForCompany(companyId, moduloCodigo, activadoPor);
  }
}
