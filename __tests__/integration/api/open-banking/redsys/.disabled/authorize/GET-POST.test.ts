import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

describe.skip('API: /open-banking/redsys/.disabled/authorize', () => {
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

  describe('GET /open-banking/redsys/.disabled/authorize', () => {
    it('debe retornar 200 con datos válidos', async () => {
      const url = `${baseURL}/api/open-banking/redsys/.disabled/authorize`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });
    
    
    
    it('debe manejar parámetros de query', async () => {
      const url = `${baseURL}/api/open-banking/redsys/.disabled/authorize?page=1&limit=10`;
      
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

  describe('POST /open-banking/redsys/.disabled/authorize', () => {
    it('debe crear recurso con datos válidos', async () => {
      const url = `${baseURL}/api/open-banking/redsys/.disabled/authorize`;
      
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
      const url = `${baseURL}/api/open-banking/redsys/.disabled/authorize`;
      
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
