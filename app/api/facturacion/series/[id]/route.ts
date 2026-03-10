/**
 * API: Serie individual
 * PUT: Actualizar (incl. activa/inactiva)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { seriesFacturacionStore } from '@/lib/facturacion-series-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateSerieSchema = z.object({
  prefijo: z.string().min(1).max(10).optional(),
  nombre: z.string().min(1).optional(),
  ultimoNumero: z.number().int().min(0).optional(),
  impuestoPorDefecto: z
    .object({
      iva: z.number().min(0).max(100),
      irpf: z.number().min(0).max(100),
    })
    .optional(),
  activa: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || 'default';

    const { id } = await params;
    const serie = seriesFacturacionStore.get(id);

    if (!serie) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    if (serie.companyId !== companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateSerieSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updated = { ...serie };

    if (data.prefijo !== undefined) updated.prefijo = data.prefijo;
    if (data.nombre !== undefined) updated.nombre = data.nombre;
    if (data.ultimoNumero !== undefined) updated.ultimoNumero = data.ultimoNumero;
    if (data.impuestoPorDefecto !== undefined) updated.impuestoPorDefecto = data.impuestoPorDefecto;
    if (data.activa !== undefined) updated.activa = data.activa;

    seriesFacturacionStore.set(id, updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('[API facturacion/series/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar serie' }, { status: 500 });
  }
}
