/**
 * API para validar cupones promocionales
 * 
 * POST /api/billing/validate-coupon
 * Valida si un cupón es válido para un plan específico
 * 
 * Body:
 * - code: Código del cupón
 * - planTier: Tier del plan (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const validateSchema = z.object({
  code: z.string().min(3),
  planTier: z.string().optional(),
  planPrice: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = validateSchema.parse(body);

    // Buscar cupón
    const coupon = await prisma.promoCoupon.findUnique({
      where: { codigo: validated.code.toUpperCase() },
      include: {
        _count: { select: { usos: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: 'Cupón no encontrado',
      });
    }

    // Verificaciones
    const now = new Date();
    const errors: string[] = [];

    if (coupon.estado !== 'ACTIVE' || !coupon.activo) {
      errors.push('Este cupón no está activo');
    }

    if (new Date(coupon.fechaExpiracion) < now) {
      errors.push('Este cupón ha expirado');
    }

    if (new Date(coupon.fechaInicio) > now) {
      errors.push('Este cupón aún no está disponible');
    }

    if (coupon.usosMaximos && coupon._count.usos >= coupon.usosMaximos) {
      errors.push('Este cupón ha alcanzado su límite de usos');
    }

    // Verificar plan permitido
    if (validated.planTier && coupon.planesPermitidos.length > 0) {
      if (!coupon.planesPermitidos.includes(validated.planTier)) {
        errors.push(`Este cupón no es válido para el plan seleccionado. Válido para: ${coupon.planesPermitidos.join(', ')}`);
      }
    }

    // Verificar uso por usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    });

    if (user?.company) {
      const usageCount = await prisma.promoCouponUsage.count({
        where: {
          couponId: coupon.id,
          companyId: user.company.id,
        },
      });

      if (usageCount >= coupon.usosPorUsuario) {
        errors.push('Ya has utilizado este cupón');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors,
      });
    }

    // Calcular descuento
    let descuentoMensual = 0;
    let ahorroTotal = 0;
    let precioConDescuento = validated.planPrice || 0;
    let descripcionDescuento = '';

    if (validated.planPrice) {
      switch (coupon.tipo) {
        case 'PERCENTAGE':
          descuentoMensual = (validated.planPrice * coupon.valor) / 100;
          ahorroTotal = descuentoMensual * coupon.duracionMeses;
          precioConDescuento = validated.planPrice - descuentoMensual;
          descripcionDescuento = `${coupon.valor}% de descuento durante ${coupon.duracionMeses} mes(es)`;
          break;
        case 'FIXED_AMOUNT':
          descuentoMensual = coupon.valor;
          ahorroTotal = coupon.valor * coupon.duracionMeses;
          precioConDescuento = Math.max(0, validated.planPrice - coupon.valor);
          descripcionDescuento = `€${coupon.valor} de descuento durante ${coupon.duracionMeses} mes(es)`;
          break;
        case 'FREE_MONTHS':
          descuentoMensual = validated.planPrice;
          ahorroTotal = validated.planPrice * coupon.valor;
          precioConDescuento = 0;
          descripcionDescuento = `${coupon.valor} mes(es) GRATIS`;
          break;
        case 'TRIAL_EXTENSION':
          descripcionDescuento = `${coupon.valor} días extra de prueba`;
          break;
      }
    }

    const diasRestantes = Math.ceil(
      (new Date(coupon.fechaExpiracion).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      valid: true,
      coupon: {
        codigo: coupon.codigo,
        nombre: coupon.nombre,
        descripcion: coupon.descripcion,
        tipo: coupon.tipo,
        valor: coupon.valor,
        duracionMeses: coupon.duracionMeses,
        planesPermitidos: coupon.planesPermitidos,
        fechaExpiracion: coupon.fechaExpiracion,
        diasRestantes,
        usosDisponibles: coupon.usosMaximos ? coupon.usosMaximos - coupon._count.usos : null,
      },
      discount: {
        descuentoMensual: Math.round(descuentoMensual * 100) / 100,
        ahorroTotal: Math.round(ahorroTotal * 100) / 100,
        precioConDescuento: Math.round(precioConDescuento * 100) / 100,
        descripcion: descripcionDescuento,
      },
    });
  } catch (error: any) {
    logger.error('[ValidateCoupon API Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Código de cupón inválido' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: false, error: 'Error validando cupón' },
      { status: 500 }
    );
  }
}
