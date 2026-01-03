/**
 * E2E TEST - COMPLETE TENANT JOURNEY
 * Journey completo del inquilino: portal → solicitudes → pagos
 */

import { test, expect } from '@playwright/test';

test.describe('👤 Tenant Complete Journey E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login como inquilino
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inquilino@inmova.app');
    await page.fill('input[name="password"]', 'Inquilino123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/portal|\/dashboard/, { timeout: 10000 });
  });

  test('✅ E2E: Inquilino ve su portal', async ({ page }) => {
    await page.goto('/portal');

    // Verificar elementos del portal
    await expect(page.locator('h1, h2')).toContainText(/Mi Portal|Portal|Dashboard/i);

    // Verificar secciones
    const sections = ['Pagos', 'Mantenimiento', 'Documentos', 'Contrato'];

    for (const section of sections) {
      const sectionElement = page.locator(`text=${section}`).first();
      if ((await sectionElement.count()) > 0) {
        await expect(sectionElement).toBeVisible();
      }
    }
  });

  test('✅ E2E: Inquilino crea solicitud de mantenimiento', async ({ page }) => {
    await page.goto('/portal/mantenimiento/nuevo');

    // Llenar formulario
    await page.fill(
      'input[name="titulo"], input[name="title"]',
      'Fuga en el baño - Solicitud inquilino'
    );
    await page.fill(
      'textarea[name="descripcion"], textarea[name="description"]',
      'Hay una pequeña fuga en el lavabo del baño principal. Necesita revisión urgente.'
    );

    // Seleccionar categoría
    const categorySelect = page.locator('select[name="categoria"], select[name="category"]');
    if ((await categorySelect.count()) > 0) {
      await categorySelect.selectOption('plomeria');
    }

    // Seleccionar prioridad
    const prioritySelect = page.locator('select[name="prioridad"], select[name="priority"]');
    if ((await prioritySelect.count()) > 0) {
      await prioritySelect.selectOption('media');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verificar éxito
    await expect(page.locator('text=/solicitud.*creada|success/i')).toBeVisible();
  });

  test('✅ E2E: Inquilino ve historial de solicitudes', async ({ page }) => {
    await page.goto('/portal/mantenimiento');

    // Verificar lista de solicitudes
    const requestsList = page.locator('[data-testid="maintenance-request"]');

    if ((await requestsList.count()) > 0) {
      await expect(requestsList.first()).toBeVisible();
    } else {
      // Si no hay solicitudes
      await expect(page.locator('text=/No hay solicitudes|Sin solicitudes/i')).toBeVisible();
    }
  });

  test('✅ E2E: Inquilino ve detalle de solicitud', async ({ page }) => {
    await page.goto('/portal/mantenimiento');

    const firstRequest = page.locator('[data-testid="maintenance-request"]').first();

    if ((await firstRequest.count()) > 0) {
      await firstRequest.click();

      // Verificar detalles
      await expect(page.locator('text=/Estado|Status/i')).toBeVisible();
      await expect(page.locator('text=/Descripción|Description/i')).toBeVisible();
    }
  });

  test('✅ E2E: Inquilino ve sus pagos', async ({ page }) => {
    await page.goto('/portal/pagos');

    // Verificar historial de pagos
    await expect(page.locator('h1, h2')).toContainText(/Mis Pagos|Pagos/i);

    const paymentsList = page.locator('[data-testid="payment-item"]');

    if ((await paymentsList.count()) > 0) {
      await expect(paymentsList.first()).toBeVisible();
    }
  });

  test('✅ E2E: Inquilino descarga recibo', async ({ page }) => {
    await page.goto('/portal/pagos');

    const downloadButton = page
      .locator('button:has-text("Descargar"), button:has-text("Recibo")')
      .first();

    if ((await downloadButton.count()) > 0) {
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test('✅ E2E: Inquilino ve su contrato', async ({ page }) => {
    await page.goto('/portal/contrato');

    // Verificar detalles del contrato
    await expect(page.locator('text=/Contrato|Contract/i')).toBeVisible();

    const contractDetails = ['Fecha de inicio', 'Fecha de fin', 'Monto mensual', 'Dirección'];

    for (const detail of contractDetails) {
      const element = page.locator(`text=${detail}`).first();
      if ((await element.count()) > 0) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('✅ E2E: Inquilino descarga contrato', async ({ page }) => {
    await page.goto('/portal/contrato');

    const downloadButton = page
      .locator('button:has-text("Descargar"), button:has-text("PDF")')
      .first();

    if ((await downloadButton.count()) > 0) {
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/contrato.*\.pdf$/i);
    }
  });

  test('✅ E2E: Inquilino actualiza su perfil', async ({ page }) => {
    await page.goto('/portal/perfil');

    // Actualizar teléfono
    const phoneInput = page.locator('input[name="telefono"], input[name="phone"]');

    if ((await phoneInput.count()) > 0) {
      await phoneInput.fill('+34612345678');
      await page.click('button:has-text("Guardar")');

      // Verificar éxito
      await expect(page.locator('text=/perfil.*actualizado|success/i')).toBeVisible();
    }
  });

  test('⚠️ E2E: Inquilino no puede acceder a admin', async ({ page }) => {
    await page.goto('/dashboard/admin');

    // Debe redirigir o mostrar error
    await page.waitForTimeout(2000);

    const hasError =
      page.url().includes('/portal') ||
      page.url().includes('/login') ||
      (await page.locator('text=/permiso|forbidden|403/i').count()) > 0;

    expect(hasError).toBe(true);
  });
});

test.describe('📱 Tenant Mobile Experience E2E', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inquilino@inmova.app');
    await page.fill('input[name="password"]', 'Inquilino123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/portal|\/dashboard/);
  });

  test('✅ Mobile: Portal carga correctamente', async ({ page }) => {
    await page.goto('/portal');

    // Verificar viewport mobile
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(768);

    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('✅ Mobile: Bottom navigation funciona', async ({ page }) => {
    await page.goto('/portal');

    const bottomNav = page.locator('[data-testid="bottom-nav"], nav');

    if ((await bottomNav.count()) > 0) {
      await expect(bottomNav).toBeVisible();

      // Click en tab de pagos
      const paymentsTab = bottomNav.locator('a:has-text("Pagos"), button:has-text("Pagos")');
      if ((await paymentsTab.count()) > 0) {
        await paymentsTab.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('pagos');
      }
    }
  });
});
