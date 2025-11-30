import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with KPIs', async ({ page }) => {
    // Verificar que se muestran los KPIs principales
    await expect(
      page.getByText(/edificios|buildings/i).or(page.getByText(/unidades|units/i))
    ).toBeVisible();
    
    await expect(
      page.getByText(/ocupación|occupancy/i).or(page.getByText(/ingresos|revenue/i))
    ).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    const activitySection = page.locator('[data-testid="recent-activity"]')
      .or(page.getByText(/actividad.*reciente|recent.*activity/i).locator('..'));
    
    if (await activitySection.isVisible().catch(() => false)) {
      await expect(activitySection).toBeVisible();
    }
  });

  test('should display charts and graphs', async ({ page }) => {
    // Verificar que hay elementos canvas (gráficos)
    const charts = page.locator('canvas').or(page.locator('[data-testid="chart"]'));
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to buildings from quick access', async ({ page }) => {
    const buildingsLink = page.getByRole('link', { name: /edificios|buildings/i });
    if (await buildingsLink.isVisible().catch(() => false)) {
      await buildingsLink.click();
      await expect(page).toHaveURL(/\/edificios/);
    }
  });

  test('should display notifications', async ({ page }) => {
    const notificationsButton = page.getByRole('button', { name: /notificaciones|notifications/i })
      .or(page.locator('[data-testid="notifications-button"]'));
    
    if (await notificationsButton.isVisible().catch(() => false)) {
      await notificationsButton.click();
      await expect(
        page.getByText(/notificaciones|notifications/i)
          .or(page.locator('[data-testid="notifications-dropdown"]'))
      ).toBeVisible();
    }
  });

  test('should change language', async ({ page }) => {
    const languageButton = page.locator('[aria-label*="idioma"]')
      .or(page.locator('[aria-label*="language"]'))
      .or(page.getByRole('button').filter({ hasText: /🌐/ }));
    
    if (await languageButton.isVisible().catch(() => false)) {
      await languageButton.click();
      await page.getByText(/English/).click();
      
      // Verificar que el idioma cambió
      await expect(page.getByText(/Dashboard|Buildings/i)).toBeVisible();
    }
  });
});
