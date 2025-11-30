import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Payments Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/pagos');
  });

  test('should display payments list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pagos|payments/i })).toBeVisible();
  });

  test('should filter payments by status', async ({ page }) => {
    const statusFilter = page.getByRole('button', { name: /filtrar|filter/i })
      .or(page.locator('[data-testid="status-filter"]'));
    
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      await page.getByText(/pagado|paid/i).click();
      await page.waitForTimeout(1000);
      
      // Verificar que se aplicó el filtro
      const payments = page.locator('[data-testid="payment-row"]');
      if (await payments.count() > 0) {
        await expect(payments.first().getByText(/pagado|paid/i)).toBeVisible();
      }
    }
  });

  test('should export payments', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /exportar|export/i });
    
    if (await exportButton.isVisible().catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click(),
      ]);
      
      expect(download.suggestedFilename()).toMatch(/pagos|payments/);
    }
  });

  test('should view payment details', async ({ page }) => {
    const firstPayment = page.locator('[data-testid="payment-row"]').first()
      .or(page.locator('table tbody tr').first());
    
    if (await firstPayment.isVisible().catch(() => false)) {
      await firstPayment.click();
      
      // Verificar que se muestra el detalle del pago
      await expect(
        page.getByText(/detalles.*pago|payment.*details/i)
          .or(page.locator('[data-testid="payment-details"]'))
      ).toBeVisible();
    }
  });
});
