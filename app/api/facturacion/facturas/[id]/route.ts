/**
 * API: Factura individual
 * GET: Obtener factura | PATCH: Marcar pagada, Anular, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { facturasStore } from '@/lib/facturacion-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const factura = facturasStore.get(id);

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const companyId = session.user.companyId || 'default';
    if (factura.companyId !== companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: factura });
  } catch (error: unknown) {
    console.error('[API facturacion/facturas/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const factura = facturasStore.get(id);

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const companyId = session.user.companyId || 'default';
    if (factura.companyId !== companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const accion = body.accion as string;

    if (accion === 'marcar_pagada') {
      factura.estado = 'pagada';
    } else if (accion === 'anular') {
      factura.estado = 'anulada';
    } else if (accion === 'marcar_vencida') {
      factura.estado = 'vencida';
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    facturasStore.set(id, factura);

    return NextResponse.json({ success: true, data: factura });
  } catch (error: unknown) {
    console.error('[API facturacion/facturas/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
  }
}
