import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireProviderAuth } from '@/lib/provider-auth';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Work Orders para Portal Proveedor
 * GET - Obtener órdenes de trabajo asignadas al proveedor
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireProviderAuth(request);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const estadoParam = searchParams.get('estado');
    const validEstados = [
      'pendiente',
      'asignada',
      'aceptada',
      'en_progreso',
      'pausada',
      'completada',
      'cancelada',
      'rechazada',
    ] as const;
    const estado = validEstados.includes(estadoParam as (typeof validEstados)[number])
      ? (estadoParam as (typeof validEstados)[number])
      : undefined;
    const pageParam = Number(searchParams.get('page') || '1');
    const limitParam = Number(searchParams.get('limit') || '20');
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 20;
    const skip = (page - 1) * limit;

    const [workOrders, total] = await prisma.$transaction([
      prisma.providerWorkOrder.findMany({
        where: {
          providerId: auth.provider.id,
          ...(estado ? { estado } : {}),
        },
        include: {
          building: { select: { id: true, nombre: true } },
          unit: { select: { id: true, numero: true } },
          maintenance: { select: { id: true, titulo: true } },
        },
        orderBy: { fechaAsignacion: 'desc' },
        skip,
        take: limit,
      }),
      prisma.providerWorkOrder.count({
        where: {
          providerId: auth.provider.id,
          ...(estado ? { estado } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      workOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
