/**
 * API Route para cargar planes de suscripción
 * Solo accesible por superadmin
 * GET /api/admin/seed-plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const normalizeTier = (
  tier: string
): 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE' => {
  const normalized = tier.trim().toLowerCase();
  if (normalized === 'profesional' || normalized === 'professional') return 'PROFESSIONAL';
  if (normalized === 'empresarial' || normalized === 'business') return 'BUSINESS';
  if (normalized === 'premium' || normalized === 'enterprise') return 'ENTERPRISE';
  return 'STARTER';
};

// Precios ALINEADOS con landing page (PricingSection.tsx + precios/page.tsx)
const PLANES_DATA = [
  // Plan interno gratuito para empresas del owner
  {
    nombre: 'Owner',
    descripcion: 'Plan interno gratuito para empresas del propietario de la plataforma. Todas las funcionalidades sin límites.',
    tier: 'ENTERPRISE', // Tier ENTERPRISE da acceso a todo
    precioMensual: 0,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: ['*'],
    activo: true,
    esInterno: true, // ← NO visible en landing ni registro
    signaturesIncludedMonth: 9999,
    storageIncludedGB: 1000,
    aiTokensIncludedMonth: 10000000,
    smsIncludedMonth: 10000,
  },
  {
    nombre: 'Starter',
    descripcion: 'Perfecto para propietarios particulares con 1-5 propiedades',
    tier: 'STARTER',
    precioMensual: 35,
    maxUsuarios: 1,
    maxPropiedades: 5,
    modulosIncluidos: [
      'Dashboard', 'Gestión de propiedades', 'Inquilinos', 'Contratos',
      'Pagos', 'Documentos', 'Mantenimiento', 'Calendario', 'Notificaciones',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 2,
    storageIncludedGB: 1,
    aiTokensIncludedMonth: 0,
    smsIncludedMonth: 0,
  },
  {
    nombre: 'Professional',
    descripcion: 'Para propietarios activos y pequeñas agencias con 6-25 propiedades',
    tier: 'PROFESSIONAL',
    precioMensual: 59,
    maxUsuarios: 3,
    maxPropiedades: 25,
    modulosIncluidos: [
      'Todo de Starter', 'CRM', 'Reportes avanzados', 'Portal inquilinos',
      'Portal propietarios', 'Proveedores', 'Chat', 'Firma digital',
      'Soporte prioritario',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 5,
    storageIncludedGB: 5,
    aiTokensIncludedMonth: 5000,
    smsIncludedMonth: 0,
  },
  {
    nombre: 'Business',
    descripcion: 'Para gestoras profesionales y agencias con 26-100 propiedades',
    tier: 'BUSINESS',
    precioMensual: 129,
    maxUsuarios: 10,
    maxPropiedades: 100,
    modulosIncluidos: [
      'Todo de Professional', 'Los 7 verticales inmobiliarios', 'API integración',
      'CRM integrado', 'Multi-idioma', 'Automatizaciones', 'Account manager dedicado',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 15,
    storageIncludedGB: 20,
    aiTokensIncludedMonth: 50000,
    smsIncludedMonth: 25,
  },
  {
    nombre: 'Enterprise',
    descripcion: 'Para grandes empresas y SOCIMIs con +100 propiedades. Todo ilimitado.',
    tier: 'ENTERPRISE',
    precioMensual: 299,
    maxUsuarios: null,
    maxPropiedades: null,
    modulosIncluidos: [
      'Todo de Business', 'White-label completo', 'API ilimitada',
      'Firmas ilimitadas', 'Almacenamiento ilimitado', 'Todos los add-ons incluidos',
      'SLA 99.9%', 'Integraciones personalizadas', 'Soporte 24/7 dedicado',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 50,
    storageIncludedGB: 50,
    aiTokensIncludedMonth: 100000,
    smsIncludedMonth: 100,
  },
];

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo superadmin puede ejecutar seed
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // 2. Verificar planes existentes (usar nombre en vez de tier porque Owner y Premium comparten tier)
    const existingPlans = await prisma.subscriptionPlan.findMany({
      select: { tier: true, nombre: true },
    });

    const existingNames = new Set(existingPlans.map(p => p.nombre));
    
    let created = 0;
    let skipped = 0;
    const results = [];

    // 3. Crear solo los planes que no existen (verificar por nombre)
    for (const planData of PLANES_DATA) {
      const normalizedTier = normalizeTier(planData.tier);
      const planPayload = {
        ...planData,
        tier: normalizedTier,
        maxUsuarios: planData.maxUsuarios ?? -1,
        maxPropiedades: planData.maxPropiedades ?? -1,
        signaturesIncludedMonth: planData.signaturesIncludedMonth ?? -1,
        storageIncludedGB: planData.storageIncludedGB ?? 0,
        aiTokensIncludedMonth: planData.aiTokensIncludedMonth ?? 0,
        smsIncludedMonth: planData.smsIncludedMonth ?? 0,
      };

      if (existingNames.has(planData.nombre)) {
        skipped++;
        results.push({
          nombre: planData.nombre,
          tier: normalizedTier,
          status: 'skipped',
          message: 'Ya existe',
        });
        continue;
      }

      try {
        const plan = await prisma.subscriptionPlan.create({
          data: planPayload,
        });

        created++;
        results.push({
          nombre: plan.nombre,
          tier: plan.tier,
          precio: plan.precioMensual,
          status: 'created',
        });
      } catch (error: any) {
        results.push({
          nombre: planData.nombre,
          tier: normalizedTier,
          status: 'error',
          error: error.message,
        });
      }
    }

    // 4. Asignar plan básico a empresas sin plan
    const basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { tier: 'STARTER' },
    });

    let companiesUpdated = 0;

    if (basicPlan) {
      const companiesWithoutPlan = await prisma.company.findMany({
        where: { subscriptionPlanId: null },
      });

      for (const company of companiesWithoutPlan) {
        try {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionPlanId: basicPlan.id },
          });
          companiesUpdated++;
        } catch (error) {
          logger.error(`Error asignando plan a ${company.nombre}:`, error);
        }
      }
    }

    // 5. Respuesta
    return NextResponse.json({
      success: true,
      summary: {
        created,
        skipped,
        total: await prisma.subscriptionPlan.count(),
        companiesUpdated,
      },
      plans: results,
    });

  } catch (error: any) {
    logger.error('[Seed Plans API Error]:', error);
    return NextResponse.json(
      { error: 'Error ejecutando seed', details: error.message },
      { status: 500 }
    );
  }
}
