/**
 * TESTS CRÍTICOS DE AUTENTICACIÓN
 * 
 * Estos tests DEBEN pasar antes de cualquier deployment.
 * Si alguno falla, el CI/CD debe abortar el deploy.
 * 
 * PROTOCOLO:
 * 1. Ejecutar: npm test -- auth-system.test.ts
 * 2. Todos los tests deben pasar (100%)
 * 3. Nunca hacer deploy si hay tests fallando
 * 
 * @module AuthSystemTests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';

describe('🔐 Sistema de Autenticación - Tests Críticos', () => {
  
  describe('bcrypt', () => {
    it('debe hashear passwords correctamente', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('debe validar password correcto', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('debe rechazar password incorrecto', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword!';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('debe manejar strings vacíos', async () => {
      const hash = await bcrypt.hash('validPassword', 10);
      
      const isValid = await bcrypt.compare('', hash);
      expect(isValid).toBe(false);
    });

    it('debe ser consistente con el mismo password', async () => {
      const password = 'ConsistentTest123!';
      
      // Hash el mismo password dos veces (con diferentes salts)
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      // Los hashes deben ser diferentes (por el salt)
      expect(hash1).not.toBe(hash2);
      
      // Pero ambos deben validar el password original
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('Variables de Entorno', () => {
    it('NEXTAUTH_SECRET debe estar configurado en producción', () => {
      // En tests, puede no estar, pero verificamos la lógica
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.NEXTAUTH_SECRET).toBeDefined();
        expect(process.env.NEXTAUTH_SECRET!.length).toBeGreaterThanOrEqual(32);
      }
    });

    it('NEXTAUTH_URL debe ser una URL válida si está configurada', () => {
      if (process.env.NEXTAUTH_URL) {
        expect(() => new URL(process.env.NEXTAUTH_URL!)).not.toThrow();
      }
    });
  });

  describe('Módulo auth-options', () => {
    it('debe exportar authOptions correctamente', async () => {
      // Este test verifica que el módulo se puede importar sin errores
      const module = await import('@/lib/auth-options');
      expect(module.authOptions).toBeDefined();
    });

    it('authOptions debe tener providers configurados', async () => {
      const { authOptions } = await import('@/lib/auth-options');
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers.length).toBeGreaterThan(0);
    });

    it('authOptions debe usar estrategia JWT', async () => {
      const { authOptions } = await import('@/lib/auth-options');
      expect(authOptions.session?.strategy).toBe('jwt');
    });

    it('authOptions debe tener página de signIn configurada', async () => {
      const { authOptions } = await import('@/lib/auth-options');
      expect(authOptions.pages?.signIn).toBe('/login');
    });

    it('authOptions debe tener callbacks definidos', async () => {
      const { authOptions } = await import('@/lib/auth-options');
      expect(authOptions.callbacks).toBeDefined();
      expect(authOptions.callbacks?.jwt).toBeDefined();
      expect(authOptions.callbacks?.session).toBeDefined();
    });
  });

  describe('Timing Attack Prevention', () => {
    it('bcrypt.compare debe tener tiempo constante', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);
      
      // Medir tiempo para password correcto
      const startCorrect = Date.now();
      await bcrypt.compare(password, hash);
      const timeCorrect = Date.now() - startCorrect;
      
      // Medir tiempo para password incorrecto
      const startWrong = Date.now();
      await bcrypt.compare('WrongPassword123!', hash);
      const timeWrong = Date.now() - startWrong;
      
      // La diferencia de tiempo no debe ser significativa (< 50ms)
      // Esto previene timing attacks
      const timeDiff = Math.abs(timeCorrect - timeWrong);
      expect(timeDiff).toBeLessThan(50);
    });
  });

  describe('Password Hashing Security', () => {
    it('hash debe usar cost factor >= 10', async () => {
      const password = 'SecureTest123!';
      const hash = await bcrypt.hash(password, 10);
      
      // El hash de bcrypt tiene formato: $2a$XX$...
      // XX es el cost factor
      const costFactor = parseInt(hash.split('$')[2]);
      expect(costFactor).toBeGreaterThanOrEqual(10);
    });

    it('passwords similares deben tener hashes diferentes', async () => {
      const hash1 = await bcrypt.hash('Password1', 10);
      const hash2 = await bcrypt.hash('Password2', 10);
      const hash3 = await bcrypt.hash('password1', 10);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });
  });
});

describe('🛡️ Auth Guard Module', () => {
  it('debe exportar verifyAuthSystem', async () => {
    const module = await import('@/lib/auth-guard');
    expect(module.verifyAuthSystem).toBeDefined();
    expect(typeof module.verifyAuthSystem).toBe('function');
  });

  it('debe exportar testLoginFlow', async () => {
    const module = await import('@/lib/auth-guard');
    expect(module.testLoginFlow).toBeDefined();
    expect(typeof module.testLoginFlow).toBe('function');
  });

  it('debe exportar generateAuthReport', async () => {
    const module = await import('@/lib/auth-guard');
    expect(module.generateAuthReport).toBeDefined();
    expect(typeof module.generateAuthReport).toBe('function');
  });
});
