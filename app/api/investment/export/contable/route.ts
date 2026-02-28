import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  ejercicio: z.coerce.number().int().min(2020).max(2050),
  tipo: z.enum(['diario', 'facturas-emitidas', 'facturas-recibidas']),
  formato: z.enum(['json', 'csv']).default('csv'),
  companyId: z.string().min(1).optional(),
});

/**
 * GET /api/investment/export/contable?ejercicio=2025&tipo=diario&formato=csv
 * Exporta datos contables en formato PGC para gestoría.
 *
 * Tipos disponibles:
 * - diario: Diario contable (asientos debe/haber)
 * - facturas-emitidas: Libro de facturas emitidas (alquileres)
 * - facturas-recibidas: Libro de facturas recibidas (gastos)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      ejercicio: searchParams.get('ejercicio'),
      tipo: searchParams.get('tipo'),
      formato: searchParams.get('formato') || 'csv',
      companyId: searchParams.get('companyId'),
    });

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Parámetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const companyId = parsed.data.companyId || session.user.companyId;
    const { ejercicio, tipo, formato } = parsed.data;

    const {
      generateDiarioContable,
      generateLibroFacturasEmitidas,
      generateLibroFacturasRecibidas,
      toCSV,
    } = await import('@/lib/accounting-export-service');

    let data: { headers: string[]; rows: any[] };

    switch (tipo) {
      case 'diario':
        data = await generateDiarioContable(companyId, ejercicio);
        break;
      case 'facturas-emitidas':
        data = await generateLibroFacturasEmitidas(companyId, ejercicio);
        break;
      case 'facturas-recibidas':
        data = await generateLibroFacturasRecibidas(companyId, ejercicio);
        break;
      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    if (formato === 'csv') {
      const csv = toCSV(data.headers, data.rows);
      const filename = `${tipo}_${ejercicio}_${companyId.slice(-6)}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        tipo,
        ejercicio,
        totalRegistros: data.rows.length,
        headers: data.headers,
        rows: data.rows,
      },
    });
  } catch (error: any) {
    logger.error('[Export Contable API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
