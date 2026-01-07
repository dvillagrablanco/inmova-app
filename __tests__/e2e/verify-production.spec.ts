import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://inmovaapp.com';

test.describe('Verificación de Producción - Cambios Desplegados', () => {
  
  test('Landing principal carga correctamente', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing`);
    await expect(page).toHaveTitle(/inmova/i);
    
    // Verificar que hay contenido visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Landing carga correctamente');
  });

  test('No hay menciones de competidores (Homming/Rentger)', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing`);
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.content();
    const lowerContent = pageContent.toLowerCase();
    
    // Verificar que NO hay menciones de competidores
    expect(lowerContent).not.toContain('homming');
    expect(lowerContent).not.toContain('rentger');
    expect(lowerContent).not.toContain('guesty');
    
    console.log('✅ No hay menciones de competidores');
  });

  test('Sección de precios tiene nombres genéricos', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing`);
    await page.waitForLoadState('networkidle');
    
    // Buscar sección de pricing
    const pricingSection = page.locator('[id*="pricing"], [class*="pricing"], section:has-text("Plan")');
    
    if (await pricingSection.count() > 0) {
      const pricingText = await pricingSection.first().textContent();
      
      // Verificar que usa "Plataforma A/B/C" en lugar de competidores específicos
      expect(pricingText?.toLowerCase()).not.toContain('homming');
      expect(pricingText?.toLowerCase()).not.toContain('rentger');
      
      console.log('✅ Precios usan nombres genéricos');
    } else {
      console.log('ℹ️ Sección de pricing no encontrada específicamente');
    }
  });

  test('API de planes responde correctamente', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/planes`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.planes || data.addOns).toBeDefined();
    
    console.log('✅ API /api/planes funciona');
  });

  test('API de addons responde correctamente', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/addons`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    
    console.log('✅ API /api/addons funciona');
    console.log(`   Add-ons disponibles: ${data.data?.length || 0}`);
  });

  test('API de health responde correctamente', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    
    console.log('✅ API /api/health funciona');
    console.log(`   Database: ${data.checks?.database || 'unknown'}`);
  });

  test('Calculadora ROI no tiene competidores específicos', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing/calculadora-roi`);
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.content();
    const lowerContent = pageContent.toLowerCase();
    
    expect(lowerContent).not.toContain('homming');
    expect(lowerContent).not.toContain('rentger');
    
    console.log('✅ Calculadora ROI sin menciones de competidores');
  });

});
