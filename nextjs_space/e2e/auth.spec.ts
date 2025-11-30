import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/INMOVA|Login/);
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    // Esperar a que aparezcan los mensajes de error
    await expect(page.getByText(/email.*requerido/i).or(page.getByText(/campo.*obligatorio/i))).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Credenciales de prueba (ajustar según tu sistema)
    await page.getByLabel(/email/i).fill('admin@inmova.com');
    await page.getByLabel(/contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Esperar redirección al dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/bienvenido/i).or(page.getByText(/panel de control/i))).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Esperar mensaje de error
    await expect(
      page.getByText(/credenciales.*inválidas/i)
        .or(page.getByText(/error/i))
        .or(page.getByText(/incorrect/i))
    ).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.getByRole('link', { name: /registrarse/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Logout Flow', () => {
  test('should logout successfully', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@inmova.com');
    await page.getByLabel(/contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole('button', { name: /usuario/i }).or(page.getByRole('button', { name: /perfil/i })).click();
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();

    // Verificar redirección a login
    await expect(page).toHaveURL(/\/login/);
  });
});
