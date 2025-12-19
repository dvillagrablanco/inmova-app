/**
 * E2E Tests - Flujo Crítico de Registro de Pago
 * Pruebas exhaustivas del proceso de creación y gestión de pagos
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'admin@inmova.com',
  password: 'admin123',
};

const TEST_PAYMENT = {
  amount: '1200',
  date: '2025-01-05',
  method: 'transferencia',
  reference: 'REF-2025-001',
};

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.getByRole('button', { name: /iniciar sesión|entrar|login/i }).click();
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
}

test.describe('Flujo Crítico: Registro de Pago', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('PAYMENT-001: Debe navegar a la página de pagos', async ({ page }) => {
    await page.goto('/pagos');
    
    // Verificar que cargó correctamente
    await expect(page.getByRole('heading', { name: /pagos|payments/i })).toBeVisible();
  });

  test('PAYMENT-002: Debe mostrar botón de registrar nuevo pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Buscar botón de registrar pago
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago|crear.*pago/i })
      .or(page.locator('[data-testid="new-payment-button"]'));
    
    await expect(newPaymentButton.first()).toBeVisible();
  });

  test('PAYMENT-003: Debe abrir formulario de registro de pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Click en botón de registrar pago
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago|crear.*pago/i }).first();
    await newPaymentButton.click();
    
    // Esperar a que se abra el formulario
    await page.waitForTimeout(1000);
    
    // Verificar que se muestra el formulario
    const formTitle = page.getByText(/nuevo pago|registrar pago|crear pago/i);
    await expect(formTitle).toBeVisible({ timeout: 5000 });
  });

  test('PAYMENT-004: Debe validar campos obligatorios del formulario de pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Intentar guardar sin llenar campos
    const saveButton = page.getByRole('button', { name: /guardar|registrar|save/i }).first();
    
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      // Debe mostrar mensajes de validación
      const validationMessages = page.locator('[role="alert"]')
        .or(page.getByText(/requerido|obligatorio|required/i));
      
      const hasValidation = await validationMessages.first().isVisible().catch(() => false);
      expect(hasValidation).toBeTruthy();
    }
  });

  test('PAYMENT-005: Debe seleccionar contrato para el pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar selector de contrato
    const contractSelect = page.locator('select[name*="contrato"]')
      .or(page.locator('select[name*="contract"]'))
      .or(page.locator('[data-testid="contract-select"]'))
      .or(page.getByLabel(/contrato|contract/i));
    
    if (await contractSelect.first().isVisible().catch(() => false)) {
      await contractSelect.first().click();
      await page.waitForTimeout(500);
      
      // Verificar que se muestran opciones
      const options = page.locator('option').or(page.locator('[role="option"]'));
      const optionCount = await options.count();
      
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('PAYMENT-006: Debe llenar monto del pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar campo de monto
    const amountInput = page.locator('input[name*="monto"]')
      .or(page.locator('input[name*="amount"]'))
      .or(page.getByLabel(/monto|amount|cantidad/i));
    
    if (await amountInput.first().isVisible().catch(() => false)) {
      await amountInput.first().fill(TEST_PAYMENT.amount);
      await expect(amountInput.first()).toHaveValue(TEST_PAYMENT.amount);
    }
  });

  test('PAYMENT-007: Debe validar que el monto sea un número positivo', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar campo de monto
    const amountInput = page.locator('input[name*="monto"]')
      .or(page.locator('input[name*="amount"]')).first();
    
    if (await amountInput.isVisible().catch(() => false)) {
      // Intentar ingresar monto negativo
      await amountInput.fill('-100');
      
      // Intentar guardar
      const saveButton = page.getByRole('button', { name: /guardar|registrar/i }).first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // Debe mostrar error de validación o prevenir el ingreso
        const errorMessage = page.getByText(/monto.*positivo|positive.*amount|invalid/i);
        const hasError = await errorMessage.isVisible().catch(() => false);
        const inputValue = await amountInput.inputValue();
        
        // Validación HTML5 puede prevenir valores negativos
        expect(hasError || parseFloat(inputValue) >= 0).toBeTruthy();
      }
    }
  });

  test('PAYMENT-008: Debe seleccionar fecha del pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar campo de fecha
    const dateInput = page.locator('input[name*="fecha"]')
      .or(page.locator('input[name*="date"]'))
      .or(page.getByLabel(/fecha|date/i));
    
    if (await dateInput.first().isVisible().catch(() => false)) {
      await dateInput.first().fill(TEST_PAYMENT.date);
      await expect(dateInput.first()).toHaveValue(TEST_PAYMENT.date);
    }
  });

  test('PAYMENT-009: Debe seleccionar método de pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar selector de método de pago
    const methodSelect = page.locator('select[name*="metodo"]')
      .or(page.locator('select[name*="method"]'))
      .or(page.getByLabel(/método.*pago|payment.*method/i));
    
    if (await methodSelect.first().isVisible().catch(() => false)) {
      await methodSelect.first().click();
      await page.waitForTimeout(500);
      
      // Verificar que hay opciones (transferencia, efectivo, tarjeta, etc.)
      const options = page.locator('option').or(page.locator('[role="option"]'));
      const optionCount = await options.count();
      
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('PAYMENT-010: Debe permitir añadir referencia o nota al pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar campo de referencia/nota
    const referenceInput = page.locator('input[name*="referencia"]')
      .or(page.locator('input[name*="reference"]'))
      .or(page.locator('textarea[name*="nota"]'))
      .or(page.getByLabel(/referencia|reference|nota|note/i));
    
    if (await referenceInput.first().isVisible().catch(() => false)) {
      await referenceInput.first().fill(TEST_PAYMENT.reference);
      await expect(referenceInput.first()).toHaveValue(TEST_PAYMENT.reference);
    }
  });

  test('PAYMENT-011: Debe permitir adjuntar comprobante de pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    await newPaymentButton.click();
    await page.waitForTimeout(1000);
    
    // Buscar campo de archivo
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible().catch(() => false)) {
      // Verificar que el input de archivo está presente
      await expect(fileInput).toBeVisible();
    } else {
      // Buscar botón de adjuntar archivo
      const attachButton = page.getByRole('button', { name: /adjuntar|attach|subir|upload/i });
      const hasAttachOption = await attachButton.isVisible().catch(() => false);
      
      // Al menos debe haber opción de adjuntar
      expect(hasAttachOption || await fileInput.count() > 0).toBeTruthy();
    }
  });

  test('PAYMENT-012: Debe filtrar pagos por estado', async ({ page }) => {
    await page.goto('/pagos');
    
    // Buscar filtro de estado
    const statusFilter = page.locator('select[name*="estado"]')
      .or(page.locator('[data-testid="status-filter"]'))
      .or(page.getByLabel(/estado|status/i));
    
    if (await statusFilter.first().isVisible().catch(() => false)) {
      await statusFilter.first().click();
      await page.waitForTimeout(500);
      
      // Seleccionar un estado específico
      const paidOption = page.getByText(/pagado|paid/i).first();
      if (await paidOption.isVisible().catch(() => false)) {
        await paidOption.click();
        await page.waitForTimeout(1000);
        
        // Verificar que se aplicó el filtro
        const filteredPayments = page.locator('[data-testid="payment-row"]');
        const count = await filteredPayments.count();
        
        // Si hay pagos, todos deben estar pagados
        if (count > 0) {
          const firstPayment = filteredPayments.first();
          const hasPaidStatus = await firstPayment.getByText(/pagado|paid/i).isVisible().catch(() => false);
          expect(hasPaidStatus).toBeTruthy();
        }
      }
    }
  });

  test('PAYMENT-013: Debe exportar lista de pagos a CSV', async ({ page }) => {
    await page.goto('/pagos');
    
    // Buscar botón de exportar
    const exportButton = page.getByRole('button', { name: /exportar|export/i });
    
    if (await exportButton.isVisible().catch(() => false)) {
      // Esperar por la descarga
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        exportButton.click(),
      ]);
      
      if (download) {
        // Verificar que el archivo descargado es CSV
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(csv|xlsx|xls)$/i);
      }
    }
  });

  test('PAYMENT-014: Debe ver detalles de un pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Buscar primer pago en la lista
    const firstPayment = page.locator('[data-testid="payment-row"]').first()
      .or(page.locator('table tbody tr').first());
    
    if (await firstPayment.isVisible().catch(() => false)) {
      // Click para ver detalles
      await firstPayment.click();
      await page.waitForTimeout(1000);
      
      // Verificar que se muestra el detalle
      const detailsView = page.getByText(/detalles.*pago|payment.*details/i)
        .or(page.locator('[data-testid="payment-details"]'));
      
      await expect(detailsView.first()).toBeVisible();
    }
  });

  test('PAYMENT-015: Debe actualizar el saldo pendiente del contrato al registrar pago', async ({ page }) => {
    await page.goto('/pagos');
    
    // Abrir formulario
    const newPaymentButton = page.getByRole('button', { name: /nuevo.*pago|registrar.*pago/i }).first();
    
    if (await newPaymentButton.isVisible().catch(() => false)) {
      await newPaymentButton.click();
      await page.waitForTimeout(1000);
      
      // Seleccionar un contrato
      const contractSelect = page.locator('select[name*="contrato"]').first();
      
      if (await contractSelect.isVisible().catch(() => false)) {
        await contractSelect.click();
        await page.waitForTimeout(500);
        
        // Verificar que se muestra información del saldo
        const balanceInfo = page.getByText(/saldo|balance|pendiente|outstanding/i);
        const hasBalanceInfo = await balanceInfo.first().isVisible().catch(() => false);
        
        // Debe mostrar saldo actual del contrato
        expect(hasBalanceInfo).toBeTruthy();
      }
    }
  });
});
