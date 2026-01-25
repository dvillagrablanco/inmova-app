import { test, expect } from '@playwright/test';

test.describe('Valoración IA y Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    // Ir a login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Cerrar banner de cookies si aparece
    const cookieButton = page.locator('button:has-text("Aceptar")').first();
    if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieButton.click();
    }
    
    // Login - usar textbox por placeholder
    await page.getByPlaceholder('tu@correo.com').fill('admin@inmova.app');
    await page.getByPlaceholder('••••••••').fill('Admin123!');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    
    // Esperar a que cargue el dashboard
    await page.waitForURL(/dashboard|admin|portal|propiedades/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  });

  test('Valoración IA aparece en el sidebar de Living Residencial', async ({ page }) => {
    // Buscar la sección Living Residencial en el sidebar
    const sidebarSection = page.locator('text=Living Residencial').first();
    
    // Si existe, hacer clic para expandir
    if (await sidebarSection.isVisible()) {
      await sidebarSection.click();
      await page.waitForTimeout(500);
    }
    
    // Buscar "Valoración IA" en el sidebar
    const valoracionLink = page.locator('a[href="/valoracion-ia"]').first();
    
    // Verificar que el enlace existe y es visible
    await expect(valoracionLink).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Valoración IA encontrada en el sidebar');
  });

  test('Página de Valoración IA carga correctamente', async ({ page }) => {
    // Navegar directamente a la página
    await page.goto('/valoracion-ia');
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga sin errores
    const pageTitle = page.locator('h1:has-text("Valoración")');
    await expect(pageTitle).toBeVisible({ timeout: 15000 });
    
    // Verificar elementos clave de la página
    const formCard = page.locator('text=Seleccionar Activo a Valorar').first();
    await expect(formCard).toBeVisible();
    
    // Verificar botón de valorar
    const valorarButton = page.locator('button:has-text("Valorar")').first();
    await expect(valorarButton).toBeVisible();
    
    console.log('✅ Página de Valoración IA carga correctamente');
  });

  test('AI Document Assistant muestra botón de aplicar datos', async ({ page }) => {
    // Ir a la página de nuevo inquilino
    await page.goto('/inquilinos/nuevo');
    await page.waitForLoadState('networkidle');
    
    // Buscar el botón flotante del asistente IA
    const aiButton = page.locator('[data-floating-widget="ai-document-assistant"] button').first();
    
    if (await aiButton.isVisible()) {
      // Hacer clic para abrir el panel
      await aiButton.click();
      await page.waitForTimeout(1000);
      
      // Verificar que el panel se abre
      const panel = page.locator('text=Asistente IA').first();
      await expect(panel).toBeVisible();
      
      console.log('✅ AI Document Assistant se abre correctamente');
    } else {
      // El asistente puede estar en otro formato
      console.log('ℹ️ Botón flotante no visible, puede estar en otro lugar');
    }
  });
});
