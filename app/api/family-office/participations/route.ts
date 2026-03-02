import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const createParticipationSchema = z.object({
  targetCompanyName: z.string().min(1, 'Nombre de sociedad requerido'),
  targetCompanyCIF: z.string().optional(),
  tipo: z.enum([
    'filial_100',
    'participada_mayoritaria',
    'participada_minoritaria',
    'pe_fund',
    'coinversion',
    'joint_venture',
  ]),
  porcentaje: z.number().min(0).max(100),
  fechaAdquisicion: z.string().transform((s) => new Date(s)),
  costeAdquisicion: z.number().default(0),
  valorContable: z.number().default(0),
  valorEstimado: z.number().optional(),
});

/**
 * GET /api/family-office/participations
 * List all Participation for the user's company.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    // Consolidated: include child companies
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { childCompanies: { select: { id: true } } },
    });
    const allIds = company
      ? [session.user.companyId, ...company.childCompanies.map((c: { id: string }) => c.id)]
      : [session.user.companyId];

    const participations = await prisma.participation.findMany({
      where: { companyId: { in: allIds } },
      orderBy: { targetCompanyName: 'asc' },
    });

    return NextResponse.json({ success: true, data: participations });
  } catch (error: any) {
    logger.error('[Family Office Participations GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo participaciones' }, { status: 500 });
  }
}

/**
 * POST /api/family-office/participations
 * Create a new Participation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createParticipationSchema.parse(body);

    const prisma = await getPrisma();

    const participation = await prisma.participation.create({
      data: {
        companyId: session.user.companyId,
        targetCompanyName: validated.targetCompanyName,
        targetCompanyCIF: validated.targetCompanyCIF,
        tipo: validated.tipo,
        porcentaje: validated.porcentaje,
        fechaAdquisicion: validated.fechaAdquisicion,
        costeAdquisicion: validated.costeAdquisicion,
        valorContable: validated.valorContable,
        valorEstimado: validated.valorEstimado,
      },
    });

    logger.info('[Family Office] Participación creada', {
      participationId: participation.id,
      companyId: session.user.companyId,
    });

    return NextResponse.json({ success: true, data: participation }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Family Office Participations POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando participación' }, { status: 500 });
  }
}
