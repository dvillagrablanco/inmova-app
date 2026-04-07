import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSerieSchema = z.object({
  prefijo: z.string().min(1).max(10),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ success: true, data: [] });

    const series = await prisma.invoiceSeries.findMany({
      where: { companyId },
      orderBy: { prefijo: 'asc' },
    });

    return NextResponse.json({ success: true, data: series });
  } catch (error) {
    console.error('[API facturacion/series] Error:', error);
    return NextResponse.json({ error: 'Error al obtener series' }, { status: 500 });
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
    const validation = createSerieSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existing = await prisma.invoiceSeries.findFirst({
      where: { companyId, prefijo: data.prefijo },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una serie con ese prefijo' }, { status: 409 });
    }

    const serie = await prisma.invoiceSeries.create({
      data: {
        companyId,
        prefijo: data.prefijo,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        siguiente: 1,
        activo: true,
      },
    });

    return NextResponse.json({ success: true, data: serie }, { status: 201 });
  } catch (error) {
    console.error('[API facturacion/series] Error:', error);
    return NextResponse.json({ error: 'Error al crear serie' }, { status: 500 });
  }
}
