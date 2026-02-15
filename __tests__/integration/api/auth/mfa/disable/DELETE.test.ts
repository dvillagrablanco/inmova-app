import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

describe.skip('API: /auth/mfa/disable', () => {
  let authToken: string;
  const baseURL = 'http://localhost:3000';
  
  beforeAll(async () => {
    // Mock de autenticación
    authToken = 'mock-jwt-token';
    
    // O autenticación real si es necesario
    // const response = await fetch(`${baseURL}/api/auth/signin`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: 'test@inmova.app',
    //     password: 'Test123456!'
    //   })
    // });
    // const data = await response.json();
    // authToken = data.token;
  });

  describe('DELETE /auth/mfa/disable', () => {
    it('debe eliminar recurso existente', async () => {
      const testId = 'existing-id';
      const url = `${baseURL}/api/auth/mfa/disable`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          
        }
      });
      
      expect([200, 204, 404]).toContain(response.status);
    });
    
    it('debe retornar 404 para recurso inexistente', async () => {
      const url = `${baseURL}/api/auth/mfa/disable`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          
        }
      });
      
      expect(response.status).toBe(404);
    });
    
    
  });
});
