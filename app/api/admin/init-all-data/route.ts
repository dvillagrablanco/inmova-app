/**
 * API Route: Inicializar todos los datos de la plataforma
 * 
 * Esta ruta crea/actualiza:
 * - Planes de suscripción de Inmova (sincronizados con landing /landing/precios)
 * - Planes de eWoorker
 * - Add-ons de Inmova y eWoorker
 * - Cupones promocionales
 * 
 * Solo accesible por super_admin
 * GET /api/admin/init-all-data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isSuperAdmin } from '@/lib/admin-roles';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ═══════════════════════════════════════════════════════════════
// PLANES INMOVA (Sincronizados con /landing/precios/page.tsx)
// ═══════════════════════════════════════════════════════════════

const INMOVA_PLANS = [
  {
    nombre: 'Starter',
    descripcion: 'Perfecto para propietarios particulares. Gestión básica de hasta 5 propiedades.',
    tier: 'STARTER' as const,
    precioMensual: 35,
    maxUsuarios: 2,
    maxPropiedades: 5,
    modulosIncluidos: [
      'Hasta 5 propiedades',
      'Gestión básica de inquilinos',
      'Contratos simples',
      '5 firmas digitales/mes incluidas',
      '2GB almacenamiento',
      'Soporte por email',
    ],
    signaturesIncludedMonth: 5,
    storageIncludedGB: 2,
    aiTokensIncludedMonth: 5000,
    smsIncludedMonth: 10,
    activo: true,
  },
  {
    nombre: 'Profesional',
    descripcion: 'Para propietarios activos y pequeñas agencias. Incluye firma digital y cobros automáticos.',
    tier: 'PROFESSIONAL' as const,
    precioMensual: 59,
    maxUsuarios: 5,
    maxPropiedades: 25,
    modulosIncluidos: [
      'Hasta 25 propiedades',
      'Gestión avanzada de inquilinos',
      'Contratos con firma digital',
      '20 firmas digitales/mes incluidas',
      '10GB almacenamiento',
      'Cobro automático de rentas',
      'Informes financieros',
      'Recordatorios automáticos',
      'Soporte prioritario',
    ],
    signaturesIncludedMonth: 20,
    storageIncludedGB: 10,
    aiTokensIncludedMonth: 20000,
    smsIncludedMonth: 50,
    activo: true,
  },
  {
    nombre: 'Business',
    descripcion: 'Para gestoras profesionales y agencias. Multi-propietario, CRM y API incluidos.',
    tier: 'BUSINESS' as const,
    precioMensual: 129,
    maxUsuarios: 15,
    maxPropiedades: 100,
    modulosIncluidos: [
      'Hasta 100 propiedades',
      'Multi-propietario',
      '50 firmas digitales/mes incluidas',
      '50GB almacenamiento',
      'CRM integrado',
      'API de integración',
      'Los 7 verticales inmobiliarios',
      'Reportes avanzados incluidos',
      'Multi-idioma incluido',
      'Account manager dedicado',
    ],
    signaturesIncludedMonth: 50,
    storageIncludedGB: 50,
    aiTokensIncludedMonth: 100000,
    smsIncludedMonth: 200,
    activo: true,
  },
  {
    nombre: 'Enterprise',
    descripcion: 'Para grandes empresas y SOCIMIs. Todo ilimitado con soporte premium 24/7.',
    tier: 'ENTERPRISE' as const,
    precioMensual: 299,
    maxUsuarios: null,
    maxPropiedades: null,
    modulosIncluidos: [
      'Todo de Business',
      'Propiedades ilimitadas',
      'Firmas digitales ilimitadas',
      'Almacenamiento ilimitado',
      'White-label completo incluido',
      'API ilimitada incluida',
      'SLA garantizado 99.9%',
      'Integraciones personalizadas',
      'Todos los add-ons incluidos',
      'Soporte 24/7 dedicado',
    ],
    signaturesIncludedMonth: -1, // Ilimitado
    storageIncludedGB: -1, // Ilimitado
    aiTokensIncludedMonth: -1, // Ilimitado
    smsIncludedMonth: -1, // Ilimitado
    activo: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// PLANES EWOORKER (Construcción B2B)
// ═══════════════════════════════════════════════════════════════

const EWOORKER_PLANS = [
  {
    codigo: 'OBRERO',
    nombre: 'eWoorker Obrero',
    descripcion: 'Plan gratuito para empezar. Acceso básico al marketplace con comisión por obra cerrada.',
    precioMensual: 0,
    precioAnual: 0,
    maxOfertas: 3,
    comisionEscrow: 5,
    features: [
      'Perfil básico',
      'Ver obras públicas',
      '3 ofertas/mes',
      'Chat básico',
      'Soporte email',
    ],
    socioPercentage: 50,
    plataformaPercentage: 50,
    destacado: false,
    orden: 1,
  },
  {
    codigo: 'CAPATAZ',
    nombre: 'eWoorker Capataz',
    descripcion: 'El más popular. Ofertas ilimitadas, compliance completo y comisión reducida.',
    precioMensual: 49,
    precioAnual: 490,
    maxOfertas: -1,
    comisionEscrow: 2,
    features: [
      'Todo de Obrero',
      'Ofertas ilimitadas',
      'Compliance Hub completo',
      'Chat prioritario',
      'Sistema escrow (+2% comisión)',
      'Certificaciones digitales',
      'Badge "Capataz" visible',
    ],
    socioPercentage: 50,
    plataformaPercentage: 50,
    destacado: true,
    orden: 2,
  },
  {
    codigo: 'CONSTRUCTOR',
    nombre: 'eWoorker Constructor',
    descripcion: 'Para constructoras serias. Sin comisiones, obras ilimitadas y account manager.',
    precioMensual: 149,
    precioAnual: 1490,
    maxOfertas: -1,
    comisionEscrow: 0,
    features: [
      'Todo de Capataz',
      'Obras ilimitadas',
      'Marketplace destacado',
      'API de integración',
      'Dashboard analytics avanzado',
      'Account manager dedicado',
      '0% comisiones en escrow',
      'Multi-usuario (hasta 5)',
      'Prioridad en matching',
    ],
    socioPercentage: 50,
    plataformaPercentage: 50,
    destacado: false,
    orden: 3,
  },
];

// ═══════════════════════════════════════════════════════════════
// ADD-ONS (Sincronizados con landing)
// ═══════════════════════════════════════════════════════════════

const ADDONS = [
  // Firmas Digitales
  {
    codigo: 'signatures_pack_10',
    nombre: 'Pack 10 Firmas Digitales',
    descripcion: 'Pack de 10 firmas digitales con validez legal europea (eIDAS).',
    categoria: 'usage',
    precioMensual: 15,
    unidades: 10,
    tipoUnidad: 'firmas',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: true,
    orden: 1,
  },
  {
    codigo: 'signatures_pack_50',
    nombre: 'Pack 50 Firmas Digitales',
    descripcion: 'Pack de 50 firmas para gestoras con alto volumen.',
    categoria: 'usage',
    precioMensual: 60,
    unidades: 50,
    tipoUnidad: 'firmas',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 2,
  },
  {
    codigo: 'signatures_pack_100',
    nombre: 'Pack 100 Firmas Digitales',
    descripcion: 'Pack empresarial de 100 firmas. Máximo ahorro.',
    categoria: 'usage',
    precioMensual: 100,
    unidades: 100,
    tipoUnidad: 'firmas',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 3,
  },
  // SMS/WhatsApp
  {
    codigo: 'sms_pack_100',
    nombre: 'Pack 100 SMS/WhatsApp',
    descripcion: 'Pack de 100 notificaciones SMS o WhatsApp.',
    categoria: 'usage',
    precioMensual: 10,
    unidades: 100,
    tipoUnidad: 'mensajes',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: true,
    orden: 4,
  },
  {
    codigo: 'sms_pack_500',
    nombre: 'Pack 500 SMS/WhatsApp',
    descripcion: 'Pack de 500 mensajes para gestoras.',
    categoria: 'usage',
    precioMensual: 40,
    unidades: 500,
    tipoUnidad: 'mensajes',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 5,
  },
  {
    codigo: 'sms_pack_1000',
    nombre: 'Pack 1000 SMS/WhatsApp',
    descripcion: 'Pack empresarial de 1000 mensajes.',
    categoria: 'usage',
    precioMensual: 70,
    unidades: 1000,
    tipoUnidad: 'mensajes',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 6,
  },
  // IA
  {
    codigo: 'ai_pack_50k',
    nombre: 'Pack IA Básico (50K tokens)',
    descripcion: '50,000 tokens de IA para valoraciones y asistente.',
    categoria: 'usage',
    precioMensual: 10,
    unidades: 50000,
    tipoUnidad: 'tokens',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: true,
    orden: 7,
  },
  {
    codigo: 'ai_pack_200k',
    nombre: 'Pack IA Avanzado (200K tokens)',
    descripcion: '200,000 tokens con acceso a GPT-4.',
    categoria: 'usage',
    precioMensual: 35,
    unidades: 200000,
    tipoUnidad: 'tokens',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 8,
  },
  {
    codigo: 'ai_pack_500k',
    nombre: 'Pack IA Enterprise (500K tokens)',
    descripcion: '500,000 tokens con GPT-4 ilimitado.',
    categoria: 'usage',
    precioMensual: 75,
    unidades: 500000,
    tipoUnidad: 'tokens',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 9,
  },
  // Storage
  {
    codigo: 'storage_pack_10gb',
    nombre: 'Pack 10GB Storage',
    descripcion: 'Almacenamiento adicional de 10GB.',
    categoria: 'usage',
    precioMensual: 5,
    unidades: 10,
    tipoUnidad: 'GB',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 10,
  },
  {
    codigo: 'storage_pack_50gb',
    nombre: 'Pack 50GB Storage',
    descripcion: 'Almacenamiento de 50GB.',
    categoria: 'usage',
    precioMensual: 20,
    unidades: 50,
    tipoUnidad: 'GB',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 11,
  },
  {
    codigo: 'storage_pack_100gb',
    nombre: 'Pack 100GB Storage',
    descripcion: 'Almacenamiento empresarial de 100GB.',
    categoria: 'usage',
    precioMensual: 35,
    unidades: 100,
    tipoUnidad: 'GB',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 12,
  },
  // Módulos Premium
  {
    codigo: 'portal_sync',
    nombre: 'Publicación en Portales',
    descripcion: 'Publicación automática en Idealista, Fotocasa, Habitaclia.',
    categoria: 'premium',
    precioMensual: 25,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: true,
    orden: 13,
  },
  {
    codigo: 'whitelabel_basic',
    nombre: 'White-Label',
    descripcion: 'Tu marca, tu dominio. Personalización total.',
    categoria: 'premium',
    precioMensual: 35,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 14,
  },
  {
    codigo: 'pricing_ai',
    nombre: 'Pricing Dinámico IA',
    descripcion: 'Optimiza precios de alquiler con Machine Learning.',
    categoria: 'premium',
    precioMensual: 45,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: true,
    orden: 15,
  },
  {
    codigo: 'tours_vr',
    nombre: 'Tours Virtuales 360°',
    descripcion: 'Tours interactivos con integración Matterport.',
    categoria: 'premium',
    precioMensual: 35,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 16,
  },
  {
    codigo: 'api_access',
    nombre: 'Acceso API REST',
    descripcion: 'API completa para integraciones personalizadas.',
    categoria: 'premium',
    precioMensual: 49,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 17,
  },
  {
    codigo: 'tenant_screening',
    nombre: 'Screening Inquilinos',
    descripcion: 'Verificación de solvencia y puntuación de riesgo.',
    categoria: 'premium',
    precioMensual: 20,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 18,
  },
];

// ═══════════════════════════════════════════════════════════════
// CUPONES PROMOCIONALES
// ═══════════════════════════════════════════════════════════════

const COUPONS = [
  {
    codigo: 'STARTER26',
    nombre: 'Cupón Starter 2026',
    descripcion: '50% descuento primer mes en plan Starter.',
    tipo: 'PERCENTAGE' as const,
    valor: 50,
    duracionMeses: 1,
    planesPermitidos: ['STARTER'],
    usosMaximos: 1000,
    destacado: true,
  },
  {
    codigo: 'PRO2MESES',
    nombre: '2 Meses GRATIS Plan Profesional',
    descripcion: '2 meses completamente gratis en el Plan Profesional.',
    tipo: 'FREE_MONTHS' as const,
    valor: 2,
    duracionMeses: 2,
    planesPermitidos: ['PROFESSIONAL'],
    usosMaximos: 500,
    destacado: true,
  },
  {
    codigo: 'BUSINESS2MESES',
    nombre: '2 Meses GRATIS Plan Business',
    descripcion: '2 meses completamente gratis en el Plan Business.',
    tipo: 'FREE_MONTHS' as const,
    valor: 2,
    duracionMeses: 2,
    planesPermitidos: ['BUSINESS'],
    usosMaximos: 200,
    destacado: true,
  },
  {
    codigo: 'ENTERPRISE2MESES',
    nombre: '2 Meses GRATIS Enterprise',
    descripcion: '2 meses completamente gratis en el Plan Enterprise.',
    tipo: 'FREE_MONTHS' as const,
    valor: 2,
    duracionMeses: 2,
    planesPermitidos: ['ENTERPRISE'],
    usosMaximos: 100,
    destacado: true,
  },
  {
    codigo: 'SWITCH26',
    nombre: 'Cambia y Ahorra',
    descripcion: 'Igualamos el precio de tu competidor actual y te damos 3 meses gratis.',
    tipo: 'FREE_MONTHS' as const,
    valor: 3,
    duracionMeses: 3,
    planesPermitidos: [],
    usosMaximos: 100,
    destacado: true,
  },
  {
    codigo: 'WELCOME30',
    nombre: '30% Descuento Primer Año',
    descripcion: '30% de descuento durante los primeros 12 meses en cualquier plan.',
    tipo: 'PERCENTAGE' as const,
    valor: 30,
    duracionMeses: 12,
    planesPermitidos: [],
    usosMaximos: 1000,
    destacado: true,
  },
  {
    codigo: 'COLIVING26',
    nombre: 'Cupón Coliving',
    descripcion: '25% descuento para empresas de coliving.',
    tipo: 'PERCENTAGE' as const,
    valor: 25,
    duracionMeses: 6,
    planesPermitidos: ['PROFESSIONAL', 'BUSINESS'],
    usosMaximos: 200,
    destacado: false,
  },
  {
    codigo: 'STR26',
    nombre: 'Cupón Short-Term Rental',
    descripcion: '25% descuento para empresas de alquiler vacacional.',
    tipo: 'PERCENTAGE' as const,
    valor: 25,
    duracionMeses: 6,
    planesPermitidos: ['PROFESSIONAL', 'BUSINESS'],
    usosMaximos: 200,
    destacado: false,
  },
  {
    codigo: 'PARTNER20',
    nombre: 'Cupón Partner',
    descripcion: '20% descuento para clientes de partners.',
    tipo: 'PERCENTAGE' as const,
    valor: 20,
    duracionMeses: 12,
    planesPermitidos: [],
    usosMaximos: 500,
    destacado: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // 2. Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const results = {
      plans: { created: 0, updated: 0 },
      ewoorkerPlans: { created: 0, updated: 0 },
      addons: { created: 0, updated: 0 },
      coupons: { created: 0, updated: 0 },
    };

    // 3. Crear/Actualizar planes de Inmova
    for (const planData of INMOVA_PLANS) {
      const existing = await prisma.subscriptionPlan.findFirst({
        where: { tier: planData.tier },
      });

      if (existing) {
        await prisma.subscriptionPlan.update({
          where: { id: existing.id },
          data: {
            nombre: planData.nombre,
            descripcion: planData.descripcion,
            precioMensual: planData.precioMensual,
            maxUsuarios: planData.maxUsuarios ?? -1,
            maxPropiedades: planData.maxPropiedades ?? -1,
            modulosIncluidos: planData.modulosIncluidos,
            signaturesIncludedMonth: planData.signaturesIncludedMonth,
            storageIncludedGB: planData.storageIncludedGB,
            aiTokensIncludedMonth: planData.aiTokensIncludedMonth,
            smsIncludedMonth: planData.smsIncludedMonth,
            activo: planData.activo,
          },
        });
        results.plans.updated++;
      } else {
        await prisma.subscriptionPlan.create({
          data: {
            nombre: planData.nombre,
            descripcion: planData.descripcion,
            tier: planData.tier,
            precioMensual: planData.precioMensual,
            maxUsuarios: planData.maxUsuarios ?? -1,
            maxPropiedades: planData.maxPropiedades ?? -1,
            modulosIncluidos: planData.modulosIncluidos,
            signaturesIncludedMonth: planData.signaturesIncludedMonth,
            storageIncludedGB: planData.storageIncludedGB,
            aiTokensIncludedMonth: planData.aiTokensIncludedMonth,
            smsIncludedMonth: planData.smsIncludedMonth,
            activo: planData.activo,
          },
        });
        results.plans.created++;
      }
    }

    // 4. Crear/Actualizar planes de eWoorker
    for (const planData of EWOORKER_PLANS) {
      await prisma.ewoorkerPlan.upsert({
        where: { codigo: planData.codigo },
        update: {
          nombre: planData.nombre,
          descripcion: planData.descripcion,
          precioMensual: planData.precioMensual,
          precioAnual: planData.precioAnual,
          maxOfertas: planData.maxOfertas,
          comisionEscrow: planData.comisionEscrow,
          features: planData.features,
          socioPercentage: planData.socioPercentage,
          plataformaPercentage: planData.plataformaPercentage,
          destacado: planData.destacado,
          orden: planData.orden,
          activo: true,
        },
        create: {
          codigo: planData.codigo,
          nombre: planData.nombre,
          descripcion: planData.descripcion,
          precioMensual: planData.precioMensual,
          precioAnual: planData.precioAnual,
          maxOfertas: planData.maxOfertas,
          comisionEscrow: planData.comisionEscrow,
          features: planData.features,
          socioPercentage: planData.socioPercentage,
          plataformaPercentage: planData.plataformaPercentage,
          destacado: planData.destacado,
          orden: planData.orden,
          activo: true,
        },
      });
      
      const existing = await prisma.ewoorkerPlan.findUnique({ where: { codigo: planData.codigo } });
      if (existing) results.ewoorkerPlans.updated++;
      else results.ewoorkerPlans.created++;
    }

    // 5. Crear/Actualizar add-ons
    for (const addon of ADDONS) {
      const existing = await prisma.addOn.findUnique({ where: { codigo: addon.codigo } });
      
      await prisma.addOn.upsert({
        where: { codigo: addon.codigo },
        update: {
          nombre: addon.nombre,
          descripcion: addon.descripcion,
          categoria: addon.categoria,
          precioMensual: addon.precioMensual,
          unidades: addon.unidades,
          tipoUnidad: addon.tipoUnidad,
          disponiblePara: addon.disponiblePara,
          incluidoEn: (addon as any).incluidoEn || [],
          destacado: addon.destacado,
          orden: addon.orden,
          activo: true,
        },
        create: {
          codigo: addon.codigo,
          nombre: addon.nombre,
          descripcion: addon.descripcion,
          categoria: addon.categoria,
          precioMensual: addon.precioMensual,
          unidades: addon.unidades,
          tipoUnidad: addon.tipoUnidad,
          disponiblePara: addon.disponiblePara,
          incluidoEn: (addon as any).incluidoEn || [],
          destacado: addon.destacado,
          orden: addon.orden,
          activo: true,
        },
      });

      if (existing) results.addons.updated++;
      else results.addons.created++;
    }

    // 6. Crear/Actualizar cupones
    const fechaExpiracion = new Date('2026-12-31T23:59:59.000Z');
    const fechaInicio = new Date();

    for (const coupon of COUPONS) {
      const existing = await prisma.promoCoupon.findUnique({ where: { codigo: coupon.codigo } });
      
      await prisma.promoCoupon.upsert({
        where: { codigo: coupon.codigo },
        update: {
          nombre: coupon.nombre,
          descripcion: coupon.descripcion,
          tipo: coupon.tipo,
          valor: coupon.valor,
          duracionMeses: coupon.duracionMeses,
          planesPermitidos: coupon.planesPermitidos,
          usosMaximos: coupon.usosMaximos,
          destacado: coupon.destacado,
          fechaExpiracion,
          activo: true,
          estado: 'ACTIVE',
        },
        create: {
          codigo: coupon.codigo,
          nombre: coupon.nombre,
          descripcion: coupon.descripcion,
          tipo: coupon.tipo,
          valor: coupon.valor,
          duracionMeses: coupon.duracionMeses,
          planesPermitidos: coupon.planesPermitidos,
          usosMaximos: coupon.usosMaximos,
          destacado: coupon.destacado,
          fechaInicio,
          fechaExpiracion,
          activo: true,
          estado: 'ACTIVE',
        },
      });

      if (existing) results.coupons.updated++;
      else results.coupons.created++;
    }

    // 7. Obtener resumen
    const [planesCount, ewoorkerPlanesCount, addonsCount, couponsCount] = await Promise.all([
      prisma.subscriptionPlan.count({ where: { activo: true } }),
      prisma.ewoorkerPlan.count({ where: { activo: true } }),
      prisma.addOn.count({ where: { activo: true } }),
      prisma.promoCoupon.count({ where: { activo: true } }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Datos inicializados correctamente',
      results,
      totals: {
        planesInmova: planesCount,
        planesEwoorker: ewoorkerPlanesCount,
        addons: addonsCount,
        cupones: couponsCount,
      },
    });
  } catch (error: any) {
    logger.error('[Init All Data Error]:', error);
    return NextResponse.json(
      { error: 'Error inicializando datos', details: error.message },
      { status: 500 }
    );
  }
}
