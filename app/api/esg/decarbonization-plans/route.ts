export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Obtener planes de descarbonización reales desde la base de datos
    const plans = await prisma.decarbonizationPlan.findMany({
      where: {
        companyId,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar al formato esperado por el frontend
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      buildingId: plan.buildingId,
      buildingName: plan.building?.nombre || 'Sin edificio asignado',
      targetYear: plan.añoObjetivo,
      currentEmissions: plan.emisionesActuales,
      targetReduction: plan.objetivoReduccion,
      targetEmissions: plan.emisionesObjetivo,
      status: plan.estado,
      progress: plan.avance,
      actions: plan.actuaciones || [],
      budget: plan.presupuestoTotal,
      name: plan.nombre,
      description: plan.descripcion,
    }));

    return NextResponse.json(formattedPlans);
  } catch (error) {
    logger.error('Error fetching decarbonization plans:', error);
    return NextResponse.json(
      { error: 'Error al obtener planes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const body = await request.json();

    const {
      buildingId,
      nombre,
      descripcion,
      emisionesActuales,
      objetivoReduccion,
      añoObjetivo,
      actuaciones,
      presupuestoTotal,
    } = body;

    // Validar campos requeridos
    if (!nombre || !emisionesActuales || !objetivoReduccion || !añoObjetivo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Calcular emisiones objetivo
    const emisionesObjetivo = emisionesActuales * (1 - objetivoReduccion / 100);

    // Crear el plan en la base de datos
    const plan = await prisma.decarbonizationPlan.create({
      data: {
        companyId,
        buildingId: buildingId || null,
        nombre,
        descripcion: descripcion || null,
        emisionesActuales,
        objetivoReduccion,
        emisionesObjetivo,
        añoObjetivo,
        actuaciones: actuaciones || [],
        presupuestoTotal: presupuestoTotal || 0,
        estado: 'planificado',
        avance: 0,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    logger.info(`Plan de descarbonización creado: ${plan.id}`);

    return NextResponse.json({
      success: true,
      message: 'Plan de descarbonización creado',
      data: plan,
    });
  } catch (error) {
    logger.error('Error creating decarbonization plan:', error);
    return NextResponse.json(
      { error: 'Error al crear plan' },
      { status: 500 }
    );
  }
}
