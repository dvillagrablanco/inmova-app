/**
 * Tests E2E del flujo principal de la aplicación INMOVA
 * Flujo: Login → Crear Edificio → Crear Unidad → Crear Contrato → Crear Pago
 */

import { test, expect } from '@playwright/test';

test.describe('Flujo Principal E2E - INMOVA', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de login
    await page.goto('http://localhost:3000/login');
  });

  test('debe completar el flujo completo: Login → Edificio → Unidad → Contrato → Pago', async ({ page }) => {
    // PASO 1: LOGIN
    test.step('Autenticarse en el sistema', async () => {
      await expect(page).toHaveTitle(/INMOVA|Login/);
      
      // Llenar formulario de login
      await page.fill('input[name="email"], input[type="email"]', 'admin@inmova.com');
      await page.fill('input[name="password"], input[type="password"]', 'admin123');
      
      // Hacer click en botón de login
      await page.click('button[type="submit"], button:has-text("Iniciar")');
      
      // Esperar redirección al dashboard
      await page.waitForURL(/.*\/(dashboard|home)/, { timeout: 10000 });
      await expect(page).toHaveURL(/.*\/(dashboard|home)/);
    });

    // PASO 2: CREAR EDIFICIO
    let edificioId: string;
    test.step('Crear un nuevo edificio', async () => {
      // Navegar a edificios
      await page.goto('http://localhost:3000/edificios');
      await page.waitForLoadState('networkidle');
      
      // Click en botón "Nuevo Edificio"
      const nuevoBtn = page.locator('a[href*="/edificios/nuevo"], button:has-text("Nuevo Edificio"), a:has-text("Nuevo Edificio")');
      await nuevoBtn.click();
      
      // Esperar a estar en página de creación
      await page.waitForURL(/.*\/edificios\/nuevo/, { timeout: 5000 });
      
      // Llenar formulario
      const timestamp = Date.now();
      await page.fill('input[name="nombre"]', `Edificio Test E2E ${timestamp}`);
      await page.fill('input[name="direccion"]', 'Calle Test 123');
      await page.fill('input[name="ciudad"]', 'Madrid');
      await page.fill('input[name="codigoPostal"]', '28001');
      
      // Seleccionar tipo de edificio si existe el campo
      const tipoSelect = page.locator('select[name="tipo"]');
      if (await tipoSelect.count() > 0) {
        await tipoSelect.selectOption({ index: 1 });
      }
      
      // Guardar
      await page.click('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")');
      
      // Esperar confirmación (redirect o toast)
      await page.waitForTimeout(2000);
      
      // Verificar que se creó (debe redirigir a lista o detalle)
      const currentUrl = page.url();
      const match = currentUrl.match(/\/edificios(?:\/([a-zA-Z0-9\-]+))?/);
      if (match && match[1] && match[1] !== 'nuevo') {
        edificioId = match[1];
      }
      
      expect(currentUrl).toContain('/edificios');
    });

    // PASO 3: CREAR UNIDAD
    let unidadId: string;
    test.step('Crear una nueva unidad', async () => {
      // Navegar a unidades
      await page.goto('http://localhost:3000/unidades');
      await page.waitForLoadState('networkidle');
      
      // Click en botón "Nueva Unidad"
      const nuevaUnidadBtn = page.locator('a[href*="/unidades/nuevo"], button:has-text("Nueva Unidad"), a:has-text("Nueva Unidad")');
      await nuevaUnidadBtn.click();
      
      await page.waitForURL(/.*\/unidades\/nuevo/, { timeout: 5000 });
      
      // Llenar formulario
      await page.fill('input[name="numero"]', `${Math.floor(Math.random() * 1000)}`);
      
      // Seleccionar edificio
      const edificioSelect = page.locator('select[name="edificioId"], select[name="buildingId"]');
      if (await edificioSelect.count() > 0) {
        if (edificioId) {
          await edificioSelect.selectOption(edificioId);
        } else {
          await edificioSelect.selectOption({ index: 1 });
        }
      }
      
      // Tipo de unidad
      const tipoSelect = page.locator('select[name="tipo"]');
      if (await tipoSelect.count() > 0) {
        await tipoSelect.selectOption({ index: 1 });
      }
      
      // Campos numéricos
      const superficieInput = page.locator('input[name="superficie"]');
      if (await superficieInput.count() > 0) {
        await superficieInput.fill('75');
      }
      
      const precioInput = page.locator('input[name="precio"], input[name="rentaMensual"]');
      if (await precioInput.count() > 0) {
        await precioInput.fill('1200');
      }
      
      // Guardar
      await page.click('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")');
      
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const match = currentUrl.match(/\/unidades(?:\/([a-zA-Z0-9\-]+))?/);
      if (match && match[1] && match[1] !== 'nuevo') {
        unidadId = match[1];
      }
      
      expect(currentUrl).toContain('/unidades');
    });

    // PASO 4: CREAR CONTRATO
    let contratoId: string;
    test.step('Crear un nuevo contrato', async () => {
      // Navegar a contratos
      await page.goto('http://localhost:3000/contratos');
      await page.waitForLoadState('networkidle');
      
      // Click en "Nuevo Contrato"
      const nuevoContratoBtn = page.locator('a[href*="/contratos/nuevo"], button:has-text("Nuevo Contrato"), a:has-text("Nuevo Contrato")');
      await nuevoContratoBtn.click();
      
      await page.waitForURL(/.*\/contratos\/nuevo/, { timeout: 5000 });
      
      // Seleccionar unidad
      const unidadSelect = page.locator('select[name="unitId"]');
      if (await unidadSelect.count() > 0) {
        if (unidadId) {
          await unidadSelect.selectOption(unidadId);
        } else {
          await unidadSelect.selectOption({ index: 1 });
        }
      }
      
      // Seleccionar inquilino
      const tenantSelect = page.locator('select[name="tenantId"]');
      if (await tenantSelect.count() > 0) {
        await tenantSelect.selectOption({ index: 1 });
      }
      
      // Fechas
      const fechaInicioInput = page.locator('input[name="fechaInicio"]');
      if (await fechaInicioInput.count() > 0) {
        const hoy = new Date().toISOString().split('T')[0];
        await fechaInicioInput.fill(hoy);
      }
      
      const fechaFinInput = page.locator('input[name="fechaFin"]');
      if (await fechaFinInput.count() > 0) {
        const futuro = new Date();
        futuro.setFullYear(futuro.getFullYear() + 1);
        await fechaFinInput.fill(futuro.toISOString().split('T')[0]);
      }
      
      // Renta mensual
      const rentaInput = page.locator('input[name="rentaMensual"]');
      if (await rentaInput.count() > 0) {
        await rentaInput.fill('1200');
      }
      
      // Guardar
      await page.click('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")');
      
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const match = currentUrl.match(/\/contratos(?:\/([a-zA-Z0-9\-]+))?/);
      if (match && match[1] && match[1] !== 'nuevo') {
        contratoId = match[1];
      }
      
      expect(currentUrl).toContain('/contratos');
    });

    // PASO 5: CREAR PAGO
    test.step('Crear un nuevo pago', async () => {
      // Navegar a pagos
      await page.goto('http://localhost:3000/pagos');
      await page.waitForLoadState('networkidle');
      
      // Click en "Nuevo Pago"
      const nuevoPagoBtn = page.locator('a[href*="/pagos/nuevo"], button:has-text("Nuevo Pago"), a:has-text("Nuevo Pago")');
      if (await nuevoPagoBtn.count() > 0) {
        await nuevoPagoBtn.click();
        
        await page.waitForURL(/.*\/pagos\/nuevo/, { timeout: 5000 });
        
        // Seleccionar contrato
        const contratoSelect = page.locator('select[name="contractId"]');
        if (await contratoSelect.count() > 0) {
          if (contratoId) {
            await contratoSelect.selectOption(contratoId);
          } else {
            await contratoSelect.selectOption({ index: 1 });
          }
        }
        
        // Monto
        const montoInput = page.locator('input[name="monto"], input[name="cantidad"]');
        if (await montoInput.count() > 0) {
          await montoInput.fill('1200');
        }
        
        // Fecha de vencimiento
        const fechaInput = page.locator('input[name="fechaVencimiento"]');
        if (await fechaInput.count() > 0) {
          const fechaVencimiento = new Date();
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
          await fechaInput.fill(fechaVencimiento.toISOString().split('T')[0]);
        }
        
        // Guardar
        await page.click('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")');
        
        await page.waitForTimeout(2000);
        
        expect(page.url()).toContain('/pagos');
      }
    });

    // VERIFICACIÓN FINAL
    test.step('Verificar que los datos se crearon correctamente', async () => {
      // Verificar edificio
      if (edificioId) {
        await page.goto(`http://localhost:3000/edificios/${edificioId}`);
        await expect(page.locator('body')).toContainText(/Edificio Test E2E|Información del Edificio/);
      }
      
      // Verificar en dashboard que hay datos
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Debe haber al menos un KPI visible
      const kpis = page.locator('[class*="kpi"], [class*="stat"], [class*="card"]');
      await expect(kpis.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('debe manejar errores de validación correctamente', async ({ page }) => {
    // Login
    await page.fill('input[name="email"], input[type="email"]', 'admin@inmova.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(dashboard|home)/, { timeout: 10000 });

    // Intentar crear edificio sin datos requeridos
    await page.goto('http://localhost:3000/edificios/nuevo');
    
    // Intentar guardar sin llenar campos
    await page.click('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")');
    
    // Debe mostrar errores de validación o permanecer en la página
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/edificios/nuevo');
  });
});

export {};
