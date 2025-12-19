/**
 * TESTS E2E - FLUJO DE AUTENTICACIÓN
 * Pruebas end-to-end del proceso de login/logout usando Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('🎭 E2E - Flujo de Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de login
    await page.goto('http://localhost:3000/auth/login');
  });

  test('✅ Debe mostrar el formulario de login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /login|iniciar sesión/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password|contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|entrar|iniciar/i })).toBeVisible();
  });

  test('❌ Debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password|contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login|entrar|iniciar/i }).click();

    // Verificar mensaje de error
    await expect(
      page.getByText(/credenciales inválidas|incorrect|error/i)
    ).toBeVisible();
  });

  test('✅ Debe hacer login exitoso con credenciales válidas', async ({ page }) => {
    await page.getByLabel(/email/i).fill('admin@inmova.app');
    await page.getByLabel(/password|contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /login|entrar|iniciar/i }).click();

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/\/home|\/dashboard/, { timeout: 10000 });

    // Verificar elementos del dashboard
    await expect(
      page.getByText(/bienvenido|dashboard|inicio/i)
    ).toBeVisible();
  });

  test('✅ Debe hacer logout correctamente', async ({ page }) => {
    // Login primero
    await page.getByLabel(/email/i).fill('admin@inmova.app');
    await page.getByLabel(/password|contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /login|entrar|iniciar/i }).click();

    await expect(page).toHaveURL(/\/home|\/dashboard/, { timeout: 10000 });

    // Hacer logout
    await page.getByRole('button', { name: /logout|salir|cerrar sesión/i }).click();

    // Verificar redirección a login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('❌ Debe validar campos vacíos', async ({ page }) => {
    // Intentar submit sin llenar campos
    await page.getByRole('button', { name: /login|entrar|iniciar/i }).click();

    // Verificar mensajes de validación
    await expect(
      page.getByText(/requerido|obligatorio|required/i)
    ).toBeVisible();
  });

  test('❌ Debe validar formato de email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password|contraseña/i).fill('password123');
    await page.getByRole('button', { name: /login|entrar|iniciar/i }).click();

    // Verificar mensaje de validación de email
    await expect(
      page.getByText(/email inválido|invalid email/i)
    ).toBeVisible();
  });
});
