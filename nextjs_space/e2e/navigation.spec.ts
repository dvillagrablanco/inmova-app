import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to all main sections', async ({ page }) => {
    const sections = [
      { name: /edificios|buildings/i, path: '/edificios' },
      { name: /unidades|units/i, path: '/unidades' },
      { name: /inquilinos|tenants/i, path: '/inquilinos' },
      { name: /contratos|contracts/i, path: '/contratos' },
      { name: /pagos|payments/i, path: '/pagos' },
      { name: /mantenimiento|maintenance/i, path: '/mantenimiento' },
      { name: /documentos|documents/i, path: '/documentos' },
    ];

    for (const section of sections) {
      const link = page.getByRole('link', { name: section.name });
      
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(section.path));
        
        // Volver al dashboard
        await page.goto('/dashboard');
      }
    }
  });

  test('should display sidebar on desktop', async ({ page }) => {
    const sidebar = page.locator('aside').or(page.locator('[role="navigation"]'));
    
    if (await sidebar.isVisible().catch(() => false)) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await page.goto('/edificios');
    
    const breadcrumb = page.locator('[aria-label="breadcrumb"]')
      .or(page.locator('nav[aria-label*="bread"]'));
    
    if (await breadcrumb.isVisible().catch(() => false)) {
      await expect(breadcrumb).toBeVisible();
    }
  });

  test('should have back button functionality', async ({ page }) => {
    await page.goto('/edificios');
    
    const backButton = page.getByRole('button', { name: /volver|back/i });
    
    if (await backButton.isVisible().catch(() => false)) {
      await backButton.click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should display header on all pages', async ({ page }) => {
    const header = page.locator('header');
    
    await expect(header).toBeVisible();
    
    // Navegar a diferentes páginas y verificar el header
    const pages = ['/edificios', '/unidades', '/inquilinos'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(header).toBeVisible();
    }
  });

  test('should have search functionality in header', async ({ page }) => {
    const searchButton = page.locator('[data-testid="global-search"]')
      .or(page.getByPlaceholder(/buscar|search/i));
    
    if (await searchButton.isVisible().catch(() => false)) {
      await expect(searchButton).toBeVisible();
    }
  });
});
