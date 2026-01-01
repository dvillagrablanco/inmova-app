/**
 * Inspección visual completa con Playwright
 * Verifica TODAS las 383 rutas de la app
 */

import { chromium, Browser, Page, ConsoleMessage } from 'playwright';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const ROUTES_FILE = '/tmp/all-routes.txt';

interface RouteError {
  route: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  details?: any;
}

interface RouteResult {
  route: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  httpStatus?: number;
  finalURL: string;
  errors: RouteError[];
  consoleErrors: string[];
  loadTime: number;
  screenshotPath?: string;
}

const results: RouteResult[] = [];
const allErrors: RouteError[] = [];

// Capturar errores de consola
function setupConsoleCapture(page: Page, route: string, consoleErrors: string[]) {
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filtrar errores conocidos/ignorables
      if (!text.includes('Invalid or unexpected token') && 
          !text.includes('Hydration') &&
          !text.includes('_next/static')) {
        consoleErrors.push(text);
      }
    }
  });
  
  page.on('pageerror', (error) => {
    consoleErrors.push(`Page error: ${error.message}`);
  });
}

async function loginOnce(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Verificar si ya estamos autenticados
    if (page.url().includes('/dashboard') || page.url().includes('/admin')) {
      console.log('  ✅ Ya autenticado');
      return true;
    }
    
    // Login
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
    console.log('  ✅ Login exitoso');
    return true;
  } catch (error: any) {
    console.log(`  ❌ Login falló: ${error.message}`);
    return false;
  }
}

async function inspectRoute(page: Page, route: string): Promise<RouteResult> {
  const startTime = Date.now();
  const consoleErrors: string[] = [];
  const errors: RouteError[] = [];
  
  setupConsoleCapture(page, route, consoleErrors);
  
  try {
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    
    const loadTime = Date.now() - startTime;
    const httpStatus = response?.status() || 0;
    const finalURL = page.url();
    
    // Errores HTTP
    if (httpStatus === 404) {
      errors.push({
        route,
        severity: 'CRITICAL',
        type: '404_NOT_FOUND',
        message: 'Página no encontrada',
      });
    } else if (httpStatus >= 500) {
      errors.push({
        route,
        severity: 'CRITICAL',
        type: 'SERVER_ERROR',
        message: `Error del servidor: ${httpStatus}`,
      });
    } else if (httpStatus >= 400) {
      errors.push({
        route,
        severity: 'HIGH',
        type: 'CLIENT_ERROR',
        message: `Error cliente: ${httpStatus}`,
      });
    }
    
    // Verificar si redirige a login/unauthorized
    if (finalURL.includes('/login') && !route.includes('/login')) {
      errors.push({
        route,
        severity: 'MEDIUM',
        type: 'AUTH_REQUIRED',
        message: 'Requiere autenticación',
        details: { finalURL },
      });
    }
    
    if (finalURL.includes('/unauthorized')) {
      errors.push({
        route,
        severity: 'HIGH',
        type: 'UNAUTHORIZED',
        message: 'Acceso no autorizado',
        details: { finalURL },
      });
    }
    
    // Verificar texto "404" en página
    const has404Text = await page.locator('text=/404|not found/i').count() > 0;
    if (has404Text && httpStatus !== 404) {
      errors.push({
        route,
        severity: 'HIGH',
        type: 'SOFT_404',
        message: 'Página contiene texto "404" pero HTTP status OK',
      });
    }
    
    // Errores de consola JavaScript
    if (consoleErrors.length > 0) {
      errors.push({
        route,
        severity: 'MEDIUM',
        type: 'CONSOLE_ERRORS',
        message: `${consoleErrors.length} errores de consola`,
        details: consoleErrors.slice(0, 3),
      });
    }
    
    // Performance warning
    if (loadTime > 5000) {
      errors.push({
        route,
        severity: 'LOW',
        type: 'SLOW_LOAD',
        message: `Carga lenta: ${loadTime}ms`,
      });
    }
    
    const status = errors.some(e => e.severity === 'CRITICAL') ? 'ERROR' :
                   errors.length > 0 ? 'WARNING' : 'SUCCESS';
    
    return {
      route,
      status,
      httpStatus,
      finalURL,
      errors,
      consoleErrors,
      loadTime,
    };
  } catch (error: any) {
    errors.push({
      route,
      severity: 'CRITICAL',
      type: 'TIMEOUT_ERROR',
      message: error.message,
    });
    
    return {
      route,
      status: 'ERROR',
      finalURL: '',
      errors,
      consoleErrors,
      loadTime: Date.now() - startTime,
    };
  }
}

async function main() {
  console.log('🔍 INSPECCIÓN VISUAL COMPLETA - 383 RUTAS\n');
  
  // Leer todas las rutas
  const routes = fs.readFileSync(ROUTES_FILE, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .filter(r => !r.includes('/_next') && !r.includes('/api/'));
  
  console.log(`📊 Total rutas a inspeccionar: ${routes.length}\n`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // Login inicial
  console.log('🔐 Autenticando...');
  const loginSuccess = await loginOnce(page);
  
  if (!loginSuccess) {
    console.log('❌ No se pudo autenticar. Abortando.\n');
    await browser.close();
    process.exit(1);
  }
  
  console.log('\n📡 Inspeccionando rutas...\n');
  
  let count = 0;
  const batchSize = 50;
  
  for (const route of routes) {
    count++;
    process.stdout.write(`[${count}/${routes.length}] ${route.padEnd(50)} `);
    
    const result = await inspectRoute(page, route);
    results.push(result);
    
    // Agregar errores a lista global
    result.errors.forEach(e => allErrors.push(e));
    
    if (result.status === 'SUCCESS') {
      process.stdout.write(`✅ ${result.httpStatus} (${result.loadTime}ms)\n`);
    } else if (result.status === 'WARNING') {
      process.stdout.write(`⚠️  ${result.errors.length} warnings\n`);
    } else {
      process.stdout.write(`❌ ${result.errors[0]?.type}\n`);
    }
    
    // Re-login cada 50 rutas (por si expira sesión)
    if (count % batchSize === 0) {
      await loginOnce(page);
    }
    
    await page.waitForTimeout(100);
  }
  
  await browser.close();
  
  // Resultados
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTADOS');
  console.log('='.repeat(80));
  
  const success = results.filter(r => r.status === 'SUCCESS').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`\n✅ Éxito: ${success}/${routes.length}`);
  console.log(`⚠️  Warnings: ${warnings}/${routes.length}`);
  console.log(`❌ Errores: ${errors}/${routes.length}`);
  
  // Errores por severidad
  const bySeverity = {
    CRITICAL: allErrors.filter(e => e.severity === 'CRITICAL'),
    HIGH: allErrors.filter(e => e.severity === 'HIGH'),
    MEDIUM: allErrors.filter(e => e.severity === 'MEDIUM'),
    LOW: allErrors.filter(e => e.severity === 'LOW'),
  };
  
  console.log(`\n🔴 Críticos: ${bySeverity.CRITICAL.length}`);
  console.log(`🟠 Altos: ${bySeverity.HIGH.length}`);
  console.log(`🟡 Medios: ${bySeverity.MEDIUM.length}`);
  console.log(`🟢 Bajos: ${bySeverity.LOW.length}`);
  
  // Top 10 errores críticos
  if (bySeverity.CRITICAL.length > 0) {
    console.log('\n🔴 TOP ERRORES CRÍTICOS:\n');
    bySeverity.CRITICAL.slice(0, 10).forEach(e => {
      console.log(`  ${e.route}`);
      console.log(`    → ${e.type}: ${e.message}`);
    });
  }
  
  // Guardar reporte JSON
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRoutes: routes.length,
      success,
      warnings,
      errors,
      critical: bySeverity.CRITICAL.length,
      high: bySeverity.HIGH.length,
      medium: bySeverity.MEDIUM.length,
      low: bySeverity.LOW.length,
    },
    results: results.sort((a, b) => {
      if (a.status === 'ERROR' && b.status !== 'ERROR') return -1;
      if (a.status !== 'ERROR' && b.status === 'ERROR') return 1;
      return 0;
    }),
    errorsByType: Object.entries(
      allErrors.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]),
  };
  
  fs.writeFileSync(
    '/workspace/visual-inspection-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Reporte guardado: visual-inspection-report.json\n');
  
  process.exit(errors > 0 ? 1 : 0);
}

main();
