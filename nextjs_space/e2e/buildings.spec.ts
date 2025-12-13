import { test, expect } from '@playwright/test';

// Helper function para login
async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Buildings Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/edificios');
  });

  test('should display buildings list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /edificios/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /nuevo edificio/i })).toBeVisible();
  });

  test('should open create building modal', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo edificio/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/nombre.*edificio/i)).toBeVisible();
    await expect(page.getByLabel(/dirección/i)).toBeVisible();
  });

  test('should create a new building', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo edificio/i }).click();
    
    const buildingName = `Edificio Test ${Date.now()}`;
    await page.getByLabel(/nombre.*edificio/i).fill(buildingName);
    await page.getByLabel(/dirección/i).fill('Calle Test 123, Madrid');
    
    // Llenar campos opcionales si existen
    const totalUnitsField = page.getByLabel(/total.*unidades/i);
    if (await totalUnitsField.isVisible().catch(() => false)) {
      await totalUnitsField.fill('10');
    }
    
    await page.getByRole('button', { name: /guardar|crear/i }).click();
    
    // Verificar que se creó el edificio
    await expect(page.getByText(buildingName)).toBeVisible({ timeout: 10000 });
  });

  test('should search for buildings', async ({ page }) => {
    const searchBox = page.getByPlaceholder(/buscar/i);
    if (await searchBox.isVisible().catch(() => false)) {
      await searchBox.fill('Edificio');
      await page.waitForTimeout(1000); // Esperar a que se aplique el filtro
      // Verificar que hay resultados o mensaje de "no hay resultados"
      await expect(
        page.getByText(/edificio/i).or(page.getByText(/no.*resultados/i))
      ).toBeVisible();
    }
  });

  test('should navigate to building details', async ({ page }) => {
    // Hacer clic en el primer edificio de la lista
    const firstBuilding = page.locator('[data-testid="building-row"]').first()
      .or(page.locator('table tbody tr').first());
    
    if (await firstBuilding.isVisible().catch(() => false)) {
      await firstBuilding.click();
      // Verificar que navegó a la página de detalles
      await expect(page).toHaveURL(/\/edificios\/[a-zA-Z0-9-]+/);
    }
  });
});
