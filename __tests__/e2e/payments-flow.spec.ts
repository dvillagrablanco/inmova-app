/**
 * TESTS E2E - FLUJO DE PAGOS
 * Pruebas end-to-end del módulo de pagos
 */

import { test, expect } from '@playwright/test';

test.describe('🎭 E2E - Flujo de Pagos', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel(/email/i).fill('admin@inmova.app');
    await page.getByLabel(/password|contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /login|entrar|iniciar/i }).click();
    await expect(page).toHaveURL(/\/home|\/dashboard/, { timeout: 10000 });

    // Navegar a pagos
    await page.goto('http://localhost:3000/pagos');
  });

  test('✅ Debe mostrar lista de pagos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pagos/i })).toBeVisible();

    // Verificar tabla o lista de pagos
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('✅ Debe filtrar pagos por estado', async ({ page }) => {
    // Abrir filtro
    await page.getByRole('button', { name: /filtro|filter/i }).click();

    // Seleccionar "Pendiente"
    await page.getByLabel(/estado/i).selectOption('pendiente');
    await page.getByRole('button', { name: /aplicar|apply/i }).click();

    // Verificar que solo se muestran pagos pendientes
    await expect(page.getByText(/pendiente/i).first()).toBeVisible();
  });

  test('✅ Debe crear un nuevo pago', async ({ page }) => {
    // Click en "Nuevo Pago"
    await page.getByRole('button', { name: /nuevo pago|crear pago/i }).click();

    // Llenar formulario
    await page.getByLabel(/monto/i).fill('1000');
    await page.getByLabel(/concepto/i).fill('Renta Enero 2025');
    await page.getByLabel(/fecha vencimiento/i).fill('2025-01-31');

    // Submit
    await page.getByRole('button', { name: /guardar|save/i }).click();

    // Verificar mensaje de éxito
    await expect(
      page.getByText(/pago creado|payment created|exitosamente/i)
    ).toBeVisible();
  });

  test('✅ Debe marcar pago como pagado', async ({ page }) => {
    // Encontrar primer pago pendiente
    const firstPayment = page.locator('tr:has-text("pendiente")').first();

    // Click en "Marcar como pagado"
    await firstPayment.getByRole('button', { name: /pagar|marcar pagado/i }).click();

    // Confirmar
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    // Verificar cambio de estado
    await expect(page.getByText(/pagado|paid/i).first()).toBeVisible();
  });

  test('❌ Debe validar monto negativo', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo pago|crear pago/i }).click();

    await page.getByLabel(/monto/i).fill('-100');
    await page.getByLabel(/concepto/i).fill('Test');
    await page.getByLabel(/fecha vencimiento/i).fill('2025-01-31');

    await page.getByRole('button', { name: /guardar|save/i }).click();

    // Verificar mensaje de error
    await expect(
      page.getByText(/monto debe ser positivo|amount must be positive/i)
    ).toBeVisible();
  });
});
