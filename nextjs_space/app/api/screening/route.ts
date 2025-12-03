import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  crearScreening,
  calcularScoringCompleto,
  actualizarScreening
} from '@/lib/screening-service';
import { ScreeningEstado } from '@prisma/client';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/screening
 * Obtiene lista de screenings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const candidateId = searchParams.get('candidateId');

    const where: any = {
      companyId: session.user.companyId
    };

    if (estado) where.estado = estado as ScreeningEstado;
    if (candidateId) where.candidateId = candidateId;

    const screenings = await prisma.screeningCandidato.findMany({
      where,
      include: {
        candidate: {
          include: {
            unit: {
              include: {
                building: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(screenings);
  } catch (error: any) {
    logger.error('Error al obtener screenings:', error);
    return NextResponse.json(
      { error: 'Error al obtener screenings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/screening
 * Crea un nuevo screening para un candidato
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { candidateId, accion } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId es requerido' },
        { status: 400 }
      );
    }

    // Si es acción de recalcular
    if (accion === 'recalcular') {
      const resultado = await calcularScoringCompleto(candidateId);
      
      // Actualizar screening con nuevo scoring
      await prisma.screeningCandidato.update({
        where: { candidateId },
        data: {
          scoringTotal: resultado.scoringTotal,
          dniPuntos: resultado.desglosePuntos.identidad,
          laboralPuntos: resultado.desglosePuntos.laboral,
          economicaPuntos: resultado.desglosePuntos.economica,
          referenciasPuntos: resultado.desglosePuntos.referencias,
          antecedentesPuntos: resultado.desglosePuntos.antecedentes,
          flagsRiesgo: resultado.flagsRiesgo as any,
          nivelRiesgoGlobal: resultado.nivelRiesgoGlobal
        }
      });

      return NextResponse.json({ resultado });
    }

    // Crear nuevo screening
    const screening = await crearScreening(
      session.user.companyId,
      candidateId
    );

    return NextResponse.json(screening, { status: 201 });
    
  } catch (error: any) {
    logger.error('Error al crear/recalcular screening:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar screening' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/screening
 * Actualiza datos del screening
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...datos } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    // Si se cambia el estado a revisado o aprobado, registrar auditoría
    if (datos.estado === 'verificado' || datos.estado === 'aprobado' || datos.estado === 'rechazado') {
      datos.revisadoPor = session.user.id;
      datos.fechaRevision = new Date();
      
      if (datos.estado === 'aprobado' || datos.estado === 'rechazado') {
        datos.fechaDecision = new Date();
        datos.aprobado = datos.estado === 'aprobado';
      }
    }

    const screening = await actualizarScreening(id, datos);

    return NextResponse.json(screening);
    
  } catch (error: any) {
    logger.error('Error al actualizar screening:', error);
    return NextResponse.json(
      { error: 'Error al actualizar screening' },
      { status: 500 }
    );
  }
}
