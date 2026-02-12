/**
 * API: Matching automático eWoorker
 * GET /api/ewoorker/matching - Buscar empresas/trabajadores matching
 * POST /api/ewoorker/matching/obra/[id] - Recomendaciones para obra
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerMatching, MatchCriteria } from '@/lib/ewoorker-matching-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const searchSchema = z.object({
  especialidad: z.string(),
  provincia: z.string(),
  especialidadesSecundarias: z.array(z.string()).optional(),
  presupuestoMax: z.number().optional(),
  fechaInicio: z.string().optional(),
  duracionDias: z.number().optional(),
  nivelExperienciaMin: z.number().optional(),
  ratingMin: z.number().optional(),
  soloVerificados: z.boolean().optional(),
  soloConREA: z.boolean().optional(),
  tipo: z.enum(['empresas', 'trabajadores', 'ambos']).optional(),
  limit: z.number().min(1).max(50).optional(),
});

/**
 * GET: Buscar empresas/trabajadores matching
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parsear parámetros
    const params = {
      especialidad: searchParams.get('especialidad') || '',
      provincia: searchParams.get('provincia') || '',
      especialidadesSecundarias: searchParams.get('especialidadesSecundarias')?.split(','),
      presupuestoMax: searchParams.get('presupuestoMax')
        ? parseInt(searchParams.get('presupuestoMax')!)
        : undefined,
      fechaInicio: searchParams.get('fechaInicio') || undefined,
      duracionDias: searchParams.get('duracionDias')
        ? parseInt(searchParams.get('duracionDias')!)
        : undefined,
      nivelExperienciaMin: searchParams.get('nivelExperienciaMin')
        ? parseInt(searchParams.get('nivelExperienciaMin')!)
        : undefined,
      ratingMin: searchParams.get('ratingMin')
        ? parseFloat(searchParams.get('ratingMin')!)
        : undefined,
      soloVerificados: searchParams.get('soloVerificados') === 'true',
      soloConREA: searchParams.get('soloConREA') === 'true',
      tipo: (searchParams.get('tipo') as any) || 'ambos',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    };

    const validated = searchSchema.parse(params);

    // Obtener empresa del usuario para excluirla
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: { include: { ewoorkerPerfil: true } } },
    });

    const criteria: MatchCriteria = {
      especialidad: validated.especialidad,
      especialidadesSecundarias: validated.especialidadesSecundarias,
      provincia: validated.provincia,
      presupuestoMax: validated.presupuestoMax,
      fechaInicio: validated.fechaInicio ? new Date(validated.fechaInicio) : undefined,
      duracionDias: validated.duracionDias,
      nivelExperienciaMin: validated.nivelExperienciaMin,
      ratingMin: validated.ratingMin,
      soloVerificados: validated.soloVerificados,
      soloConREA: validated.soloConREA,
      excludeEmpresaIds: user?.company?.ewoorkerPerfil?.id
        ? [user.company.ewoorkerPerfil.id]
        : undefined,
    };

    const results: any = {};

    if (validated.tipo === 'empresas' || validated.tipo === 'ambos') {
      results.empresas = await ewoorkerMatching.findMatchingEmpresas(criteria, validated.limit);
    }

    if (validated.tipo === 'trabajadores' || validated.tipo === 'ambos') {
      results.trabajadores = await ewoorkerMatching.findMatchingTrabajadores(
        criteria,
        validated.limit
      );
    }

    return NextResponse.json({
      criteria: {
        especialidad: validated.especialidad,
        provincia: validated.provincia,
      },
      results,
      count: {
        empresas: results.empresas?.length || 0,
        trabajadores: results.trabajadores?.length || 0,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[EWOORKER_MATCHING_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
