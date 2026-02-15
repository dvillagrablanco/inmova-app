/**
 * 👤 API Contract Tests - Usuarios
 * 
 * Verifican que las APIs de usuarios devuelven el formato esperado.
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe.skip('👤 API Contract Tests - Usuarios', () => {
  
  describe.skip('GET /api/admin/users', () => {
    it('devuelve 401 sin autenticación', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users`);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe.skip('GET /api/admin/companies (para selector de empresa)', () => {
    it('devuelve 401 sin autenticación', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/companies`);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});

describe.skip('📋 Verificar Rutas de Usuarios Existen', () => {
  
  it('API de usuarios responde (aunque sea 401)', async () => {
    const response = await fetch(`${BASE_URL}/api/admin/users`);
    
    // No debe ser 404 (la ruta existe)
    expect(response.status).not.toBe(404);
  });

  it('API de crear usuario acepta POST', async () => {
    const response = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    // No debe ser 404 ni 405 (Method Not Allowed)
    expect(response.status).not.toBe(404);
    // 401 (no auth) o 400 (bad request) son aceptables
    expect([400, 401, 403]).toContain(response.status);
  });
});
