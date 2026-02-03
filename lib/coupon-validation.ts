/**
 * COUPON VALIDATION - Funciones de validación de cupones
 * Implementación simple para tests
 */

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUsageCount: number | null;
  currentUsageCount: number;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  minPurchaseAmount: number | null;
}

interface ValidationResult {
  isValid: boolean;
  discountAmount: number;
  finalPrice: number;
  error?: string;
}

/**
 * Valida un cupón y calcula el descuento
 */
export function validateCoupon(
  coupon: Coupon,
  purchaseAmount: number,
  now: Date = new Date()
): ValidationResult {
  // Validación: cupón activo
  if (!coupon.isActive) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: purchaseAmount,
      error: 'Cupón inactivo',
    };
  }

  // Validación: fecha de inicio
  const validFrom = new Date(coupon.validFrom);
  if (now < validFrom) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: purchaseAmount,
      error: 'Cupón aún no válido',
    };
  }

  // Validación: fecha de expiración
  if (coupon.validUntil) {
    const validUntil = new Date(coupon.validUntil);
    if (now > validUntil) {
      return {
        isValid: false,
        discountAmount: 0,
        finalPrice: purchaseAmount,
        error: 'Cupón expirado',
      };
    }
  }

  // Validación: usos máximos
  if (coupon.maxUsageCount !== null && coupon.currentUsageCount >= coupon.maxUsageCount) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: purchaseAmount,
      error: 'Cupón agotado',
    };
  }

  // Validación: monto mínimo de compra
  if (coupon.minPurchaseAmount !== null && purchaseAmount < coupon.minPurchaseAmount) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: purchaseAmount,
      error: `Compra mínima requerida: ${coupon.minPurchaseAmount}`,
    };
  }

  // Calcular descuento
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (purchaseAmount * coupon.discountValue) / 100;
  } else if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discountValue;
  }

  // No permitir que el descuento sea mayor al monto de compra
  if (discountAmount > purchaseAmount) {
    discountAmount = purchaseAmount;
  }

  const finalPrice = purchaseAmount - discountAmount;

  return {
    isValid: true,
    discountAmount,
    finalPrice,
  };
}
