import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createMortgageSchema = z.object({
  assetId: z.string(),
  entidadFinanciera: z.string().min(1),
  numeroExpediente: z.string().optional(),
  tipoHipoteca: z.enum(['fijo', 'variable', 'mixto']),
  capitalInicial: z.number().positive(),
  capitalPendiente: z.number().min(0),
  tipoInteres: z.number().min(0).max(30),
  diferencial: z.number().min(0).optional(),
  indiceReferencia: z.string().optional(),
  plazoAnos: z.number().int().positive(),
  cuotaMensual: z.number().positive(),
  diaVencimiento: z.number().int().min(1).max(31).default(1),
  fechaConstitucion: z.string().datetime(),
  fechaVencimiento: z.string().datetime(),
  fechaRevision: z.string().datetime().optional(),
  periodoCarencia: z.number().int().min(0).optional(),
  gastosConstitucion: z.number().min(0).default(0),
  comisionApertura: z.number().min(0).default(0),
  comisionCancelacion: z.number().min(0).optional(),
  seguroVidaAnual: z.number().min(0).optional(),
  seguroHogarAnual: z.number().min(0).optional(),
  notas: z.string().optional(),
});

/**
 * GET /api/investment/mortgages - Lista hipotecas de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const mortgages = await prisma.mortgage.findMany({
      where: { companyId: session.user.companyId },
      include: {
        asset: {
          select: {
            id: true,
            assetType: true,
            precioCompra: true,
            building: { select: { nombre: true, direccion: true } },
            unit: { select: { numero: true } },
          },
        },
      },
      orderBy: { fechaConstitucion: 'desc' },
    });

    // Calcular metricas agregadas
    const activeMortgages = mortgages.filter(m => m.estado === 'activa');
    const totalDebt = activeMortgages.reduce((s, m) => s + m.capitalPendiente, 0);
    const totalMonthlyPayment = activeMortgages.reduce((s, m) => s + m.cuotaMensual, 0);
    const avgInterestRate = activeMortgages.length > 0
      ? activeMortgages.reduce((s, m) => s + m.tipoInteres, 0) / activeMortgages.length
      : 0;

    return NextResponse.json({
      success: true,
      data: mortgages,
      summary: {
        totalActive: activeMortgages.length,
        totalDebt: Math.round(totalDebt * 100) / 100,
        totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
        avgInterestRate: Math.round(avgInterestRate * 100) / 100,
      },
    });
  } catch (error: any) {
    logger.error('[Mortgages GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo hipotecas' }, { status: 500 });
  }
}

/**
 * POST /api/investment/mortgages - Registrar nueva hipoteca
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createMortgageSchema.parse(body);

    const prisma = getPrismaClient();

    // Verificar que el asset pertenece a la empresa
    const asset = await prisma.assetAcquisition.findFirst({
      where: { id: validated.assetId, companyId: session.user.companyId },
    });
    if (!asset) {
      return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 });
    }

    const mortgage = await prisma.mortgage.create({
      data: {
        ...validated,
        companyId: session.user.companyId,
        fechaConstitucion: new Date(validated.fechaConstitucion),
        fechaVencimiento: new Date(validated.fechaVencimiento),
        fechaRevision: validated.fechaRevision ? new Date(validated.fechaRevision) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: mortgage }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Mortgages POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando hipoteca' }, { status: 500 });
  }
}
