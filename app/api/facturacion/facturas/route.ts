import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createFacturaSchema = z.object({
  serieId: z.string(),
  numeroFactura: z.string().optional(),
  fechaEmision: z.string(),
  fechaVencimiento: z.string().optional(),
  cliente: z.object({
    nombre: z.string(),
    nif: z.string().optional(),
    direccion: z.string().optional(),
  }),
  concepto: z.string(),
  baseImponible: z.number().min(0),
  ivaPorcentaje: z.number().min(0).max(100).default(21),
  ivaImporte: z.number().min(0),
  retencionPorcentaje: z.number().min(0).max(100).default(0),
  retencionImporte: z.number().min(0).default(0),
  total: z.number(),
  notas: z.string().optional(),
  esProforma: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId)
      return NextResponse.json({
        success: true,
        data: [],
        kpis: { totalFacturado: 0, pendientesCobro: 0, facturasEsteMes: 0 },
      });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const serie = searchParams.get('serie');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const where: Record<string, unknown> = { companyId };
    if (estado && estado !== 'todas') where.estado = estado;
    if (serie) where.serie = { startsWith: serie };
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = new Date(fechaDesde);
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = new Date(fechaHasta);
    }

    const facturas = await prisma.invoice.findMany({
      where: where as any,
      orderBy: { fecha: 'desc' },
    });

    const formatted = facturas.map((f: any) => ({
      ...f,
      fecha: f.fecha.toISOString().split('T')[0],
      fechaContable: f.fechaContable.toISOString().split('T')[0],
      destinatario: { nombre: f.destinatarioNombre, nif: f.destinatarioNif },
    }));

    const active = formatted.filter((f: any) => f.estado !== 'anulada');
    const pendientes = formatted.filter((f: any) => f.estado === 'emitida');
    const now = new Date();
    const facturasEsteMes = formatted.filter((f: any) => {
      const d = new Date(f.fecha);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        f.estado !== 'anulada'
      );
    }).length;

    return NextResponse.json({
      success: true,
      data: formatted,
      kpis: {
        totalFacturado: active.reduce((s: number, f: any) => s + f.total, 0),
        pendientesCobro: pendientes.reduce((s: number, f: any) => s + f.total, 0),
        facturasEsteMes,
      },
    });
  } catch (error) {
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

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ error: 'Company requerida' }, { status: 400 });

    const body = await req.json();
    const validation = createFacturaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const tipo = data.esProforma ? 'proforma' : 'factura';

    const factura = await prisma.invoice.create({
      data: {
        companyId,
        numeroFactura: data.numeroFactura || `${tipo.charAt(0).toUpperCase()}-${Date.now()}`,
        serie: data.serieId,
        fecha: new Date(data.fechaEmision),
        fechaContable: new Date(data.fechaEmision),
        concepto: data.concepto,
        baseImponible: data.baseImponible,
        iva: data.ivaPorcentaje,
        irpf: data.retencionPorcentaje,
        totalImpuestos: data.ivaImporte - data.retencionImporte,
        total: data.total,
        estado: 'emitida',
        tipo,
        destinatarioNombre: data.cliente.nombre,
        destinatarioNif: data.cliente.nif || null,
        notas: data.notas || null,
      },
    });

    return NextResponse.json({ success: true, data: factura }, { status: 201 });
  } catch (error) {
    console.error('[API facturacion/facturas] Error:', error);
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
  }
}
