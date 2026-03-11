// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ventaSchema = z.object({
  escenario: z.literal('venta_inmueble'),
  assetId: z.string().min(1),
  precioVenta: z.number().positive(),
  gastosVenta: z.number().min(0).optional(),
  plusvaliaMunicipal: z.number().min(0).optional(),
  year: z.number().int().min(2020).max(2050),
});

const subidaSchema = z.object({
  escenario: z.literal('subida_alquiler'),
  porcentajeSubida: z.number().min(0.1).max(100),
  year: z.number().int().min(2020).max(2050),
});

const amortizacionSchema = z.object({
  escenario: z.literal('amortizacion_anticipada'),
  mortgageId: z.string().min(1),
  importeAmortizacion: z.number().positive(),
  year: z.number().int().min(2020).max(2050),
});

const compraSchema = z.object({
  escenario: z.literal('compra_inmueble'),
  precioCompra: z.number().positive(),
  gastosCompra: z.number().min(0),
  rentaMensualEstimada: z.number().positive(),
  gastosAnualesEstimados: z.number().min(0),
  financiacion: z
    .object({
      ltv: z.number().min(0).max(100),
      tipoInteres: z.number().min(0).max(30),
      plazoAnos: z.number().int().min(1).max(40),
    })
    .optional(),
  year: z.number().int().min(2020).max(2050),
});

const bodySchema = z.discriminatedUnion('escenario', [
  ventaSchema,
  subidaSchema,
  amortizacionSchema,
  compraSchema,
]);

/**
 * POST /api/investment/fiscal/simulate
 * Simulador fiscal "what-if" para sociedades patrimoniales.
 *
 * Body: { escenario: "venta_inmueble" | "subida_alquiler" | "amortizacion_anticipada" | "compra_inmueble", ...params }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    const data = parsed.data;

    const {
      simulateVentaInmueble,
      simulateSubidaAlquiler,
      simulateAmortizacionAnticipada,
      simulateCompraInmueble,
    } = await import('@/lib/fiscal-simulator-service');

    let result;

    switch (data.escenario) {
      case 'venta_inmueble':
        result = await simulateVentaInmueble({ companyId, ...data });
        break;
      case 'subida_alquiler':
        result = await simulateSubidaAlquiler({ companyId, ...data });
        break;
      case 'amortizacion_anticipada':
        result = await simulateAmortizacionAnticipada({ companyId, ...data });
        break;
      case 'compra_inmueble':
        result = await simulateCompraInmueble({ companyId, ...data });
        break;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('[Fiscal Simulate API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
