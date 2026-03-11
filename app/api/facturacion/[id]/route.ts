// @ts-nocheck
/**
 * API: Factura individual
 * GET: Obtener factura | PUT: Actualizar | DELETE: Eliminar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  facturasHommingStore,
  seedFacturasHomming,
  type FacturaItem,
} from '@/lib/facturacion-homming-store';
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

    const companyId = session.user.companyId || 'default';
    seedFacturasHomming(companyId);

    const { id } = await params;
    const factura = facturasHommingStore.get(id);

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (factura.companyId !== companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: factura });
  } catch (error: unknown) {
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

    const { id } = await params;
    const factura = facturasHommingStore.get(id);

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const companyId = session.user.companyId || 'default';
    if (factura.companyId !== companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
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
    const updated: FacturaItem = { ...factura };

    if (data.estado !== undefined) updated.estado = data.estado;
    if (data.concepto !== undefined) updated.concepto = data.concepto;
    if (data.baseImponible !== undefined) updated.baseImponible = data.baseImponible;
    if (data.iva !== undefined) updated.iva = data.iva;
    if (data.irpf !== undefined) updated.irpf = data.irpf;
    if (data.notas !== undefined) updated.notas = data.notas;
    if (data.destinatario !== undefined) updated.destinatario = data.destinatario;
    if (data.inmueble !== undefined) updated.inmueble = data.inmueble ?? undefined;

    if (data.baseImponible !== undefined || data.iva !== undefined || data.irpf !== undefined) {
      const base = updated.baseImponible;
      const ivaImporte = (base * updated.iva) / 100;
      const irpfImporte = (base * updated.irpf) / 100;
      updated.totalImpuestos = ivaImporte - irpfImporte;
      updated.total = base + updated.totalImpuestos;
    }

    facturasHommingStore.set(id, updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
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

    const { id } = await params;
    const factura = facturasHommingStore.get(id);

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const companyId = session.user.companyId || 'default';
    if (factura.companyId !== companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    facturasHommingStore.delete(id);

    return NextResponse.json({ success: true, message: 'Factura eliminada' });
  } catch (error: unknown) {
    console.error('[API facturacion/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 });
  }
}
