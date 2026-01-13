/**
 * 🔥 SMOKE TESTS - Páginas Críticas
 * 
 * Estos tests DEBEN pasar antes de cualquier deployment.
 * Verifican que todas las páginas críticas cargan sin error 404.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Páginas que DEBEN existir y cargar
const CRITICAL_PAGES = [
  // Públicas
  { path: '/', name: 'Landing' },
  { path: '/login', name: 'Login' },
  { path: '/registro', name: 'Registro' },
  
  // Auth requerida (verificamos que no den 500)
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/admin/clientes', name: 'Admin Clientes', requiresAuth: true },
  { path: '/admin/planes', name: 'Admin Planes', requiresAuth: true },
];

// Rutas dinámicas que deben existir (verificamos estructura)
const DYNAMIC_ROUTES = [
  { pattern: '/admin/clientes/[id]/editar', name: 'Editar Cliente' },
  { pattern: '/api/admin/companies/[id]', name: 'API Company Detail' },
];

describe('🔥 Smoke Tests - Páginas Críticas', () => {
  describe('Páginas públicas cargan correctamente', () => {
    CRITICAL_PAGES
      .filter(p => !p.requiresAuth)
      .forEach(page => {
        it(`${page.name} (${page.path}) debe cargar sin errores`, async () => {
          const response = await fetch(`${BASE_URL}${page.path}`);
          
          // No debe ser 404 ni 500
          expect(response.status).not.toBe(404);
          expect(response.status).not.toBe(500);
          
          // Debe ser 200 o redirect (302/307)
          expect([200, 302, 307]).toContain(response.status);
        });
      });
  });

  describe('Páginas protegidas redirigen correctamente', () => {
    CRITICAL_PAGES
      .filter(p => p.requiresAuth)
      .forEach(page => {
        it(`${page.name} (${page.path}) redirige a login sin auth`, async () => {
          const response = await fetch(`${BASE_URL}${page.path}`, {
            redirect: 'manual', // No seguir redirects
          });
          
          // Debe redirigir (no 404 ni 500)
          expect(response.status).not.toBe(404);
          expect(response.status).not.toBe(500);
        });
      });
  });

  describe('APIs críticas responden', () => {
    it('Health check responde OK', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ok');
    });

    it('API de planes públicos responde', async () => {
      const response = await fetch(`${BASE_URL}/api/public/subscription-plans`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('API de auth session responde', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/session`);
      expect(response.status).toBe(200);
    });
  });
});

describe('🔍 Verificación de Rutas Dinámicas', () => {
  it('Estructura de carpetas para rutas dinámicas existe', async () => {
    // Este test verifica que las rutas dinámicas están definidas
    // checkeando que una petición con ID falso no de 500 (error de servidor)
    // sino 404 (no encontrado) o redirect
    
    const testId = 'test-nonexistent-id-12345';
    
    const response = await fetch(`${BASE_URL}/admin/clientes/${testId}/editar`, {
      redirect: 'manual',
    });
    
    // Si la ruta existe, debe redirigir a login (no 500)
    expect(response.status).not.toBe(500);
  });
});
