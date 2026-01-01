const puppeteer = require('puppeteer');
const fs = require('fs');

// Páginas a inspeccionar (organizadas por prioridad)
const PAGES_TO_INSPECT = {
  landing: [
    { name: 'Landing', url: '/landing' },
    { name: 'Home', url: '/' },
    { name: 'Login', url: '/login' },
    { name: 'Register', url: '/register' },
  ],
  dashboard: [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Properties', url: '/dashboard/properties' },
    { name: 'Tenants', url: '/dashboard/tenants' },
    { name: 'Contracts', url: '/dashboard/contracts' },
    { name: 'Payments', url: '/dashboard/payments' },
    { name: 'Maintenance', url: '/dashboard/maintenance' },
    { name: 'Analytics', url: '/dashboard/analytics' },
    { name: 'Messages', url: '/dashboard/messages' },
    { name: 'Documents', url: '/dashboard/documents' },
    { name: 'Referrals', url: '/dashboard/referrals' },
    { name: 'Budgets', url: '/dashboard/budgets' },
    { name: 'Coupons', url: '/dashboard/coupons' },
  ],
  admin: [
    { name: 'Admin', url: '/admin' },
    { name: 'AdminUsers', url: '/admin/usuarios' },
    { name: 'AdminConfig', url: '/admin/configuracion' },
    { name: 'AdminPlanes', url: '/admin/planes' },
    { name: 'AdminModulos', url: '/admin/modulos' },
  ],
  portals: [
    { name: 'PortalInquilino', url: '/portal-inquilino' },
    { name: 'PortalProveedor', url: '/portal-proveedor' },
    { name: 'PortalComercial', url: '/portal-comercial' },
  ],
  features: [
    { name: 'Propiedades', url: '/propiedades' },
    { name: 'Seguros', url: '/seguros' },
    { name: 'Reportes', url: '/reportes' },
    { name: 'STR', url: '/str' },
    { name: 'Partners', url: '/partners' },
    { name: 'Coliving', url: '/coliving' },
    { name: 'StudentHousing', url: '/student-housing' },
    { name: 'Workspace', url: '/workspace' },
    { name: 'Votaciones', url: '/votaciones' },
    { name: 'Visitas', url: '/visitas' },
  ]
};

const results = {
  summary: { total: 0, success: 0, errors: 0, warnings: 0 },
  pages: [],
  criticalErrors: [],
};

async function inspectPage(browser, baseURL, pageData) {
  const page = await browser.newPage();
  
  const pageResult = {
    name: pageData.name,
    url: pageData.url,
    status: 'unknown',
    httpCode: null,
    consoleErrors: [],
    jsErrors: [],
    hydrationErrors: [],
    loadTime: 0,
    hasButtons: false,
  };
  
  try {
    // Capturar errores de consola
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        pageResult.consoleErrors.push(text);
      }
      
      // Detectar errores de hydration
      if (text.toLowerCase().includes('hydration')) {
        pageResult.hydrationErrors.push(text);
      }
    });
    
    // Capturar errores de JavaScript
    page.on('pageerror', error => {
      pageResult.jsErrors.push(error.message);
    });
    
    // Navegar
    const startTime = Date.now();
    const response = await page.goto(baseURL + pageData.url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    pageResult.loadTime = Date.now() - startTime;
    pageResult.httpCode = response.status();
    
    // Esperar para componentes lazy
    await page.waitForTimeout(2000);
    
    // Verificar si hay botones
    const buttons = await page.$$('button, a[role="button"], input[type="submit"], input[type="button"]');
    pageResult.hasButtons = buttons.length > 0;
    
    // Determinar estado
    if (pageResult.httpCode === 200 && pageResult.jsErrors.length === 0 && pageResult.consoleErrors.length === 0) {
      pageResult.status = 'success';
      results.summary.success++;
    } else if (pageResult.httpCode === 200) {
      pageResult.status = 'warning';
      results.summary.warnings++;
    } else {
      pageResult.status = 'error';
      results.summary.errors++;
    }
    
  } catch (error) {
    pageResult.status = 'error';
    pageResult.jsErrors.push('Navigation error: ' + error.message);
    results.summary.errors++;
    
    // Errores críticos en páginas importantes
    if (['Landing', 'Login', 'Dashboard'].includes(pageData.name)) {
      results.criticalErrors.push({
        page: pageData.name,
        error: error.message,
      });
    }
  }
  
  results.pages.push(pageResult);
  results.summary.total++;
  
  await page.close();
  return pageResult;
}

(async () => {
  console.log('🎨 INSPECCIÓN VISUAL EXHAUSTIVA - INMOVA APP');
  console.log('='.repeat(80));
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  
  const baseURL = 'https://inmovaapp.com';
  
  // Inspeccionar por categorías
  for (const [category, pages] of Object.entries(PAGES_TO_INSPECT)) {
    console.log('');
    console.log('📋 ' + category.toUpperCase());
    console.log('-'.repeat(80));
    
    for (const pageData of pages) {
      process.stdout.write('  ' + pageData.name.padEnd(25) + '...');
      const result = await inspectPage(browser, baseURL, pageData);
      
      const emoji = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(' ' + emoji + ' HTTP ' + result.httpCode + ' (' + result.loadTime + 'ms)');
      
      // Mostrar errores inmediatamente
      if (result.jsErrors.length > 0) {
        console.log('    🐛 ' + result.jsErrors.length + ' JS errors');
        result.jsErrors.slice(0, 2).forEach(err => {
          console.log('       - ' + err.substring(0, 100));
        });
      }
      if (result.consoleErrors.length > 0) {
        console.log('    ⚠️ ' + result.consoleErrors.length + ' console errors');
        result.consoleErrors.slice(0, 2).forEach(err => {
          console.log('       - ' + err.substring(0, 100));
        });
      }
      if (result.hydrationErrors.length > 0) {
        console.log('    💧 ' + result.hydrationErrors.length + ' hydration errors');
      }
    }
  }
  
  await browser.close();
  
  // Guardar resultados
  fs.writeFileSync('/tmp/inspection-results.json', JSON.stringify(results, null, 2));
  
  // Resumen
  console.log('');
  console.log('='.repeat(80));
  console.log('📊 RESUMEN DE INSPECCIÓN');
  console.log('='.repeat(80));
  console.log('Total páginas inspeccionadas: ' + results.summary.total);
  console.log('✅ Éxito: ' + results.summary.success);
  console.log('⚠️ Warnings: ' + results.summary.warnings);
  console.log('❌ Errores: ' + results.summary.errors);
  
  if (results.criticalErrors.length > 0) {
    console.log('');
    console.log('🚨 ERRORES CRÍTICOS:');
    results.criticalErrors.forEach(err => {
      console.log('  ❌ ' + err.page + ': ' + err.error);
    });
  }
  
  const successRate = ((results.summary.success / results.summary.total) * 100).toFixed(1);
  console.log('');
  console.log('Tasa de éxito: ' + successRate + '%');
  console.log('');
  console.log('📁 Resultados guardados en: /tmp/inspection-results.json');
  
  process.exit(0);
})();
