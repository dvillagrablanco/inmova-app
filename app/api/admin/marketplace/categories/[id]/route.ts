/**
 * API para gestionar una categoría específica del marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const resolveCategoryName = async (slugOrName: string): Promise<string | null> => {
  const prisma = await getPrisma();
  const categories = await prisma.marketplaceService.findMany({
    select: { categoria: true },
    distinct: ['categoria'],
  });
  const match = categories.find(
    (category) => category.categoria === slugOrName || slugify(category.categoria) === slugOrName
  );
  return match?.categoria ?? null;
};

const categoryUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  activo: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const services = await prisma.marketplaceService.findMany({
      select: { categoria: true, providerId: true, activo: true },
    });

    const categoryMap = new Map<
      string,
      { serviciosCount: number; proveedores: Set<string>; activo: boolean }
    >();

    services.forEach((service) => {
      const stats = categoryMap.get(service.categoria) || {
        serviciosCount: 0,
        proveedores: new Set<string>(),
        activo: false,
      };
      stats.serviciosCount += 1;
      if (service.providerId) {
        stats.proveedores.add(service.providerId);
      }
      if (service.activo) {
        stats.activo = true;
      }
      categoryMap.set(service.categoria, stats);
    });

    const entry = Array.from(categoryMap.entries()).find(
      ([categoria]) => slugify(categoria) === params.id || categoria === params.id
    );

    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const [categoria, stats] = entry;
    return NextResponse.json({
      success: true,
      data: {
        id: `cat_${slugify(categoria)}`,
        nombre: categoria,
        slug: slugify(categoria),
        descripcion: null,
        icono: 'package',
        color: '#4F46E5',
        serviciosCount: stats.serviciosCount,
        proveedoresCount: stats.proveedores.size,
        activo: stats.activo,
        orden: 0,
      },
    });
  } catch (error: unknown) {
    logger.error('[API Error] Get marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const targetCategory = await resolveCategoryName(params.id);
    if (!targetCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }
    if (parsed.data.nombre) {
      await prisma.marketplaceService.updateMany({
        where: { categoria: targetCategory },
        data: { categoria: parsed.data.nombre },
      });
    }
    if (typeof parsed.data.activo === 'boolean') {
      await prisma.marketplaceService.updateMany({
        where: { categoria: parsed.data.nombre || targetCategory },
        data: { activo: parsed.data.activo },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        nombre: parsed.data.nombre || targetCategory,
        activo: parsed.data.activo ?? true,
        updatedAt: new Date().toISOString(),
      },
      message: 'Categoría actualizada correctamente',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Update marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const targetCategory = await resolveCategoryName(params.id);
    if (!targetCategory) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    await prisma.marketplaceService.updateMany({
      where: { categoria: targetCategory },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Delete marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH para activar/desactivar
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const activo =
      typeof body === 'object' && body !== null ? (body as { activo?: boolean }).activo : undefined;

    if (typeof activo !== 'boolean') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const targetCategory = await resolveCategoryName(params.id);
    if (!targetCategory) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    await prisma.marketplaceService.updateMany({
      where: { categoria: targetCategory },
      data: { activo },
    });

    return NextResponse.json({
      success: true,
      data: { id: params.id, activo },
      message: activo ? 'Categoría activada' : 'Categoría desactivada',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Patch marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
