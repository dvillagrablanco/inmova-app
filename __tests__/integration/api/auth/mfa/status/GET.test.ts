import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

describe.skip('API: /auth/mfa/status', () => {
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

  describe.skip('GET /auth/mfa/status', () => {
    it('debe retornar 200 con datos válidos', async () => {
      const url = `${baseURL}/api/auth/mfa/status`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
    });
    
    
    
    it('debe manejar parámetros de query', async () => {
      const url = `${baseURL}/api/auth/mfa/status?page=1&limit=10`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
    });
    
    
  });
});
