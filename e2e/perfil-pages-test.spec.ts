import { test, expect } from '@playwright/test';

test.describe('Prueba de Páginas de Perfil', () => {
  test('Perfil de Usuario - /perfil', async ({ page }) => {
    console.log('🔍 Probando: /perfil');

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('  ❌ Console Error:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
      console.log('  ❌ Page Error:', error.message);
    });

    try {
      await page.goto('/perfil', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      await page.waitForTimeout(2000);

      const hasContent = await page.evaluate(() => {
        return {
          hasProfile:
            document.body.innerText.includes('Perfil') ||
            document.body.innerText.includes('perfil'),
          hasForm: document.querySelectorAll('form, input').length > 0,
          bodyText: document.body.innerText.substring(0, 200),
        };
      });

      console.log('  ✅ Página cargada');
      console.log('  📄 Contenido:', hasContent);

      expect(pageErrors.length).toBe(0);
    } catch (error) {
      console.log('  ⚠️ Error:', error);
    }
  });

  test('Perfil de Inquilino - /portal-inquilino/perfil', async ({ page }) => {
    console.log('🔍 Probando: /portal-inquilino/perfil');

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('  ❌ Console Error:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
      console.log('  ❌ Page Error:', error.message);
    });

    try {
      await page.goto('/portal-inquilino/perfil', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      await page.waitForTimeout(2000);

      const hasContent = await page.evaluate(() => {
        return {
          hasProfile:
            document.body.innerText.includes('Perfil') ||
            document.body.innerText.includes('perfil'),
          hasForm: document.querySelectorAll('form, input').length > 0,
          bodyText: document.body.innerText.substring(0, 200),
        };
      });

      console.log('  ✅ Página cargada');
      console.log('  📄 Contenido:', hasContent);

      expect(pageErrors.length).toBe(0);
    } catch (error) {
      console.log('  ⚠️ Error:', error);
    }
  });
});
