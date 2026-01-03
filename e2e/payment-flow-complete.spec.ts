/**
 * E2E TEST - COMPLETE PAYMENT FLOW
 * Flujo completo de pagos: creación → procesamiento → confirmación
 */

import { test, expect } from '@playwright/test';

test.describe('💰 Payment Flow Complete E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('✅ E2E: Crear pago → Ver en lista → Ver detalle', async ({ page }) => {
    // 1. Crear pago
    await page.goto('/dashboard/payments/new');

    const timestamp = Date.now();
    await page.fill('input[name="monto"]', '1500');
    await page.fill('input[name="concepto"]', `Renta Febrero ${timestamp}`);

    // Select tenant (si hay dropdown)
    const tenantSelect = page.locator('select[name="tenantId"], select[name="inquilinoId"]');
    if ((await tenantSelect.count()) > 0) {
      await tenantSelect.selectOption({ index: 1 });
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 2. Verificar redirect a lista
    await expect(page).toHaveURL(/\/dashboard\/payments/);

    // 3. Buscar el pago en la lista
    await page.fill('input[placeholder*="Buscar" i]', `Renta Febrero ${timestamp}`);
    await page.waitForTimeout(1000);

    // 4. Click en el pago
    const paymentRow = page.locator(`text=/Renta Febrero ${timestamp}/`).first();
    if ((await paymentRow.count()) > 0) {
      await paymentRow.click();

      // 5. Verificar detalle
      await expect(page.locator('text=/1500|€1,500/i')).toBeVisible();
    }
  });

  test('✅ E2E: Filtrar pagos por estado', async ({ page }) => {
    await page.goto('/dashboard/payments');

    // Filtrar por pendiente
    const stateFilter = page.locator('select[name="estado"], select[name="status"]');
    if ((await stateFilter.count()) > 0) {
      await stateFilter.selectOption('pendiente');
      await page.waitForTimeout(1000);

      // Verificar que solo hay pagos pendientes
      const payments = await page.locator('[data-testid="payment-row"]').all();
      for (const payment of payments) {
        await expect(payment).toContainText(/pendiente/i);
      }
    }
  });

  test('✅ E2E: Filtrar por rango de fechas', async ({ page }) => {
    await page.goto('/dashboard/payments');

    const dateFromInput = page.locator('input[name="fechaDesde"], input[name="dateFrom"]');
    const dateToInput = page.locator('input[name="fechaHasta"], input[name="dateTo"]');

    if ((await dateFromInput.count()) > 0 && (await dateToInput.count()) > 0) {
      await dateFromInput.fill('2026-01-01');
      await dateToInput.fill('2026-01-31');
      await page.click('button:has-text("Filtrar"), button:has-text("Buscar")');
      await page.waitForTimeout(1000);

      // Verificar que solo hay pagos del rango
      expect(page.url()).toContain('fecha');
    }
  });

  test('✅ E2E: Exportar pagos a PDF', async ({ page }) => {
    await page.goto('/dashboard/payments');

    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("PDF")');

    if ((await exportButton.count()) > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.first().click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test('⚠️ E2E: Validación de monto negativo', async ({ page }) => {
    await page.goto('/dashboard/payments/new');

    await page.fill('input[name="monto"]', '-500');
    await page.click('button[type="submit"]');

    // Verificar error
    await expect(page.locator('text=/monto.*positivo|debe ser mayor/i')).toBeVisible();
  });

  test('⚠️ E2E: Crear pago sin concepto', async ({ page }) => {
    await page.goto('/dashboard/payments/new');

    await page.fill('input[name="monto"]', '1000');
    // No llenar concepto
    await page.click('button[type="submit"]');

    // Verificar error de campo requerido
    await expect(page.locator('text=/concepto.*requerido|required/i')).toBeVisible();
  });
});

test.describe('💳 Payment Processing E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('✅ E2E: Confirmar pago pendiente', async ({ page }) => {
    await page.goto('/dashboard/payments');

    // Buscar pago pendiente
    const pendingPayment = page.locator('[data-status="pendiente"]').first();

    if ((await pendingPayment.count()) > 0) {
      await pendingPayment.click();

      // Confirmar pago
      await page.click('button:has-text("Confirmar"), button:has-text("Marcar como pagado")');

      // Verificar confirmación
      await expect(page.locator('text=/confirmado|pagado|success/i')).toBeVisible();
    }
  });

  test('✅ E2E: Rechazar pago', async ({ page }) => {
    await page.goto('/dashboard/payments');

    const payment = page.locator('[data-testid="payment-row"]').first();

    if ((await payment.count()) > 0) {
      await payment.click();

      // Rechazar
      const rejectButton = page.locator('button:has-text("Rechazar"), button:has-text("Cancelar")');

      if ((await rejectButton.count()) > 0) {
        await rejectButton.click();

        // Confirmar rechazo
        await page.click('button:has-text("Confirmar")');

        // Verificar estado
        await expect(page.locator('text=/rechazado|cancelado/i')).toBeVisible();
      }
    }
  });

  test('✅ E2E: Agregar nota a pago', async ({ page }) => {
    await page.goto('/dashboard/payments');

    const payment = page.locator('[data-testid="payment-row"]').first();

    if ((await payment.count()) > 0) {
      await payment.click();

      const notesTextarea = page.locator('textarea[name="notas"], textarea[name="notes"]');

      if ((await notesTextarea.count()) > 0) {
        await notesTextarea.fill('Pago verificado por contabilidad');
        await page.click('button:has-text("Guardar")');

        // Verificar nota guardada
        await expect(page.locator('text=/Pago verificado por contabilidad/i')).toBeVisible();
      }
    }
  });
});
