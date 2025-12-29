/**
 * Auditoría completa de la aplicación con Playwright
 * Login como superadmin y revisión de todas las páginas
 */

import { chromium, Browser, Page, ConsoleMessage } from '@playwright/test';
import { writeFileSync } from 'fs';

interface AuditResult {
  page: string;
  url: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  title: string;
  errors: string[];
  warnings: string[];
  screenshot: string;
  timestamp: string;
}

const results: AuditResult[] = [];
const allErrors: ConsoleMessage[] = [];

async function auditPage(
  page: Page,
  pageName: string,
  url: string,
  waitTime = 3000
): Promise<AuditResult> {
  console.log(`\n--- Auditando: ${pageName} ---`);
  console.log(`URL: ${url}`);

  const errors: string[] = [];
  const warnings: string[] = [];
  const screenshotPath = `visual-verification-results/audit-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`;

  try {
    // Navegar a la página
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const status = response?.status() || 0;
    console.log(`Status: ${status}`);

    if (status >= 400) {
      errors.push(`HTTP ${status} error`);
    }

    // Esperar a que cargue
    await page.waitForTimeout(waitTime);

    // Capturar título
    const title = await page.title();
    console.log(`Título: ${title}`);

    // Verificar si hay errores de autenticación
    const currentUrl = page.url();
    if (currentUrl.includes('/login') && !url.includes('/login')) {
      errors.push('Redirigió a login - Sesión expirada o no autorizado');
    }

    // Capturar screenshot
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    console.log(`Screenshot: ${screenshotPath}`);

    // Verificar elementos críticos
    const hasHeader = await page.locator('header, [role="banner"]').count();
    const hasSidebar = await page.locator('nav, aside, [role="navigation"]').count();

    if (hasHeader === 0 && !url.includes('/login')) {
      warnings.push('No se encontró header');
    }

    // Determinar estado
    let resultStatus: 'OK' | 'ERROR' | 'WARNING' = 'OK';
    if (errors.length > 0) {
      resultStatus = 'ERROR';
    } else if (warnings.length > 0) {
      resultStatus = 'WARNING';
    }

    const result: AuditResult = {
      page: pageName,
      url: currentUrl,
      status: resultStatus,
      title,
      errors,
      warnings,
      screenshot: screenshotPath,
      timestamp: new Date().toISOString(),
    };

    console.log(`Estado: ${resultStatus}`);
    if (errors.length > 0) {
      console.log(`Errores (${errors.length}):`, errors);
    }
    if (warnings.length > 0) {
      console.log(`Warnings (${warnings.length}):`, warnings);
    }

    return result;
  } catch (error: any) {
    console.log(`ERROR: ${error.message}`);

    return {
      page: pageName,
      url,
      status: 'ERROR',
      title: '',
      errors: [error.message],
      warnings,
      screenshot: screenshotPath,
      timestamp: new Date().toISOString(),
    };
  }
}

async function runFullAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDITORIA COMPLETA DE LA APLICACION');
  console.log('='.repeat(80) + '\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // 1. Lanzar navegador
    console.log('1. Lanzando navegador...');
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    page = await context.newPage();

    // Capturar errores de consola
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        allErrors.push(msg);
        console.log(`[CONSOLE ERROR]: ${msg.text()}`);
      }
    });

    // Capturar errores de página
    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR]: ${error.message}`);
    });

    console.log('   OK - Navegador lanzado\n');

    // 2. Login como superadministrador
    console.log('2. Realizando login como superadministrador...');
    await page.goto('https://inmovaapp.com/login', {
      waitUntil: 'networkidle',
    });

    // Credenciales de superadmin (ajustar según tu BD)
    const superadminEmail = 'admin@inmova.com'; // Ajustar
    const superadminPassword = 'admin123'; // Ajustar

    await page.waitForTimeout(2000);

    // Llenar formulario
    const emailField = await page.locator('input[type="email"], input[name="email"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill(superadminEmail);
    }

    const passwordField = await page.locator('input[type="password"]').first();
    if (await passwordField.isVisible()) {
      await passwordField.fill(superadminPassword);
    }

    // Click login
    const submitButton = await page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(5000);
    }

    const currentUrl = page.url();
    console.log(`URL después de login: ${currentUrl}`);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
      console.log('   OK - Login exitoso\n');
    } else {
      console.log('   WARNING - No redirigió al dashboard, continuando de todos modos...\n');
    }

    // 3. Auditar todas las páginas principales
    console.log('3. Auditando páginas principales...\n');

    const pagesToAudit = [
      { name: 'Dashboard', url: 'https://inmovaapp.com/dashboard' },
      { name: 'Propiedades', url: 'https://inmovaapp.com/dashboard/properties' },
      { name: 'Inquilinos', url: 'https://inmovaapp.com/dashboard/tenants' },
      { name: 'Contratos', url: 'https://inmovaapp.com/dashboard/contracts' },
      { name: 'Pagos', url: 'https://inmovaapp.com/dashboard/payments' },
      { name: 'Mantenimiento', url: 'https://inmovaapp.com/dashboard/maintenance' },
      { name: 'Reportes', url: 'https://inmovaapp.com/dashboard/reports' },
      { name: 'CRM', url: 'https://inmovaapp.com/dashboard/crm' },
      { name: 'Leads', url: 'https://inmovaapp.com/dashboard/crm/leads' },
      { name: 'Configuración', url: 'https://inmovaapp.com/dashboard/settings' },
      { name: 'Perfil', url: 'https://inmovaapp.com/dashboard/profile' },
      { name: 'Admin Empresas', url: 'https://inmovaapp.com/admin/companies' },
      { name: 'Admin Usuarios', url: 'https://inmovaapp.com/admin/users' },
      { name: 'Superadmin', url: 'https://inmovaapp.com/superadmin' },
      { name: 'Analytics', url: 'https://inmovaapp.com/dashboard/analytics' },
      { name: 'Documentos', url: 'https://inmovaapp.com/dashboard/documents' },
      { name: 'Notificaciones', url: 'https://inmovaapp.com/dashboard/notifications' },
      { name: 'Comunidades', url: 'https://inmovaapp.com/dashboard/communities' },
      { name: 'Coliving', url: 'https://inmovaapp.com/dashboard/coliving' },
      { name: 'Billing', url: 'https://inmovaapp.com/dashboard/billing' },
    ];

    for (const pageInfo of pagesToAudit) {
      const result = await auditPage(page, pageInfo.name, pageInfo.url);
      results.push(result);
      await page.waitForTimeout(1000);
    }

    // 4. Generar reporte
    console.log('\n4. Generando reporte...\n');

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === 'OK').length,
      warnings: results.filter((r) => r.status === 'WARNING').length,
      errors: results.filter((r) => r.status === 'ERROR').length,
      timestamp: new Date().toISOString(),
    };

    console.log('='.repeat(80));
    console.log('RESUMEN DE AUDITORIA');
    console.log('='.repeat(80));
    console.log(`Total páginas: ${summary.total}`);
    console.log(`OK: ${summary.ok}`);
    console.log(`Warnings: ${summary.warnings}`);
    console.log(`Errors: ${summary.errors}`);
    console.log('='.repeat(80));

    // Mostrar páginas con errores
    const errorPages = results.filter((r) => r.status === 'ERROR');
    if (errorPages.length > 0) {
      console.log('\nPAGINAS CON ERRORES:');
      errorPages.forEach((r) => {
        console.log(`\n- ${r.page} (${r.url})`);
        r.errors.forEach((e) => console.log(`  ERROR: ${e}`));
      });
    }

    // Mostrar páginas con warnings
    const warningPages = results.filter((r) => r.status === 'WARNING');
    if (warningPages.length > 0) {
      console.log('\nPAGINAS CON WARNINGS:');
      warningPages.forEach((r) => {
        console.log(`\n- ${r.page} (${r.url})`);
        r.warnings.forEach((w) => console.log(`  WARNING: ${w}`));
      });
    }

    // Guardar reporte JSON
    const report = {
      summary,
      results,
      consoleErrors: allErrors.map((msg) => ({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      })),
    };

    writeFileSync('visual-verification-results/audit-report.json', JSON.stringify(report, null, 2));
    console.log('\nReporte guardado en: visual-verification-results/audit-report.json');

    // Guardar reporte HTML
    const html = generateHTMLReport(summary, results);
    writeFileSync('visual-verification-results/audit-report.html', html);
    console.log('Reporte HTML guardado en: visual-verification-results/audit-report.html\n');

    console.log('='.repeat(80));
    console.log('AUDITORIA COMPLETADA');
    console.log('='.repeat(80) + '\n');
  } catch (error: any) {
    console.error('\nERROR FATAL durante la auditoría:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log('Cerrando navegador...');
      await browser.close();
      console.log('Navegador cerrado\n');
    }
  }
}

function generateHTMLReport(summary: any, results: AuditResult[]): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auditoría de Aplicación - ${new Date().toLocaleDateString()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { color: #333; }
        .summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat {
            display: inline-block;
            margin-right: 30px;
            font-size: 18px;
        }
        .stat strong { font-size: 24px; }
        .ok { color: #10b981; }
        .warning { color: #f59e0b; }
        .error { color: #ef4444; }
        .page-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #ccc;
        }
        .page-card.ok { border-left-color: #10b981; }
        .page-card.warning { border-left-color: #f59e0b; }
        .page-card.error { border-left-color: #ef4444; }
        .page-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
        .page-url { color: #666; font-size: 14px; margin-bottom: 10px; }
        .issues { margin-top: 10px; }
        .issue { padding: 8px; margin: 5px 0; border-radius: 4px; font-size: 14px; }
        .issue.error { background: #fee2e2; color: #991b1b; }
        .issue.warning { background: #fef3c7; color: #92400e; }
        img { max-width: 100%; border-radius: 4px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>📊 Auditoría de Aplicación</h1>
    <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    
    <div class="summary">
        <h2>Resumen</h2>
        <div class="stat"><strong>${summary.total}</strong> páginas auditadas</div>
        <div class="stat ok"><strong>${summary.ok}</strong> OK</div>
        <div class="stat warning"><strong>${summary.warnings}</strong> Warnings</div>
        <div class="stat error"><strong>${summary.errors}</strong> Errors</div>
    </div>
    
    <h2>Resultados Detallados</h2>
    ${results
      .map(
        (r) => `
    <div class="page-card ${r.status.toLowerCase()}">
        <div class="page-title">${r.page} - <span class="${r.status.toLowerCase()}">${r.status}</span></div>
        <div class="page-url">${r.url}</div>
        <div><strong>Título:</strong> ${r.title || 'N/A'}</div>
        ${
          r.errors.length > 0
            ? `<div class="issues">
                ${r.errors.map((e) => `<div class="issue error">❌ ${e}</div>`).join('')}
            </div>`
            : ''
        }
        ${
          r.warnings.length > 0
            ? `<div class="issues">
                ${r.warnings.map((w) => `<div class="issue warning">⚠️ ${w}</div>`).join('')}
            </div>`
            : ''
        }
    </div>
    `
      )
      .join('')}
</body>
</html>`;
}

runFullAudit().catch(console.error);
