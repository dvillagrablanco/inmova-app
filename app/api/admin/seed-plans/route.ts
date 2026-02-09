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

const PLANES_DATA = [
  // Plan interno gratuito para empresas del owner
  {
    nombre: 'Owner',
    descripcion: 'Plan interno gratuito para empresas del propietario de la plataforma. Todas las funcionalidades sin límites.',
    tier: 'premium',
    precioMensual: 0,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: [
      'Todas las funcionalidades',
      'Sin límites',
      'Soporte prioritario',
    ],
    activo: true,
    esInterno: true, // ← NO visible en landing ni registro
    signaturesIncludedMonth: 9999,
    storageIncludedGB: 1000,
    aiTokensIncludedMonth: 10000000,
    smsIncludedMonth: 10000,
  },
  {
    nombre: 'Básico',
    descripcion: 'Plan inicial para pequeñas inmobiliarias o propietarios individuales',
    tier: 'basico',
    precioMensual: 49,
    maxUsuarios: 2,
    maxPropiedades: 50,
    modulosIncluidos: [
      'Dashboard básico',
      'Gestión de propiedades',
      'Gestión de inquilinos',
      'Contratos digitales',
      'Notificaciones por email',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 10,
    storageIncludedGB: 5,
    aiTokensIncludedMonth: 10000,
    smsIncludedMonth: 50,
  },
  {
    nombre: 'Profesional',
    descripcion: 'Para agentes inmobiliarios y gestores profesionales',
    tier: 'profesional',
    precioMensual: 149,
    maxUsuarios: 10,
    maxPropiedades: 200,
    modulosIncluidos: [
      'Todo lo del plan Básico',
      'CRM con pipeline de ventas',
      'Automatizaciones básicas',
      'Informes personalizados',
      'Portal para inquilinos',
      'Integraciones con terceros',
      'Firma digital de contratos',
      'API access básico',
      'Soporte prioritario 24h',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 50,
    storageIncludedGB: 25,
    aiTokensIncludedMonth: 50000,
    smsIncludedMonth: 200,
  },
  {
    nombre: 'Empresarial',
    descripcion: 'Para gestoras y empresas inmobiliarias',
    tier: 'empresarial',
    precioMensual: 499,
    maxUsuarios: null,
    maxPropiedades: null,
    modulosIncluidos: [
      'Todo lo del plan Profesional',
      'Multi-empresa',
      'Workflows personalizados',
      'Integraciones avanzadas',
      'White-label opcional',
      'API access completo',
      'Soporte 24/7',
      'Account manager dedicado',
      'Capacitación incluida',
      'SLA 99.9%',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 200,
    storageIncludedGB: 100,
    aiTokensIncludedMonth: 200000,
    smsIncludedMonth: 1000,
  },
  {
    nombre: 'Premium',
    descripcion: 'Solución enterprise con características a medida',
    tier: 'premium',
    precioMensual: 999,
    maxUsuarios: null,
    maxPropiedades: null,
    modulosIncluidos: [
      'Todo lo del plan Empresarial',
      'Desarrollo a medida',
      'White-label completo',
      'Infraestructura dedicada',
      'Todos los add-ons incluidos',
      'Consultoría estratégica',
      'Soporte premium 24/7',
      'Account manager senior',
      'Acceso anticipado a features',
      'Integraciones custom',
      'Capacitación ilimitada',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: null,
    storageIncludedGB: 500,
    aiTokensIncludedMonth: 1000000,
    smsIncludedMonth: 5000,
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
