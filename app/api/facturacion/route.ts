import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company no encontrada' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const serie = searchParams.get('serie');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const destinatario = searchParams.get('destinatario');

    const where: Record<string, unknown> = { companyId };

    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (serie) {
      where.OR = [{ serie: { startsWith: serie } }, { numeroFactura: { contains: serie } }];
    }
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = new Date(fechaDesde);
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = new Date(fechaHasta);
    }
    if (destinatario) {
      where.destinatarioNombre = { contains: destinatario, mode: 'insensitive' };
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

    const active = formatted.filter((f: any) => !['anulada', 'borrador'].includes(f.estado));
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

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company no encontrada' }, { status: 400 });
    }

    const body = await req.json();
    const validation = createFacturaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const ivaImporte = (data.baseImponible * data.iva) / 100;
    const irpfImporte = (data.baseImponible * (data.irpf || 0)) / 100;
    const totalImpuestos = ivaImporte - irpfImporte;
    const total = data.baseImponible + totalImpuestos;

    let prefijo = 'F';
    let nextNum = 1;

    const series = await prisma.invoiceSeries.findFirst({
      where: { id: data.serieId, companyId },
    });

    if (series) {
      prefijo = series.prefijo;
      nextNum = series.siguiente;
      await prisma.invoiceSeries.update({
        where: { id: series.id },
        data: { siguiente: nextNum + 1 },
      });
    } else {
      prefijo = data.serieId.startsWith('F') ? 'F' : data.serieId.startsWith('P') ? 'P' : 'R';
      const count = await prisma.invoice.count({
        where: { companyId, serie: { startsWith: prefijo } },
      });
      nextNum = count + 1;
    }

    const numero = String(nextNum).padStart(5, '0');
    const numeroFactura = `${prefijo}-${numero}`;

    const factura = await prisma.invoice.create({
      data: {
        companyId,
        numeroFactura,
        serie: numeroFactura,
        fecha: new Date(),
        fechaContable: new Date(),
        concepto: data.concepto,
        baseImponible: data.baseImponible,
        iva: data.iva,
        irpf: data.irpf || 0,
        totalImpuestos,
        total,
        estado: 'borrador',
        tipo: data.tipo,
        destinatarioNombre: data.destinatario.nombre,
        destinatarioNif: data.destinatario.nif || null,
        inmueble: data.inmueble || null,
        notas: data.notas || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...factura,
          destinatario: { nombre: factura.destinatarioNombre, nif: factura.destinatarioNif },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API facturacion] Error:', error);
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
  }
}
