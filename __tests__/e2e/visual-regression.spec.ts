/**
 * TESTS DE REGRESIÓN VISUAL - PLAYWRIGHT
 * Captura de screenshots para detectar cambios visuales
 */

import { test, expect } from '@playwright/test';

test.describe('📸 Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel(/email/i).fill('admin@inmova.app');
    await page.getByLabel(/password|contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /login|entrar|iniciar/i }).click();
    await expect(page).toHaveURL(/\/home|\/dashboard/, { timeout: 10000 });
  });

  test('@visual Dashboard - Vista completa', async ({ page }) => {
    await page.goto('http://localhost:3000/home');
    await page.waitForLoadState('networkidle');

    // Capturar screenshot completo
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Pagos - Lista de pagos', async ({ page }) => {
    await page.goto('http://localhost:3000/pagos');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('payments-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Room Rental - Prorrateo', async ({ page }) => {
    await page.goto('http://localhost:3000/room-rental');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('room-rental.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Modal - Crear pago', async ({ page }) => {
    await page.goto('http://localhost:3000/pagos');
    await page.getByRole('button', { name: /nuevo pago|crear pago/i }).click();

    // Esperar a que el modal se abra completamente
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('modal-new-payment.png', {
      animations: 'disabled',
    });
  });

  test('@visual Responsive - Dashboard en mobile', async ({ page }) => {
    // Cambiar a tamaño mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3000/home');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Responsive - Dashboard en tablet', async ({ page }) => {
    // Cambiar a tamaño tablet
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('http://localhost:3000/home');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Tema oscuro - Dashboard', async ({ page }) => {
    // Activar tema oscuro (si está disponible)
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('http://localhost:3000/home');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Componente - Tabla de pagos', async ({ page }) => {
    await page.goto('http://localhost:3000/pagos');
    await page.waitForLoadState('networkidle');

    // Capturar solo la tabla
    const table = page.locator('table').first();
    await expect(table).toHaveScreenshot('payments-table.png', {
      animations: 'disabled',
    });
  });

  test('@visual Componente - Gráfico de dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/home');
    await page.waitForLoadState('networkidle');

    // Capturar el primer gráfico
    const chart = page.locator('canvas').first();
    if (await chart.isVisible()) {
      await expect(chart).toHaveScreenshot('dashboard-chart.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Estados - Botón hover', async ({ page }) => {
    await page.goto('http://localhost:3000/pagos');
    await page.waitForLoadState('networkidle');

    const button = page.getByRole('button', { name: /nuevo pago/i });
    await button.hover();
    await page.waitForTimeout(200); // Esperar animación de hover

    await expect(button).toHaveScreenshot('button-hover.png', {
      animations: 'disabled',
    });
  });
});
