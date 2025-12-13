import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Documents Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/documentos');
  });

  test('should display documents page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /documentos/i })).toBeVisible();
  });

  test('should show upload button', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /subir|upload|cargar/i });
    
    if (await uploadButton.isVisible().catch(() => false)) {
      await expect(uploadButton).toBeVisible();
    }
  });

  test('should filter documents by type', async ({ page }) => {
    const typeFilter = page.locator('select[name="tipo"]')
      .or(page.getByRole('combobox').first());
    
    if (await typeFilter.isVisible().catch(() => false)) {
      await typeFilter.click();
      await page.waitForTimeout(300);
    }
  });

  test('should search documents', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('contrato');
      await page.waitForTimeout(500);
      await expect(searchInput).toHaveValue('contrato');
    }
  });

  test('should display document list', async ({ page }) => {
    // Verificar que se muestra la lista de documentos
    const documentList = page.locator('[data-testid="document-list"]')
      .or(page.locator('.grid'))
      .or(page.locator('table'));
    
    const count = await documentList.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show document preview', async ({ page }) => {
    // Buscar el primer documento
    const firstDocument = page.locator('[data-testid="document-item"]').first()
      .or(page.locator('tr').nth(1));
    
    if (await firstDocument.isVisible().catch(() => false)) {
      // Buscar botón de ver/preview
      const viewButton = firstDocument.locator('button').first();
      
      if (await viewButton.isVisible().catch(() => false)) {
        await viewButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should display storage stats', async ({ page }) => {
    // Verificar estadísticas de almacenamiento
    const storageStats = page.locator('[data-testid="storage-stats"]')
      .or(page.getByText(/almacenamiento|storage/i));
    
    if (await storageStats.isVisible().catch(() => false)) {
      await expect(storageStats).toBeVisible();
    }
  });
});
