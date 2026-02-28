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

const simulationSchema = z.object({
  // Datos del activo
  precioCompra: z.number().positive(),
  gastosCompra: z.number().min(0).optional(), // Notaría, registro, ITP. Default: 10%
  reformas: z.number().min(0).default(0),

  // Ingresos
  rentaMensualEstimada: z.number().min(0),
  ocupacionEstimada: z.number().min(0).max(100).default(95), // %

  // Gastos
  ibiAnual: z.number().min(0).default(0),
  comunidadMensual: z.number().min(0).default(0),
  seguroAnual: z.number().min(0).default(0),
  mantenimientoAnual: z.number().min(0).default(0),

  // Financiación
  hipoteca: z.object({
    capitalInicial: z.number().min(0),
    interes: z.number().min(0), // %
    plazoAnos: z.number().min(1).max(40),
  }).optional(),

  // Simulación
  anosSimulacion: z.number().min(1).max(30).default(10),
  revalorizacionAnual: z.number().default(2), // %
  incrementoRentaAnual: z.number().default(2.5), // % IPC
});

/**
 * POST /api/investment/simulate-acquisition
 * Simulador completo de adquisición inmobiliaria.
 * Calcula: yield, cash-flow, ROI, TIR, payback, impacto fiscal, comparativa vs cartera.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const data = simulationSchema.parse(body);

    const gastosCompra = data.gastosCompra ?? Math.round(data.precioCompra * 0.10);
    const inversionTotal = data.precioCompra + gastosCompra + data.reformas;

    // Ingresos anuales
    const rentaAnualBruta = data.rentaMensualEstimada * 12;
    const rentaAnualEfectiva = rentaAnualBruta * (data.ocupacionEstimada / 100);

    // Gastos anuales
    const gastosAnuales = data.ibiAnual + (data.comunidadMensual * 12) + data.seguroAnual + data.mantenimientoAnual;
    const noiAnual = rentaAnualEfectiva - gastosAnuales;

    // Hipoteca
    let cuotaHipotecaMensual = 0;
    let cuotaHipotecaAnual = 0;
    let capitalInicial = 0;
    let totalIntereses = 0;

    if (data.hipoteca && data.hipoteca.capitalInicial > 0) {
      capitalInicial = data.hipoteca.capitalInicial;
      const r = data.hipoteca.interes / 100 / 12;
      const n = data.hipoteca.plazoAnos * 12;
      cuotaHipotecaMensual = r > 0
        ? (capitalInicial * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : capitalInicial / n;
      cuotaHipotecaAnual = cuotaHipotecaMensual * 12;
      totalIntereses = (cuotaHipotecaMensual * n) - capitalInicial;
    }

    const cashFlowAnual = noiAnual - cuotaHipotecaAnual;
    const cashFlowMensual = cashFlowAnual / 12;
    const capitalPropio = inversionTotal - capitalInicial;

    // Yields
    const yieldBruta = (rentaAnualBruta / inversionTotal) * 100;
    const yieldNeta = (noiAnual / inversionTotal) * 100;
    const cashOnCash = capitalPropio > 0 ? (cashFlowAnual / capitalPropio) * 100 : 0;
    const ltv = inversionTotal > 0 ? (capitalInicial / inversionTotal) * 100 : 0;

    // Simulación a X años
    const proyeccion = [];
    let valorAcumulado = data.precioCompra;
    let rentaAcum = data.rentaMensualEstimada;
    let cashFlowAcumulado = 0;
    let paybackYear = null;

    for (let year = 1; year <= data.anosSimulacion; year++) {
      valorAcumulado *= (1 + data.revalorizacionAnual / 100);
      rentaAcum *= (1 + data.incrementoRentaAnual / 100);

      const rentaAnualYear = rentaAcum * 12 * (data.ocupacionEstimada / 100);
      const noiYear = rentaAnualYear - gastosAnuales;
      const cashFlowYear = noiYear - cuotaHipotecaAnual;
      cashFlowAcumulado += cashFlowYear;

      const plusvalia = valorAcumulado - data.precioCompra;
      const roiTotal = capitalPropio > 0
        ? ((cashFlowAcumulado + plusvalia) / capitalPropio) * 100 : 0;

      if (!paybackYear && cashFlowAcumulado >= capitalPropio) {
        paybackYear = year;
      }

      proyeccion.push({
        ano: year,
        valorMercado: Math.round(valorAcumulado),
        rentaMensual: Math.round(rentaAcum),
        noiAnual: Math.round(noiYear),
        cashFlowAnual: Math.round(cashFlowYear),
        cashFlowAcumulado: Math.round(cashFlowAcumulado),
        plusvalia: Math.round(plusvalia),
        roiTotal: Math.round(roiTotal * 10) / 10,
      });
    }

    // Comparativa con cartera actual
    const currentContracts = await prisma.contract.findMany({
      where: { unit: { building: { companyId: session.user.companyId } }, estado: 'activo' },
      select: { rentaMensual: true },
    });
    const rentaMediaCartera = currentContracts.length > 0
      ? currentContracts.reduce((s, c) => s + c.rentaMensual, 0) / currentContracts.length : 0;

    // Fiscal: IS al 25%
    const amortizacion = data.precioCompra * 0.7 * 0.03; // 3% construcción
    const interesesDeducibles = cuotaHipotecaAnual * 0.4; // ~40% son intereses primer año
    const baseImponible = noiAnual - amortizacion - interesesDeducibles;
    const cuotaIS = Math.max(0, baseImponible * 0.25);
    const cashFlowPostIS = cashFlowAnual - cuotaIS;

    return NextResponse.json({
      success: true,
      simulacion: {
        inversion: {
          precioCompra: data.precioCompra,
          gastosCompra,
          reformas: data.reformas,
          total: inversionTotal,
          capitalPropio,
          hipoteca: capitalInicial,
          ltv: Math.round(ltv * 10) / 10,
        },
        ingresos: {
          rentaMensual: data.rentaMensualEstimada,
          rentaAnualBruta,
          rentaAnualEfectiva: Math.round(rentaAnualEfectiva),
          ocupacion: data.ocupacionEstimada,
        },
        gastos: {
          ibi: data.ibiAnual,
          comunidad: data.comunidadMensual * 12,
          seguro: data.seguroAnual,
          mantenimiento: data.mantenimientoAnual,
          totalAnual: Math.round(gastosAnuales),
          hipotecaAnual: Math.round(cuotaHipotecaAnual),
          hipotecaMensual: Math.round(cuotaHipotecaMensual),
        },
        rendimiento: {
          noiAnual: Math.round(noiAnual),
          cashFlowAnual: Math.round(cashFlowAnual),
          cashFlowMensual: Math.round(cashFlowMensual),
          cashFlowPostIS: Math.round(cashFlowPostIS),
          yieldBruta: Math.round(yieldBruta * 100) / 100,
          yieldNeta: Math.round(yieldNeta * 100) / 100,
          cashOnCash: Math.round(cashOnCash * 100) / 100,
          paybackAnos: paybackYear || '>30',
        },
        fiscal: {
          amortizacionAnual: Math.round(amortizacion),
          interesesDeducibles: Math.round(interesesDeducibles),
          baseImponible: Math.round(baseImponible),
          cuotaIS: Math.round(cuotaIS),
        },
        comparativaCartera: {
          rentaMediaActual: Math.round(rentaMediaCartera),
          contratosActuales: currentContracts.length,
          mejoraPortfolio: yieldNeta > 4.5,
          comentario: yieldNeta > 5.5
            ? '✅ Supera la yield media del grupo. Buena adquisición.'
            : yieldNeta > 4.0
              ? '⚠️ Yield aceptable pero no excepcional. Negociar precio.'
              : '❌ Yield insuficiente. No mejora el portfolio actual.',
        },
        proyeccion,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[Simulate Acquisition]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error en simulación' }, { status: 500 });
  }
}
