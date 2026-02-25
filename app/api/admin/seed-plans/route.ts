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

const normalizeTier = (tier: string): 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE' => {
  const normalized = tier.trim().toLowerCase();
  if (normalized === 'profesional' || normalized === 'professional') return 'PROFESSIONAL';
  if (normalized === 'empresarial' || normalized === 'business') return 'BUSINESS';
  if (normalized === 'premium' || normalized === 'enterprise') return 'ENTERPRISE';
  return 'STARTER';
};

/**
 * PLANES SINCRONIZADOS CON LANDING /landing/precios
 * Starter €35, Profesional €59, Business €129, Enterprise €299
 * + Owner €0 (interno, acceso total)
 */
const PLANES_DATA = [
  {
    nombre: 'Owner',
    descripcion: 'Plan especial para propietarios de la plataforma. Acceso completo sin coste.',
    tier: 'enterprise',
    precioMensual: 0,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: [
      'Acceso completo a todos los módulos',
      'Sin límites',
      'Todos los add-ons incluidos',
    ],
    activo: true,
    esInterno: true,
    signaturesIncludedMonth: 9999,
    storageIncludedGB: 999,
    aiTokensIncludedMonth: 1000000,
    smsIncludedMonth: 9999,
  },
  {
    nombre: 'Starter',
    descripcion: 'Perfecto para propietarios particulares',
    tier: 'starter',
    precioMensual: 35,
    maxUsuarios: 1,
    maxPropiedades: 5,
    modulosIncluidos: [
      'Hasta 5 propiedades',
      'Gestión básica de inquilinos',
      'Contratos simples',
      '5 firmas digitales/mes',
      '2GB almacenamiento',
      'Soporte por email',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 5,
    storageIncludedGB: 2,
    aiTokensIncludedMonth: 0,
    smsIncludedMonth: 0,
  },
  {
    nombre: 'Profesional',
    descripcion: 'Para propietarios activos y pequeñas agencias',
    tier: 'professional',
    precioMensual: 59,
    maxUsuarios: 3,
    maxPropiedades: 25,
    modulosIncluidos: [
      'Hasta 25 propiedades',
      '20 firmas digitales/mes',
      '10GB almacenamiento',
      'Cobro automático de rentas',
      'Informes financieros',
      'Recordatorios automáticos',
      'Soporte prioritario',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 20,
    storageIncludedGB: 10,
    aiTokensIncludedMonth: 10000,
    smsIncludedMonth: 50,
  },
  {
    nombre: 'Business',
    descripcion: 'Para gestoras profesionales y agencias',
    tier: 'business',
    precioMensual: 129,
    maxUsuarios: 10,
    maxPropiedades: 100,
    modulosIncluidos: [
      'Hasta 100 propiedades',
      'Multi-propietario',
      '50 firmas digitales/mes',
      '50GB almacenamiento',
      'CRM integrado',
      'API de integración',
      '7 verticales inmobiliarios',
      'Reportes avanzados',
      'Multi-idioma',
      'Account manager dedicado',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 50,
    storageIncludedGB: 50,
    aiTokensIncludedMonth: 50000,
    smsIncludedMonth: 200,
  },
  {
    nombre: 'Enterprise',
    descripcion: 'Para grandes empresas y SOCIMIs',
    tier: 'enterprise',
    precioMensual: 299,
    maxUsuarios: null,
    maxPropiedades: null,
    modulosIncluidos: [
      'Todo de Business',
      'Propiedades ilimitadas',
      'Firmas digitales ilimitadas',
      'Almacenamiento ilimitado',
      'White-label completo',
      'API ilimitada',
      'SLA 99.9%',
      'Todos los add-ons incluidos',
      'Soporte 24/7 dedicado',
    ],
    activo: true,
    esInterno: false,
    signaturesIncludedMonth: 9999,
    storageIncludedGB: 999,
    aiTokensIncludedMonth: 1000000,
    smsIncludedMonth: 9999,
  },
];

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo superadmin puede ejecutar seed
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // 2. Verificar planes existentes (usar nombre en vez de tier porque Owner y Premium comparten tier)
    const existingPlans = await prisma.subscriptionPlan.findMany({
      select: { tier: true, nombre: true },
    });

    const existingNames = new Set(existingPlans.map((p) => p.nombre));

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
