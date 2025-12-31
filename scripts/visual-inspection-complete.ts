#!/usr/bin/env tsx

/**
 * Inspección Visual Completa del Módulo de Propiedades
 * Verifica todas las páginas implementadas y detecta errores
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.APP_URL || 'https://inmovaapp.com';
const SCREENSHOT_DIR = path.join(process.cwd(), 'visual-inspection-screenshots');
const REPORT_FILE = path.join(process.cwd(), 'VISUAL_INSPECTION_REPORT.md');

// Credenciales de test
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

interface InspectionResult {
  url: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  screenshot?: string;
  errors: string[];
  warnings: string[];
  pageTitle: string;
  loadTime: number;
  hasInteractiveElements: boolean;
  consoleErrors: number;
  networkErrors: number;
}

const results: InspectionResult[] = [];

// Crear directorio de screenshots
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function login(page: Page): Promise<boolean> {
  console.log('🔐 Iniciando sesión...');
  
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Llenar formulario
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    
    // Interceptar respuesta de auth
    const authResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/auth/callback') || url.includes('/api/auth/signin')) &&
               response.request().method() === 'POST';
      },
      { timeout: 15000 }
    );
    
    // Submit
    await page.click('button[type="submit"]');
    const authResponse = await authResponsePromise;
    
    if (authResponse.status() !== 200) {
      console.error('❌ Login falló - Status:', authResponse.status());
      return false;
    }
    
    // Esperar redirect a dashboard
    await page.waitForURL(
      url => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        return urlStr.includes('/dashboard') || urlStr.includes('/admin') || urlStr.includes('/portal');
      },
      { timeout: 15000 }
    );
    
    console.log('✅ Login exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return false;
  }
}

async function inspectPage(page: Page, url: string, pageName: string): Promise<InspectionResult> {
  console.log(`\n🔍 Inspeccionando: ${pageName} (${url})`);
  
  const result: InspectionResult = {
    url,
    status: 'OK',
    errors: [],
    warnings: [],
    pageTitle: '',
    loadTime: 0,
    hasInteractiveElements: false,
    consoleErrors: 0,
    networkErrors: 0,
  };
  
  // Interceptores de errores
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} - ${response.url()}`);
    }
  });
  
  try {
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    result.loadTime = Date.now() - startTime;
    
    // Título de página
    result.pageTitle = await page.title();
    
    // Screenshot
    const screenshotName = `${pageName.replace(/\s+/g, '-').toLowerCase()}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshot = screenshotName;
    
    // Detectar Coming Soon
    const isComingSoon = await page.locator('text=/coming soon/i').count() > 0;
    if (isComingSoon) {
      result.warnings.push('Página muestra "Coming Soon"');
      result.status = 'WARNING';
    }
    
    // Detectar elementos interactivos
    const buttonCount = await page.locator('button').count();
    const linkCount = await page.locator('a').count();
    const inputCount = await page.locator('input, select, textarea').count();
    
    result.hasInteractiveElements = buttonCount > 0 || linkCount > 0 || inputCount > 0;
    
    if (!result.hasInteractiveElements) {
      result.warnings.push('No se detectaron elementos interactivos');
    }
    
    // Detectar errores visibles
    const errorElements = await page.locator('text=/error|falló|failed/i').count();
    if (errorElements > 0) {
      result.errors.push(`${errorElements} elementos con texto de error detectados`);
      result.status = 'ERROR';
    }
    
    // Errores de consola
    result.consoleErrors = consoleErrors.length;
    if (consoleErrors.length > 0) {
      result.errors.push(...consoleErrors.slice(0, 3)); // Primeros 3
      if (consoleErrors.length > 3) {
        result.errors.push(`... y ${consoleErrors.length - 3} errores más`);
      }
      if (result.status !== 'ERROR') result.status = 'WARNING';
    }
    
    // Errores de red
    result.networkErrors = networkErrors.length;
    if (networkErrors.length > 0) {
      result.errors.push(...networkErrors.slice(0, 3)); // Primeros 3
      if (networkErrors.length > 3) {
        result.errors.push(`... y ${networkErrors.length - 3} errores de red más`);
      }
      result.status = 'ERROR';
    }
    
    console.log(`  ${result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'} ${pageName}: ${result.status}`);
    if (result.errors.length > 0) {
      console.log(`  Errores: ${result.errors.length}`);
    }
    if (result.warnings.length > 0) {
      console.log(`  Advertencias: ${result.warnings.length}`);
    }
    
  } catch (error: any) {
    result.status = 'ERROR';
    result.errors.push(`Error al cargar página: ${error.message}`);
    console.log(`  ❌ ERROR: ${error.message}`);
  }
  
  return result;
}

async function generateReport(): Promise<void> {
  console.log('\n📝 Generando reporte...');
  
  const okCount = results.filter(r => r.status === 'OK').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  
  let report = `# 🔍 INFORME DE INSPECCIÓN VISUAL COMPLETA

**Fecha**: ${new Date().toLocaleString('es-ES')}
**URL Base**: ${BASE_URL}
**Total Páginas Inspeccionadas**: ${results.length}

## 📊 RESUMEN EJECUTIVO

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| ✅ OK | ${okCount} | ${((okCount / results.length) * 100).toFixed(1)}% |
| ⚠️ WARNING | ${warningCount} | ${((warningCount / results.length) * 100).toFixed(1)}% |
| ❌ ERROR | ${errorCount} | ${((errorCount / results.length) * 100).toFixed(1)}% |

---

## 📄 RESULTADOS DETALLADOS

`;

  for (const result of results) {
    const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    
    report += `### ${icon} ${result.pageTitle || 'Sin título'}\n\n`;
    report += `- **URL**: ${result.url}\n`;
    report += `- **Estado**: ${result.status}\n`;
    report += `- **Tiempo de Carga**: ${result.loadTime}ms\n`;
    report += `- **Elementos Interactivos**: ${result.hasInteractiveElements ? 'Sí' : 'No'}\n`;
    report += `- **Errores de Consola**: ${result.consoleErrors}\n`;
    report += `- **Errores de Red**: ${result.networkErrors}\n`;
    
    if (result.screenshot) {
      report += `- **Screenshot**: [\`${result.screenshot}\`](${SCREENSHOT_DIR}/${result.screenshot})\n`;
    }
    
    if (result.errors.length > 0) {
      report += `\n**Errores Detectados:**\n`;
      result.errors.forEach(err => report += `- ❌ ${err}\n`);
    }
    
    if (result.warnings.length > 0) {
      report += `\n**Advertencias:**\n`;
      result.warnings.forEach(warn => report += `- ⚠️ ${warn}\n`);
    }
    
    report += '\n---\n\n';
  }
  
  report += `## 🎯 CONCLUSIONES\n\n`;
  
  if (errorCount === 0 && warningCount === 0) {
    report += `✅ **Todas las páginas están funcionando correctamente** sin errores ni advertencias.\n\n`;
  } else if (errorCount === 0) {
    report += `⚠️ **No se encontraron errores críticos**, pero hay ${warningCount} advertencia(s) que deberían revisarse.\n\n`;
  } else {
    report += `❌ **Se encontraron ${errorCount} error(es) que requieren atención inmediata.**\n\n`;
  }
  
  report += `**Screenshots guardados en**: \`${SCREENSHOT_DIR}\`\n\n`;
  report += `---\n\n*Generado automáticamente por el script de inspección visual*\n`;
  
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`✅ Reporte guardado en: ${REPORT_FILE}`);
}

async function main() {
  console.log('🚀 INICIANDO INSPECCIÓN VISUAL COMPLETA\n');
  console.log(`URL Base: ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();
  
  try {
    // Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.error('❌ No se pudo iniciar sesión, abortando inspección');
      process.exit(1);
    }
    
    // Páginas a inspeccionar
    const pagesToInspect = [
      { url: `${BASE_URL}/propiedades`, name: 'Listado de Propiedades' },
      { url: `${BASE_URL}/propiedades/crear`, name: 'Crear Propiedad' },
      { url: `${BASE_URL}/dashboard`, name: 'Dashboard Principal' },
      { url: `${BASE_URL}/edificios`, name: 'Gestión de Edificios' },
      { url: `${BASE_URL}/inquilinos`, name: 'Gestión de Inquilinos' },
      { url: `${BASE_URL}/contratos`, name: 'Gestión de Contratos' },
      { url: `${BASE_URL}/pagos`, name: 'Gestión de Pagos' },
      { url: `${BASE_URL}/mantenimiento`, name: 'Gestión de Mantenimiento' },
      { url: `${BASE_URL}/comunidad`, name: 'Gestión de Comunidad' },
      { url: `${BASE_URL}/crm`, name: 'CRM' },
    ];
    
    // Inspeccionar cada página
    for (const pageToInspect of pagesToInspect) {
      const result = await inspectPage(page, pageToInspect.url, pageToInspect.name);
      results.push(result);
      
      // Pequeña pausa entre páginas
      await page.waitForTimeout(1000);
    }
    
    // Generar reporte
    await generateReport();
    
    console.log('\n✅ INSPECCIÓN COMPLETA');
    console.log(`📊 Resultados: ${results.filter(r => r.status === 'OK').length} OK, ${results.filter(r => r.status === 'WARNING').length} WARNING, ${results.filter(r => r.status === 'ERROR').length} ERROR`);
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
