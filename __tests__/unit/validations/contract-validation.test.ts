/**
 * CONTRACT VALIDATION - UNIT TESTS
 * Tests para validaciones de contratos de alquiler
 */

import { describe, test, expect } from 'vitest';

describe('📝 Contract Validation - Business Rules', () => {
  // Helper para validar fechas de contrato
  const validateContractDates = (startDate: Date, endDate: Date) => {
    if (startDate >= endDate) {
      return { valid: false, error: 'La fecha de inicio debe ser anterior a la de fin' };
    }

    const minDuration = 30; // días
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (duration < minDuration) {
      return { valid: false, error: `El contrato debe tener al menos ${minDuration} días` };
    }

    return { valid: true };
  };

  // Helper para validar monto de alquiler
  const validateRentAmount = (amount: number, propertyType: string) => {
    if (amount <= 0) {
      return { valid: false, error: 'El monto debe ser positivo' };
    }

    const minRent = propertyType === 'room' ? 200 : 400;
    const maxRent = propertyType === 'room' ? 2000 : 10000;

    if (amount < minRent) {
      return { valid: false, error: `El monto mínimo es €${minRent}` };
    }

    if (amount > maxRent) {
      return { valid: false, error: `El monto máximo es €${maxRent}` };
    }

    return { valid: true };
  };

  // Helper para validar depósito
  const validateDeposit = (deposit: number, rent: number) => {
    if (deposit < 0) {
      return { valid: false, error: 'El depósito no puede ser negativo' };
    }

    const maxDeposit = rent * 3; // Máximo 3 meses de renta

    if (deposit > maxDeposit) {
      return { valid: false, error: `El depósito máximo es €${maxDeposit} (3 meses de renta)` };
    }

    return { valid: true };
  };

  // ========================================
  // VALIDACIÓN DE FECHAS
  // ========================================

  test('✅ Debe aceptar fechas válidas de contrato', () => {
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2027-02-01'); // 1 año

    const result = validateContractDates(startDate, endDate);

    expect(result.valid).toBe(true);
  });

  test('❌ Debe rechazar fecha de fin anterior a fecha de inicio', () => {
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-01-01'); // Anterior

    const result = validateContractDates(startDate, endDate);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('debe ser anterior');
  });

  test('❌ Debe rechazar contrato con duración menor a 30 días', () => {
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-02-15'); // 14 días

    const result = validateContractDates(startDate, endDate);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('al menos 30 días');
  });

  test('✅ Debe aceptar contrato de exactamente 30 días', () => {
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-03-03'); // 30 días

    const result = validateContractDates(startDate, endDate);

    expect(result.valid).toBe(true);
  });

  test('⚠️ Debe manejar fechas iguales', () => {
    const date = new Date('2026-02-01');

    const result = validateContractDates(date, date);

    expect(result.valid).toBe(false);
  });

  // ========================================
  // VALIDACIÓN DE MONTOS
  // ========================================

  test('✅ Debe aceptar monto de alquiler válido para apartamento', () => {
    const result = validateRentAmount(1200, 'apartment');

    expect(result.valid).toBe(true);
  });

  test('✅ Debe aceptar monto de alquiler válido para habitación', () => {
    const result = validateRentAmount(450, 'room');

    expect(result.valid).toBe(true);
  });

  test('❌ Debe rechazar monto negativo', () => {
    const result = validateRentAmount(-500, 'apartment');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('positivo');
  });

  test('❌ Debe rechazar monto = 0', () => {
    const result = validateRentAmount(0, 'apartment');

    expect(result.valid).toBe(false);
  });

  test('❌ Debe rechazar monto menor al mínimo para apartamento', () => {
    const result = validateRentAmount(300, 'apartment');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('mínimo es €400');
  });

  test('❌ Debe rechazar monto menor al mínimo para habitación', () => {
    const result = validateRentAmount(150, 'room');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('mínimo es €200');
  });

  test('❌ Debe rechazar monto mayor al máximo para apartamento', () => {
    const result = validateRentAmount(15000, 'apartment');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('máximo es €10000');
  });

  test('❌ Debe rechazar monto mayor al máximo para habitación', () => {
    const result = validateRentAmount(2500, 'room');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('máximo es €2000');
  });

  test('✅ Debe aceptar monto en el límite mínimo', () => {
    const resultApartment = validateRentAmount(400, 'apartment');
    const resultRoom = validateRentAmount(200, 'room');

    expect(resultApartment.valid).toBe(true);
    expect(resultRoom.valid).toBe(true);
  });

  test('✅ Debe aceptar monto en el límite máximo', () => {
    const resultApartment = validateRentAmount(10000, 'apartment');
    const resultRoom = validateRentAmount(2000, 'room');

    expect(resultApartment.valid).toBe(true);
    expect(resultRoom.valid).toBe(true);
  });

  test('⚠️ Debe manejar decimales en el monto', () => {
    const result = validateRentAmount(1234.56, 'apartment');

    expect(result.valid).toBe(true);
  });

  test('⚠️ Debe manejar monto con muchos decimales', () => {
    const result = validateRentAmount(1234.56789, 'apartment');

    expect(result.valid).toBe(true);
  });

  // ========================================
  // VALIDACIÓN DE DEPÓSITO
  // ========================================

  test('✅ Debe aceptar depósito de 1 mes de renta', () => {
    const result = validateDeposit(1200, 1200);

    expect(result.valid).toBe(true);
  });

  test('✅ Debe aceptar depósito de 2 meses de renta', () => {
    const result = validateDeposit(2400, 1200);

    expect(result.valid).toBe(true);
  });

  test('✅ Debe aceptar depósito de 3 meses de renta (máximo)', () => {
    const result = validateDeposit(3600, 1200);

    expect(result.valid).toBe(true);
  });

  test('❌ Debe rechazar depósito mayor a 3 meses de renta', () => {
    const result = validateDeposit(4000, 1200);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('máximo es €3600');
  });

  test('✅ Debe aceptar depósito de 0 (sin depósito)', () => {
    const result = validateDeposit(0, 1200);

    expect(result.valid).toBe(true);
  });

  test('❌ Debe rechazar depósito negativo', () => {
    const result = validateDeposit(-500, 1200);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('no puede ser negativo');
  });

  // ========================================
  // REGLAS DE NEGOCIO COMPLEJAS
  // ========================================

  test('✅ Contrato anual estándar debe ser válido', () => {
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2027-03-01');
    const rent = 1200;
    const deposit = 2400;

    const datesValid = validateContractDates(startDate, endDate);
    const rentValid = validateRentAmount(rent, 'apartment');
    const depositValid = validateDeposit(deposit, rent);

    expect(datesValid.valid).toBe(true);
    expect(rentValid.valid).toBe(true);
    expect(depositValid.valid).toBe(true);
  });

  test('✅ Contrato temporal (6 meses) debe ser válido', () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-10-01'); // 6 meses

    const result = validateContractDates(startDate, endDate);

    expect(result.valid).toBe(true);
  });

  test('✅ Contrato de habitación debe ser válido', () => {
    const rent = 550;
    const deposit = 550;

    const rentValid = validateRentAmount(rent, 'room');
    const depositValid = validateDeposit(deposit, rent);

    expect(rentValid.valid).toBe(true);
    expect(depositValid.valid).toBe(true);
  });

  test('⚠️ Debe validar relación proporcional depósito/renta', () => {
    const rent = 1000;
    const deposits = [0, 1000, 2000, 3000];

    deposits.forEach((deposit) => {
      const result = validateDeposit(deposit, rent);
      expect(result.valid).toBe(true);
    });
  });

  test('⚠️ Debe rechazar depósito desproporcionado', () => {
    const rent = 500;
    const deposit = 5000; // 10 meses (excesivo)

    const result = validateDeposit(deposit, rent);

    expect(result.valid).toBe(false);
  });
});
