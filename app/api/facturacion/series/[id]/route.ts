import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateSerieSchema = z.object({
  prefijo: z.string().min(1).max(10).optional(),
  nombre: z.string().min(1).optional(),
  siguiente: z.number().int().min(0).optional(),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    const { id } = await params;

    const existing = await prisma.invoiceSeries.findFirst({
      where: { id, companyId: companyId || undefined },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
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
    const updated = await prisma.invoiceSeries.update({
      where: { id },
      data: {
        ...(data.prefijo !== undefined && { prefijo: data.prefijo }),
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.siguiente !== undefined && { siguiente: data.siguiente }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.activo !== undefined && { activo: data.activo }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[API facturacion/series/[id]] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar serie' }, { status: 500 });
  }
}
