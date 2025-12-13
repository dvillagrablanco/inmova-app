import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Tenants Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/inquilinos');
  });

  test('should display tenants list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /inquilinos|tenants/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /nuevo inquilino|new tenant/i })).toBeVisible();
  });

  test('should open create tenant modal', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo inquilino|new tenant/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/nombre|name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should create a new tenant', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo inquilino|new tenant/i }).click();
    
    const tenantName = `Test Tenant ${Date.now()}`;
    const tenantEmail = `test${Date.now()}@example.com`;
    
    await page.getByLabel(/nombre.*completo|full.*name/i).fill(tenantName);
    await page.getByLabel(/email/i).fill(tenantEmail);
    
    const phoneField = page.getByLabel(/teléfono|phone/i);
    if (await phoneField.isVisible().catch(() => false)) {
      await phoneField.fill('+34612345678');
    }
    
    await page.getByRole('button', { name: /guardar|crear|save|create/i }).click();
    
    // Verificar que se creó el inquilino
    await expect(page.getByText(tenantName)).toBeVisible({ timeout: 10000 });
  });

  test('should filter tenants by status', async ({ page }) => {
    const statusFilter = page.getByRole('combobox', { name: /estado|status/i });
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      await page.getByRole('option', { name: /activo|active/i }).click();
      await page.waitForTimeout(1000);
      // Verificar que se aplicó el filtro
      await expect(page.getByText(/activo|active/i)).toBeVisible();
    }
  });
});
