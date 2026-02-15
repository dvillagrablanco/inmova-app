import { describe, it, expect } from 'vitest';
import {
  paymentCreateSchema,
  contractCreateSchema,
  tenantCreateSchema,
  buildingCreateSchema,
  unitCreateSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('paymentCreateSchema', () => {
    it('valida un pago correcto', () => {
      const validPayment = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Renta mensual',
        monto: 1000,
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'pendiente',
      };

      const result = paymentCreateSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('rechaza monto negativo', () => {
      const invalidPayment = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Renta mensual',
        monto: -1000,
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'pendiente',
      };

      const result = paymentCreateSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('mayor a 0');
      }
    });

    it('rechaza monto cero', () => {
      const invalidPayment = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Renta mensual',
        monto: 0,
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'pendiente',
      };

      const result = paymentCreateSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });

    it('rechaza contractId inválido (no UUID)', () => {
      const invalidPayment = {
        contractId: 'invalid-id',
        concepto: 'Renta mensual',
        monto: 1000,
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'pendiente',
      };

      const result = paymentCreateSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });

    it('valida estado enum correctamente', () => {
      const validStates = ['pendiente', 'pagado', 'atrasado'];

      validStates.forEach((estado) => {
        const payment = {
          contractId: '123e4567-e89b-12d3-a456-426614174000',
          concepto: 'Renta mensual',
          monto: 1000,
          fechaVencimiento: '2025-01-15T00:00:00.000Z',
          estado,
        };

        const result = paymentCreateSchema.safeParse(payment);
        expect(result.success).toBe(true);
      });
    });

    it('rechaza estado inválido', () => {
      const invalidPayment = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Renta mensual',
        monto: 1000,
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'estado_invalido',
      };

      const result = paymentCreateSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });
  });

  describe.skip('contractCreateSchema', () => {
    it('valida un contrato correcto', () => {
      const validContract = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '223e4567-e89b-12d3-a456-426614174000',
        fechaInicio: '2025-01-01',
        fechaFin: '2026-01-01',
        rentaMensual: 1000,
        deposito: 2000,
        estado: 'activo',
        diaCobranza: 1,
      };

      const result = contractCreateSchema.safeParse(validContract);
      expect(result.success).toBe(true);
    });

    it('rechaza renta mensual negativa', () => {
      const invalidContract = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '223e4567-e89b-12d3-a456-426614174000',
        fechaInicio: '2025-01-01',
        fechaFin: '2026-01-01',
        rentaMensual: -1000,
        deposito: 2000,
        estado: 'activo',
        diaCobranza: 1,
      };

      const result = contractCreateSchema.safeParse(invalidContract);
      expect(result.success).toBe(false);
    });

    it('rechaza depósito negativo', () => {
      const invalidContract = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '223e4567-e89b-12d3-a456-426614174000',
        fechaInicio: '2025-01-01',
        fechaFin: '2026-01-01',
        rentaMensual: 1000,
        deposito: -2000,
        estado: 'activo',
        diaCobranza: 1,
      };

      const result = contractCreateSchema.safeParse(invalidContract);
      expect(result.success).toBe(false);
    });

    it('rechaza día de cobranza fuera de rango', () => {
      const invalidContract = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '223e4567-e89b-12d3-a456-426614174000',
        fechaInicio: '2025-01-01',
        fechaFin: '2026-01-01',
        rentaMensual: 1000,
        deposito: 2000,
        estado: 'activo',
        diaCobranza: 32, // Inválido
      };

      const result = contractCreateSchema.safeParse(invalidContract);
      expect(result.success).toBe(false);
    });
  });

  describe.skip('tenantCreateSchema', () => {
    it('valida un inquilino correcto', () => {
      const validTenant = {
        nombre: 'Juan',
        apellidos: 'Pérez García',
        email: 'juan@example.com',
        telefono: '+34123456789',
        dni: '12345678A',
        fechaNacimiento: '1990-01-01',
      };

      const result = tenantCreateSchema.safeParse(validTenant);
      expect(result.success).toBe(true);
    });

    it('rechaza email inválido', () => {
      const invalidTenant = {
        nombre: 'Juan',
        apellidos: 'Pérez García',
        email: 'email-invalido',
        telefono: '+34123456789',
        dni: '12345678A',
        fechaNacimiento: '1990-01-01',
      };

      const result = tenantCreateSchema.safeParse(invalidTenant);
      expect(result.success).toBe(false);
    });

    it('rechaza nombre muy corto', () => {
      const invalidTenant = {
        nombre: 'J',
        apellidos: 'Pérez García',
        email: 'juan@example.com',
        telefono: '+34123456789',
        dni: '12345678A',
        fechaNacimiento: '1990-01-01',
      };

      const result = tenantCreateSchema.safeParse(invalidTenant);
      expect(result.success).toBe(false);
    });
  });

  describe.skip('buildingCreateSchema', () => {
    it('valida un edificio correcto', () => {
      const validBuilding = {
        nombre: 'Edificio Central',
        direccion: 'Calle Mayor 123',
        tipo: 'residencial',
        numeroUnidades: 10,
        anoConstructor: 2020,
      };

      const result = buildingCreateSchema.safeParse(validBuilding);
      expect(result.success).toBe(true);
    });

    it('rechaza tipo inválido', () => {
      const invalidBuilding = {
        nombre: 'Edificio Central',
        direccion: 'Calle Mayor 123',
        tipo: 'tipo_invalido',
        numeroUnidades: 10,
        anoConstructor: 2020,
      };

      const result = buildingCreateSchema.safeParse(invalidBuilding);
      expect(result.success).toBe(false);
    });

    it('rechaza número de unidades negativo', () => {
      const invalidBuilding = {
        nombre: 'Edificio Central',
        direccion: 'Calle Mayor 123',
        tipo: 'residencial',
        numeroUnidades: -10,
        anoConstructor: 2020,
      };

      const result = buildingCreateSchema.safeParse(invalidBuilding);
      expect(result.success).toBe(false);
    });
  });

  describe.skip('unitCreateSchema', () => {
    it('valida una unidad correcta', () => {
      const validUnit = {
        buildingId: '123e4567-e89b-12d3-a456-426614174000',
        numero: '101',
        tipo: 'vivienda',
        estado: 'disponible',
        superficie: 80.5,
        habitaciones: 3,
        banos: 2,
        rentaMensual: 1000,
      };

      const result = unitCreateSchema.safeParse(validUnit);
      expect(result.success).toBe(true);
    });

    it('rechaza superficie negativa', () => {
      const invalidUnit = {
        buildingId: '123e4567-e89b-12d3-a456-426614174000',
        numero: '101',
        tipo: 'vivienda',
        estado: 'disponible',
        superficie: -80.5,
        habitaciones: 3,
        banos: 2,
        rentaMensual: 1000,
      };

      const result = unitCreateSchema.safeParse(invalidUnit);
      expect(result.success).toBe(false);
    });

    it('rechaza renta mensual negativa', () => {
      const invalidUnit = {
        buildingId: '123e4567-e89b-12d3-a456-426614174000',
        numero: '101',
        tipo: 'vivienda',
        estado: 'disponible',
        superficie: 80.5,
        habitaciones: 3,
        banos: 2,
        rentaMensual: -1000,
      };

      const result = unitCreateSchema.safeParse(invalidUnit);
      expect(result.success).toBe(false);
    });

    it('valida tipos de unidad correctos', () => {
      const validTypes = ['vivienda', 'local', 'oficina', 'garaje', 'trastero', 'otro'];

      validTypes.forEach((tipo) => {
        const unit = {
          buildingId: '123e4567-e89b-12d3-a456-426614174000',
          numero: '101',
          tipo,
          estado: 'disponible',
          superficie: 80.5,
          rentaMensual: 1000,
        };

        const result = unitCreateSchema.safeParse(unit);
        expect(result.success).toBe(true);
      });
    });
  });

  describe.skip('Edge Cases', () => {
    it('maneja valores null correctamente', () => {
      const paymentWithNulls = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Renta mensual',
        monto: 1000,
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'pendiente',
        metodoPago: null,
        fechaPago: null,
      };

      const result = paymentCreateSchema.safeParse(paymentWithNulls);
      expect(result.success).toBe(true);
    });

    it('transforma strings a números correctamente', () => {
      const paymentWithStringAmount = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Renta mensual',
        monto: '1000.50', // String instead of number
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'pendiente',
      };

      const result = paymentCreateSchema.safeParse(paymentWithStringAmount);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.monto).toBe('number');
        expect(result.data.monto).toBe(1000.5);
      }
    });

    it('rechaza strings no numéricos', () => {
      const paymentWithInvalidString = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        concepto: 'Renta mensual',
        monto: 'invalid-number',
        fechaVencimiento: '2025-01-15T00:00:00.000Z',
        estado: 'pendiente',
      };

      const result = paymentCreateSchema.safeParse(paymentWithInvalidString);
      expect(result.success).toBe(false);
    });
  });
});
