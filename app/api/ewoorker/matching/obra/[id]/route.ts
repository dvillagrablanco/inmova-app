/**
 * API: Recomendaciones matching para una obra específica
 * GET /api/ewoorker/matching/obra/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerMatching } from '@/lib/ewoorker-matching-service';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que la obra existe y el usuario tiene acceso
    const obra = await prisma.ewoorkerObra.findUnique({
      where: { id: params.id },
    });

    if (!obra) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 });
    }

    // Verificar acceso (propietario de la obra o admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: { include: { ewoorkerPerfil: true } } },
    });

    const esPropietario = user?.company?.ewoorkerPerfil?.id === obra.perfilConstructorId;
    const esAdmin = ['super_admin', 'administrador'].includes(session.user.role as string);

    if (!esPropietario && !esAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener recomendaciones
    const recommendations = await ewoorkerMatching.getRecommendationsForObra(params.id);

    // Sugerencia de precio
    const priceSuggestion = await ewoorkerMatching.suggestCompetitivePrice(
      params.id,
      obra.categoria
    );

    return NextResponse.json({
      obra: {
        id: obra.id,
        titulo: obra.titulo,
        especialidad: obra.categoria,
        provincia: obra.provincia,
        presupuestoEstimado: obra.presupuestoMaximo ?? obra.presupuestoMinimo ?? 0,
      },
      recommendations,
      priceSuggestion,
      totalMatches: {
        empresas: recommendations.empresas.length,
        trabajadores: recommendations.trabajadores.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[EWOORKER_MATCHING_OBRA_GET]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
