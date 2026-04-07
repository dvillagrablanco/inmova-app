import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateFacturaSchema = z.object({
  estado: z.enum(['borrador', 'emitida', 'pagada', 'anulada', 'rectificada']).optional(),
  concepto: z.string().optional(),
  baseImponible: z.number().optional(),
  iva: z.number().optional(),
  irpf: z.number().optional(),
  notas: z.string().optional(),
  destinatario: z
    .object({
      nombre: z.string(),
      nif: z.string().optional(),
    })
    .optional(),
  inmueble: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    const { id } = await params;

    const factura = await prisma.invoice.findFirst({
      where: { id, companyId: companyId || undefined },
    });

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...factura,
        fecha: factura.fecha.toISOString().split('T')[0],
        fechaContable: factura.fechaContable.toISOString().split('T')[0],
        destinatario: { nombre: factura.destinatarioNombre, nif: factura.destinatarioNif },
      },
    });
  } catch (error) {
    console.error('[API facturacion/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    const { id } = await params;

    const existing = await prisma.invoice.findFirst({
      where: { id, companyId: companyId || undefined },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateFacturaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: Record<string, unknown> = {};

    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.concepto !== undefined) updateData.concepto = data.concepto;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.inmueble !== undefined) updateData.inmueble = data.inmueble;
    if (data.destinatario) {
      updateData.destinatarioNombre = data.destinatario.nombre;
      if (data.destinatario.nif !== undefined) updateData.destinatarioNif = data.destinatario.nif;
    }

    const base = data.baseImponible ?? existing.baseImponible;
    const iva = data.iva ?? existing.iva;
    const irpf = data.irpf ?? existing.irpf;

    if (data.baseImponible !== undefined || data.iva !== undefined || data.irpf !== undefined) {
      updateData.baseImponible = base;
      updateData.iva = iva;
      updateData.irpf = irpf;
      const ivaImporte = (base * iva) / 100;
      const irpfImporte = (base * irpf) / 100;
      updateData.totalImpuestos = ivaImporte - irpfImporte;
      updateData.total = base + (ivaImporte - irpfImporte);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData as any,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        destinatario: { nombre: updated.destinatarioNombre, nif: updated.destinatarioNif },
      },
    });
  } catch (error) {
    console.error('[API facturacion/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    const { id } = await params;

    const existing = await prisma.invoice.findFirst({
      where: { id, companyId: companyId || undefined },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Factura eliminada' });
  } catch (error) {
    console.error('[API facturacion/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 });
  }
}
