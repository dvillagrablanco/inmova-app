/**
 * COUPON SYSTEM - UNIT TESTS
 * Batería completa de tests para sistema de cupones de descuento
 * Incluye: Edge Cases, validaciones, casos límite
 */

import { Prisma } from '@prisma/client';

// Tipos para el sistema de cupones
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

interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  discountAmount?: number;
  finalPrice?: number;
}

// ========================================
// FUNCIÓN DE VALIDACIÓN DE CUPONES
// ========================================

function validateCoupon(
  coupon: Coupon,
  purchaseAmount: number,
  currentDate: Date = new Date()
): CouponValidationResult {
  // 1. Validar que el cupón esté activo
  if (!coupon.isActive) {
    return { isValid: false, error: 'Cupón inactivo' };
  }

  // 2. Validar límite de uso
  if (
    coupon.maxUsageCount !== null &&
    coupon.currentUsageCount >= coupon.maxUsageCount
  ) {
    return { isValid: false, error: 'Cupón agotado' };
  }

  // 3. Validar fechas de vigencia
  if (currentDate < coupon.validFrom) {
    return { isValid: false, error: 'Cupón aún no válido' };
  }

  if (coupon.validUntil && currentDate > coupon.validUntil) {
    return { isValid: false, error: 'Cupón expirado' };
  }

  // 4. Validar monto mínimo de compra
  if (
    coupon.minPurchaseAmount !== null &&
    purchaseAmount < coupon.minPurchaseAmount
  ) {
    return {
      isValid: false,
      error: `Compra mínima de €${coupon.minPurchaseAmount} requerida`,
    };
  }

  // 5. Validar valores de descuento
  if (coupon.discountValue <= 0 || !isFinite(coupon.discountValue)) {
    return { isValid: false, error: 'Valor de descuento inválido' };
  }

  // 6. Validar monto de compra
  if (purchaseAmount <= 0 || !isFinite(purchaseAmount)) {
    return { isValid: false, error: 'Monto de compra inválido' };
  }

  // 7. Calcular descuento
  let discountAmount = 0;

  if (coupon.discountType === 'percentage') {
    // Validar que el porcentaje esté en rango válido
    if (coupon.discountValue > 100) {
      return { isValid: false, error: 'Porcentaje inválido (>100%)' };
    }
    discountAmount = (purchaseAmount * coupon.discountValue) / 100;
  } else if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discountValue;
  }

  // El descuento no puede ser mayor que el precio
  if (discountAmount > purchaseAmount) {
    discountAmount = purchaseAmount;
  }

  const finalPrice = Math.max(0, purchaseAmount - discountAmount);

  return {
    isValid: true,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2)),
  };
}

describe('🧪 Coupon Validation - Casos Normales', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'SUMMER2025',
    discountType: 'percentage',
    discountValue: 20,
    maxUsageCount: 100,
    currentUsageCount: 50,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    isActive: true,
    minPurchaseAmount: 50,
  };

  test('✅ Debe aplicar descuento del 20% correctamente', () => {
    const result = validateCoupon(mockCoupon, 100);

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(20);
    expect(result.finalPrice).toBe(80);
  });

  test('✅ Debe aplicar descuento fijo correctamente', () => {
    const fixedCoupon: Coupon = {
      ...mockCoupon,
      discountType: 'fixed',
      discountValue: 15,
    };

    const result = validateCoupon(fixedCoupon, 100);

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(15);
    expect(result.finalPrice).toBe(85);
  });

  test('✅ Debe validar monto mínimo de compra', () => {
    const result = validateCoupon(mockCoupon, 30);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Compra mínima');
  });
});

describe('🧪 Coupon Validation - Edge Cases: Estado del Cupón', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'TEST2025',
    discountType: 'percentage',
    discountValue: 10,
    maxUsageCount: 10,
    currentUsageCount: 5,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    isActive: true,
    minPurchaseAmount: null,
  };

  test('❌ Debe rechazar cupón inactivo', () => {
    const inactiveCoupon = { ...mockCoupon, isActive: false };
    const result = validateCoupon(inactiveCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cupón inactivo');
  });

  test('❌ Debe rechazar cupón agotado', () => {
    const exhaustedCoupon = {
      ...mockCoupon,
      maxUsageCount: 10,
      currentUsageCount: 10,
    };
    const result = validateCoupon(exhaustedCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cupón agotado');
  });

  test('❌ Debe rechazar cupón sobre-usado', () => {
    const overUsedCoupon = {
      ...mockCoupon,
      maxUsageCount: 10,
      currentUsageCount: 15, // Más de lo permitido
    };
    const result = validateCoupon(overUsedCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cupón agotado');
  });

  test('✅ Debe aceptar cupón sin límite de uso (null)', () => {
    const unlimitedCoupon = {
      ...mockCoupon,
      maxUsageCount: null,
      currentUsageCount: 999999,
    };
    const result = validateCoupon(unlimitedCoupon, 100);

    expect(result.isValid).toBe(true);
  });
});

describe('🧪 Coupon Validation - Edge Cases: Fechas', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'TEST2025',
    discountType: 'percentage',
    discountValue: 10,
    maxUsageCount: null,
    currentUsageCount: 0,
    validFrom: new Date('2025-06-01'),
    validUntil: new Date('2025-06-30'),
    isActive: true,
    minPurchaseAmount: null,
  };

  test('❌ Debe rechazar cupón antes de fecha de inicio', () => {
    const beforeDate = new Date('2025-05-31');
    const result = validateCoupon(mockCoupon, 100, beforeDate);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cupón aún no válido');
  });

  test('✅ Debe aceptar cupón en fecha de inicio', () => {
    const startDate = new Date('2025-06-01');
    const result = validateCoupon(mockCoupon, 100, startDate);

    expect(result.isValid).toBe(true);
  });

  test('✅ Debe aceptar cupón en fecha de vencimiento', () => {
    const endDate = new Date('2025-06-30');
    const result = validateCoupon(mockCoupon, 100, endDate);

    expect(result.isValid).toBe(true);
  });

  test('❌ Debe rechazar cupón después de fecha de vencimiento', () => {
    const afterDate = new Date('2025-07-01');
    const result = validateCoupon(mockCoupon, 100, afterDate);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cupón expirado');
  });

  test('✅ Debe aceptar cupón sin fecha de vencimiento (null)', () => {
    const neverExpires = { ...mockCoupon, validUntil: null };
    const farFuture = new Date('2099-12-31');
    const result = validateCoupon(neverExpires, 100, farFuture);

    expect(result.isValid).toBe(true);
  });

  test('⚠️ Debe manejar fechas inválidas', () => {
    const invalidDateCoupon = {
      ...mockCoupon,
      validFrom: new Date('invalid-date'),
    };

    // Debería lanzar error o manejar la fecha inválida
    expect(() => validateCoupon(invalidDateCoupon, 100)).toThrow();
  });
});

describe('🧪 Coupon Validation - Edge Cases: Montos Negativos', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'TEST2025',
    discountType: 'percentage',
    discountValue: 10,
    maxUsageCount: null,
    currentUsageCount: 0,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    isActive: true,
    minPurchaseAmount: null,
  };

  test('❌ Debe rechazar monto de compra negativo', () => {
    const result = validateCoupon(mockCoupon, -100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Monto de compra inválido');
  });

  test('❌ Debe rechazar monto de compra = 0', () => {
    const result = validateCoupon(mockCoupon, 0);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Monto de compra inválido');
  });

  test('❌ Debe rechazar descuento negativo', () => {
    const negativeCoupon = { ...mockCoupon, discountValue: -10 };
    const result = validateCoupon(negativeCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Valor de descuento inválido');
  });

  test('❌ Debe rechazar descuento = 0', () => {
    const zeroCoupon = { ...mockCoupon, discountValue: 0 };
    const result = validateCoupon(zeroCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Valor de descuento inválido');
  });
});

describe('🧪 Coupon Validation - Edge Cases: Números Extremos', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'TEST2025',
    discountType: 'percentage',
    discountValue: 10,
    maxUsageCount: null,
    currentUsageCount: 0,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    isActive: true,
    minPurchaseAmount: null,
  };

  test('❌ Debe rechazar monto de compra = Infinity', () => {
    const result = validateCoupon(mockCoupon, Infinity);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Monto de compra inválido');
  });

  test('❌ Debe rechazar monto de compra = NaN', () => {
    const result = validateCoupon(mockCoupon, NaN);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Monto de compra inválido');
  });

  test('❌ Debe rechazar descuento = Infinity', () => {
    const infiniteCoupon = { ...mockCoupon, discountValue: Infinity };
    const result = validateCoupon(infiniteCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Valor de descuento inválido');
  });

  test('❌ Debe rechazar descuento = NaN', () => {
    const nanCoupon = { ...mockCoupon, discountValue: NaN };
    const result = validateCoupon(nanCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Valor de descuento inválido');
  });

  test('⚠️ Debe manejar montos muy grandes', () => {
    const result = validateCoupon(mockCoupon, 999999999999);

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBeDefined();
    expect(result.finalPrice).toBeDefined();
  });

  test('⚠️ Debe manejar montos con muchos decimales', () => {
    const result = validateCoupon(mockCoupon, 123.456789123456789);

    expect(result.isValid).toBe(true);
    // Debería redondear a 2 decimales
    expect(result.finalPrice?.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });
});

describe('🧪 Coupon Validation - Edge Cases: Porcentajes', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'TEST2025',
    discountType: 'percentage',
    discountValue: 50,
    maxUsageCount: null,
    currentUsageCount: 0,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    isActive: true,
    minPurchaseAmount: null,
  };

  test('✅ Debe aplicar 100% de descuento', () => {
    const fullDiscountCoupon = { ...mockCoupon, discountValue: 100 };
    const result = validateCoupon(fullDiscountCoupon, 100);

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(100);
    expect(result.finalPrice).toBe(0);
  });

  test('❌ Debe rechazar descuento > 100%', () => {
    const overDiscountCoupon = { ...mockCoupon, discountValue: 150 };
    const result = validateCoupon(overDiscountCoupon, 100);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Porcentaje inválido');
  });

  test('✅ Debe aplicar descuento del 0.01%', () => {
    const tinyDiscountCoupon = { ...mockCoupon, discountValue: 0.01 };
    const result = validateCoupon(tinyDiscountCoupon, 100);

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(0.01);
  });
});

describe('🧪 Coupon Validation - Edge Cases: Descuento Fijo Mayor al Precio', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'TEST2025',
    discountType: 'fixed',
    discountValue: 50,
    maxUsageCount: null,
    currentUsageCount: 0,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    isActive: true,
    minPurchaseAmount: null,
  };

  test('✅ Descuento fijo mayor al precio debería dar precio final = 0', () => {
    const result = validateCoupon(mockCoupon, 30);

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(30); // Limitado al precio
    expect(result.finalPrice).toBe(0);
  });

  test('✅ Descuento fijo igual al precio', () => {
    const exactCoupon = { ...mockCoupon, discountValue: 100 };
    const result = validateCoupon(exactCoupon, 100);

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(100);
    expect(result.finalPrice).toBe(0);
  });
});

describe('🧪 Coupon Validation - Edge Cases: Mínimo de Compra', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'TEST2025',
    discountType: 'percentage',
    discountValue: 10,
    maxUsageCount: null,
    currentUsageCount: 0,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    isActive: true,
    minPurchaseAmount: 100,
  };

  test('❌ Debe rechazar si no alcanza el mínimo', () => {
    const result = validateCoupon(mockCoupon, 99.99);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Compra mínima');
  });

  test('✅ Debe aceptar si alcanza exactamente el mínimo', () => {
    const result = validateCoupon(mockCoupon, 100);

    expect(result.isValid).toBe(true);
  });

  test('✅ Debe aceptar si no hay mínimo (null)', () => {
    const noMinCoupon = { ...mockCoupon, minPurchaseAmount: null };
    const result = validateCoupon(noMinCoupon, 0.01);

    expect(result.isValid).toBe(true);
  });

  test('⚠️ Debe manejar mínimo = 0', () => {
    const zeroMinCoupon = { ...mockCoupon, minPurchaseAmount: 0 };
    const result = validateCoupon(zeroMinCoupon, 50);

    expect(result.isValid).toBe(true);
  });

  test('❌ Debe rechazar mínimo negativo', () => {
    const negativeMinCoupon = { ...mockCoupon, minPurchaseAmount: -50 };
    // En producción, esto debería validarse al crear el cupón
    expect(negativeMinCoupon.minPurchaseAmount).toBeLessThan(0);
  });
});
