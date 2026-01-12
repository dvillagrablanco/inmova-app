/**
 * Script de verificación para módulos eWoorker y Construcción
 * Verifica que todas las páginas están accesibles y funcionando
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

interface PageCheck {
  path: string;
  name: string;
  expectTitle?: string;
}

const EWOORKER_PAGES: PageCheck[] = [
  { path: '/ewoorker/dashboard', name: 'Dashboard eWoorker' },
  { path: '/ewoorker/panel', name: 'Panel eWoorker' },
  { path: '/ewoorker/trabajadores', name: 'Trabajadores' },
  { path: '/ewoorker/asignaciones', name: 'Asignaciones' },
  { path: '/ewoorker/obras', name: 'Obras' },
  { path: '/ewoorker/contratos', name: 'Contratos' },
  { path: '/ewoorker/pagos', name: 'Pagos' },
  { path: '/ewoorker/analytics', name: 'Analytics' },
  { path: '/ewoorker/empresas', name: 'Empresas' },
  { path: '/ewoorker/compliance', name: 'Compliance' },
  { path: '/ewoorker/leaderboard', name: 'Leaderboard' },
];

const CONSTRUCCION_PAGES: PageCheck[] = [
  { path: '/construccion/proyectos', name: 'Proyectos Construcción' },
  { path: '/ordenes-trabajo', name: 'Órdenes de Trabajo' },
];

async function login(page: Page): Promise<boolean> {
  try {
    console.log('🔐 Iniciando sesión...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Esperar a que cargue el JS
    
    // Los inputs usan id en lugar de name
    await page.fill('#email', TEST_USER);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Esperar a que se complete el login
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
    console.log('✅ Login exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return false;
  }
}

async function checkPage(page: Page, pageInfo: PageCheck): Promise<{
  success: boolean;
  status: number;
  error?: string;
}> {
  try {
    const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    const status = response?.status() || 0;
    
    if (status >= 400) {
      return { success: false, status, error: `HTTP ${status}` };
    }
    
    // Verificar que no hay errores visibles
    const errorElement = await page.locator('[role="alert"]').first();
    if (await errorElement.isVisible({ timeout: 1000 }).catch(() => false)) {
      const errorText = await errorElement.textContent();
      if (errorText?.toLowerCase().includes('error')) {
        return { success: false, status, error: `Error visible: ${errorText}` };
      }
    }
    
    return { success: true, status };
  } catch (error: any) {
    return { success: false, status: 0, error: error.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 VERIFICACIÓN DE MÓDULOS EWOORKER Y CONSTRUCCIÓN');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log('');
  
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.error('❌ No se pudo iniciar sesión. Abortando.');
      process.exit(1);
    }
    
    console.log('\n📦 VERIFICANDO PÁGINAS DE EWOORKER');
    console.log('───────────────────────────────────────────────────────────────');
    
    let ewoorkerPassed = 0;
    let ewoorkerFailed = 0;
    
    for (const pageInfo of EWOORKER_PAGES) {
      const result = await checkPage(page, pageInfo);
      if (result.success) {
        console.log(`  ✅ ${pageInfo.name} (${pageInfo.path}) - HTTP ${result.status}`);
        ewoorkerPassed++;
      } else {
        console.log(`  ❌ ${pageInfo.name} (${pageInfo.path}) - ${result.error}`);
        ewoorkerFailed++;
      }
    }
    
    console.log('\n🏗️ VERIFICANDO PÁGINAS DE CONSTRUCCIÓN');
    console.log('───────────────────────────────────────────────────────────────');
    
    let construccionPassed = 0;
    let construccionFailed = 0;
    
    for (const pageInfo of CONSTRUCCION_PAGES) {
      const result = await checkPage(page, pageInfo);
      if (result.success) {
        console.log(`  ✅ ${pageInfo.name} (${pageInfo.path}) - HTTP ${result.status}`);
        construccionPassed++;
      } else {
        console.log(`  ❌ ${pageInfo.name} (${pageInfo.path}) - ${result.error}`);
        construccionFailed++;
      }
    }
    
    // Verificar sidebar
    console.log('\n📋 VERIFICANDO SIDEBAR');
    console.log('───────────────────────────────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Buscar sección eWoorker
    const ewoorkerSection = await page.locator('text=eWoorker').first();
    if (await ewoorkerSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ✅ Sección eWoorker visible en sidebar');
    } else {
      console.log('  ⚠️ Sección eWoorker no encontrada (puede requerir expandir menú)');
    }
    
    // Buscar sección Construcción
    const construccionSection = await page.locator('text=Construcción').first();
    if (await construccionSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ✅ Sección Construcción visible en sidebar');
    } else {
      console.log('  ⚠️ Sección Construcción no encontrada (puede requerir expandir menú)');
    }
    
    // Tomar screenshot
    await page.screenshot({ path: 'screenshots-verification/ewoorker-construccion-sidebar.png', fullPage: true });
    console.log('\n  📸 Screenshot guardado: screenshots-verification/ewoorker-construccion-sidebar.png');
    
    // Resumen
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  eWoorker: ${ewoorkerPassed}/${EWOORKER_PAGES.length} páginas OK`);
    console.log(`  Construcción: ${construccionPassed}/${CONSTRUCCION_PAGES.length} páginas OK`);
    
    const totalPassed = ewoorkerPassed + construccionPassed;
    const totalPages = EWOORKER_PAGES.length + CONSTRUCCION_PAGES.length;
    
    if (totalPassed === totalPages) {
      console.log('\n✅ TODAS LAS PÁGINAS ESTÁN FUNCIONANDO CORRECTAMENTE');
    } else {
      console.log(`\n⚠️ ${totalPages - totalPassed} páginas con problemas`);
    }
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
