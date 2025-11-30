import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createCoupon,
  getCompanyCoupons,
  validateCoupon,
} from '@/lib/coupon-service';
import { CouponType, CouponStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') as CouponStatus | null;
    const activo = searchParams.get('activo');

    const filters: any = {};
    if (estado) filters.estado = estado;
    if (activo !== null) filters.activo = activo === 'true';

    const coupons = await getCompanyCoupons(session.user.companyId, filters);

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error al obtener cupones:', error);
    return NextResponse.json(
      { error: 'Error al obtener cupones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden crear cupones
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Validar cupón
    if (action === 'validate') {
      const { codigo, montoCompra, userId, tenantId } = body;

      if (!codigo || !montoCompra) {
        return NextResponse.json(
          { error: 'Código y monto son requeridos' },
          { status: 400 }
        );
      }

      const result = await validateCoupon({
        codigo,
        companyId: session.user.companyId,
        montoCompra: parseFloat(montoCompra),
        userId,
        tenantId,
      });

      return NextResponse.json(result);
    }

    // Crear cupón
    const {
      codigo,
      tipo,
      valor,
      descripcion,
      usosMaximos,
      usosPorUsuario,
      montoMinimo,
      fechaInicio,
      fechaExpiracion,
      aplicaATodos,
      unidadesPermitidas,
      planesPermitidos,
    } = body;

    if (!codigo || !tipo || !valor || !fechaInicio || !fechaExpiracion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const coupon = await createCoupon({
      companyId: session.user.companyId,
      codigo,
      tipo: tipo as CouponType,
      valor: parseFloat(valor),
      descripcion,
      usosMaximos: usosMaximos ? parseInt(usosMaximos) : undefined,
      usosPorUsuario: usosPorUsuario ? parseInt(usosPorUsuario) : 1,
      montoMinimo: montoMinimo ? parseFloat(montoMinimo) : undefined,
      fechaInicio: new Date(fechaInicio),
      fechaExpiracion: new Date(fechaExpiracion),
      aplicaATodos: aplicaATodos ?? true,
      unidadesPermitidas: unidadesPermitidas || [],
      planesPermitidos: planesPermitidos || [],
      creadoPor: session.user.id,
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear cupón:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear cupón' },
      { status: 500 }
    );
  }
}
