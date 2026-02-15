import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createFianzaSchema = z.object({
  contractId: z.string(),
  importeFianza: z.number().positive(),
  mesesFianza: z.number().int().positive().default(1),
  organismoDeposito: z.string().optional(),
  numeroDeposito: z.string().optional(),
  fechaDeposito: z.string().datetime().optional(),
  estado: z.enum([
    'pendiente_deposito', 'depositada', 'devuelta', 'retenida_parcial', 'retenida_total',
  ]).default('pendiente_deposito'),
});

/**
 * GET /api/investment/fianzas - Lista fianzas de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const fianzas = await prisma.fianzaDeposit.findMany({
      where: { companyId: session.user.companyId },
      include: {
        contract: {
          select: {
            id: true,
            estado: true,
            tenant: { select: { nombreCompleto: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendientes = fianzas.filter(f => f.estado === 'pendiente_deposito');
    const depositadas = fianzas.filter(f => f.estado === 'depositada');
    const totalDepositado = depositadas.reduce((s, f) => s + f.importeFianza, 0);
    const totalPendiente = pendientes.reduce((s, f) => s + f.importeFianza, 0);

    return NextResponse.json({
      success: true,
      data: fianzas,
      summary: {
        total: fianzas.length,
        pendientes: pendientes.length,
        depositadas: depositadas.length,
        totalDepositado: Math.round(totalDepositado * 100) / 100,
        totalPendiente: Math.round(totalPendiente * 100) / 100,
      },
    });
  } catch (error: any) {
    logger.error('[Fianzas GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo fianzas' }, { status: 500 });
  }
}

/**
 * POST /api/investment/fianzas - Registrar nueva fianza
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createFianzaSchema.parse(body);

    const prisma = getPrismaClient();

    const fianza = await prisma.fianzaDeposit.create({
      data: {
        ...validated,
        companyId: session.user.companyId,
        fechaDeposito: validated.fechaDeposito ? new Date(validated.fechaDeposito) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: fianza }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Fianzas POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error registrando fianza' }, { status: 500 });
  }
}
