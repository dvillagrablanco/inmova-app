/**
 * API para gestionar un cupón promocional específico
 * Solo accesible para SUPERADMIN
 * 
 * GET /api/admin/promo-coupons/[id] - Obtener cupón
 * PUT /api/admin/promo-coupons/[id] - Actualizar cupón
 * DELETE /api/admin/promo-coupons/[id] - Eliminar cupón
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateCouponSchema = z.object({
  codigo: z.string().min(3).max(20).toUpperCase().optional(),
  nombre: z.string().min(3).optional(),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_MONTHS', 'TRIAL_EXTENSION']).optional(),
  valor: z.number().positive().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaExpiracion: z.string().datetime().optional(),
  usosMaximos: z.number().int().positive().optional().nullable(),
  usosPorUsuario: z.number().int().positive().optional(),
  duracionMeses: z.number().int().positive().optional(),
  planesPermitidos: z.array(z.string()).optional(),
  estado: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'EXHAUSTED']).optional(),
  activo: z.boolean().optional(),
  destacado: z.boolean().optional(),
  notas: z.string().optional().nullable(),
}).partial();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const coupon = await prisma.promoCoupon.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { usos: true } },
        usos: {
          take: 10,
          orderBy: { aplicadoEn: 'desc' },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    }

    const diasRestantes = Math.ceil(
      (new Date(coupon.fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      success: true,
      data: {
        ...coupon,
        usosActuales: coupon._count.usos,
        diasRestantes,
      },
    });
  } catch (error: any) {
    logger.error('[PromoCoupon GET Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo cupón' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateCouponSchema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que existe
    const existing = await prisma.promoCoupon.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    }

    // Si se cambia el código, verificar que no exista otro con el mismo código
    if (validated.codigo && validated.codigo !== existing.codigo) {
      const duplicate = await prisma.promoCoupon.findUnique({
        where: { codigo: validated.codigo },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: `Ya existe un cupón con el código ${validated.codigo}` },
          { status: 400 }
        );
      }
    }

    // Preparar datos para actualizar
    const updateData: any = { ...validated };

    // Convertir fechas si vienen como string
    if (validated.fechaInicio) {
      updateData.fechaInicio = new Date(validated.fechaInicio);
    }
    if (validated.fechaExpiracion) {
      updateData.fechaExpiracion = new Date(validated.fechaExpiracion);
    }

    // Si se reactiva un cupón expirado, resetear alertas
    if (validated.estado === 'ACTIVE' && existing.estado === 'EXPIRED') {
      updateData.alertaEnviada7d = false;
      updateData.alertaEnviada3d = false;
      updateData.alertaEnviada1d = false;
    }

    // Actualizar cupón
    const coupon = await prisma.promoCoupon.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error: any) {
    logger.error('[PromoCoupon PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error actualizando cupón' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que existe y no tiene usos
    const existing = await prisma.promoCoupon.findUnique({
      where: { id: params.id },
      include: { _count: { select: { usos: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    }

    if (existing._count.usos > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: el cupón tiene ${existing._count.usos} usos registrados` },
        { status: 400 }
      );
    }

    // Eliminar cupón
    await prisma.promoCoupon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cupón eliminado correctamente',
    });
  } catch (error: any) {
    logger.error('[PromoCoupon DELETE Error]:', error);
    return NextResponse.json({ error: 'Error eliminando cupón' }, { status: 500 });
  }
}
