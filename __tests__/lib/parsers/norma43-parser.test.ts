/**
 * Tests para lib/parsers/norma43-parser.ts
 * Parser de Norma 43 (AEB Cuaderno 43) — extractos bancarios españoles
 */

import { describe, it, expect } from 'vitest';
import { parseNorma43, isNorma43 } from '@/lib/parsers/norma43-parser';

// ============================================================================
// DATOS DE EJEMPLO
// ============================================================================

// Ejemplo de archivo Norma 43 típico (80 chars por línea)
// Registro 11: entidad 0128, oficina 0250, cuenta 0100083954, saldo 2=acreedor, fecha 250101, importe 00000012345678 (123456.78€)
// Registro 22: fecha op 250115, fecha valor 250115, concepto 02, propio 001, haber(2), importe 00000000150000 (1500.00€)
// Registro 23: complementario con texto
// Registro 22: otra operación, debe(1), importe 00000000050000 (500.00€)
// Registro 33: final de cuenta
// Registro 88: final de archivo

const SAMPLE_N43 = [
  '110128025001000839540225010100000123456778978                                   ',
  '220128025001000839542501152501150200102000000001500001234567890112345REFERENCIA1',
  '2302PAGO ALQUILER LOCAL BARQUILLO 30      INQUILINO EMPRESA SL             ',
  '2301CONCEPTO ADICIONAL DEL MOVIMIENTO     SEGUNDA LINEA INFO               ',
  '220128025001000839542501202501200300201000000000500000987654321015432REFERENCIA2',
  '2302GASTO COMUNIDAD ESPRONCEDA 32         COMUNIDAD PROPIETARIOS           ',
  '33012802500100083954000020000000005000000001000000001500000200000124956780      ',
  '8800000000000000000000000000000000000000000000000000000000000000000000000000000000',
].join('\n');

// Archivo con múltiples cuentas
const MULTI_ACCOUNT_N43 = [
  '110128025001000839540225010100000001234567978                                   ',
  '220128025001000839542501152501150200102000000001000000000000000000000000000000000',
  '33012802500100083954000010000000000000000001000000001000000200000001234567      ',
  '110049001502000011220225020100000000500000978                                   ',
  '220049001502000011222502052502050300301000000000025000000000000000000000000000000',
  '33004900150200001122000010000000002500000000000000000000000200000000475000      ',
  '8800000000000000000000000000000000000000000000000000000000000000000000000000000000',
].join('\n');

// ============================================================================
// TESTS
// ============================================================================

describe('norma43-parser', () => {
  describe('parseNorma43', () => {
    it('parsea un extracto básico con 2 movimientos', () => {
      const result = parseNorma43(SAMPLE_N43);

      expect(result.success).toBe(true);
      expect(result.statements).toHaveLength(1);
      expect(result.totalMovements).toBe(2);
      expect(result.errors).toHaveLength(0);

      const stmt = result.statements[0];
      expect(stmt.bankCode).toBe('0128');
      expect(stmt.branchCode).toBe('0250');
      expect(stmt.accountNumber).toBe('0100083954');
      expect(stmt.fullAccount).toBe('012802500100083954');
      expect(stmt.currency).toBe('EUR');
    });

    it('parsea saldo inicial correctamente', () => {
      const result = parseNorma43(SAMPLE_N43);
      const stmt = result.statements[0];

      // Saldo acreedor (signo 2) = positivo: 00000123456778 / 100 = 1234567.78
      expect(stmt.openingBalance).toBe(1234567.78);
      expect(stmt.openingBalanceSign).toBe(2);
    });

    it('parsea movimientos con importes correctos', () => {
      const result = parseNorma43(SAMPLE_N43);
      const movs = result.statements[0].movements;

      // Primer movimiento: haber (crédito) = +1500.00
      expect(movs[0].creditDebit).toBe('CRDT');
      expect(movs[0].amount).toBe(1500);
      expect(movs[0].absoluteAmount).toBe(1500);

      // Segundo movimiento: debe (débito) = -500.00
      expect(movs[1].creditDebit).toBe('DBIT');
      expect(movs[1].amount).toBe(-500);
      expect(movs[1].absoluteAmount).toBe(500);
    });

    it('parsea fechas correctamente', () => {
      const result = parseNorma43(SAMPLE_N43);
      const stmt = result.statements[0];

      expect(stmt.startDate).toBe('2025-01-01');
      expect(stmt.movements[0].date).toBe('2025-01-15');
      expect(stmt.movements[0].valueDate).toBe('2025-01-15');
      expect(stmt.movements[1].date).toBe('2025-01-20');
    });

    it('parsea conceptos comunes y propios', () => {
      const result = parseNorma43(SAMPLE_N43);
      const movs = result.statements[0].movements;

      expect(movs[0].commonConcept).toBe('02');
      expect(movs[0].ownConcept).toBe('001');
      expect(movs[1].commonConcept).toBe('03');
      expect(movs[1].ownConcept).toBe('002');
    });

    it('combina registros 23 en la descripción', () => {
      const result = parseNorma43(SAMPLE_N43);
      const movs = result.statements[0].movements;

      // Primer movimiento tiene 2 registros 23
      expect(movs[0].complementaryInfo).toHaveLength(2);
      expect(movs[0].description).toContain('PAGO ALQUILER LOCAL BARQUILLO 30');
      expect(movs[0].description).toContain('INQUILINO EMPRESA SL');
      expect(movs[0].description).toContain('CONCEPTO ADICIONAL');
    });

    it('parsea referencia y número de documento', () => {
      const result = parseNorma43(SAMPLE_N43);
      const movs = result.statements[0].movements;

      expect(movs[0].documentNumber).toBe('12345678901');
      expect(movs[0].reference1).toBe('12345');
      expect(movs[0].reference2).toBe('REFERENCIA1');
    });

    it('parsea saldo final y totales del registro 33', () => {
      const result = parseNorma43(SAMPLE_N43);
      const stmt = result.statements[0];

      expect(stmt.debitCount).toBe(2);
      expect(stmt.totalDebits).toBe(500);
      expect(stmt.creditCount).toBe(1);
      expect(stmt.totalCredits).toBe(1500);
      expect(stmt.closingBalance).toBe(1249567.80);
      expect(stmt.closingBalanceSign).toBe(2);
    });

    it('parsea múltiples cuentas en un solo archivo', () => {
      const result = parseNorma43(MULTI_ACCOUNT_N43);

      expect(result.success).toBe(true);
      expect(result.statements).toHaveLength(2);
      expect(result.totalMovements).toBe(2);

      // Primera cuenta
      expect(result.statements[0].bankCode).toBe('0128');
      expect(result.statements[0].movements).toHaveLength(1);

      // Segunda cuenta (diferente banco/oficina)
      expect(result.statements[1].bankCode).toBe('0049');
      expect(result.statements[1].branchCode).toBe('0015');
      expect(result.statements[1].movements).toHaveLength(1);
    });

    it('maneja archivo vacío', () => {
      const result = parseNorma43('');

      expect(result.success).toBe(true);
      expect(result.statements).toHaveLength(0);
      expect(result.totalMovements).toBe(0);
    });

    it('maneja líneas Windows (CRLF)', () => {
      const crlf = SAMPLE_N43.replace(/\n/g, '\r\n');
      const result = parseNorma43(crlf);

      expect(result.success).toBe(true);
      expect(result.totalMovements).toBe(2);
    });

    it('maneja líneas más cortas de 80 caracteres', () => {
      const short = [
        '1101280250010008395402250101000000123456780000',
        '2201280250010008395425011525011502001020000000001500001234567890112345REF',
        '33012802500100083954000020000000005000000001000000000150000020000001249567800',
        '88',
      ].join('\n');

      const result = parseNorma43(short);
      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].movements).toHaveLength(1);
    });
  });

  describe('isNorma43', () => {
    it('detecta formato Norma 43', () => {
      expect(isNorma43(SAMPLE_N43)).toBe(true);
    });

    it('rechaza contenido XML', () => {
      expect(isNorma43('<?xml version="1.0"?>\n<Document>')).toBe(false);
    });

    it('rechaza contenido CSV', () => {
      expect(isNorma43('Fecha,Concepto,Importe\n2025-01-15,Pago,1500')).toBe(false);
    });

    it('rechaza texto vacío', () => {
      expect(isNorma43('')).toBe(false);
    });

    it('rechaza texto corto', () => {
      expect(isNorma43('hola')).toBe(false);
    });
  });
});
