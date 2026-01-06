import { test, expect } from '@playwright/test';

/**
 * Test E2E para verificar que todas las páginas del vertical Media Estancia existen
 * y no retornan errores 404 o 500.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Páginas públicas (landing)
const PUBLIC_PAGES = [
  '/landing',
  '/landing/media-estancia',
];

// Páginas del dashboard (requieren autenticación)
const DASHBOARD_PAGES = [
  '/media-estancia',
  '/media-estancia/calendario',
  '/media-estancia/analytics',
  '/media-estancia/configuracion',
  '/media-estancia/scoring',
];

test.describe('Media Estancia - Landing Pages', () => {
  for (const page of PUBLIC_PAGES) {
    test(`Landing page ${page} loads without 404/500`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${page}`);
      
      // Verificar que no es 404 o 500
      expect(response.status()).not.toBe(404);
      expect(response.status()).not.toBe(500);
      
      // Verificar que es 200 o redirect (3xx)
      expect([200, 301, 302, 307, 308]).toContain(response.status());
    });
  }

  test('Landing Media Estancia has correct content', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing/media-estancia`);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Media Estancia');
    
    // Verificar secciones clave
    await expect(page.locator('text=Contratos LAU Art. 3.2')).toBeVisible();
    await expect(page.locator('text=Scoring de Inquilinos IA')).toBeVisible();
    await expect(page.locator('text=Check-in/Out Digital')).toBeVisible();
    
    // Verificar CTAs
    await expect(page.locator('text=Empezar Gratis')).toBeVisible();
  });
});

test.describe('Media Estancia - Dashboard Pages (Auth Required)', () => {
  // Estas páginas redirigen a login si no hay sesión
  // Verificamos que existen y redirigen correctamente
  
  for (const dashPage of DASHBOARD_PAGES) {
    test(`Dashboard page ${dashPage} exists (redirects to login)`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${dashPage}`, {
        maxRedirects: 0, // No seguir redirects para ver el status real
      });
      
      // Puede ser 200 (si hay sesión) o 307/302 (redirect a login)
      // No debe ser 404 o 500
      expect(response.status()).not.toBe(404);
      expect(response.status()).not.toBe(500);
    });
  }
});

test.describe('Media Estancia - Components Check', () => {
  test('FeaturesSection includes Media Estancia vertical', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing`);
    
    // Scroll to features section
    await page.locator('#features').scrollIntoViewIfNeeded();
    
    // Verificar que Media Estancia aparece en los verticales
    await expect(page.locator('text=Media Estancia (1-11 meses)')).toBeVisible();
    await expect(page.locator('text=8 Verticales')).toBeVisible();
  });
});
