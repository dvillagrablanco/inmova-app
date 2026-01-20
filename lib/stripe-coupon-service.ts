/**
 * Servicio de Sincronización de Cupones con Stripe
 * 
 * Según directrices cursorrules:
 * - Los cupones deben existir tanto en BD como en Stripe
 * - La sincronización es bidireccional
 * - Se valida en Stripe antes de aplicar descuento
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
// Singleton de Stripe (lazy initialization)
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn('[Stripe Coupon] STRIPE_SECRET_KEY no configurada');
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  return stripeInstance;
}

export interface CouponData {
  codigo: string;
  tipo: 'PERCENTAGE' | 'FIXED';
  valor: number;
  descripcion?: string;
  duracion: 'once' | 'repeating' | 'forever';
  duracionMeses?: number;
  usosMaximos?: number;
  fechaExpiracion: Date;
  planesPermitidos?: string[];
}

/**
 * Crea un cupón en Stripe y retorna los IDs
 */
export async function createStripeCoupon(data: CouponData): Promise<{
  stripeCouponId: string | null;
  stripePromotionCodeId: string | null;
  error?: string;
}> {
  const stripe = getStripe();
  if (!stripe) {
    return { stripeCouponId: null, stripePromotionCodeId: null, error: 'Stripe no configurado' };
  }

  try {
    // 1. Verificar si ya existe
    try {
      const existing = await stripe.coupons.retrieve(data.codigo.toLowerCase());
      if (existing) {
        // Buscar promotion code existente
        const promoCodes = await stripe.promotionCodes.list({
          coupon: existing.id,
          limit: 10,
        });
        const promoCode = promoCodes.data.find(p => p.code === data.codigo);

        return {
          stripeCouponId: existing.id,
          stripePromotionCodeId: promoCode?.id || null,
        };
      }
    } catch {
      // No existe, continuar con creación
    }

    // 2. Crear cupón en Stripe
    const stripeCoupon = await stripe.coupons.create({
      id: data.codigo.toLowerCase(),
      name: data.codigo,
      percent_off: data.tipo === 'PERCENTAGE' ? data.valor : undefined,
      amount_off: data.tipo === 'FIXED' ? Math.round(data.valor * 100) : undefined,
      currency: data.tipo === 'FIXED' ? 'eur' : undefined,
      duration: data.duracion,
      duration_in_months: data.duracion === 'repeating' ? data.duracionMeses : undefined,
      max_redemptions: data.usosMaximos,
      redeem_by: Math.floor(data.fechaExpiracion.getTime() / 1000),
      metadata: {
        descripcion: data.descripcion?.substring(0, 500) || '',
        planes_permitidos: data.planesPermitidos?.join(',') || '',
        source: 'inmova_app',
      },
    });

    // 3. Crear código promocional
    const promoCode = await stripe.promotionCodes.create({
      coupon: stripeCoupon.id,
      code: data.codigo,
      max_redemptions: data.usosMaximos,
      expires_at: data.fechaExpiracion
        ? Math.floor(data.fechaExpiracion.getTime() / 1000)
        : undefined,
      metadata: {
        descripcion: data.descripcion?.substring(0, 500) || '',
      },
    });

    return {
      stripeCouponId: stripeCoupon.id,
      stripePromotionCodeId: promoCode.id,
    };
  } catch (error: any) {
    logger.error('[Stripe Coupon] Error creando cupón:', error.message);
    return {
      stripeCouponId: null,
      stripePromotionCodeId: null,
      error: error.message,
    };
  }
}

/**
 * Valida un código de cupón con Stripe
 */
export async function validateStripeCoupon(codigo: string): Promise<{
  valid: boolean;
  coupon?: Stripe.Coupon;
  promotionCode?: Stripe.PromotionCode;
  error?: string;
}> {
  const stripe = getStripe();
  if (!stripe) {
    // Si Stripe no está configurado, validar solo en BD
    const dbCoupon = await prisma.discountCoupon.findFirst({
      where: {
        codigo,
        activo: true,
        estado: 'activo',
        fechaExpiracion: { gte: new Date() },
      },
    });

    return {
      valid: !!dbCoupon,
      error: dbCoupon ? undefined : 'Cupón no válido o expirado',
    };
  }

  try {
    // Buscar promotion code por código
    const promoCodes = await stripe.promotionCodes.list({
      code: codigo,
      limit: 1,
    });

    if (promoCodes.data.length === 0) {
      return { valid: false, error: 'Código promocional no encontrado en Stripe' };
    }

    const promoCode = promoCodes.data[0];

    // Verificar si está activo
    if (!promoCode.active) {
      return { valid: false, error: 'Código promocional inactivo' };
    }

    // Obtener datos del cupón
    const coupon = await stripe.coupons.retrieve(promoCode.coupon as string);

    // Verificar si el cupón está válido
    if (!coupon.valid) {
      return { valid: false, error: 'Cupón no válido o expirado' };
    }

    return {
      valid: true,
      coupon,
      promotionCode: promoCode,
    };
  } catch (error: any) {
    logger.error('[Stripe Coupon] Error validando:', error.message);
    return { valid: false, error: error.message };
  }
}

/**
 * Sincroniza un cupón de la BD con Stripe
 */
export async function syncCouponToStripe(couponId: string): Promise<{
  success: boolean;
  stripeCouponId?: string;
  stripePromotionCodeId?: string;
  error?: string;
}> {
  const dbCoupon = await prisma.discountCoupon.findUnique({
    where: { id: couponId },
  });

  if (!dbCoupon) {
    return { success: false, error: 'Cupón no encontrado en BD' };
  }

  const stripeResult = await createStripeCoupon({
    codigo: dbCoupon.codigo,
    tipo: dbCoupon.tipo as 'PERCENTAGE' | 'FIXED',
    valor: dbCoupon.valor,
    descripcion: dbCoupon.descripcion || undefined,
    duracion: 'once', // Por defecto
    usosMaximos: dbCoupon.usosMaximos || undefined,
    fechaExpiracion: dbCoupon.fechaExpiracion,
    planesPermitidos: dbCoupon.planesPermitidos,
  });

  if (stripeResult.error) {
    return { success: false, error: stripeResult.error };
  }

  // Actualizar BD con IDs de Stripe
  await prisma.discountCoupon.update({
    where: { id: couponId },
    data: {
      stripeCouponId: stripeResult.stripeCouponId,
      stripePromotionCodeId: stripeResult.stripePromotionCodeId,
    },
  });

  return {
    success: true,
    stripeCouponId: stripeResult.stripeCouponId || undefined,
    stripePromotionCodeId: stripeResult.stripePromotionCodeId || undefined,
  };
}

/**
 * Sincroniza todos los cupones activos con Stripe
 */
export async function syncAllCouponsToStripe(): Promise<{
  total: number;
  synced: number;
  errors: Array<{ codigo: string; error: string }>;
}> {
  const coupons = await prisma.discountCoupon.findMany({
    where: {
      activo: true,
      estado: 'activo',
      stripeCouponId: null, // Solo los que no tienen ID de Stripe
    },
  });

  const results = {
    total: coupons.length,
    synced: 0,
    errors: [] as Array<{ codigo: string; error: string }>,
  };

  for (const coupon of coupons) {
    const result = await syncCouponToStripe(coupon.id);
    if (result.success) {
      results.synced++;
    } else {
      results.errors.push({ codigo: coupon.codigo, error: result.error || 'Error desconocido' });
    }
  }

  return results;
}

/**
 * Elimina un cupón de Stripe
 */
export async function deleteStripeCoupon(stripeCouponId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe no configurado' };
  }

  try {
    await stripe.coupons.del(stripeCouponId);
    return { success: true };
  } catch (error: any) {
    logger.error('[Stripe Coupon] Error eliminando:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Aplica un cupón a una suscripción en Stripe
 */
export async function applyCouponToSubscription(
  subscriptionId: string,
  couponCode: string
): Promise<{
  success: boolean;
  subscription?: Stripe.Subscription;
  error?: string;
}> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe no configurado' };
  }

  try {
    // Validar cupón primero
    const validation = await validateStripeCoupon(couponCode);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Aplicar a suscripción
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      coupon: validation.coupon?.id,
    });

    // Registrar uso en BD
    const dbCoupon = await prisma.discountCoupon.findFirst({
      where: { codigo: couponCode },
    });

    if (dbCoupon) {
      await prisma.discountCoupon.update({
        where: { id: dbCoupon.id },
        data: {
          usosActuales: { increment: 1 },
        },
      });
    }

    return { success: true, subscription };
  } catch (error: any) {
    logger.error('[Stripe Coupon] Error aplicando:', error.message);
    return { success: false, error: error.message };
  }
}
