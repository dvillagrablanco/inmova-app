/**
 * API: Validar cupón de descuento
 * 
 * POST /api/coupons/validate
 * Body: { codigo: string, planId?: string }
 * 
 * Valida un cupón tanto en BD local como en Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateStripeCoupon } from '@/lib/stripe-coupon-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const validateSchema = z.object({
  codigo: z.string().min(1).max(50),
  planId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { codigo, planId } = validateSchema.parse(body);

    // 1. Buscar cupón en BD
    const dbCoupon = await prisma.discountCoupon.findFirst({
      where: {
        codigo: codigo.toUpperCase(),
        activo: true,
        estado: 'activo',
      },
    });

    if (!dbCoupon) {
      return NextResponse.json(
        { valid: false, error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    // 2. Verificar vigencia
    const now = new Date();
    if (dbCoupon.fechaInicio > now) {
      return NextResponse.json(
        { valid: false, error: 'Cupón aún no válido' },
        { status: 400 }
      );
    }

    if (dbCoupon.fechaExpiracion < now) {
      return NextResponse.json(
        { valid: false, error: 'Cupón expirado' },
        { status: 400 }
      );
    }

    // 3. Verificar usos máximos
    if (dbCoupon.usosMaximos && dbCoupon.usosActuales >= dbCoupon.usosMaximos) {
      return NextResponse.json(
        { valid: false, error: 'Cupón agotado' },
        { status: 400 }
      );
    }

    // 4. Verificar usos por usuario
    const userUsages = await prisma.couponUsage.count({
      where: {
        couponId: dbCoupon.id,
        usuarioId: session.user.id,
      },
    });

    if (userUsages >= dbCoupon.usosPorUsuario) {
      return NextResponse.json(
        { valid: false, error: 'Ya has usado este cupón' },
        { status: 400 }
      );
    }

    // 5. Verificar si aplica al plan seleccionado
    if (planId && dbCoupon.planesPermitidos.length > 0) {
      if (!dbCoupon.planesPermitidos.includes(planId)) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'Este cupón no es válido para el plan seleccionado',
            planesPermitidos: dbCoupon.planesPermitidos,
          },
          { status: 400 }
        );
      }
    }

    // 6. Validar en Stripe si está sincronizado
    let stripeValid = true;
    let stripeError: string | undefined;

    if (dbCoupon.stripeCouponId) {
      const stripeValidation = await validateStripeCoupon(codigo);
      stripeValid = stripeValidation.valid;
      stripeError = stripeValidation.error;
    }

    // 7. Retornar resultado
    return NextResponse.json({
      valid: stripeValid,
      coupon: {
        id: dbCoupon.id,
        codigo: dbCoupon.codigo,
        tipo: dbCoupon.tipo,
        valor: dbCoupon.valor,
        descripcion: dbCoupon.descripcion,
        planesPermitidos: dbCoupon.planesPermitidos,
        fechaExpiracion: dbCoupon.fechaExpiracion,
        stripeSynced: !!dbCoupon.stripeCouponId,
      },
      descuento: {
        tipo: dbCoupon.tipo,
        valor: dbCoupon.valor,
        texto: dbCoupon.tipo === 'PERCENTAGE' 
          ? `${dbCoupon.valor}% de descuento`
          : `${dbCoupon.valor}€ de descuento`,
      },
      stripeError,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[API Validate Coupon] Error:', error);
    return NextResponse.json(
      { valid: false, error: 'Error validando cupón' },
      { status: 500 }
    );
  }
}
