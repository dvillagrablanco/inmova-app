/**
 * Tests para lib/zucchetti-sqlserver.ts
 *
 * Tests unitarios de las funciones de configuración, mapeo y helpers.
 * No requiere conexión real al SQL Server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock del módulo mssql
vi.mock('mssql', () => ({
  default: {
    ConnectionPool: vi.fn(),
    NVarChar: 'nvarchar',
    Date: 'date',
  },
}));

// Mock de logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('zucchetti-sqlserver', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isZucchettiSqlConfigured', () => {
    it('retorna false si ZUCCHETTI_SERVER no está configurado', async () => {
      delete process.env.ZUCCHETTI_SERVER;
      const { isZucchettiSqlConfigured } = await import('@/lib/zucchetti-sqlserver');
      expect(isZucchettiSqlConfigured()).toBe(false);
    });

    it('retorna false si el servidor está pero no hay credenciales', async () => {
      process.env.ZUCCHETTI_SERVER = 'test.server.com';
      delete process.env.ZUCCHETTI_RSQ_USER;
      delete process.env.ZUCCHETTI_VID_USER;
      delete process.env.ZUCCHETTI_VIR_USER;
      const { isZucchettiSqlConfigured } = await import('@/lib/zucchetti-sqlserver');
      expect(isZucchettiSqlConfigured()).toBe(false);
    });

    it('retorna true si al menos una sociedad está configurada', async () => {
      process.env.ZUCCHETTI_SERVER = 'test.server.com';
      process.env.ZUCCHETTI_VID_USER = 'user';
      process.env.ZUCCHETTI_VID_PASS = 'pass';
      const { isZucchettiSqlConfigured } = await import('@/lib/zucchetti-sqlserver');
      expect(isZucchettiSqlConfigured()).toBe(true);
    });

    it('verifica sociedad específica', async () => {
      process.env.ZUCCHETTI_SERVER = 'test.server.com';
      process.env.ZUCCHETTI_VID_USER = 'user';
      process.env.ZUCCHETTI_VID_PASS = 'pass';
      const { isZucchettiSqlConfigured } = await import('@/lib/zucchetti-sqlserver');
      expect(isZucchettiSqlConfigured('VID')).toBe(true);
      expect(isZucchettiSqlConfigured('RSQ')).toBe(false);
      expect(isZucchettiSqlConfigured('VIR')).toBe(false);
    });
  });

  describe('getConfiguredCompanyKeys', () => {
    it('retorna solo las sociedades configuradas', async () => {
      process.env.ZUCCHETTI_SERVER = 'test.server.com';
      process.env.ZUCCHETTI_VID_USER = 'user_vid';
      process.env.ZUCCHETTI_VID_PASS = 'pass_vid';
      process.env.ZUCCHETTI_VIR_USER = 'user_vir';
      process.env.ZUCCHETTI_VIR_PASS = 'pass_vir';
      const { getConfiguredCompanyKeys } = await import('@/lib/zucchetti-sqlserver');
      const keys = getConfiguredCompanyKeys();
      expect(keys).toContain('VID');
      expect(keys).toContain('VIR');
      expect(keys).not.toContain('RSQ');
    });

    it('retorna vacío si nada está configurado', async () => {
      process.env.ZUCCHETTI_SERVER = 'test.server.com';
      delete process.env.ZUCCHETTI_RSQ_USER;
      delete process.env.ZUCCHETTI_VID_USER;
      delete process.env.ZUCCHETTI_VIR_USER;
      const { getConfiguredCompanyKeys } = await import('@/lib/zucchetti-sqlserver');
      expect(getConfiguredCompanyKeys()).toEqual([]);
    });
  });

  describe('mapCompanyKeyToInmovaId', () => {
    it('mapea VID a vidaro-inversiones', async () => {
      const { mapCompanyKeyToInmovaId } = await import('@/lib/zucchetti-sqlserver');
      expect(mapCompanyKeyToInmovaId('VID')).toBe('vidaro-inversiones');
    });

    it('mapea VIR a viroda-inversiones', async () => {
      const { mapCompanyKeyToInmovaId } = await import('@/lib/zucchetti-sqlserver');
      expect(mapCompanyKeyToInmovaId('VIR')).toBe('viroda-inversiones');
    });

    it('mapea RSQ a rovida-sl', async () => {
      const { mapCompanyKeyToInmovaId } = await import('@/lib/zucchetti-sqlserver');
      expect(mapCompanyKeyToInmovaId('RSQ')).toBe('rovida-sl');
    });
  });

  describe('mapInmovaIdToCompanyKey', () => {
    it('mapea vidaro-inversiones a VID', async () => {
      const { mapInmovaIdToCompanyKey } = await import('@/lib/zucchetti-sqlserver');
      expect(mapInmovaIdToCompanyKey('vidaro-inversiones')).toBe('VID');
    });

    it('retorna null para ID desconocido', async () => {
      const { mapInmovaIdToCompanyKey } = await import('@/lib/zucchetti-sqlserver');
      expect(mapInmovaIdToCompanyKey('unknown-company')).toBeNull();
    });
  });

  describe('getTableNames', () => {
    it('retorna nombres reales de tablas de Zucchetti', async () => {
      const { getTableNames } = await import('@/lib/zucchetti-sqlserver');
      const tables = getTableNames();
      expect(tables.apuntes).toBe('Apuntes');
      expect(tables.subcuentas).toBe('Subcuentas');
      expect(tables.ejercicios).toBe('Ejercicios');
      expect(tables.terceros).toBe('Terceros');
    });
  });

  describe('getZucchettiDatabase', () => {
    it('mapea RSQ a CONT_RSQ', async () => {
      const { getZucchettiDatabase } = await import('@/lib/zucchetti-sqlserver');
      expect(getZucchettiDatabase('RSQ')).toBe('CONT_RSQ');
    });

    it('mapea VID a CONT_VID', async () => {
      const { getZucchettiDatabase } = await import('@/lib/zucchetti-sqlserver');
      expect(getZucchettiDatabase('VID')).toBe('CONT_VID');
    });

    it('mapea VIR a DAT_VIR (diferente patrón)', async () => {
      const { getZucchettiDatabase } = await import('@/lib/zucchetti-sqlserver');
      expect(getZucchettiDatabase('VIR')).toBe('DAT_VIR');
    });
  });
});
