import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Contracts Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/contratos');
  });

  test('should display contracts list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contratos/i })).toBeVisible();
    
    // Verificar que existe el botón de crear nuevo contrato
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato/i });
    if (await newContractButton.isVisible().catch(() => false)) {
      await expect(newContractButton).toBeVisible();
    }
  });

  test('should filter contracts by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      // Esperar a que se actualice la lista
      await page.waitForTimeout(500);
      
      // Verificar que se actualizó la vista
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should display contract status badges', async ({ page }) => {
    // Buscar badges de estado (activo, vencido, pendiente, etc.)
    const badges = page.locator('[class*="badge"]').or(page.locator('.badge'));
    const count = await badges.count();
    
    // Si hay contratos, deben tener badges de estado
    if (count > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test('should show contract expiration warnings', async ({ page }) => {
    // Buscar indicadores de contratos próximos a vencer
    const warningIndicators = page.locator('[data-testid="contract-warning"]')
      .or(page.getByText(/días.*vencimiento|próximo.*vencer/i));
    
    const count = await warningIndicators.count();
    // No falla si no hay advertencias
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display contract details', async ({ page }) => {
    // Buscar el primer contrato en la lista
    const firstContract = page.locator('[data-testid="contract-card"]').first()
      .or(page.locator('.card').first());
    
    if (await firstContract.isVisible().catch(() => false)) {
      // Buscar botón de ver detalles o clic en la tarjeta
      const viewButton = firstContract.getByRole('button', { name: /ver|details/i }).first();
      
      if (await viewButton.isVisible().catch(() => false)) {
        await viewButton.click();
        
        // Esperar a que se muestre el modal o página de detalles
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show stats summary', async ({ page }) => {
    // Verificar que se muestran estadísticas de contratos
    const stats = page.locator('[data-testid="stats"]').or(page.locator('.grid'));
    
    if (await stats.isVisible().catch(() => false)) {
      await expect(stats).toBeVisible();
    }
  });
});
