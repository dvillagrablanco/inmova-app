/**
 * ACCESSIBILITY TESTING - PA11Y
 * Script para ejecutar tests de accesibilidad en múltiples páginas
 */

const pa11y = require('pa11y');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Páginas a testear
const pages = [
  {
    name: 'Login',
    url: `${BASE_URL}/auth/login`,
    requiresAuth: false,
  },
  {
    name: 'Dashboard',
    url: `${BASE_URL}/home`,
    requiresAuth: true,
  },
  {
    name: 'Payments List',
    url: `${BASE_URL}/pagos`,
    requiresAuth: true,
  },
  {
    name: 'Room Rental',
    url: `${BASE_URL}/room-rental`,
    requiresAuth: true,
  },
];

// Configuración de Pa11y
const pa11yConfig = {
  standard: 'WCAG2AA', // WCAG 2.1 Level AA
  runners: ['axe', 'htmlcs'],
  includeNotices: false,
  includeWarnings: true,
  chromeLaunchConfig: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  timeout: 60000,
};

// Función para generar reporte HTML
function generateHTMLReport(results) {
  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Accesibilidad - INMOVA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #4f46e5;
      margin-bottom: 10px;
      font-size: 32px;
    }
    .meta {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .summary-card.error { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .summary-card.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .summary-card h3 { font-size: 36px; margin-bottom: 5px; }
    .summary-card p { font-size: 14px; opacity: 0.9; }
    .page-results {
      margin-bottom: 40px;
    }
    .page-header {
      background: #f9fafb;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #4f46e5;
    }
    .page-header h2 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .page-header .url {
      color: #6b7280;
      font-size: 14px;
      word-break: break-all;
    }
    .issue {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .issue.error { border-left: 4px solid #ef4444; }
    .issue.warning { border-left: 4px solid #f59e0b; }
    .issue-type {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .issue-type.error { background: #fee2e2; color: #991b1b; }
    .issue-type.warning { background: #fef3c7; color: #92400e; }
    .issue-message { color: #374151; font-size: 15px; margin-bottom: 10px; font-weight: 500; }
    .issue-code {
      background: #f3f4f6;
      border-radius: 4px;
      padding: 10px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #1f2937;
      overflow-x: auto;
      margin-bottom: 10px;
    }
    .issue-selector { color: #6b7280; font-size: 13px; }
    .no-issues {
      background: #ecfdf5;
      border: 1px solid #10b981;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      color: #065f46;
    }
    .no-issues h3 { margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>♿ Reporte de Accesibilidad</h1>
    <p class="meta">Generado el: ${new Date().toLocaleString('es-ES')}</p>
    
    <div class="summary">
      <div class="summary-card">
        <h3>${results.length}</h3>
        <p>Páginas Analizadas</p>
      </div>
      <div class="summary-card error">
        <h3>${results.reduce((sum, r) => sum + r.errors, 0)}</h3>
        <p>Errores Críticos</p>
      </div>
      <div class="summary-card warning">
        <h3>${results.reduce((sum, r) => sum + r.warnings, 0)}</h3>
        <p>Advertencias</p>
      </div>
      <div class="summary-card success">
        <h3>${results.filter(r => r.errors === 0).length}</h3>
        <p>Páginas Sin Errores</p>
      </div>
    </div>

    ${results.map(page => `
      <div class="page-results">
        <div class="page-header">
          <h2>${page.name}</h2>
          <p class="url">${page.url}</p>
        </div>
        
        ${page.issues.length === 0 ? `
          <div class="no-issues">
            <h3>✅ ¡Excelente!</h3>
            <p>No se encontraron problemas de accesibilidad en esta página.</p>
          </div>
        ` : `
          ${page.issues.map(issue => `
            <div class="issue ${issue.type}">
              <span class="issue-type ${issue.type}">${issue.type.toUpperCase()}</span>
              <div class="issue-message">${issue.message}</div>
              ${issue.code ? `<div class="issue-code">${issue.code}</div>` : ''}
              <div class="issue-selector"><strong>Selector:</strong> ${issue.selector}</div>
            </div>
          `).join('')}
        `}
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;

  return html;
}

// Función principal
async function runAccessibilityTests() {
  console.log('🚀 Iniciando tests de accesibilidad...\n');

  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const page of pages) {
    console.log(`♿ Analizando: ${page.name} (${page.url})`);

    try {
      const result = await pa11y(page.url, pa11yConfig);

      const errors = result.issues.filter((i) => i.type === 'error');
      const warnings = result.issues.filter((i) => i.type === 'warning');

      console.log(`   ❌ Errores: ${errors.length}`);
      console.log(`   ⚠️  Advertencias: ${warnings.length}`);
      console.log('');

      totalErrors += errors.length;
      totalWarnings += warnings.length;

      results.push({
        name: page.name,
        url: page.url,
        errors: errors.length,
        warnings: warnings.length,
        issues: result.issues.map((i) => ({
          type: i.type,
          code: i.code,
          message: i.message,
          selector: i.selector,
        })),
      });
    } catch (error) {
      console.error(`   ❌ Error al analizar ${page.name}:`, error.message);
      results.push({
        name: page.name,
        url: page.url,
        errors: 1,
        warnings: 0,
        issues: [{
          type: 'error',
          code: 'TEST_ERROR',
          message: `Error al ejecutar el test: ${error.message}`,
          selector: 'N/A',
        }],
      });
    }
  }

  // Generar reportes
  const reportDir = path.join(__dirname, '..', 'pa11y-report');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Reporte JSON
  fs.writeFileSync(
    path.join(reportDir, 'accessibility-report.json'),
    JSON.stringify(results, null, 2)
  );

  // Reporte HTML
  const htmlReport = generateHTMLReport(results);
  fs.writeFileSync(path.join(reportDir, 'accessibility-report.html'), htmlReport);

  console.log('\n📊 Resumen Final:');
  console.log(`   Total de errores críticos: ${totalErrors}`);
  console.log(`   Total de advertencias: ${totalWarnings}`);
  console.log(`\n📎 Reportes generados en: ${reportDir}`);

  // Fallar el test si hay errores críticos
  if (totalErrors > 0) {
    console.error('\n❌ Tests de accesibilidad FALLARON debido a errores críticos.');
    process.exit(1);
  } else {
    console.log('\n✅ Tests de accesibilidad PASADOS exitosamente.');
    process.exit(0);
  }
}

// Ejecutar
runAccessibilityTests().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
