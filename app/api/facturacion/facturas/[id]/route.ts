import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
        destinatario: { nombre: factura.destinatarioNombre, nif: factura.destinatarioNif },
      },
    });
  } catch (error) {
    console.error('[API facturacion/facturas/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const accion = body.accion as string;

    let nuevoEstado: string;
    if (accion === 'marcar_pagada') {
      nuevoEstado = 'pagada';
    } else if (accion === 'anular') {
      nuevoEstado = 'anulada';
    } else if (accion === 'marcar_vencida') {
      nuevoEstado = 'emitida';
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { estado: nuevoEstado },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        destinatario: { nombre: updated.destinatarioNombre, nif: updated.destinatarioNif },
      },
    });
  } catch (error) {
    console.error('[API facturacion/facturas/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
  }
}
