/**
 * Tests for SWIFT MT940 parser
 */
import { describe, it, expect } from 'vitest';
import {
  parseMT940,
  parseMT940File,
  type MT940Statement,
  type MT940Transaction,
} from '@/lib/parsers/swift-mt940-parser';

describe('swift-mt940-parser', () => {
  const sampleMT940 = `:20:REF20250101001
:25:ES9121000418450200051332/1234
:28C:1/1
:60F:C250101EUR1000,00
:61:2501020102C500,00NTRFPAYMENT REF
:86:Payment for invoice 123
Additional info line
:61:2501030103D200,00DDT
:86:Direct debit - utility
:62F:C250131EUR1300,00`;

  describe('parseMT940', () => {
    it('parses single statement with transactions', () => {
      const statements = parseMT940(sampleMT940);
      expect(statements).toHaveLength(1);

      const stmt = statements[0];
      expect(stmt.transactionReference).toBe('REF20250101001');
      expect(stmt.accountId).toBe('ES9121000418450200051332/1234');
      expect(stmt.statementNumber).toBe('1/1');
      expect(stmt.openingBalance).toBe(1000);
      expect(stmt.closingBalance).toBe(1300);
      expect(stmt.currency).toBe('EUR');
      expect(stmt.bankCode).toBe('1234');
      expect(stmt.transactions).toHaveLength(2);

      const tx1 = stmt.transactions[0];
      expect(tx1.date).toBe('2025-01-02');
      expect(tx1.entryDate).toBe('01-02');
      expect(tx1.debitCredit).toBe('C');
      expect(tx1.amount).toBe(500);
      expect(tx1.transactionType).toBe('NTRF');
      expect(tx1.reference).toContain('PAYMENT');
      expect(tx1.description).toContain('invoice');

      const tx2 = stmt.transactions[1];
      expect(tx2.debitCredit).toBe('D');
      expect(tx2.amount).toBe(200);
      expect(tx2.transactionType).toBe('DDT');
    });

    it('parses multi-statement file', () => {
      const multi = `${sampleMT940}
:20:REF002
:25:ES1234567890123456789012
:28C:2/1
:60F:D250201EUR500,00
:62F:D250228EUR400,00`;

      const statements = parseMT940(multi);
      expect(statements).toHaveLength(2);
      expect(statements[0].transactionReference).toBe('REF20250101001');
      expect(statements[1].transactionReference).toBe('REF002');
      expect(statements[1].openingBalance).toBe(-500);
      expect(statements[1].closingBalance).toBe(-400);
    });

    it('returns empty array for empty content', () => {
      expect(parseMT940('')).toHaveLength(0);
      expect(parseMT940('   \n  ')).toHaveLength(0);
    });

    it('handles malformed content gracefully', () => {
      const result = parseMT940(':20:only-ref\n:25:ES12');
      expect(result).toHaveLength(1);
      expect(result[0].transactionReference).toBe('only-ref');
      expect(result[0].transactions).toHaveLength(0);
    });

    it('parses European amount format (comma decimal)', () => {
      const content = `:20:X
:25:ES12
:60F:C250101EUR1234,56
:62F:C250101EUR1234,56`;
      const stmt = parseMT940(content)[0];
      expect(stmt.openingBalance).toBe(1234.56);
      expect(stmt.closingBalance).toBe(1234.56);
    });
  });

  describe('parseMT940File', () => {
    it('decodes buffer and parses', () => {
      const buffer = Buffer.from(sampleMT940, 'utf-8');
      const statements = parseMT940File(buffer);
      expect(statements).toHaveLength(1);
      expect(statements[0].accountId).toBe('ES9121000418450200051332/1234');
    });

    it('returns empty array for invalid buffer', () => {
      expect(parseMT940File(null as unknown as Buffer)).toHaveLength(0);
      expect(parseMT940File(undefined as unknown as Buffer)).toHaveLength(0);
    });
  });
});
