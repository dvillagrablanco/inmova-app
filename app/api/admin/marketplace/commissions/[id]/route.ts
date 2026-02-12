/**
 * API para gestionar una comisión específica del marketplace
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

type ServiceCommissionStatus = 'active' | 'paused' | 'pending';

const commissionSchema = z.object({
  commissionType: z.enum(['fixed', 'percentage']),
  commissionRate: z.number().min(0),
  status: z.enum(['active', 'paused', 'pending']).optional(),
});

const mapServiceStatus = (activo: boolean): ServiceCommissionStatus =>
  activo ? 'active' : 'paused';

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

    const service = await prisma.marketplaceService.findUnique({
      where: { id: params.id },
      include: { provider: { select: { nombre: true, email: true } } },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Comisión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: service.id,
        serviceName: service.nombre,
        serviceCategory: service.categoria,
        providerName: service.provider?.nombre || 'Sin proveedor',
        providerEmail: service.provider?.email || '',
        commissionType: 'percentage',
        commissionRate: service.comisionPorcentaje,
        status: mapServiceStatus(service.activo),
      },
    });
  } catch (error: unknown) {
    logger.error('[API Error] Get marketplace commission:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT para actualizar configuración de comisión
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
    const parsed = commissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { commissionType, commissionRate, status } = parsed.data;

    if (commissionType !== 'percentage') {
      return NextResponse.json(
        { error: 'Solo se admite comisión por porcentaje' },
        { status: 400 }
      );
    }

    const service = await prisma.marketplaceService.update({
      where: { id: params.id },
      data: {
        comisionPorcentaje: commissionRate,
        activo: status ? status === 'active' : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: { 
        id: service.id,
        commissionType,
        commissionRate: service.comisionPorcentaje,
        status: mapServiceStatus(service.activo),
        updatedAt: new Date().toISOString(),
      },
      message: 'Configuración de comisión actualizada',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Update marketplace commission:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH para cambiar estado de comisión
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
    const action =
      typeof body === 'object' && body !== null ? (body as { action?: string }).action : undefined; // 'activate' | 'pause'

    let message = '';
    let newStatus = '';

    switch (action) {
      case 'activate':
        newStatus = 'active';
        message = 'Comisión activada';
        break;
      case 'pause':
        newStatus = 'paused';
        message = 'Comisión pausada';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    await prisma.marketplaceService.update({
      where: { id: params.id },
      data: { activo: newStatus === 'active' },
    });

    return NextResponse.json({
      success: true,
      data: { id: params.id, status: newStatus },
      message,
    });
  } catch (error: unknown) {
    logger.error('[API Error] Patch marketplace commission:', error);
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

    await prisma.marketplaceService.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Comisión eliminada correctamente',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Delete marketplace commission:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
