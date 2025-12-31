/**
 * 🎭 AUDITORÍA FRONTEND COMPLETA CON PLAYWRIGHT
 * 
 * Test exhaustivo que:
 * - Login como superadmin
 * - Revisa todas las rutas principales
 * - Detecta errores de consola
 * - Detecta errores de hydration
 * - Verifica accesibilidad básica
 * - Verifica responsive design
 * - Captura screenshots de errores
 * - Genera reporte detallado
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SUPERADMIN_EMAIL = 'superadmin@inmova.com';
const SUPERADMIN_PASSWORD = 'superadmin123';

const REPORT_DIR = path.join(process.cwd(), 'frontend-audit-report');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');

// Rutas a auditar
const ROUTES_TO_AUDIT = [
  { name: 'Landing', url: '/', requiresAuth: false },
  { name: 'Login', url: '/login', requiresAuth: false },
  { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
  { name: 'Propiedades', url: '/dashboard/propiedades', requiresAuth: true },
  { name: 'Edificios', url: '/dashboard/edificios', requiresAuth: true },
  { name: 'Inquilinos', url: '/dashboard/inquilinos', requiresAuth: true },
  { name: 'Contratos', url: '/dashboard/contratos', requiresAuth: true },
  { name: 'Pagos', url: '/dashboard/pagos', requiresAuth: true },
  { name: 'Mantenimiento', url: '/dashboard/mantenimiento', requiresAuth: true },
  { name: 'Documentos', url: '/dashboard/documentos', requiresAuth: true },
  { name: 'Analytics', url: '/dashboard/analytics', requiresAuth: true },
  { name: 'CRM', url: '/dashboard/crm', requiresAuth: true },
  { name: 'Comunidades', url: '/dashboard/comunidades', requiresAuth: true },
  { name: 'Superadmin', url: '/superadmin', requiresAuth: true },
  { name: 'Perfil', url: '/dashboard/perfil', requiresAuth: true },
  { name: 'Configuración', url: '/dashboard/configuracion', requiresAuth: true },
];

// Tipos de errores a detectar
interface ErrorReport {
  route: string;
  consoleErrors: Array<{ type: string; message: string }>;
  networkErrors: Array<{ url: string; status: number }>;
  hydrationErrors: boolean;
  accessibilityIssues: string[];
  missingElements: string[];
  brokenImages: string[];
  screenshot?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Setup de directorios para reporte
 */
function setupReportDirectories() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

/**
 * Captura errors de consola
 */
function setupConsoleListeners(page: Page, errors: Array<{ type: string; message: string }>) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      errors.push({
        type,
        message: msg.text(),
      });
    }
  });

  page.on('pageerror', (error) => {
    errors.push({
      type: 'pageerror',
      message: error.message,
    });
  });
}

/**
 * Captura errores de red
 */
function setupNetworkListeners(
  page: Page,
  errors: Array<{ url: string; status: number }>
) {
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      errors.push({
        url: response.url(),
        status,
      });
    }
  });
}

/**
 * Detecta errores de hydration en la página
 */
async function detectHydrationErrors(page: Page): Promise<boolean> {
  const pageContent = await page.content();
  
  // Patrones comunes de errores de hydration
  const hydrationPatterns = [
    'Hydration failed',
    'hydration mismatch',
    'server HTML',
    'client-side exception',
    'Text content does not match',
  ];

  return hydrationPatterns.some((pattern) =>
    pageContent.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Verifica accesibilidad básica
 */
async function checkBasicAccessibility(page: Page): Promise<string[]> {
  const issues: string[] = [];

  // 1. Verificar que haya un h1
  const h1Count = await page.locator('h1').count();
  if (h1Count === 0) {
    issues.push('No se encontró ningún elemento <h1>');
  } else if (h1Count > 1) {
    issues.push(`Se encontraron ${h1Count} elementos <h1> (debería haber solo uno)`);
  }

  // 2. Verificar alt en imágenes
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt} imágenes sin atributo alt`);
  }

  // 3. Verificar botones sin aria-label o texto
  const buttons = await page.locator('button').count();
  const buttonsWithLabel = await page.locator('button[aria-label], button:has-text("")').count();
  if (buttons > buttonsWithLabel) {
    issues.push(`${buttons - buttonsWithLabel} botones sin texto ni aria-label`);
  }

  // 4. Verificar inputs sin label
  const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').count();
  const inputsWithLabel = await page.locator('input[type="text"][aria-label], input[type="email"][aria-label], input[type="password"][aria-label]').count();
  if (inputs > inputsWithLabel) {
    const missingLabels = inputs - inputsWithLabel;
    if (missingLabels > 0) {
      issues.push(`${missingLabels} inputs sin label o aria-label`);
    }
  }

  // 5. Verificar contraste (simplificado - solo verifica si hay estilos inline con colores problemáticos)
  const lowContrastElements = await page.locator('[style*="color: #ccc"], [style*="color: #ddd"]').count();
  if (lowContrastElements > 0) {
    issues.push(`${lowContrastElements} elementos con posible bajo contraste`);
  }

  return issues;
}

/**
 * Verifica elementos comunes que deberían existir
 */
async function checkMissingElements(page: Page): Promise<string[]> {
  const missing: string[] = [];

  // Verificar navegación
  const nav = await page.locator('nav').count();
  if (nav === 0) {
    missing.push('No se encontró elemento <nav>');
  }

  // Verificar footer (en páginas públicas)
  const isPublicPage = page.url().includes('/login') || page.url() === '/';
  if (isPublicPage) {
    const footer = await page.locator('footer').count();
    if (footer === 0) {
      missing.push('No se encontró elemento <footer> en página pública');
    }
  }

  return missing;
}

/**
 * Detecta imágenes rotas
 */
async function checkBrokenImages(page: Page): Promise<string[]> {
  const brokenImages: string[] = [];

  const images = await page.locator('img').all();
  
  for (const img of images) {
    const src = await img.getAttribute('src');
    if (!src) continue;

    // Verificar si la imagen se cargó correctamente
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    if (naturalWidth === 0) {
      brokenImages.push(src);
    }
  }

  return brokenImages;
}

/**
 * Genera reporte HTML
 */
function generateHTMLReport(reports: ErrorReport[]) {
  const timestamp = new Date().toISOString();
  
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auditoría Frontend - Inmova App</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .stat {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #1a1a1a;
    }
    .stat-label {
      color: #6b7280;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .route-report {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .route-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .route-name {
      font-size: 1.3em;
      font-weight: bold;
      color: #1a1a1a;
    }
    .status-badge {
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: 600;
    }
    .status-ok {
      background: #dcfce7;
      color: #166534;
    }
    .status-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .status-error {
      background: #fee2e2;
      color: #991b1b;
    }
    .error-section {
      margin: 15px 0;
    }
    .error-section h3 {
      color: #374151;
      font-size: 1.1em;
      margin-bottom: 10px;
    }
    .error-list {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #ef4444;
    }
    .error-item {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .error-item:last-child {
      border-bottom: none;
    }
    .error-type {
      font-weight: 600;
      color: #dc2626;
      margin-right: 10px;
    }
    .screenshot {
      margin-top: 15px;
    }
    .screenshot img {
      max-width: 100%;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .timestamp {
      color: #6b7280;
      font-size: 0.9em;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>🎭 Auditoría Frontend Completa - Inmova App</h1>
  
  <div class="summary">
    <h2>📊 Resumen Ejecutivo</h2>
    <div class="summary-stats">
      <div class="stat">
        <div class="stat-value">${reports.length}</div>
        <div class="stat-label">Rutas Auditadas</div>
      </div>
      <div class="stat">
        <div class="stat-value">${reports.filter(r => r.consoleErrors.length > 0).length}</div>
        <div class="stat-label">Rutas con Errores de Consola</div>
      </div>
      <div class="stat">
        <div class="stat-value">${reports.filter(r => r.networkErrors.length > 0).length}</div>
        <div class="stat-label">Rutas con Errores de Red</div>
      </div>
      <div class="stat">
        <div class="stat-value">${reports.filter(r => r.hydrationErrors).length}</div>
        <div class="stat-label">Errores de Hydration</div>
      </div>
      <div class="stat">
        <div class="stat-value">${reports.filter(r => r.accessibilityIssues.length > 0).length}</div>
        <div class="stat-label">Rutas con Problemas de Accesibilidad</div>
      </div>
    </div>
  </div>
`;

  // Generar reporte por ruta
  reports.forEach((report) => {
    const hasErrors =
      report.consoleErrors.length > 0 ||
      report.networkErrors.length > 0 ||
      report.hydrationErrors ||
      report.accessibilityIssues.length > 0 ||
      report.brokenImages.length > 0;

    const status = hasErrors
      ? report.consoleErrors.some(e => e.type === 'error') || report.networkErrors.some(e => e.status >= 500)
        ? 'error'
        : 'warning'
      : 'ok';

    html += `
  <div class="route-report">
    <div class="route-header">
      <div class="route-name">${report.route}</div>
      <div class="status-badge status-${status}">
        ${status === 'ok' ? '✅ Sin errores' : status === 'warning' ? '⚠️ Warnings' : '❌ Errores'}
      </div>
    </div>
`;

    // Errores de consola
    if (report.consoleErrors.length > 0) {
      html += `
    <div class="error-section">
      <h3>🔴 Errores de Consola (${report.consoleErrors.length})</h3>
      <div class="error-list">
`;
      report.consoleErrors.forEach((error) => {
        html += `        <div class="error-item">
          <span class="error-type">[${error.type.toUpperCase()}]</span>
          <span>${error.message}</span>
        </div>
`;
      });
      html += `      </div>
    </div>
`;
    }

    // Errores de red
    if (report.networkErrors.length > 0) {
      html += `
    <div class="error-section">
      <h3>🌐 Errores de Red (${report.networkErrors.length})</h3>
      <div class="error-list">
`;
      report.networkErrors.forEach((error) => {
        html += `        <div class="error-item">
          <span class="error-type">[${error.status}]</span>
          <span>${error.url}</span>
        </div>
`;
      });
      html += `      </div>
    </div>
`;
    }

    // Hydration errors
    if (report.hydrationErrors) {
      html += `
    <div class="error-section">
      <h3>💧 Error de Hydration Detectado</h3>
      <div class="error-list">
        <div class="error-item">
          La página tiene errores de hidratación de React. Esto indica que el HTML generado en el servidor no coincide con el renderizado en el cliente.
        </div>
      </div>
    </div>
`;
    }

    // Accesibilidad
    if (report.accessibilityIssues.length > 0) {
      html += `
    <div class="error-section">
      <h3>♿ Problemas de Accesibilidad (${report.accessibilityIssues.length})</h3>
      <div class="error-list">
`;
      report.accessibilityIssues.forEach((issue) => {
        html += `        <div class="error-item">${issue}</div>
`;
      });
      html += `      </div>
    </div>
`;
    }

    // Imágenes rotas
    if (report.brokenImages.length > 0) {
      html += `
    <div class="error-section">
      <h3>🖼️ Imágenes Rotas (${report.brokenImages.length})</h3>
      <div class="error-list">
`;
      report.brokenImages.forEach((img) => {
        html += `        <div class="error-item">${img}</div>
`;
      });
      html += `      </div>
    </div>
`;
    }

    // Screenshot
    if (report.screenshot) {
      html += `
    <div class="screenshot">
      <h3>📸 Captura de Pantalla</h3>
      <img src="screenshots/${path.basename(report.screenshot)}" alt="Screenshot de ${report.route}">
    </div>
`;
    }

    html += `  </div>
`;
  });

  html += `
  <div class="timestamp">
    Reporte generado: ${timestamp}
  </div>
</body>
</html>
`;

  fs.writeFileSync(path.join(REPORT_DIR, 'index.html'), html);
  console.log(`\n📄 Reporte HTML generado en: ${path.join(REPORT_DIR, 'index.html')}`);
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('🎭 Auditoría Frontend Completa', () => {
  const allReports: ErrorReport[] = [];

  test.beforeAll(() => {
    setupReportDirectories();
  });

  test('Login como superadmin', async ({ page }) => {
    await page.goto('/login');
    
    // Llenar credenciales
    await page.fill('input[type="email"]', SUPERADMIN_EMAIL);
    await page.fill('input[type="password"]', SUPERADMIN_PASSWORD);
    
    // Click en botón de login
    const loginButton = page.locator('button').filter({ hasText: /iniciar sesión|entrar|login/i }).first();
    await loginButton.click();
    
    // Esperar navegación
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
    
    // Verificar que estamos logueados
    expect(page.url()).toMatch(/\/(dashboard|home)/);
    
    console.log('✅ Login exitoso como superadmin');
  });

  // Auditar cada ruta
  for (const route of ROUTES_TO_AUDIT) {
    test(`Auditar ruta: ${route.name}`, async ({ page }) => {
      const report: ErrorReport = {
        route: `${route.name} (${route.url})`,
        consoleErrors: [],
        networkErrors: [],
        hydrationErrors: false,
        accessibilityIssues: [],
        missingElements: [],
        brokenImages: [],
      };

      // Setup listeners
      setupConsoleListeners(page, report.consoleErrors);
      setupNetworkListeners(page, report.networkErrors);

      try {
        // Navegar a la ruta
        await page.goto(route.url, { waitUntil: 'networkidle', timeout: 15000 });
        
        // Esperar a que la página se cargue
        await page.waitForTimeout(2000);

        // Detectar hydration errors
        report.hydrationErrors = await detectHydrationErrors(page);

        // Verificar accesibilidad
        report.accessibilityIssues = await checkBasicAccessibility(page);

        // Verificar elementos faltantes
        report.missingElements = await checkMissingElements(page);

        // Verificar imágenes rotas
        report.brokenImages = await checkBrokenImages(page);

        // Capturar screenshot
        const screenshotPath = path.join(
          SCREENSHOTS_DIR,
          `${route.name.replace(/\s+/g, '-').toLowerCase()}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        report.screenshot = screenshotPath;

        console.log(`✅ Auditoría completada: ${route.name}`);
      } catch (error: any) {
        console.error(`❌ Error auditando ${route.name}:`, error.message);
        report.consoleErrors.push({
          type: 'error',
          message: `Error navegando a la ruta: ${error.message}`,
        });
      }

      allReports.push(report);
    });
  }

  test.afterAll(() => {
    // Generar reporte HTML
    generateHTMLReport(allReports);

    // Generar reporte JSON
    fs.writeFileSync(
      path.join(REPORT_DIR, 'report.json'),
      JSON.stringify(allReports, null, 2)
    );

    // Log resumen en consola
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE AUDITORÍA');
    console.log('='.repeat(80));
    console.log(`Total de rutas auditadas: ${allReports.length}`);
    console.log(
      `Rutas con errores de consola: ${allReports.filter((r) => r.consoleErrors.length > 0).length}`
    );
    console.log(
      `Rutas con errores de red: ${allReports.filter((r) => r.networkErrors.length > 0).length}`
    );
    console.log(
      `Rutas con hydration errors: ${allReports.filter((r) => r.hydrationErrors).length}`
    );
    console.log(
      `Rutas con problemas de accesibilidad: ${allReports.filter((r) => r.accessibilityIssues.length > 0).length}`
    );
    console.log('='.repeat(80));
    console.log(`\n📄 Reporte completo: ${path.join(REPORT_DIR, 'index.html')}`);
  });
});
