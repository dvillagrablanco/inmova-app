import { prisma } from '@/lib/db';
import type {CouponType, CouponStatus } from '@prisma/client';
import { addDays } from 'date-fns';

/**
 * Servicio de Cupones de Descuento
 * Gestiona la creación, validación y uso de cupones
 */

interface CreateCouponParams {
  companyId: string;
  codigo: string;
  tipo: CouponType;
  valor: number;
  descripcion?: string;
  usosMaximos?: number;
  usosPorUsuario?: number;
  montoMinimo?: number;
  fechaInicio: Date;
  fechaExpiracion: Date;
  aplicaATodos?: boolean;
  unidadesPermitidas?: string[];
  planesPermitidos?: string[];
  creadoPor: string;
}

interface ValidateCouponParams {
  codigo: string;
  companyId: string;
  userId?: string;
  tenantId?: string;
  montoCompra: number;
}

interface ApplyCouponParams {
  couponId: string;
  userId?: string;
  tenantId?: string;
  contractId?: string;
  paymentId?: string;
  montoOriginal: number;
}

/**
 * Crea un nuevo cupón de descuento
 */
export async function createCoupon(params: CreateCouponParams) {
  // Verificar que el código no exista para esta empresa
  const existingCoupon = await prisma.discountCoupon.findUnique({
    where: {
      companyId_codigo: {
        companyId: params.companyId,
        codigo: params.codigo.toUpperCase(),
      },
    },
  });

  if (existingCoupon) {
    throw new Error('El código de cupón ya existe');
  }

  // Validaciones
  if (params.tipo === 'PERCENTAGE' && params.valor > 100) {
    throw new Error('El porcentaje de descuento no puede ser mayor a 100%');
  }

  if (params.valor <= 0) {
    throw new Error('El valor del descuento debe ser mayor a 0');
  }

  if (params.fechaExpiracion <= params.fechaInicio) {
    throw new Error('La fecha de expiración debe ser posterior a la fecha de inicio');
  }

  // Crear el cupón
  const coupon = await prisma.discountCoupon.create({
    data: {
      companyId: params.companyId,
      codigo: params.codigo.toUpperCase(),
      tipo: params.tipo,
      valor: params.valor,
      descripcion: params.descripcion,
      usosMaximos: params.usosMaximos,
      usosActuales: 0,
      usosPorUsuario: params.usosPorUsuario || 1,
      montoMinimo: params.montoMinimo,
      fechaInicio: params.fechaInicio,
      fechaExpiracion: params.fechaExpiracion,
      aplicaATodos: params.aplicaATodos ?? true,
      unidadesPermitidas: params.unidadesPermitidas || [],
      planesPermitidos: params.planesPermitidos || [],
      estado: 'activo',
      activo: true,
      creadoPor: params.creadoPor,
    },
  });

  return coupon;
}

/**
 * Valida si un cupón puede ser usado
 */
export async function validateCoupon(params: ValidateCouponParams) {
  const coupon = await prisma.discountCoupon.findUnique({
    where: {
      companyId_codigo: {
        companyId: params.companyId,
        codigo: params.codigo.toUpperCase(),
      },
    },
    include: {
      usos: {
        where: {
          OR: [
            { userId: params.userId },
            { tenantId: params.tenantId },
          ],
        },
      },
    },
  });

  if (!coupon) {
    return { valid: false, error: 'Cupón no encontrado' };
  }

  if (!coupon.activo || coupon.estado !== 'activo') {
    return { valid: false, error: 'Cupón no activo' };
  }

  const now = new Date();
  if (now < coupon.fechaInicio) {
    return { valid: false, error: 'El cupón aún no está disponible' };
  }

  if (now > coupon.fechaExpiracion) {
    // Actualizar estado a expirado
    await prisma.discountCoupon.update({
      where: { id: coupon.id },
      data: { estado: 'expirado' },
    });
    return { valid: false, error: 'El cupón ha expirado' };
  }

  if (coupon.usosMaximos && coupon.usosActuales >= coupon.usosMaximos) {
    await prisma.discountCoupon.update({
      where: { id: coupon.id },
      data: { estado: 'agotado' },
    });
    return { valid: false, error: 'El cupón ha alcanzado su límite de usos' };
  }

  // Verificar usos por usuario
  if (params.userId || params.tenantId) {
    const userUses = coupon.usos.length;
    if (userUses >= coupon.usosPorUsuario) {
      return { valid: false, error: 'Has alcanzado el límite de usos para este cupón' };
    }
  }

  // Verificar monto mínimo
  if (coupon.montoMinimo && params.montoCompra < coupon.montoMinimo) {
    return {
      valid: false,
      error: `El monto mínimo de compra es ${coupon.montoMinimo}€`,
    };
  }

  // Calcular descuento
  let montoDescuento = 0;
  if (coupon.tipo === 'PERCENTAGE') {
    montoDescuento = (params.montoCompra * coupon.valor) / 100;
  } else {
    montoDescuento = coupon.valor;
  }

  // El descuento no puede ser mayor que el monto original
  if (montoDescuento > params.montoCompra) {
    montoDescuento = params.montoCompra;
  }

  const montoFinal = params.montoCompra - montoDescuento;

  return {
    valid: true,
    coupon,
    montoDescuento,
    montoFinal,
  };
}

/**
 * Aplica un cupón y registra su uso
 */
export async function applyCoupon(params: ApplyCouponParams) {
  const coupon = await prisma.discountCoupon.findUnique({
    where: { id: params.couponId },
  });

  if (!coupon) {
    throw new Error('Cupón no encontrado');
  }

  // Calcular descuento
  let montoDescuento = 0;
  if (coupon.tipo === 'PERCENTAGE') {
    montoDescuento = (params.montoOriginal * coupon.valor) / 100;
  } else {
    montoDescuento = coupon.valor;
  }

  if (montoDescuento > params.montoOriginal) {
    montoDescuento = params.montoOriginal;
  }

  const montoFinal = params.montoOriginal - montoDescuento;

  // Registrar uso
  const usage = await prisma.couponUsage.create({
    data: {
      couponId: params.couponId,
      userId: params.userId,
      tenantId: params.tenantId,
      contractId: params.contractId,
      paymentId: params.paymentId,
      montoOriginal: params.montoOriginal,
      montoDescuento,
      montoFinal,
    },
  });

  // Incrementar usos del cupón
  await prisma.discountCoupon.update({
    where: { id: params.couponId },
    data: {
      usosActuales: {
        increment: 1,
      },
    },
  });

  return {
    usage,
    montoDescuento,
    montoFinal,
  };
}

/**
 * Obtiene los cupones de una empresa
 */
export async function getCompanyCoupons(
  companyId: string,
  filters?: {
    estado?: CouponStatus;
    activo?: boolean;
  }
) {
  return await prisma.discountCoupon.findMany({
    where: {
      companyId,
      ...(filters?.estado && { estado: filters.estado }),
      ...(filters?.activo !== undefined && { activo: filters.activo }),
    },
    include: {
      _count: {
        select: { usos: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Obtiene estadísticas de un cupón
 */
export async function getCouponStats(couponId: string) {
  const coupon = await prisma.discountCoupon.findUnique({
    where: { id: couponId },
    include: {
      usos: true,
    },
  });

  if (!coupon) {
    throw new Error('Cupón no encontrado');
  }

  const totalDescuentoOtorgado = coupon.usos.reduce(
    (sum, uso) => sum + uso.montoDescuento,
    0
  );

  const usuariosUnicos = new Set(
    coupon.usos.map((uso) => uso.userId || uso.tenantId).filter(Boolean)
  ).size;

  return {
    coupon,
    stats: {
      usosActuales: coupon.usosActuales,
      usosMaximos: coupon.usosMaximos,
      porcentajeUso: coupon.usosMaximos
        ? (coupon.usosActuales / coupon.usosMaximos) * 100
        : 0,
      totalDescuentoOtorgado,
      usuariosUnicos,
      promedioDescuento: coupon.usosActuales > 0 ? totalDescuentoOtorgado / coupon.usosActuales : 0,
    },
  };
}

/**
 * Desactiva un cupón
 */
export async function deactivateCoupon(couponId: string) {
  return await prisma.discountCoupon.update({
    where: { id: couponId },
    data: {
      activo: false,
      estado: 'inactivo',
    },
  });
}

/**
 * Reactiva un cupón
 */
export async function reactivateCoupon(couponId: string) {
  const coupon = await prisma.discountCoupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) {
    throw new Error('Cupón no encontrado');
  }

  const now = new Date();
  if (now > coupon.fechaExpiracion) {
    throw new Error('No se puede reactivar un cupón expirado');
  }

  return await prisma.discountCoupon.update({
    where: { id: couponId },
    data: {
      activo: true,
      estado: 'activo',
    },
  });
}
