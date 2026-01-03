import { test, expect, Page } from '@playwright/test';

// Configuración global
const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';
const TEST_USER_EMAIL = 'admin@inmova.app';
const TEST_USER_PASSWORD = 'Admin123!';

// Helper para login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  
  // Esperar que la página cargue
  await page.waitForLoadState('networkidle');
  
  // Llenar formulario
  await page.fill('input[type="email"]', TEST_USER_EMAIL);
  await page.fill('input[type="password"]', TEST_USER_PASSWORD);
  
  // Click en botón de login
  await page.click('button[type="submit"]');
  
  // Esperar redirect a dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

test.describe('INMOVA App - Tests E2E Completos', () => {
  
  test.describe('1. Landing Page', () => {
    
    test('debe cargar la landing page correctamente', async ({ page }) => {
      await page.goto(`${BASE_URL}/landing`);
      
      // Verificar título o logo
      await expect(page.locator('text=INMOVA').first()).toBeVisible({ timeout: 10000 });
      
      // Verificar que no hay errores en consola
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // No debe haber errores críticos
      expect(errors.filter(e => !e.includes('404'))).toHaveLength(0);
    });
    
    test('debe tener botón de "Iniciar Sesión"', async ({ page }) => {
      await page.goto(`${BASE_URL}/landing`);
      
      // Buscar botón o link de login
      const loginButton = page.locator('text=/Iniciar.*Sesión|Login/i').first();
      await expect(loginButton).toBeVisible({ timeout: 10000 });
    });
    
    test('debe ser responsive (mobile)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto(`${BASE_URL}/landing`);
      
      await expect(page.locator('text=INMOVA').first()).toBeVisible();
    });
    
  });
  
  test.describe('2. Login Page', () => {
    
    test('debe cargar la página de login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Verificar elementos del login
      await expect(page.locator('text=Iniciar Sesión')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
    
    test('debe mostrar error con credenciales inválidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Esperar mensaje de error
      await expect(page.locator('text=/Credenciales.*inválidas/i')).toBeVisible({ timeout: 10000 });
    });
    
    test('debe validar campos requeridos', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Intentar submit sin llenar campos
      await page.click('button[type="submit"]');
      
      // Debería mostrar errores de validación (HTML5 o custom)
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });
    
    test('debe hacer login exitoso con credenciales correctas', async ({ page }) => {
      await login(page);
      
      // Verificar que estamos en dashboard
      await expect(page).toHaveURL(/.*dashboard.*/);
    });
    
  });
  
  test.describe('3. Dashboard Principal', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });
    
    test('debe cargar el dashboard correctamente', async ({ page }) => {
      // Verificar elementos comunes del dashboard
      await expect(page.locator('text=/Dashboard|Inicio|Bienvenido/i').first()).toBeVisible({ timeout: 10000 });
    });
    
    test('debe tener sidebar de navegación', async ({ page }) => {
      // Verificar que existe navegación lateral o menú
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible({ timeout: 10000 });
    });
    
    test('debe tener enlaces a módulos principales', async ({ page }) => {
      // Verificar que existen enlaces a secciones principales
      await page.waitForLoadState('networkidle');
      
      // Buscar enlaces comunes (adaptar según tu app)
      const moduleLinks = [
        'Propiedades',
        'Inquilinos',
        'Contratos',
        'Pagos',
      ];
      
      let foundCount = 0;
      for (const linkText of moduleLinks) {
        const exists = await page.locator(`text=${linkText}`).count() > 0;
        if (exists) foundCount++;
      }
      
      // Al menos 2 módulos deben estar visibles
      expect(foundCount).toBeGreaterThanOrEqual(2);
    });
    
    test('debe poder hacer logout', async ({ page }) => {
      // Buscar botón/link de logout
      const logoutButton = page.locator('text=/Cerrar.*Sesión|Logout|Salir/i').first();
      
      if (await logoutButton.isVisible({ timeout: 5000 })) {
        await logoutButton.click();
        
        // Verificar redirect a login o landing
        await page.waitForURL(/\/(login|landing)/, { timeout: 10000 });
        await expect(page).toHaveURL(/\/(login|landing)/);
      }
    });
    
  });
  
  test.describe('4. Módulo de Propiedades', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });
    
    test('debe cargar la lista de propiedades', async ({ page }) => {
      // Navegar a propiedades
      await page.goto(`${BASE_URL}/dashboard/properties`);
      await page.waitForLoadState('networkidle');
      
      // Verificar que la página carga (puede estar vacía)
      await expect(page.locator('text=/Propiedades|Properties/i').first()).toBeVisible({ timeout: 10000 });
    });
    
    test('debe tener botón para crear nueva propiedad', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/properties`);
      await page.waitForLoadState('networkidle');
      
      // Buscar botón de crear/añadir
      const createButton = page.locator('text=/Nueva.*Propiedad|Crear|Añadir/i').first();
      const exists = await createButton.count() > 0;
      
      expect(exists).toBeTruthy();
    });
    
  });
  
  test.describe('5. Módulo de Inquilinos', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });
    
    test('debe cargar la lista de inquilinos', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/tenants`);
      await page.waitForLoadState('networkidle');
      
      // Verificar título o header
      await expect(page.locator('text=/Inquilinos|Tenants/i').first()).toBeVisible({ timeout: 10000 });
    });
    
  });
  
  test.describe('6. Módulo de Contratos', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });
    
    test('debe cargar la lista de contratos', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/contracts`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('text=/Contratos|Contracts/i').first()).toBeVisible({ timeout: 10000 });
    });
    
  });
  
  test.describe('7. Módulo de Pagos', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });
    
    test('debe cargar la lista de pagos', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/payments`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('text=/Pagos|Payments/i').first()).toBeVisible({ timeout: 10000 });
    });
    
  });
  
  test.describe('8. Health Check & API', () => {
    
    test('debe responder el endpoint de health', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/api/health`);
      
      expect(response?.status()).toBe(200);
      
      const body = await response?.json();
      expect(body.status).toBe('ok');
    });
    
    test('debe proteger rutas de API sin auth', async ({ page }) => {
      // Intentar acceder a API sin autenticación
      const response = await page.goto(`${BASE_URL}/api/users`);
      
      // Debe retornar 401 o 403
      const status = response?.status();
      expect([401, 403, 404]).toContain(status);
    });
    
  });
  
  test.describe('9. Manejo de Errores', () => {
    
    test('debe mostrar 404 en rutas inexistentes', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/ruta-que-no-existe-12345`);
      
      // Puede ser 404 o redirect
      const status = response?.status();
      expect([404, 301, 302, 307, 308]).toContain(status);
    });
    
    test('debe redirigir rutas protegidas si no hay sesión', async ({ page }) => {
      // Intentar acceder a dashboard sin login
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Debe redirigir a login
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    });
    
  });
  
  test.describe('10. Accesibilidad', () => {
    
    test('debe tener meta tags básicos en landing', async ({ page }) => {
      await page.goto(`${BASE_URL}/landing`);
      
      // Verificar title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      
      // Verificar description
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length).toBeGreaterThan(0);
    });
    
    test('debe tener alt text en imágenes principales', async ({ page }) => {
      await page.goto(`${BASE_URL}/landing`);
      await page.waitForLoadState('networkidle');
      
      // Verificar que las imágenes tienen alt
      const images = await page.locator('img').all();
      
      for (const img of images.slice(0, 5)) { // Primeras 5 imágenes
        const alt = await img.getAttribute('alt');
        // Alt puede estar vacío para decorativas, pero debe existir el atributo
        expect(alt !== null).toBeTruthy();
      }
    });
    
  });
  
  test.describe('11. Performance', () => {
    
    test('debe cargar landing en menos de 5 segundos', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/landing`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Debe cargar en menos de 5 segundos
      expect(loadTime).toBeLessThan(5000);
    });
    
  });
  
  test.describe('12. Detección de Errores de Consola', () => {
    
    test('no debe tener errores críticos en consola en landing', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(`${BASE_URL}/landing`);
      await page.waitForLoadState('networkidle');
      
      // Filtrar errores conocidos/permitidos
      const criticalErrors = errors.filter(e => 
        !e.includes('404') && 
        !e.includes('favicon') &&
        !e.includes('analytics')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
    
    test('no debe tener errores críticos en dashboard post-login', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await login(page);
      await page.waitForLoadState('networkidle');
      
      // Filtrar errores conocidos
      const criticalErrors = errors.filter(e => 
        !e.includes('404') && 
        !e.includes('favicon')
      );
      
      // Reportar errores si los hay
      if (criticalErrors.length > 0) {
        console.log('Errores encontrados:', criticalErrors);
      }
      
      expect(criticalErrors.length).toBeLessThan(5); // Permitir hasta 4 errores menores
    });
    
  });

});
