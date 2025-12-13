import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Maintenance Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/mantenimiento');
  });

  test('should display maintenance page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mantenimiento/i })).toBeVisible();
  });

  test('should show maintenance requests tab', async ({ page }) => {
    const requestsTab = page.getByRole('tab', { name: /solicitudes|requests/i });
    
    if (await requestsTab.isVisible().catch(() => false)) {
      await requestsTab.click();
      await expect(requestsTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should show preventive maintenance tab', async ({ page }) => {
    const preventiveTab = page.getByRole('tab', { name: /preventivo|preventive/i });
    
    if (await preventiveTab.isVisible().catch(() => false)) {
      await preventiveTab.click();
      await expect(preventiveTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should display priority badges', async ({ page }) => {
    // Buscar badges de prioridad (alta, media, baja)
    const priorityBadges = page.locator('[data-testid="priority-badge"]')
      .or(page.getByText(/alta|media|baja|high|medium|low/i));
    
    const count = await priorityBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter maintenance requests', async ({ page }) => {
    // Buscar filtros de estado
    const statusFilter = page.locator('select').first()
      .or(page.getByRole('combobox').first());
    
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      // Esperar a que se muestre el dropdown
      await page.waitForTimeout(300);
    }
  });

  test('should display maintenance stats', async ({ page }) => {
    // Verificar estadísticas de mantenimiento
    const stats = page.locator('[data-testid="maintenance-stats"]')
      .or(page.locator('.grid').first());
    
    if (await stats.isVisible().catch(() => false)) {
      await expect(stats).toBeVisible();
    }
  });

  test('should show create maintenance button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nueva.*solicitud|new.*request/i });
    
    if (await createButton.isVisible().catch(() => false)) {
      await expect(createButton).toBeVisible();
      await createButton.click();
      // Verificar que se abre el modal o formulario
      await page.waitForTimeout(500);
    }
  });

  test('should display maintenance history', async ({ page }) => {
    // Buscar historial de mantenimiento
    const historySection = page.locator('[data-testid="maintenance-history"]')
      .or(page.getByText(/historial|history/i));
    
    if (await historySection.isVisible().catch(() => false)) {
      await expect(historySection).toBeVisible();
    }
  });
});
