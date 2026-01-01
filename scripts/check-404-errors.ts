/**
 * Inspección automatizada de errores 404 en todas las rutas
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';

// Rutas críticas a verificar
const ROUTES = [
  // Auth
  '/login',
  '/register',
  '/landing',
  
  // Dashboard principal
  '/dashboard',
  '/dashboard/properties',
  '/dashboard/properties/new',
  '/dashboard/tenants',
  '/dashboard/contracts',
  '/dashboard/payments',
  '/dashboard/maintenance',
  '/dashboard/documents',
  '/dashboard/analytics',
  '/dashboard/calendar',
  '/dashboard/settings',
  
  // Admin
  '/admin',
  '/admin/users',
  '/admin/companies',
  '/admin/roles',
  '/admin/modules',
  '/admin/billing',
  '/admin/integrations',
  '/admin/settings',
  '/admin/audit',
  '/admin/system-health',
  
  // Verticales
  '/coliving',
  '/coliving/feed',
  '/coliving/events',
  '/coliving/packages',
  '/coliving/profiles',
  
  '/str',
  '/str/listings',
  '/str/bookings',
  '/str/calendar',
  '/str/pricing',
  '/str/housekeeping',
  
  '/community',
  '/community/votes',
  '/community/events',
  '/community/minutes',
  
  // Portales
  '/portal-inquilino',
  '/portal-inquilino/dashboard',
  '/portal-inquilino/pagos',
  '/portal-inquilino/documentos',
  '/portal-inquilino/mantenimiento',
  
  '/portal-proveedor',
  '/portal-proveedor/dashboard',
  '/portal-proveedor/work-orders',
  '/portal-proveedor/invoices',
  
  '/portal-propietario',
  '/portal-propietario/dashboard',
  '/portal-propietario/propiedades',
  
  // Módulos especiales
  '/crm',
  '/crm/leads',
  '/crm/activities',
  
  '/marketplace',
  '/marketplace/services',
  '/marketplace/jobs',
  
  '/bi',
  '/bi/reports',
  
  '/legal',
  '/legal/contracts',
  '/legal/compliance',
  
  '/energy',
  '/energy/readings',
  '/energy/alerts',
  
  '/treasury',
  '/treasury/forecast',
  '/treasury/alerts',
  
  '/professional',
  '/professional/projects',
  
  '/esg',
  '/esg/metrics',
  '/esg/reports',
  
  // Features
  '/features/valuations',
  '/features/signatures',
  '/features/virtual-tours',
  '/features/matching',
  '/features/incidents',
  
  // Settings
  '/settings',
  '/settings/profile',
  '/settings/security',
  '/settings/notifications',
  '/settings/integrations',
  '/settings/branding',
];

interface RouteResult {
  route: string;
  status: number;
  is404: boolean;
  finalURL: string;
  error?: string;
}

async function checkRoute(page: Page, route: string): Promise<RouteResult> {
  try {
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
    
    const status = response?.status() || 0;
    const finalURL = page.url();
    
    // Verificar si es 404
    const is404 = status === 404 || 
                  finalURL.includes('/404') ||
                  await page.locator('text=/404|not found/i').count() > 0;
    
    return {
      route,
      status,
      is404,
      finalURL,
    };
  } catch (error: any) {
    return {
      route,
      status: 0,
      is404: true,
      finalURL: '',
      error: error.message,
    };
  }
}

async function loginIfNeeded(page: Page) {
  const currentURL = page.url();
  
  if (currentURL.includes('/login') || currentURL.includes('/unauthorized')) {
    console.log('🔑 Login requerido, autenticando...');
    
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
}

async function main() {
  console.log('🔍 Iniciando inspección de rutas...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results: RouteResult[] = [];
  let errors404 = 0;
  
  for (const route of ROUTES) {
    process.stdout.write(`Verificando ${route}... `);
    
    const result = await checkRoute(page, route);
    results.push(result);
    
    // Login si redirige
    await loginIfNeeded(page);
    
    if (result.is404) {
      console.log('❌ 404');
      errors404++;
    } else {
      console.log(`✅ ${result.status}`);
    }
    
    await page.waitForTimeout(300);
  }
  
  await browser.close();
  
  // Resultados
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTADOS');
  console.log('='.repeat(80));
  
  const errors = results.filter(r => r.is404);
  
  console.log(`\n🔴 Errores 404: ${errors404}/${ROUTES.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Rutas con error 404:\n');
    errors.forEach(r => {
      console.log(`  ${r.route}`);
      if (r.finalURL !== `${BASE_URL}${r.route}`) {
        console.log(`    → Redirige a: ${r.finalURL}`);
      }
      if (r.error) {
        console.log(`    → Error: ${r.error}`);
      }
    });
  }
  
  console.log(`\n✅ Rutas funcionando: ${ROUTES.length - errors404}/${ROUTES.length}`);
  
  // Guardar reporte JSON
  const report = {
    timestamp: new Date().toISOString(),
    totalRoutes: ROUTES.length,
    errors404: errors404,
    success: ROUTES.length - errors404,
    results: results.sort((a, b) => {
      if (a.is404 && !b.is404) return -1;
      if (!a.is404 && b.is404) return 1;
      return 0;
    }),
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    '/workspace/404-errors-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Reporte guardado: 404-errors-report.json');
  
  process.exit(errors404 > 0 ? 1 : 0);
}

main();
