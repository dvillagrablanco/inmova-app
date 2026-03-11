/**
 * API: Facturación inmobiliaria (estilo Homming)
 * GET: Listar facturas con filtros | POST: Crear factura
 * Mock data con 8 facturas de ejemplo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import {
  facturasHommingStore,
  seedFacturasHomming,
  type FacturaItem,
} from '@/lib/facturacion-homming-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type { FacturaItem, FacturaDestinatario } from '@/lib/facturacion-homming-store';

const createFacturaSchema = z.object({
  serieId: z.string(),
  tipo: z.enum(['factura', 'proforma', 'rectificativa']),
  destinatario: z.object({
    nombre: z.string().min(1),
    nif: z.string().optional(),
  }),
  inmueble: z.string().optional(),
  concepto: z.string().min(1),
  baseImponible: z.number().min(0),
  iva: z.number().min(0).max(100),
  irpf: z.number().min(0).max(100).optional().default(0),
  notas: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || 'default';
    seedFacturasHomming(companyId);

    const { searchParams } = new URL(req.url);
    const serie = searchParams.get('serie');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const destinatario = searchParams.get('destinatario');

    let facturas = Array.from(facturasHommingStore.values()).filter((f) => f.companyId === companyId);

    if (serie) {
      facturas = facturas.filter((f) => f.serie.startsWith(serie) || f.numeroFactura.includes(serie));
    }
    if (estado) {
      facturas = facturas.filter((f) => f.estado === estado);
    }
    if (tipo) {
      facturas = facturas.filter((f) => f.tipo === tipo);
    }
    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      facturas = facturas.filter((f) => new Date(f.fecha) >= desde);
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      facturas = facturas.filter((f) => new Date(f.fecha) <= hasta);
    }
    if (destinatario) {
      const term = destinatario.toLowerCase();
      facturas = facturas.filter(
        (f) =>
          f.destinatario.nombre.toLowerCase().includes(term) ||
          (f.destinatario.nif && f.destinatario.nif.toLowerCase().includes(term))
      );
    }

    facturas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // KPIs
    const totalFacturado = facturas
      .filter((f) => !['anulada', 'borrador'].includes(f.estado))
      .reduce((s, f) => s + f.total, 0);
    const pendientes = facturas.filter((f) => f.estado === 'emitida');
    const facturasEsteMes = facturas.filter((f) => {
      const d = new Date(f.fecha);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && !['anulada'].includes(f.estado);
    }).length;

    return NextResponse.json({
      success: true,
      data: facturas,
      kpis: {
        totalFacturado,
        pendientesCobro: pendientes.reduce((s, f) => s + f.total, 0),
        facturasEsteMes,
      },
    });
  } catch (error: unknown) {
    console.error('[API facturacion] Error:', error);
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

    const ivaImporte = (data.baseImponible * data.iva) / 100;
    const irpfImporte = (data.baseImponible * (data.irpf || 0)) / 100;
    const totalImpuestos = ivaImporte - irpfImporte;
    const total = data.baseImponible + totalImpuestos;

    const prefijo = data.serieId.startsWith('F') ? 'F' : data.serieId.startsWith('P') ? 'P' : 'R';
    const numero = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
    const numeroFactura = `${prefijo}-${numero}`;
    const serie = numeroFactura;

    const factura: FacturaItem = {
      id,
      numeroFactura,
      serie,
      fecha: new Date().toISOString().split('T')[0],
      fechaContable: new Date().toISOString().split('T')[0],
      concepto: data.concepto,
      baseImponible: data.baseImponible,
      iva: data.iva,
      irpf: data.irpf || 0,
      totalImpuestos,
      total,
      estado: 'borrador',
      tipo: data.tipo,
      destinatario: data.destinatario,
      inmueble: data.inmueble,
      notas: data.notas,
      companyId,
      createdAt: new Date().toISOString(),
    };

    facturasHommingStore.set(id, factura);

    return NextResponse.json({ success: true, data: factura }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API facturacion] Error:', error);
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
  }
}
