import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

describe('API: /auth/mfa/enable', () => {
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

  describe('POST /auth/mfa/enable', () => {
    it('debe crear recurso con datos válidos', async () => {
      const url = `${baseURL}/api/auth/mfa/enable`;
      
      const testData = {
        // TODO: Ajustar según el schema real
        name: 'Test Resource',
        description: 'Test description',
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toBeDefined();
      
    });
    
    it('debe retornar 400 con datos inválidos', async () => {
      const url = `${baseURL}/api/auth/mfa/enable`;
      
      const invalidData = {};
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });
      
      expect(response.status).toBe(400);
    });
    
    
  });
});
