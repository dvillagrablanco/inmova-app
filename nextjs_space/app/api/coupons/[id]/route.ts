import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  getCouponStats,
  deactivateCoupon,
  reactivateCoupon,
} from '@/lib/coupon-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    if (includeStats) {
      const stats = await getCouponStats(params.id);
      return NextResponse.json(stats);
    }

    const coupon = await prisma.discountCoupon.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        usos: {
          orderBy: { aplicadoEn: 'desc' },
          take: 10,
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error al obtener cupón:', error);
    return NextResponse.json(
      { error: 'Error al obtener cupón' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Desactivar cupón
    if (action === 'deactivate') {
      const coupon = await deactivateCoupon(params.id);
      return NextResponse.json(coupon);
    }

    // Reactivar cupón
    if (action === 'reactivate') {
      const coupon = await reactivateCoupon(params.id);
      return NextResponse.json(coupon);
    }

    // Actualizar cupón
    const coupon = await prisma.discountCoupon.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    const updated = await prisma.discountCoupon.update({
      where: { id: params.id },
      data: {
        descripcion: body.descripcion,
        usosMaximos: body.usosMaximos ? parseInt(body.usosMaximos) : undefined,
        montoMinimo: body.montoMinimo ? parseFloat(body.montoMinimo) : undefined,
        fechaExpiracion: body.fechaExpiracion
          ? new Date(body.fechaExpiracion)
          : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error al actualizar cupón:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar cupón' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    await prisma.discountCoupon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Cupón eliminado' });
  } catch (error) {
    console.error('Error al eliminar cupón:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cupón' },
      { status: 500 }
    );
  }
}
