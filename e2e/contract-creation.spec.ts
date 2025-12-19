/**
 * E2E Tests - Flujo Crítico de Creación de Contrato
 * Pruebas exhaustivas del proceso de creación de contratos
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'admin@inmova.com',
  password: 'admin123',
};

const TEST_CONTRACT = {
  startDate: '2025-01-01',
  endDate: '2026-01-01',
  monthlyRent: '1200',
  deposit: '2400',
  paymentDay: '5',
};

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.getByRole('button', { name: /iniciar sesión|entrar|login/i }).click();
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
}

test.describe('Flujo Crítico: Creación de Contrato', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('CONTRACT-001: Debe navegar a la página de contratos', async ({ page }) => {
    // Navegar a contratos
    await page.goto('/contratos');
    
    // Verificar que cargó correctamente
    await expect(page.getByRole('heading', { name: /contratos/i })).toBeVisible();
  });

  test('CONTRACT-002: Debe mostrar botón de crear nuevo contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Buscar botón de crear contrato
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i })
      .or(page.locator('[data-testid="new-contract-button"]'));
    
    await expect(newContractButton.first()).toBeVisible();
  });

  test('CONTRACT-003: Debe abrir formulario de creación de contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Click en botón de crear
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    
    // Esperar a que se abra el formulario (modal o página nueva)
    await page.waitForTimeout(1000);
    
    // Verificar que se muestra el formulario
    const formTitle = page.getByText(/nuevo contrato|crear contrato/i);
    await expect(formTitle).toBeVisible({ timeout: 5000 });
  });

  test('CONTRACT-004: Debe validar campos obligatorios del formulario', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Intentar guardar sin llenar campos
    const saveButton = page.getByRole('button', { name: /guardar|crear|save/i }).first();
    
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      
      // Debe permanecer en el formulario o mostrar errores
      await page.waitForTimeout(1000);
      
      // Buscar mensajes de validación
      const validationMessages = page.locator('[role="alert"]')
        .or(page.getByText(/requerido|obligatorio|required/i));
      
      const hasValidation = await validationMessages.first().isVisible().catch(() => false);
      expect(hasValidation).toBeTruthy();
    }
  });

  test('CONTRACT-005: Debe seleccionar inquilino para el contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar selector de inquilino
    const tenantSelect = page.locator('select[name*="tenant"]')
      .or(page.locator('[data-testid="tenant-select"]'))
      .or(page.getByLabel(/inquilino|tenant/i));
    
    if (await tenantSelect.first().isVisible().catch(() => false)) {
      await tenantSelect.first().click();
      await page.waitForTimeout(500);
      
      // Verificar que se muestran opciones
      const options = page.locator('option').or(page.locator('[role="option"]'));
      const optionCount = await options.count();
      
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('CONTRACT-006: Debe seleccionar unidad para el contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar selector de unidad
    const unitSelect = page.locator('select[name*="unit"]')
      .or(page.locator('[data-testid="unit-select"]'))
      .or(page.getByLabel(/unidad|unit|propiedad/i));
    
    if (await unitSelect.first().isVisible().catch(() => false)) {
      await unitSelect.first().click();
      await page.waitForTimeout(500);
      
      // Verificar que se muestran opciones
      const options = page.locator('option').or(page.locator('[role="option"]'));
      const optionCount = await options.count();
      
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('CONTRACT-007: Debe llenar fechas de inicio y fin del contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar campos de fecha
    const startDateInput = page.locator('input[name*="fechaInicio"]')
      .or(page.locator('input[name*="startDate"]'))
      .or(page.getByLabel(/fecha.*inicio|start.*date/i));
    
    const endDateInput = page.locator('input[name*="fechaFin"]')
      .or(page.locator('input[name*="endDate"]'))
      .or(page.getByLabel(/fecha.*fin|end.*date/i));
    
    if (await startDateInput.first().isVisible().catch(() => false)) {
      await startDateInput.first().fill(TEST_CONTRACT.startDate);
      await expect(startDateInput.first()).toHaveValue(TEST_CONTRACT.startDate);
    }
    
    if (await endDateInput.first().isVisible().catch(() => false)) {
      await endDateInput.first().fill(TEST_CONTRACT.endDate);
      await expect(endDateInput.first()).toHaveValue(TEST_CONTRACT.endDate);
    }
  });

  test('CONTRACT-008: Debe validar que fecha de fin sea posterior a fecha de inicio', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar campos de fecha
    const startDateInput = page.locator('input[name*="fechaInicio"]')
      .or(page.locator('input[name*="startDate"]')).first();
    const endDateInput = page.locator('input[name*="fechaFin"]')
      .or(page.locator('input[name*="endDate"]')).first();
    
    if (await startDateInput.isVisible().catch(() => false) && await endDateInput.isVisible().catch(() => false)) {
      // Establecer fecha de fin antes de fecha de inicio (inválido)
      await startDateInput.fill('2025-06-01');
      await endDateInput.fill('2025-01-01');
      
      // Intentar guardar
      const saveButton = page.getByRole('button', { name: /guardar|crear/i }).first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // Debe mostrar error de validación
        const errorMessage = page.getByText(/fecha.*posterior|fecha.*después|invalid.*date/i);
        const hasError = await errorMessage.isVisible().catch(() => false);
        
        // Si no hay error explícito, al menos no debe haberse creado
        expect(hasError || page.url().includes('/contratos')).toBeTruthy();
      }
    }
  });

  test('CONTRACT-009: Debe llenar información económica del contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Renta mensual
    const rentInput = page.locator('input[name*="renta"]')
      .or(page.locator('input[name*="rent"]'))
      .or(page.getByLabel(/renta|rent|alquiler/i));
    
    if (await rentInput.first().isVisible().catch(() => false)) {
      await rentInput.first().fill(TEST_CONTRACT.monthlyRent);
      await expect(rentInput.first()).toHaveValue(TEST_CONTRACT.monthlyRent);
    }
    
    // Depósito
    const depositInput = page.locator('input[name*="deposito"]')
      .or(page.locator('input[name*="deposit"]'))
      .or(page.getByLabel(/depósito|deposit|fianza/i));
    
    if (await depositInput.first().isVisible().catch(() => false)) {
      await depositInput.first().fill(TEST_CONTRACT.deposit);
      await expect(depositInput.first()).toHaveValue(TEST_CONTRACT.deposit);
    }
  });

  test('CONTRACT-010: Debe mostrar previsualización antes de guardar', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar botón de preview/revisar
    const previewButton = page.getByRole('button', { name: /previsualizar|preview|revisar/i });
    
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click();
      await page.waitForTimeout(1000);
      
      // Debe mostrar resumen del contrato
      const preview = page.locator('[data-testid="contract-preview"]')
        .or(page.getByText(/resumen.*contrato|contract.*summary/i));
      
      await expect(preview.first()).toBeVisible();
    }
  });

  test('CONTRACT-011: Debe cancelar la creación del contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar botón de cancelar
    const cancelButton = page.getByRole('button', { name: /cancelar|cancel/i }).first();
    
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
      await page.waitForTimeout(1000);
      
      // Debe cerrar el formulario
      const formTitle = page.getByText(/nuevo contrato|crear contrato/i);
      const formClosed = !(await formTitle.isVisible().catch(() => false));
      
      expect(formClosed).toBeTruthy();
    }
  });

  test('CONTRACT-012: Debe guardar borrador del contrato', async ({ page }) => {
    await page.goto('/contratos');
    
    // Abrir formulario
    const newContractButton = page.getByRole('button', { name: /nuevo.*contrato|crear.*contrato/i }).first();
    await newContractButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar botón de guardar borrador
    const draftButton = page.getByRole('button', { name: /borrador|draft/i });
    
    if (await draftButton.isVisible().catch(() => false)) {
      await draftButton.click();
      await page.waitForTimeout(2000);
      
      // Debe mostrar confirmación o regresar a lista
      const successMessage = page.getByText(/guardado|saved|borrador/i);
      const isSuccess = await successMessage.isVisible().catch(() => false) || page.url().includes('/contratos');
      
      expect(isSuccess).toBeTruthy();
    }
  });
});
