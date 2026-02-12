/**
 * API para gestionar categorías del marketplace
 * 
 * GET /api/admin/marketplace/categories - Listar categorías
 * POST /api/admin/marketplace/categories - Crear categoría
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const CATEGORY_STYLES: Record<string, { icono: string; color: string }> = {
  seguros: { icono: 'shield', color: '#2563EB' },
  mantenimiento: { icono: 'wrench', color: '#D97706' },
  limpieza: { icono: 'sparkles', color: '#8B5CF6' },
  legal: { icono: 'scale', color: '#6366F1' },
  marketing: { icono: 'camera', color: '#14B8A6' },
  mudanzas: { icono: 'truck', color: '#EC4899' },
  certificaciones: { icono: 'building', color: '#059669' },
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const services = await prisma.marketplaceService.findMany({
      select: {
        categoria: true,
        providerId: true,
        activo: true,
      },
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

    const categories = Array.from(categoryMap.entries()).map(([categoria, stats], index) => {
      const slug = slugify(categoria);
      const style = CATEGORY_STYLES[slug] || { icono: 'package', color: '#4F46E5' };
      return {
        id: `cat_${slug}`,
        nombre: categoria,
        slug,
        descripcion: null,
        icono: style.icono,
        color: style.color,
        serviciosCount: stats.serviciosCount,
        proveedoresCount: stats.proveedores.size,
        activo: stats.activo,
        orden: index + 1,
      };
    });

    return NextResponse.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error: unknown) {
    logger.error('[API Error] Marketplace categories:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: 'La creación de categorías requiere servicios asociados',
    }, { status: 501 });
  } catch (error: unknown) {
    logger.error('[API Error] Create marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
