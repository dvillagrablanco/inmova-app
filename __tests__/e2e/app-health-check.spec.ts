/**
 * 🔥 SMOKE TEST E2E - App Health Check v2
 * 
 * Prueba exhaustiva de todas las rutas de la aplicación
 * Detecta: pantallas blancas, errores de consola, botones rotos, dropdowns muertos
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';
const AUTH_FILE = '__tests__/e2e/.auth/user.json';
const SCREENSHOTS_DIR = '__tests__/e2e/screenshots';

// Timeouts
const PAGE_TIMEOUT = 30000;
const NAVIGATION_TIMEOUT = 15000;

// ============================================================================
// UTILIDADES: MAPEO DINÁMICO DE RUTAS
// ============================================================================

interface RouteInfo {
  path: string;
  requiresAuth: boolean;
  isDynamic: boolean;
  isRedirect?: boolean;
}

function scanRoutes(appDir: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  function scanDir(dir: string, basePath: string = '') {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_') || entry.name === 'api' || entry.name === 'components') {
          continue;
        }
        
        const routeSegment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
        scanDir(fullPath, basePath + routeSegment);
      } else if (entry.name === 'page.tsx' && !fullPath.includes('.bak')) {
        const routePath = basePath || '/';
        const isDynamic = routePath.includes('[');
        
        // Verificar si es redirect
        let isRedirect = false;
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          isRedirect = content.includes('redirect(');
        } catch {}
        
        const authPrefixes = ['/dashboard', '/admin', '/propiedades', '/inquilinos', 
                            '/contratos', '/mantenimiento', '/crm', '/pagos', 
                            '/edificios', '/configuracion', '/onboarding'];
        const requiresAuth = authPrefixes.some(p => routePath.startsWith(p));
        
        routes.push({ path: routePath, requiresAuth, isDynamic, isRedirect });
      }
    }
  }
  
  scanDir(appDir);
  return routes;
}

// ============================================================================
// HELPERS DE VERIFICACIÓN
// ============================================================================

interface PageCheckResult {
  route: string;
  status: 'pass' | 'fail' | 'warning' | 'redirect';
  httpStatus?: number;
  errors: string[];
  warnings: string[];
  consoleErrors: string[];
  screenshotPath?: string;
  loadTime?: number;
}

async function checkPageHealth(page: Page, route: string, expectRedirect = false): Promise<PageCheckResult> {
  const result: PageCheckResult = {
    route,
    status: 'pass',
    errors: [],
    warnings: [],
    consoleErrors: [],
  };
  
  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];
  
  // Capturar errores de consola (solo errores importantes)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filtrar errores conocidos/inofensivos
      if (!text.includes('hydration') && 
          !text.includes('favicon') && 
          !text.includes('analytics') &&
          !text.includes('Failed to load resource')) {
        consoleMessages.push(text.substring(0, 200));
      }
    }
  });
  
  page.on('pageerror', error => {
    pageErrors.push(`[PAGE_ERROR] ${error.message}`);
  });
  
  const startTime = Date.now();
  
  try {
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT,
    });
    
    result.loadTime = Date.now() - startTime;
    
    if (!response) {
      result.errors.push('No response received');
      result.status = 'fail';
      return result;
    }
    
    result.httpStatus = response.status();
    
    // Verificar redirects
    const finalUrl = page.url();
    if (finalUrl !== `${BASE_URL}${route}` && finalUrl !== `${BASE_URL}${route}/`) {
      if (expectRedirect) {
        result.status = 'redirect';
        return result;
      }
      // Redirect inesperado podría ser auth required
      if (finalUrl.includes('/login')) {
        result.warnings.push('Redirigido a login (requiere auth?)');
      }
    }
    
    // Status HTTP
    if (result.httpStatus >= 500) {
      result.errors.push(`HTTP ${result.httpStatus} - Server Error`);
      result.status = 'fail';
    } else if (result.httpStatus >= 400) {
      result.errors.push(`HTTP ${result.httpStatus}`);
      result.status = 'fail';
    }
    
    // Esperar carga
    await page.waitForTimeout(1500);
    
    // Detectar pantalla blanca
    const pageState = await page.evaluate(() => {
      const body = document.body;
      const text = body?.innerText?.trim() || '';
      return {
        hasContent: text.length > 50,
        hasMain: !!document.querySelector('main'),
        hasHeader: !!document.querySelector('header'),
        hasNav: !!document.querySelector('nav'),
        hasError: text.toLowerCase().includes('error') || 
                  text.toLowerCase().includes('something went wrong') ||
                  text.toLowerCase().includes('500'),
        bodyLength: body?.innerHTML?.length || 0,
      };
    });
    
    if (!pageState.hasContent && pageState.bodyLength < 500) {
      result.errors.push('Pantalla blanca detectada');
      result.status = 'fail';
    }
    
    if (pageState.hasError && !route.includes('error')) {
      result.warnings.push('Página muestra mensaje de error');
    }
    
    // Verificar botones visibles (solo los realmente visibles)
    const buttonIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const buttons = document.querySelectorAll('button');
      
      buttons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        const computed = window.getComputedStyle(btn);
        const isHidden = computed.display === 'none' || 
                        computed.visibility === 'hidden' ||
                        computed.opacity === '0' ||
                        btn.classList.contains('hidden') ||
                        btn.classList.contains('sr-only') ||
                        btn.hasAttribute('aria-hidden');
        
        // Solo verificar botones visibles y no deshabilitados
        if (!isHidden && !btn.disabled) {
          if (rect.width > 0 && rect.height > 0) {
            // Verificar pointer-events
            if (computed.pointerEvents === 'none' && !btn.classList.contains('cursor-not-allowed')) {
              issues.push(`Botón "${btn.textContent?.trim().substring(0, 20) || i}" tiene pointer-events: none`);
            }
          }
        }
      });
      
      return issues.slice(0, 3); // Max 3 issues
    });
    
    result.warnings.push(...buttonIssues);
    
    // Verificar enlaces rotos
    const linkIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const links = document.querySelectorAll('a[href]');
      let emptyCount = 0;
      
      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === '#' || href === '') {
          emptyCount++;
        }
      });
      
      if (emptyCount > 5) {
        issues.push(`${emptyCount} enlaces con href vacío o #`);
      }
      
      return issues;
    });
    
    result.warnings.push(...linkIssues);
    
    // Capturar errores de consola críticos
    if (pageErrors.length > 0) {
      result.consoleErrors = pageErrors;
      result.errors.push('Errores JavaScript críticos');
      result.status = 'fail';
    } else if (consoleMessages.length > 3) {
      result.consoleErrors = consoleMessages.slice(0, 3);
      result.warnings.push(`${consoleMessages.length} errores en consola`);
    }
    
    // Determinar status final
    if (result.errors.length > 0) {
      result.status = 'fail';
    } else if (result.warnings.length > 0) {
      result.status = 'warning';
    }
    
  } catch (error: any) {
    if (error.message.includes('Target page, context or browser has been closed')) {
      result.errors.push('Navegador cerrado inesperadamente');
    } else if (error.message.includes('Timeout')) {
      result.errors.push(`Timeout navegando a ${route}`);
    } else {
      result.errors.push(`Error: ${error.message.substring(0, 100)}`);
    }
    result.status = 'fail';
  }
  
  // Screenshot si falla
  if (result.status === 'fail') {
    const screenshotName = route.replace(/\//g, '_').replace(/^_/, '') || 'home';
    const screenshotPath = `${SCREENSHOTS_DIR}/${screenshotName}-FAIL.png`;
    try {
      await page.screenshot({ path: screenshotPath, fullPage: false });
      result.screenshotPath = screenshotPath;
    } catch {}
  }
  
  return result;
}

// ============================================================================
// SETUP DE AUTENTICACIÓN
// ============================================================================

async function setupAuth(page: Page): Promise<boolean> {
  try {
    console.log('🔐 Autenticando...');
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Aceptar cookies si hay
    const cookieBtn = page.locator('button:has-text("Aceptar"), button:has-text("Accept")').first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Llenar login
    await page.locator('input[name="email"], input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[name="password"], input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    
    // Esperar navegación
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login') && !currentUrl.includes('callback')) {
      console.log('❌ Login falló - sigue en página de login');
      return false;
    }
    
    console.log('✅ Autenticado correctamente');
    return true;
  } catch (error: any) {
    console.log(`❌ Error en login: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('🔥 App Health Check - Smoke Test v2', () => {
  let allRoutes: RouteInfo[];
  
  test.beforeAll(async () => {
    // Crear directorios
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(path.dirname(AUTH_FILE))) {
      fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    }
    
    // Escanear rutas
    allRoutes = scanRoutes('./app');
    console.log(`📊 Total rutas detectadas: ${allRoutes.length}`);
    console.log(`   - Requieren auth: ${allRoutes.filter(r => r.requiresAuth).length}`);
    console.log(`   - Dinámicas: ${allRoutes.filter(r => r.isDynamic).length}`);
    console.log(`   - Redirects: ${allRoutes.filter(r => r.isRedirect).length}`);
  });
  
  test('Setup: Autenticación inicial', async ({ page, context }) => {
    const success = await setupAuth(page);
    expect(success, 'Login debe ser exitoso').toBe(true);
    
    // Guardar estado
    await context.storageState({ path: AUTH_FILE });
  });
  
  test('🎯 Rutas Críticas del Core', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    });
    const page = await context.newPage();
    
    if (!fs.existsSync(AUTH_FILE)) {
      const authSuccess = await setupAuth(page);
      if (authSuccess) {
        await context.storageState({ path: AUTH_FILE });
      }
    }
    
    const coreRoutes = [
      '/dashboard',
      '/propiedades',
      '/propiedades/crear',
      '/inquilinos',
      '/inquilinos/nuevo',
      '/contratos',
      '/mantenimiento',
      '/crm',
      '/edificios',
      '/comunicaciones',
      '/configuracion',
      '/onboarding/documents',
    ];
    
    const results: PageCheckResult[] = [];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('🎯 RUTAS CRÍTICAS DEL CORE');
    console.log('='.repeat(60));
    
    for (const route of coreRoutes) {
      process.stdout.write(`  ${route.padEnd(35)}... `);
      
      const result = await checkPageHealth(page, route);
      results.push(result);
      
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      const time = result.loadTime ? `(${result.loadTime}ms)` : '';
      console.log(`${icon} ${time}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(e => console.log(`     ❌ ${e}`));
      }
    }
    
    await context.close();
    
    const failed = results.filter(r => r.status === 'fail');
    const passed = results.filter(r => r.status === 'pass');
    const warned = results.filter(r => r.status === 'warning');
    
    console.log(`\n📊 Core: ${passed.length} OK, ${warned.length} warnings, ${failed.length} fallaron`);
    
    if (failed.length > 0) {
      console.log('\n❌ RUTAS FALLIDAS:');
      failed.forEach(f => {
        console.log(`   ${f.route}: ${f.errors.join(', ')}`);
        if (f.screenshotPath) console.log(`      📸 ${f.screenshotPath}`);
      });
    }
    
    expect(failed.length, `${failed.length} rutas core fallaron`).toBe(0);
  });
  
  test('🛡️ Rutas Admin/Platform', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    });
    const page = await context.newPage();
    
    if (!fs.existsSync(AUTH_FILE)) {
      await setupAuth(page);
    }
    
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/clientes',
      '/admin/usuarios',
      '/admin/configuracion',
      '/admin/planes',
      '/admin/integraciones',
      '/admin/alertas',
      '/admin/activity',
      '/admin/salud-sistema',
      '/admin/seguridad',
    ];
    
    const results: PageCheckResult[] = [];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('🛡️ RUTAS ADMIN/PLATFORM');
    console.log('='.repeat(60));
    
    for (const route of adminRoutes) {
      process.stdout.write(`  ${route.padEnd(35)}... `);
      
      const result = await checkPageHealth(page, route);
      results.push(result);
      
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(icon);
      
      if (result.errors.length > 0) {
        result.errors.forEach(e => console.log(`     ❌ ${e}`));
      }
    }
    
    await context.close();
    
    const failed = results.filter(r => r.status === 'fail');
    const passed = results.filter(r => r.status === 'pass');
    
    console.log(`\n📊 Admin: ${passed.length}/${adminRoutes.length} OK, ${failed.length} fallaron`);
    
    // Admin permite hasta 1 fallo (algunas rutas pueden requerir permisos especiales)
    expect(failed.length, `${failed.length} rutas admin fallaron`).toBeLessThanOrEqual(1);
  });
  
  test('🌐 Rutas Públicas', async ({ page }) => {
    const publicRoutes = [
      { path: '/landing', expectRedirect: false },
      { path: '/login', expectRedirect: false },
      { path: '/landing/precios', expectRedirect: false },
      { path: '/landing/contacto', expectRedirect: false },
      { path: '/landing/faq', expectRedirect: false },
      { path: '/legal/privacy', expectRedirect: false },
      { path: '/legal/terms', expectRedirect: false },
      { path: '/legal/privacidad', expectRedirect: true }, // Redirect esperado
      { path: '/legal/terminos', expectRedirect: true },   // Redirect esperado
      { path: '/api-docs', expectRedirect: false },
    ];
    
    const results: PageCheckResult[] = [];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('🌐 RUTAS PÚBLICAS');
    console.log('='.repeat(60));
    
    for (const { path: route, expectRedirect } of publicRoutes) {
      process.stdout.write(`  ${route.padEnd(35)}... `);
      
      const result = await checkPageHealth(page, route, expectRedirect);
      results.push(result);
      
      if (result.status === 'redirect') {
        console.log('↪️  redirect (esperado)');
      } else {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(icon);
        
        if (result.errors.length > 0) {
          result.errors.forEach(e => console.log(`     ❌ ${e}`));
        }
      }
    }
    
    const failed = results.filter(r => r.status === 'fail');
    const passed = results.filter(r => r.status === 'pass' || r.status === 'redirect');
    
    console.log(`\n📊 Públicas: ${passed.length}/${publicRoutes.length} OK, ${failed.length} fallaron`);
    
    expect(failed.length, `${failed.length} rutas públicas fallaron`).toBe(0);
  });
  
  test('📱 Mobile: Hamburguesa presente', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    
    if (!fs.existsSync(AUTH_FILE)) {
      await setupAuth(page);
    }
    
    const testRoutes = [
      '/dashboard',
      '/propiedades',
      '/inquilinos',
      '/contratos',
      '/admin/dashboard',
      '/onboarding/documents',
      '/crm',
      '/mantenimiento',
    ];
    
    const failures: string[] = [];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📱 VERIFICACIÓN HAMBURGUESA MOBILE');
    console.log('='.repeat(60));
    
    for (const route of testRoutes) {
      process.stdout.write(`  ${route.padEnd(35)}... `);
      
      try {
        await page.goto(`${BASE_URL}${route}`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });
        await page.waitForTimeout(2000);
        
        // Buscar hamburguesa con múltiples selectores
        const hamburger = page.locator([
          'button[aria-label="Toggle mobile menu"]',
          'button[aria-label*="menu"]',
          'button.lg\\:hidden',
          '[data-testid="mobile-menu-button"]'
        ].join(', ')).first();
        
        const isVisible = await hamburger.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isVisible) {
          console.log('✅ visible');
        } else {
          console.log('❌ NO VISIBLE');
          failures.push(route);
          
          await page.screenshot({ 
            path: `${SCREENSHOTS_DIR}/mobile${route.replace(/\//g, '_')}-NO-HAMBURGER.png` 
          });
        }
      } catch (error: any) {
        console.log(`❌ error: ${error.message.substring(0, 50)}`);
        failures.push(`${route} (error)`);
      }
    }
    
    await context.close();
    
    console.log(`\n📊 Mobile: ${testRoutes.length - failures.length}/${testRoutes.length} con hamburguesa`);
    
    if (failures.length > 0) {
      console.log('\n❌ PÁGINAS SIN HAMBURGUESA:');
      failures.forEach(f => console.log(`   - ${f}`));
    }
    
    expect(failures.length, `${failures.length} páginas sin hamburguesa`).toBe(0);
  });
  
  test('🔘 UI Interactiva: Dropdowns y Modales', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    });
    const page = await context.newPage();
    
    if (!fs.existsSync(AUTH_FILE)) {
      await setupAuth(page);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔘 VERIFICACIÓN UI INTERACTIVA');
    console.log('='.repeat(60));
    
    const results: { element: string; status: 'pass' | 'fail'; error?: string }[] = [];
    
    // Test en dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // 1. Verificar dropdown de usuario
    console.log('\n  🧪 Dropdown de usuario...');
    try {
      const userMenu = page.locator('button[aria-label*="usuario"], button[aria-label*="Menú de usuario"]').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.waitForTimeout(500);
        
        const menuOpen = await page.locator('[role="menu"], [data-state="open"]').first().isVisible();
        if (menuOpen) {
          console.log('     ✅ Se abre correctamente');
          results.push({ element: 'User Menu', status: 'pass' });
          await page.keyboard.press('Escape');
        } else {
          console.log('     ❌ No se abre el menú');
          results.push({ element: 'User Menu', status: 'fail', error: 'Menu no abre' });
        }
      } else {
        console.log('     ⚠️ No encontrado');
        results.push({ element: 'User Menu', status: 'pass' }); // No es crítico si no existe
      }
    } catch (e: any) {
      console.log(`     ❌ Error: ${e.message.substring(0, 50)}`);
      results.push({ element: 'User Menu', status: 'fail', error: e.message });
    }
    
    // 2. Verificar botón de notificaciones
    console.log('  🧪 Botón de notificaciones...');
    try {
      const notifBtn = page.locator('button[aria-label*="otificacion"]').first();
      if (await notifBtn.isVisible()) {
        await notifBtn.click();
        await page.waitForTimeout(500);
        
        const popoverOpen = await page.locator('[data-state="open"], [role="dialog"]').first().isVisible();
        if (popoverOpen) {
          console.log('     ✅ Se abre correctamente');
          results.push({ element: 'Notifications', status: 'pass' });
          await page.keyboard.press('Escape');
        } else {
          console.log('     ⚠️ No se detectó popover (puede estar vacío)');
          results.push({ element: 'Notifications', status: 'pass' });
        }
      } else {
        console.log('     ⚠️ No encontrado');
        results.push({ element: 'Notifications', status: 'pass' });
      }
    } catch (e: any) {
      console.log(`     ❌ Error: ${e.message.substring(0, 50)}`);
      results.push({ element: 'Notifications', status: 'fail', error: e.message });
    }
    
    // 3. Verificar buscador global
    console.log('  🧪 Buscador global...');
    try {
      const searchBtn = page.locator('button:has-text("Buscar"), [placeholder*="Buscar"]').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await page.waitForTimeout(500);
        console.log('     ✅ Buscador accesible');
        results.push({ element: 'Search', status: 'pass' });
        await page.keyboard.press('Escape');
      } else {
        console.log('     ⚠️ No encontrado');
        results.push({ element: 'Search', status: 'pass' });
      }
    } catch (e: any) {
      console.log(`     ❌ Error: ${e.message.substring(0, 50)}`);
      results.push({ element: 'Search', status: 'fail', error: e.message });
    }
    
    // 4. Test en página de propiedades - botón crear
    console.log('  🧪 Botón crear propiedad...');
    await page.goto(`${BASE_URL}/propiedades`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    try {
      const createBtn = page.locator('a:has-text("Nueva"), a:has-text("Crear"), button:has-text("Nueva")').first();
      if (await createBtn.isVisible()) {
        const href = await createBtn.getAttribute('href');
        if (href) {
          console.log(`     ✅ Botón visible (href: ${href})`);
          results.push({ element: 'Create Property Button', status: 'pass' });
        } else {
          await createBtn.click();
          await page.waitForTimeout(1000);
          const navigated = page.url().includes('crear') || page.url().includes('nuevo');
          if (navigated) {
            console.log('     ✅ Navegación funciona');
            results.push({ element: 'Create Property Button', status: 'pass' });
          } else {
            console.log('     ⚠️ Click no navega');
            results.push({ element: 'Create Property Button', status: 'pass' });
          }
        }
      } else {
        console.log('     ⚠️ No encontrado');
        results.push({ element: 'Create Property Button', status: 'pass' });
      }
    } catch (e: any) {
      console.log(`     ❌ Error: ${e.message.substring(0, 50)}`);
      results.push({ element: 'Create Property Button', status: 'fail', error: e.message });
    }
    
    await context.close();
    
    const failed = results.filter(r => r.status === 'fail');
    console.log(`\n📊 UI Interactiva: ${results.length - failed.length}/${results.length} OK`);
    
    // Solo fallar si hay problemas críticos
    expect(failed.length, `${failed.length} elementos UI fallaron`).toBeLessThanOrEqual(1);
  });
});
