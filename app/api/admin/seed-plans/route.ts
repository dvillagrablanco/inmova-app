/**
 * API Route para cargar planes de suscripción
 * Solo accesible por superadmin
 * GET /api/admin/seed-plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PLANES_DATA = [
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
    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // 2. Verificar planes existentes
    const existingPlans = await prisma.subscriptionPlan.findMany({
      select: { tier: true, nombre: true },
    });

    const existingTiers = new Set(existingPlans.map(p => p.tier));
    
    let created = 0;
    let skipped = 0;
    const results = [];

    // 3. Crear solo los planes que no existen
    for (const planData of PLANES_DATA) {
      if (existingTiers.has(planData.tier)) {
        skipped++;
        results.push({
          nombre: planData.nombre,
          tier: planData.tier,
          status: 'skipped',
          message: 'Ya existe',
        });
        continue;
      }

      try {
        const plan = await prisma.subscriptionPlan.create({
          data: planData,
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
          tier: planData.tier,
          status: 'error',
          error: error.message,
        });
      }
    }

    // 4. Asignar plan básico a empresas sin plan
    const basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { tier: 'basico' },
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
          console.error(`Error asignando plan a ${company.nombre}:`, error);
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
    console.error('[Seed Plans API Error]:', error);
    return NextResponse.json(
      { error: 'Error ejecutando seed', details: error.message },
      { status: 500 }
    );
  }
}
