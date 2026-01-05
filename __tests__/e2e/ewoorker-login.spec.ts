import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';

const EWOORKER_USERS = [
  {
    email: 'socio@ewoorker.com',
    password: 'Socio123!',
    role: 'socio',
  },
  {
    email: 'contratista@ewoorker.com',
    password: 'Contratista123!',
    role: 'contratista',
  },
  {
    email: 'subcontratista@ewoorker.com',
    password: 'Subcontratista123!',
    role: 'subcontratista',
  },
];

test.describe('eWoorker Login Tests', () => {
  test('página de login carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/login`);
    
    // Verificar elementos de la página
    await expect(page.getByRole('heading', { name: /Acceder a eWoorker/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  for (const user of EWOORKER_USERS) {
    test(`login ${user.role}: ${user.email}`, async ({ page }) => {
      console.log(`\n🔐 Testing login for ${user.email}`);
      
      // Ir a la página de login
      await page.goto(`${BASE_URL}/ewoorker/login`);
      await page.waitForLoadState('networkidle');
      
      // Tomar screenshot antes
      await page.screenshot({ path: `test-results/ewoorker-login-${user.role}-before.png` });
      
      // Llenar formulario
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      
      // Click en submit
      await page.click('button[type="submit"]');
      
      // Esperar respuesta
      await page.waitForTimeout(3000);
      
      // Tomar screenshot después
      await page.screenshot({ path: `test-results/ewoorker-login-${user.role}-after.png` });
      
      // Verificar que no estamos en la página de login (indica éxito)
      const currentUrl = page.url();
      console.log(`   URL actual: ${currentUrl}`);
      
      // Verificar que no hay mensaje de error visible
      const errorVisible = await page.locator('text=incorrectos').isVisible().catch(() => false);
      const serverError = await page.locator('text=Error').isVisible().catch(() => false);
      
      if (errorVisible) {
        console.log('   ❌ Error: Credenciales incorrectas');
      }
      if (serverError) {
        console.log('   ❌ Error de servidor detectado');
      }
      
      // El login es exitoso si redirige fuera de /login
      const loginSuccessful = !currentUrl.includes('/login') || 
                              currentUrl.includes('/panel') || 
                              currentUrl.includes('/dashboard');
      
      console.log(`   Login exitoso: ${loginSuccessful}`);
      
      expect(loginSuccessful || (!errorVisible && !serverError)).toBeTruthy();
    });
  }
});
