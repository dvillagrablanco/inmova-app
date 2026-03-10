/**
 * API: Facturas de gestión inmobiliaria
 * GET: Listar facturas con filtros | POST: Crear factura
 * Almacenamiento en memoria (mismo patrón que liquidaciones)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const lineaFacturaSchema = z.object({
  concepto: z.string(),
  cantidad: z.number().positive(),
  precioUnitario: z.number().min(0),
  subtotal: z.number().min(0),
});

const createFacturaSchema = z.object({
  serieId: z.string(),
  numeroFactura: z.string(),
  fechaEmision: z.string(),
  fechaVencimiento: z.string(),
  cliente: z.object({
    nombre: z.string(),
    nif: z.string().optional(),
    direccion: z.string().optional(),
  }),
  concepto: z.string(),
  lineas: z.array(lineaFacturaSchema).min(1),
  baseImponible: z.number().min(0),
  ivaPorcentaje: z.number().min(0).max(100),
  ivaImporte: z.number().min(0),
  retencionPorcentaje: z.number().min(0).max(100),
  retencionImporte: z.number().min(0),
  total: z.number(),
  notas: z.string().optional(),
  esProforma: z.boolean().optional().default(false),
  facturaOriginalId: z.string().optional(),
});

import { facturasStore, type Factura, type LineaFactura } from '@/lib/facturacion-store';

export type { Factura, LineaFactura };

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || 'default';
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const serie = searchParams.get('serie');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const esProforma = searchParams.get('esProforma');

    let facturas = Array.from(facturasStore.values()).filter((f) => f.companyId === companyId);

    if (estado && estado !== 'todas') {
      facturas = facturas.filter((f) => f.estado === estado);
    }
    if (serie) {
      facturas = facturas.filter((f) => f.serie === serie || f.serieId === serie);
    }
    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      facturas = facturas.filter((f) => new Date(f.fechaEmision) >= desde);
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      facturas = facturas.filter((f) => new Date(f.fechaEmision) <= hasta);
    }
    if (esProforma === 'true') {
      facturas = facturas.filter((f) => f.esProforma);
    } else if (esProforma === 'false') {
      facturas = facturas.filter((f) => !f.esProforma);
    }

    facturas.sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime());

    const totalFacturado = facturas.filter((f) => f.estado !== 'anulada').reduce((s, f) => s + f.total, 0);
    const pendientesCobro = facturas
      .filter((f) => f.estado === 'emitida' || f.estado === 'vencida')
      .reduce((s, f) => s + f.total, 0);
    const mesActual = new Date().getMonth();
    const anioActual = new Date().getFullYear();
    const facturasEsteMes = facturas.filter((f) => {
      const d = new Date(f.fechaEmision);
      return d.getMonth() === mesActual && d.getFullYear() === anioActual && f.estado !== 'anulada';
    }).length;

    return NextResponse.json({
      success: true,
      data: facturas,
      kpis: {
        totalFacturado,
        pendientesCobro,
        facturasEsteMes,
      },
    });
  } catch (error: unknown) {
    console.error('[API facturacion/facturas] Error:', error);
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || 'default';
    const body = await req.json();
    const validation = createFacturaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const id = `fact-${companyId}-${Date.now()}`;

    const serieNombre = data.serieId.includes('FAC') ? 'FAC' : data.serieId.includes('PRO') ? 'PRO' : 'REC';

    const factura: Factura = {
      id,
      companyId,
      serieId: data.serieId,
      serie: serieNombre,
      numeroFactura: data.numeroFactura,
      fechaEmision: data.fechaEmision,
      fechaVencimiento: data.fechaVencimiento,
      cliente: data.cliente,
      concepto: data.concepto,
      lineas: data.lineas,
      baseImponible: data.baseImponible,
      ivaPorcentaje: data.ivaPorcentaje,
      ivaImporte: data.ivaImporte,
      retencionPorcentaje: data.retencionPorcentaje,
      retencionImporte: data.retencionImporte,
      total: data.total,
      estado: 'emitida',
      notas: data.notas,
      esProforma: data.esProforma ?? false,
      facturaOriginalId: data.facturaOriginalId,
      createdAt: new Date().toISOString(),
    };

    facturasStore.set(id, factura);

    return NextResponse.json({ success: true, data: factura }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API facturacion/facturas] Error:', error);
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
  }
}
