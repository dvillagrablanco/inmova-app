/**
 * 🔗 API Contract Tests
 * 
 * Verifican que las APIs devuelven el formato esperado por el frontend.
 * Previenen errores como "Cannot read properties of undefined".
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe.skip('🔗 API Contract Tests', () => {
  
  describe.skip('GET /api/public/subscription-plans', () => {
    it('devuelve un array de planes', async () => {
      const response = await fetch(`${BASE_URL}/api/public/subscription-plans`);
      const data = await response.json();
      
      // Debe ser un array
      expect(Array.isArray(data)).toBe(true);
    });

    it('cada plan tiene los campos requeridos', async () => {
      const response = await fetch(`${BASE_URL}/api/public/subscription-plans`);
      const plans = await response.json();
      
      if (plans.length > 0) {
        const plan = plans[0];
        
        // Campos obligatorios
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('nombre');
        expect(plan).toHaveProperty('precioMensual');
        expect(plan).toHaveProperty('tier');
        
        // Tipos correctos
        expect(typeof plan.id).toBe('string');
        expect(typeof plan.nombre).toBe('string');
        expect(typeof plan.precioMensual).toBe('number');
      }
    });

    it('no incluye planes internos (Owner)', async () => {
      const response = await fetch(`${BASE_URL}/api/public/subscription-plans`);
      const plans = await response.json();
      
      const ownerPlan = plans.find((p: any) => p.nombre === 'Owner');
      expect(ownerPlan).toBeUndefined();
    });
  });

  describe.skip('API Admin (requiere auth)', () => {
    it('GET /api/admin/companies devuelve 401 sin auth', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/companies`);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('GET /api/admin/subscription-plans devuelve 401 sin auth', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/subscription-plans`);
      expect(response.status).toBe(401);
    });
  });
});

describe.skip('📝 API Response Format Consistency', () => {
  
  it('APIs de error devuelven { error: string }', async () => {
    // Test con endpoint que requiere auth
    const response = await fetch(`${BASE_URL}/api/admin/companies`);
    const data = await response.json();
    
    if (response.status >= 400) {
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  });

  it('Health check devuelve formato correcto', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    expect(data).toHaveProperty('status');
    expect(['ok', 'error']).toContain(data.status);
  });
});

/**
 * IMPORTANTE: Estos contratos deben coincidir con lo que espera el frontend.
 * 
 * Si cambias el formato de una API, actualiza también:
 * 1. El hook correspondiente (lib/hooks/...)
 * 2. Los tipos TypeScript
 * 3. Este test
 */
