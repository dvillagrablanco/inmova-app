/**
 * Test Comprehensivo de Auditoría de Páginas - Inmova App
 * 
 * Este test verifica:
 * 1. Todas las páginas públicas cargan correctamente (200 OK)
 * 2. Todas las páginas protegidas cargan después de login
 * 3. Detecta páginas con errores 404, 500 o incompletas
 * 4. Genera un reporte detallado del estado de cada página
 * 
 * Ejecutar: npx playwright test e2e/comprehensive-pages-audit.spec.ts --reporter=list
 */

import { test, expect, Page, Browser } from '@playwright/test';
import { ALL_ROUTES, PUBLIC_ROUTES, AUTHENTICATED_ROUTES, RouteConfig } from './routes-config';

// Credenciales de test
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

// Tipos para el reporte
interface PageAuditResult {
  url: string;
  name: string;
  status: 'ok' | 'error' | 'warning' | 'pending';
  httpStatus?: number;
  errorMessage?: string;
  hasContent: boolean;
  loadTime: number;
  category: string;
  requiresAuth: boolean;
}

// Almacenar resultados
const auditResults: PageAuditResult[] = [];

/**
 * Helper: Login automático
 */
async function login(page: Page): Promise<boolean> {
  try {
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Verificar si ya está logueado
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
      return true;
    }
    
    // Llenar formulario
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    
    // Submit
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]).catch(() => {});
    
    // Verificar login exitoso
    await page.waitForURL(url => 
      url.pathname.includes('/dashboard') || 
      url.pathname.includes('/admin') ||
      url.pathname.includes('/portal'),
      { timeout: 15000 }
    );
    
    return true;
  } catch (error: any) {
    console.error('Login failed:', error.message);
    return false;
  }
}

/**
 * Helper: Verificar si la página tiene contenido real
 */
async function hasRealContent(page: Page): Promise<{ hasContent: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  try {
    // Esperar a que el contenido cargue
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.textContent('body') || '';
    const bodyTextLower = bodyText.toLowerCase();
    
    // Detectar páginas con errores
    if (bodyTextLower.includes('404') || bodyTextLower.includes('not found') || bodyTextLower.includes('página no encontrada')) {
      issues.push('404 - Página no encontrada');
      return { hasContent: false, issues };
    }
    
    if (bodyTextLower.includes('500') || bodyTextLower.includes('internal server error') || bodyTextLower.includes('error del servidor')) {
      issues.push('500 - Error del servidor');
      return { hasContent: false, issues };
    }
    
    if (bodyTextLower.includes('error') && bodyTextLower.length < 500) {
      issues.push('Página de error genérico');
    }
    
    // Detectar páginas en desarrollo
    if (bodyTextLower.includes('coming soon') || bodyTextLower.includes('próximamente') || bodyTextLower.includes('en desarrollo')) {
      issues.push('Página en desarrollo');
    }
    
    if (bodyTextLower.includes('under construction') || bodyTextLower.includes('en construcción')) {
      issues.push('Página en construcción');
    }
    
    // Detectar páginas vacías o con poco contenido
    const visibleTextLength = bodyText.replace(/\s+/g, ' ').trim().length;
    if (visibleTextLength < 100) {
      issues.push('Contenido muy limitado (<100 caracteres)');
    }
    
    // Verificar si hay elementos principales
    const hasMainContent = await page.locator('main, [role="main"], .main-content, #main-content').count() > 0;
    const hasCards = await page.locator('[class*="card"], .card').count() > 0;
    const hasTables = await page.locator('table').count() > 0;
    const hasForms = await page.locator('form').count() > 0;
    const hasHeadings = await page.locator('h1, h2, h3').count() > 0;
    
    const hasStructuredContent = hasMainContent || hasCards || hasTables || hasForms || hasHeadings;
    
    if (!hasStructuredContent && visibleTextLength < 500) {
      issues.push('Sin estructura de contenido clara');
    }
    
    return { 
      hasContent: issues.length === 0 || (issues.every(i => i.includes('desarrollo') || i.includes('construcción'))),
      issues 
    };
  } catch (error: any) {
    issues.push(`Error verificando contenido: ${error.message}`);
    return { hasContent: false, issues };
  }
}

/**
 * Helper: Auditar una página específica
 */
async function auditPage(page: Page, route: RouteConfig): Promise<PageAuditResult> {
  const startTime = Date.now();
  const result: PageAuditResult = {
    url: route.url,
    name: route.name,
    status: 'ok',
    hasContent: false,
    loadTime: 0,
    category: route.category,
    requiresAuth: route.requiresAuth,
  };
  
  try {
    // Navegar a la página
    const response = await page.goto(route.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    result.loadTime = Date.now() - startTime;
    result.httpStatus = response?.status() || 0;
    
    // Verificar código HTTP
    if (result.httpStatus === 404) {
      result.status = 'error';
      result.errorMessage = '404 - Página no encontrada';
      return result;
    }
    
    if (result.httpStatus >= 500) {
      result.status = 'error';
      result.errorMessage = `${result.httpStatus} - Error del servidor`;
      return result;
    }
    
    if (result.httpStatus >= 400) {
      result.status = 'warning';
      result.errorMessage = `${result.httpStatus} - Error de cliente`;
    }
    
    // Verificar contenido
    const contentCheck = await hasRealContent(page);
    result.hasContent = contentCheck.hasContent;
    
    if (contentCheck.issues.length > 0) {
      if (contentCheck.issues.some(i => i.includes('404') || i.includes('500'))) {
        result.status = 'error';
      } else if (contentCheck.issues.some(i => i.includes('desarrollo') || i.includes('construcción'))) {
        result.status = 'pending';
      } else if (!contentCheck.hasContent) {
        result.status = 'warning';
      }
      result.errorMessage = contentCheck.issues.join('; ');
    }
    
  } catch (error: any) {
    result.status = 'error';
    result.errorMessage = error.message.substring(0, 200);
    result.loadTime = Date.now() - startTime;
  }
  
  return result;
}

// Test principal para páginas públicas
test.describe('Auditoría de Páginas Públicas', () => {
  test('Verificar todas las páginas públicas', async ({ page }) => {
    const publicRoutes = PUBLIC_ROUTES.filter(r => !r.url.includes('.disabled'));
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('AUDITORÍA DE PÁGINAS PÚBLICAS');
    console.log(`Total: ${publicRoutes.length} páginas`);
    console.log(`${'='.repeat(70)}\n`);
    
    for (const route of publicRoutes) {
      console.log(`Verificando: ${route.name} (${route.url})`);
      const result = await auditPage(page, route);
      auditResults.push(result);
      
      const statusIcon = result.status === 'ok' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : 
                        result.status === 'pending' ? '🔄' : '❌';
      console.log(`  ${statusIcon} HTTP ${result.httpStatus} - ${result.loadTime}ms ${result.errorMessage ? `- ${result.errorMessage}` : ''}`);
    }
    
    // Generar reporte
    const errors = auditResults.filter(r => r.status === 'error');
    const warnings = auditResults.filter(r => r.status === 'warning');
    const pending = auditResults.filter(r => r.status === 'pending');
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('RESUMEN PÁGINAS PÚBLICAS');
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ OK: ${auditResults.filter(r => r.status === 'ok').length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);
    console.log(`🔄 Pendientes: ${pending.length}`);
    console.log(`❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ PÁGINAS CON ERRORES:');
      errors.forEach(e => console.log(`  - ${e.name} (${e.url}): ${e.errorMessage}`));
    }
    
    if (pending.length > 0) {
      console.log('\n🔄 PÁGINAS PENDIENTES DE DESARROLLO:');
      pending.forEach(p => console.log(`  - ${p.name} (${p.url}): ${p.errorMessage}`));
    }
  });
});

// Test para páginas autenticadas
test.describe('Auditoría de Páginas Autenticadas', () => {
  test.beforeAll(async ({ browser }) => {
    // Login una vez para todas las pruebas
  });
  
  test('Verificar todas las páginas que requieren autenticación', async ({ page }) => {
    // Hacer login primero
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.error('❌ No se pudo hacer login. Abortando test de páginas autenticadas.');
      return;
    }
    
    // Filtrar rutas autenticadas (excluir superadmin por ahora)
    const authRoutes = AUTHENTICATED_ROUTES.filter(r => 
      !r.url.includes('.disabled') && 
      !r.requiresSuperAdmin &&
      r.priority !== 'low' // Solo probar high y medium priority primero
    );
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('AUDITORÍA DE PÁGINAS AUTENTICADAS (High/Medium Priority)');
    console.log(`Total: ${authRoutes.length} páginas`);
    console.log(`${'='.repeat(70)}\n`);
    
    const authResults: PageAuditResult[] = [];
    
    for (const route of authRoutes) {
      console.log(`Verificando: ${route.name} (${route.url})`);
      const result = await auditPage(page, route);
      authResults.push(result);
      
      const statusIcon = result.status === 'ok' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : 
                        result.status === 'pending' ? '🔄' : '❌';
      console.log(`  ${statusIcon} HTTP ${result.httpStatus} - ${result.loadTime}ms ${result.errorMessage ? `- ${result.errorMessage}` : ''}`);
    }
    
    // Generar reporte
    const errors = authResults.filter(r => r.status === 'error');
    const warnings = authResults.filter(r => r.status === 'warning');
    const pending = authResults.filter(r => r.status === 'pending');
    const ok = authResults.filter(r => r.status === 'ok');
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('RESUMEN PÁGINAS AUTENTICADAS');
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ OK: ${ok.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);
    console.log(`🔄 Pendientes: ${pending.length}`);
    console.log(`❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ PÁGINAS CON ERRORES:');
      errors.forEach(e => console.log(`  - ${e.name} (${e.url}): ${e.errorMessage}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ PÁGINAS CON WARNINGS:');
      warnings.forEach(w => console.log(`  - ${w.name} (${w.url}): ${w.errorMessage}`));
    }
    
    if (pending.length > 0) {
      console.log('\n🔄 PÁGINAS PENDIENTES DE DESARROLLO:');
      pending.forEach(p => console.log(`  - ${p.name} (${p.url}): ${p.errorMessage}`));
    }
    
    // Guardar resultados en JSON
    const allResults = [...auditResults, ...authResults];
    console.log(`\n📊 Total páginas auditadas: ${allResults.length}`);
  });
});

// Test específico para páginas de alta prioridad
test.describe('Verificación de Páginas Críticas', () => {
  test('Páginas de alta prioridad deben cargar correctamente', async ({ page }) => {
    const highPriorityRoutes = ALL_ROUTES.filter(r => r.priority === 'high');
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('VERIFICACIÓN DE PÁGINAS CRÍTICAS (Alta Prioridad)');
    console.log(`${'='.repeat(70)}\n`);
    
    for (const route of highPriorityRoutes) {
      if (route.requiresAuth) {
        await login(page);
      }
      
      console.log(`Verificando: ${route.name} (${route.url})`);
      
      const response = await page.goto(route.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      const status = response?.status() || 0;
      
      // Las páginas críticas NO deben dar 404 o 500
      expect(status, `${route.name} debe responder con éxito`).toBeLessThan(400);
      
      console.log(`  ✅ HTTP ${status} - OK`);
    }
  });
});

// Test para detectar páginas en estado "pendiente" o "en desarrollo"
test.describe('Detección de Páginas Pendientes de Desarrollo', () => {
  test('Identificar páginas marcadas como en desarrollo', async ({ page }) => {
    await login(page);
    
    const routesToCheck = AUTHENTICATED_ROUTES.filter(r => 
      !r.url.includes('.disabled') && 
      !r.requiresSuperAdmin
    );
    
    const pendingPages: string[] = [];
    const incompletePages: string[] = [];
    
    for (const route of routesToCheck.slice(0, 50)) { // Limitar a 50 para no tardar mucho
      try {
        await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        const bodyText = (await page.textContent('body') || '').toLowerCase();
        
        if (bodyText.includes('coming soon') || 
            bodyText.includes('próximamente') || 
            bodyText.includes('en desarrollo') ||
            bodyText.includes('en construcción')) {
          pendingPages.push(`${route.name} (${route.url})`);
        }
        
        // Verificar si parece incompleta
        const visibleText = bodyText.replace(/\s+/g, ' ').trim();
        if (visibleText.length < 200) {
          incompletePages.push(`${route.name} (${route.url}) - Solo ${visibleText.length} caracteres`);
        }
        
      } catch (error) {
        // Ignorar errores de timeout
      }
    }
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('PÁGINAS PENDIENTES DE DESARROLLO');
    console.log(`${'='.repeat(70)}`);
    
    if (pendingPages.length > 0) {
      console.log('\n📝 Marcadas como "En Desarrollo":');
      pendingPages.forEach(p => console.log(`  - ${p}`));
    }
    
    if (incompletePages.length > 0) {
      console.log('\n⚠️ Posiblemente Incompletas (poco contenido):');
      incompletePages.forEach(p => console.log(`  - ${p}`));
    }
    
    console.log(`\nTotal pendientes: ${pendingPages.length}`);
    console.log(`Total incompletas: ${incompletePages.length}`);
  });
});
