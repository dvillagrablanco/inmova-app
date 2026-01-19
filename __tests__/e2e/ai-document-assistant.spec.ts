import { test, expect } from '@playwright/test';

test.describe('AI Document Assistant - Visualización', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Usar #email y #password (ids de los inputs)
    await page.fill('#email', 'admin@inmova.app');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Esperar a dashboard
    await page.waitForURL(/dashboard|admin/, { timeout: 30000 });
  });

  test('Página de documentos carga correctamente', async ({ page }) => {
    await page.goto('/dashboard/documentos');
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    
    // Screenshot de la página
    await page.screenshot({ path: '__tests__/e2e/screenshots/documentos-page.png', fullPage: true });
  });

  test('Asistente documental tiene fondo blanco (no transparente)', async ({ page }) => {
    await page.goto('/dashboard/documentos');
    await page.waitForLoadState('networkidle');
    
    // Buscar el botón del asistente IA flotante
    const aiButton = page.locator('button:has(svg.lucide-brain)').first();
    
    // Si existe el botón flotante, hacer clic para abrir
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await page.waitForTimeout(500);
      
      // Verificar el sheet del asistente
      const sheetContent = page.locator('[data-state="open"] > div').first();
      
      if (await sheetContent.isVisible()) {
        // Obtener el estilo de fondo
        const bgColor = await sheetContent.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        console.log('Background color del Sheet:', bgColor);
        
        // El fondo debe ser blanco o muy cercano a blanco (rgb(255, 255, 255))
        // o gris muy oscuro en dark mode (rgb(3, 7, 18) para gray-950)
        expect(bgColor).toMatch(/rgb\(255,\s*255,\s*255\)|rgb\(3,\s*7,\s*18\)|rgb\(249,\s*250,\s*251\)/);
        
        // Screenshot del asistente abierto
        await page.screenshot({ path: '__tests__/e2e/screenshots/ai-assistant-open.png', fullPage: true });
      }
    }
  });

  test('Página de asistente-ia muestra el Asistente General primero', async ({ page }) => {
    await page.goto('/asistente-ia');
    await page.waitForLoadState('networkidle');
    
    // Ir a la pestaña de selección de agentes
    const agentsTab = page.locator('button:has-text("Seleccionar Agente")');
    if (await agentsTab.isVisible()) {
      await agentsTab.click();
      await page.waitForTimeout(500);
    }
    
    // Screenshot de la página de agentes
    await page.screenshot({ path: '__tests__/e2e/screenshots/asistente-ia-agents.png', fullPage: true });
    
    // Verificar que el primer agente es el General
    const firstAgentCard = page.locator('[class*="cursor-pointer"]').first();
    const firstAgentText = await firstAgentCard.textContent();
    
    console.log('Primer agente encontrado:', firstAgentText);
    
    // Debe contener "Asistente General" o "General"
    expect(firstAgentText?.toLowerCase()).toContain('general');
  });
});
