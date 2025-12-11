import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Definición de módulos disponibles con sus beneficios
const MODULE_DEFINITIONS = [
  {
    codigo: 'bi',
    nombre: 'Business Intelligence',
    descripcion: 'Análisis avanzado de datos y métricas predictivas',
    categoria: 'avanzado',
    icono: 'BarChart3',
    ruta: '/bi',
    benefits: [
      'Dashboards ejecutivos personalizables',
      'Análisis predictivo con IA',
      'Benchmarking vs mercado',
      'Alertas inteligentes automáticas'
    ]
  },
  {
    codigo: 'str',
    nombre: 'STR / Alquiler Vacacional',
    descripcion: 'Gestión de alquileres vacacionales y channel manager',
    categoria: 'gestion',
    icono: 'MapPin',
    ruta: '/str',
    benefits: [
      'Sincronización con Airbnb y Booking',
      'Pricing dinámico automático',
      'Gestión de calendarios unificada',
      'Automatización de mensajes a huéspedes'
    ]
  },
  {
    codigo: 'flipping',
    nombre: 'House Flipping',
    descripcion: 'Análisis y seguimiento de proyectos de inversión inmobiliaria',
    categoria: 'gestion',
    icono: 'TrendingUp',
    ruta: '/flipping',
    benefits: [
      'Cálculo de ROI y TIR en tiempo real',
      'Seguimiento de presupuestos de reforma',
      'Análisis comparativo de mercado',
      'Proyecciones de venta'
    ]
  },
  {
    codigo: 'construction',
    nombre: 'Gestión de Construcción',
    descripcion: 'Administración de proyectos de obra nueva y rehabilitación',
    categoria: 'gestion',
    icono: 'Building2',
    ruta: '/construction',
    benefits: [
      'Control de permisos y licencias',
      'Gestión de fases y cronogramas',
      'Seguimiento de agentes y subcontratas',
      'Alertas de hitos críticos'
    ]
  },
  {
    codigo: 'professional',
    nombre: 'Servicios Profesionales',
    descripcion: 'Facturación por horas para arquitectos e ingenieros',
    categoria: 'financiero',
    icono: 'DollarSign',
    ruta: '/professional',
    benefits: [
      'Time tracking integrado',
      'Facturación automática recurrente',
      'Portfolio público personalizable',
      'Gestión de proyectos y clientes'
    ]
  },
  {
    codigo: 'room_rental',
    nombre: 'Alquiler por Habitaciones',
    descripcion: 'Gestión de coliving y viviendas compartidas',
    categoria: 'gestion',
    icono: 'Users',
    ruta: '/room-rental',
    benefits: [
      'Prorrateo automático de gastos comunes',
      'Gestión de normas de convivencia',
      'Control de habitaciones individuales',
      'Contratos y pagos por inquilino'
    ]
  },
  {
    codigo: 'legal',
    nombre: 'Asesoría Legal',
    descripcion: 'Documentos legales y cumplimiento normativo',
    categoria: 'core',
    icono: 'FileText',
    ruta: '/legal',
    benefits: [
      'Plantillas de documentos actualizadas',
      'Alertas de cambios legislativos',
      'Gestión de desahucios y reclamaciones',
      'Consultas con abogados especializados'
    ]
  },
  {
    codigo: 'seguros',
    nombre: 'Gestión de Seguros',
    descripcion: 'Administración de pólizas y siniestros',
    categoria: 'financiero',
    icono: 'Building2',
    ruta: '/seguros',
    benefits: [
      'Comparador de pólizas de seguros',
      'Recordatorios de renovación',
      'Gestión de siniestros y reclamaciones',
      'Integración con aseguradoras'
    ]
  },
  {
    codigo: 'energia',
    nombre: 'Gestión Energética',
    descripcion: 'Optimización de consumos y eficiencia energética',
    categoria: 'avanzado',
    icono: 'Zap',
    ruta: '/energia',
    benefits: [
      'Monitorización de consumos en tiempo real',
      'Alertas de consumos anómalos',
      'Cálculo de certificación energética',
      'Sugerencias de mejora de eficiencia'
    ]
  },
  {
    codigo: 'esg',
    nombre: 'ESG & Sostenibilidad',
    descripcion: 'Métricas de impacto ambiental y social',
    categoria: 'avanzado',
    icono: 'TrendingUp',
    ruta: '/esg',
    benefits: [
      'Cálculo de huella de carbono',
      'Reportes ESG para inversores',
      'Certificaciones de sostenibilidad',
      'Análisis de impacto social'
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'inactive', 'all'

    // Obtener módulos activos de la empresa
    const activeModules = await prisma.companyModule.findMany({
      where: {
        companyId: user.companyId,
        activo: true
      }
    });

    const activeModuleCodes = new Set(activeModules.map(m => m.moduloCodigo));

    // Filtrar módulos según el estado solicitado
    let modules = MODULE_DEFINITIONS.map(def => ({
      ...def,
      activo: activeModuleCodes.has(def.codigo)
    }));

    if (status === 'active') {
      modules = modules.filter((m: { activo: boolean }) => m.activo);
    } else if (status === 'inactive') {
      modules = modules.filter((m: { activo: boolean }) => !m.activo);
    }

    return NextResponse.json({
      modules,
      total: modules.length,
      active: modules.filter((m: { activo: boolean }) => m.activo).length,
      inactive: modules.filter((m: { activo: boolean }) => !m.activo).length
    });
  } catch (error) {
    logger.error('Error loading modules:', error);
    return NextResponse.json(
      { error: 'Error al cargar módulos' },
      { status: 500 }
    );
  }
}
