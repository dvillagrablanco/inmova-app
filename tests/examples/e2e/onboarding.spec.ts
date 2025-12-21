import { test, expect } from '@playwright/test';

/**
 * TEST E2E: Flujo Completo de Onboarding
 * 
 * Este test verifica que un nuevo usuario puede:
 * 1. Registrarse
 * 2. Ver su progreso de onboarding
 * 3. Completar su primera tarea
 * 4. Ver el progreso actualizado
 */

test.describe('Flujo de Onboarding', () => {
  test('Usuario completa onboarding exitosamente', async ({ page }) => {
    // 1. Navegar a página de registro
    await page.goto('/signup');

    // 2. Completar formulario de registro
    const timestamp = Date.now();
    await page.fill('input[name="email"]', `test+${timestamp}@inmova.com`);
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="name"]', 'Test User');

    // 3. Seleccionar opciones
    await page.selectOption('select[name="experienceLevel"]', 'principiante');
    await page.selectOption('select[name="techSavviness"]', 'bajo');
    await page.selectOption('select[name="portfolioSize"]', 'size_1_5');
    await page.selectOption('select[name="businessModel"]', 'alquiler_tradicional');

    // 4. Hacer clic en registrarse
    await page.click('button[type="submit"]');

    // 5. Verificar redirección a onboarding
    await expect(page).toHaveURL('/onboarding');

    // 6. Verificar que aparecen las tareas
    const tasks = page.locator('[data-testid="onboarding-task"]');
    await expect(tasks).toHaveCount(7); // 7 tareas para alquiler_tradicional

    // 7. Verificar progreso inicial
    const progressText = page.locator('[data-testid="progress-percentage"]');
    await expect(progressText).toContainText('0%');

    // 8. Hacer clic en primera tarea "Crear tu primera propiedad"
    await page.click('button[data-testid="task-create-property"]');

    // 9. Verificar navegación a wizard
    await expect(page).toHaveURL(/\/edificios\/nuevo-wizard/);

    // 10. Completar wizard
    // Paso 1: Datos básicos
    await page.fill('input[id="direccion"]', 'Calle Falsa 123');
    await page.fill('input[id="ciudad"]', 'Madrid');
    await page.fill('input[id="provincia"]', 'Madrid');
    await page.click('button:has-text("Siguiente")');

    // Paso 2: Características
    await page.fill('input[id="superficie"]', '80');
    await page.fill('input[id="habitaciones"]', '3');
    await page.fill('input[id="banos"]', '2');
    await page.click('button:has-text("Siguiente")');

    // Paso 3: Propietario
    await page.fill('input[id="ownerName"]', 'Juan Pérez');
    await page.fill('input[id="ownerEmail"]', 'juan@example.com');
    await page.click('button:has-text("Siguiente")');

    // Paso 4: Saltar fotos
    await page.click('button:has-text("Saltar paso")');

    // Paso 5: Finalizar
    await page.click('button:has-text("Finalizar")');

    // 11. Verificar mensaje de éxito
    await expect(page.locator('text=Propiedad creada exitosamente')).toBeVisible();

    // 12. Navegar de vuelta a onboarding
    await page.goto('/onboarding');

    // 13. Verificar que tarea está completada
    const completedTask = page.locator('[data-testid="task-create-property"][data-status="completed"]');
    await expect(completedTask).toBeVisible();

    // 14. Verificar progreso actualizado
    await expect(progressText).toContainText('14%'); // 1 de 7 tareas
  });

  test('Usuario puede saltar tareas opcionales', async ({ page }) => {
    // TODO: Implementar
  });

  test('Progreso se guarda si usuario cierra y vuelve', async ({ page }) => {
    // TODO: Implementar
  });
});
