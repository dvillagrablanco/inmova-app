import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const rentRollEntrySchema = z.object({
  tipo: z.enum(['vivienda', 'garaje', 'local', 'trastero', 'oficina', 'otro']),
  referencia: z.string().min(1),
  superficie: z.number().min(0).optional(),
  rentaMensual: z.number().min(0),
  estado: z.enum(['alquilado', 'vacio', 'reforma']),
  notas: z.string().optional(),
});

const analysisSchema = z.object({
  nombre: z.string().min(1).max(200),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  tipoActivo: z.string().optional(),
  askingPrice: z.number().positive(),

  gastosNotaria: z.number().min(0).default(0),
  gastosRegistro: z.number().min(0).default(0),
  impuestoCompra: z.number().min(0).default(0),
  comisionCompra: z.number().min(0).default(0),
  otrosGastosCompra: z.number().min(0).default(0),

  capexReforma: z.number().min(0).default(0),
  capexImprevistos: z.number().min(0).default(10),
  capexOtros: z.number().min(0).default(0),

  ibiAnual: z.number().min(0).default(0),
  comunidadMensual: z.number().min(0).default(0),
  seguroAnual: z.number().min(0).default(0),
  mantenimientoAnual: z.number().min(0).default(0),
  gestionAdminPct: z.number().min(0).max(100).default(0),
  vacioEstimadoPct: z.number().min(0).max(100).default(5),
  comisionAlquilerPct: z.number().min(0).max(100).default(0),
  otrosGastosAnuales: z.number().min(0).default(0),

  usaFinanciacion: z.boolean().default(false),
  ltv: z.number().min(0).max(100).optional(),
  tipoInteres: z.number().min(0).max(30).optional(),
  plazoAnos: z.number().int().min(1).max(40).optional(),
  comisionApertura: z.number().min(0).max(10).optional(),

  rentRoll: z.array(rentRollEntrySchema).min(1),
  notas: z.string().optional(),
});

/**
 * GET /api/investment/analysis - Lista analisis guardados
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const analyses = await prisma.investmentAnalysis.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        ciudad: true,
        askingPrice: true,
        yieldBruto: true,
        yieldNeto: true,
        cashOnCash: true,
        cashFlowAnual: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: analyses });
  } catch (error: any) {
    logger.error('[InvestmentAnalysis GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo analisis' }, { status: 500 });
  }
}

/**
 * POST /api/investment/analysis - Crear y calcular analisis
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = analysisSchema.parse(body);

    // Calcular resultados
    const { runInvestmentAnalysis } = await import('@/lib/investment-analysis-calculator');
    const results = runInvestmentAnalysis(validated);

    // Guardar en BD
    const prisma = getPrismaClient();
    const analysis = await prisma.investmentAnalysis.create({
      data: {
        companyId: session.user.companyId,
        createdBy: session.user.id as string,
        ...validated,
        rentRoll: validated.rentRoll as any,
        // Resultados
        rentaBrutaAnual: results.rentaBrutaAnual,
        rentaNetaAnual: results.noiAnual,
        inversionTotal: results.inversionTotal,
        capitalPropio: results.capitalPropio,
        importeHipoteca: results.importeHipoteca,
        cuotaHipotecaMensual: results.cuotaMensual,
        cashFlowAnual: results.cashFlowAnualPreTax,
        yieldBruto: results.yieldBruto,
        yieldNeto: results.yieldNeto,
        cashOnCash: results.cashOnCash,
        paybackAnos: results.paybackAnos,
        tablaSensibilidad: results.tablaSensibilidad as any,
      },
    });

    return NextResponse.json({
      success: true,
      data: { analysis, results },
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[InvestmentAnalysis POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando analisis' }, { status: 500 });
  }
}
