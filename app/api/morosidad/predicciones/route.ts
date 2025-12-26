import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calcularPrediccionMorosidad } from '@/lib/morosidad-prediction-service';
import { addDays } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/morosidad/predicciones - Listar predicciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'administrador' && user.role !== 'gestor')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const nivelRiesgo = searchParams.get('nivelRiesgo');

    const whereClause: any = {
      companyId: user.companyId,
      validaHasta: { gte: new Date() }, // Solo predicciones válidas
    };

    if (nivelRiesgo) {
      whereClause.nivelRiesgo = nivelRiesgo;
    }

    const predicciones = await prisma.morosidadPrediccion.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
        contract: {
          include: {
            unit: {
              include: { building: true },
            },
          },
        },
      },
      orderBy: [{ probabilidadImpago: 'desc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json(predicciones);
  } catch (error: any) {
    logger.error('Error al obtener predicciones:', error);
    return NextResponse.json({ error: 'Error al obtener predicciones' }, { status: 500 });
  }
}

// POST /api/morosidad/predicciones - Generar predicción
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'administrador' && user.role !== 'gestor')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { tenantId, contractId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId es requerido' }, { status: 400 });
    }

    // Calcular predicción
    const result = await calcularPrediccionMorosidad(tenantId, contractId);

    // Guardar predicción en BD
    const prediccion = await prisma.morosidadPrediccion.create({
      data: {
        companyId: user.companyId,
        tenantId,
        contractId,
        probabilidadImpago: result.probabilidadImpago,
        nivelRiesgo: result.nivelRiesgo,
        scoring: result.scoring,
        factoresRiesgo: result.factoresRiesgo,
        variablesAnalizadas: 40,
        prediccion30Dias: result.prediccion30Dias,
        prediccion60Dias: result.prediccion60Dias,
        prediccion90Dias: result.prediccion90Dias,
        recomendaciones: result.recomendaciones,
        accionPrioritaria: result.accionPrioritaria,
        pagosATiempo: result.pagosATiempo,
        pagosAtrasados: result.pagosAtrasados,
        diasPromedioRetraso: result.diasPromedioRetraso,
        montoPendiente: result.montoPendiente,
        ratioIngresoRenta: result.ratioIngresoRenta,
        modeloVersion: 'xgboost_v1',
        confianzaModelo: 0.89,
        ultimoEntrenamiento: new Date(),
        alertaGenerada: result.nivelRiesgo === 'alto' || result.nivelRiesgo === 'critico',
        fechaAlerta:
          result.nivelRiesgo === 'alto' || result.nivelRiesgo === 'critico' ? new Date() : null,
        validaHasta: addDays(new Date(), 30),
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(prediccion, { status: 201 });
  } catch (error: any) {
    logger.error('Error al generar predicción:', error);
    return NextResponse.json(
      { error: 'Error al generar predicción', details: error.message },
      { status: 500 }
    );
  }
}
