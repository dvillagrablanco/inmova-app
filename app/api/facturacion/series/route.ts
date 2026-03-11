// @ts-nocheck
/**
 * API: Series de facturación
 * GET: Listar series | POST: Crear serie
 * Mock: F- (facturas), P- (proformas), R- (rectificativas)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import {
  seriesFacturacionStore,
  seedSeriesFacturacion,
  type SerieFacturacion,
} from '@/lib/facturacion-series-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type { SerieFacturacion };

const createSerieSchema = z.object({
  prefijo: z.string().min(1).max(10),
  nombre: z.string().min(1),
  impuestoPorDefecto: z
    .object({
      iva: z.number().min(0).max(100),
      irpf: z.number().min(0).max(100),
    })
    .optional()
    .default({ iva: 21, irpf: 0 }),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || 'default';
    seedSeriesFacturacion(companyId);

    const series = Array.from(seriesFacturacionStore.values())
      .filter((s) => s.companyId === companyId)
      .sort((a, b) => a.prefijo.localeCompare(b.prefijo));

    return NextResponse.json({ success: true, data: series });
  } catch (error: unknown) {
    console.error('[API facturacion/series] Error:', error);
    return NextResponse.json({ error: 'Error al obtener series' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || 'default';
    seedSeriesFacturacion(companyId);

    const body = await req.json();
    const validation = createSerieSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const id = `serie-${companyId}-${Date.now()}`;

    const serie: SerieFacturacion = {
      id,
      prefijo: data.prefijo,
      nombre: data.nombre,
      ultimoNumero: 0,
      impuestoPorDefecto: data.impuestoPorDefecto,
      activa: true,
      createdAt: new Date().toISOString(),
      companyId,
    };

    seriesFacturacionStore.set(id, serie);

    return NextResponse.json({ success: true, data: serie }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API facturacion/series] Error:', error);
    return NextResponse.json({ error: 'Error al crear serie' }, { status: 500 });
  }
}
