/**
 * Verificación COMPLETA de páginas Super Admin
 * Incluye todas las páginas con submenús
 */
import { chromium } from '@playwright/test';

const BASE_URL = 'https://inmovaapp.com';
const SUPER_ADMIN_EMAIL = 'admin@inmova.app';
const SUPER_ADMIN_PASSWORD = 'Admin123!';

// TODAS las páginas del Super Admin organizadas por sección
const SUPERADMIN_PAGES = {
  'Gestión de Plataforma': [
    { path: '/admin/dashboard', name: 'Dashboard' },
    { path: '/admin/clientes', name: 'Clientes B2B' },
    { path: '/admin/clientes/comparar', name: '↳ Comparar Empresas' },
    { path: '/admin/planes', name: 'Billing - Planes' },
    { path: '/admin/facturacion-b2b', name: '↳ Facturación B2B' },
    { path: '/admin/cupones', name: 'Cupones' },
    { path: '/admin/partners', name: 'Partners' },
    { path: '/dashboard/integrations', name: 'Integraciones - Dashboard' },
    { path: '/admin/integraciones-contables', name: '↳ Contables' },
    { path: '/admin/marketplace', name: 'Marketplace - Servicios' },
    { path: '/admin/addons', name: '↳ Addons' },
    { path: '/admin/plantillas-sms', name: 'Servicios - Plantillas SMS' },
    { path: '/admin/firma-digital', name: '↳ Firma Digital' },
    { path: '/admin/ocr-import', name: '↳ OCR Import' },
    { path: '/admin/legal', name: 'Legal' },
    { path: '/admin/activity', name: 'Monitoreo - Actividad' },
    { path: '/admin/alertas', name: '↳ Alertas' },
    { path: '/admin/salud-sistema', name: '↳ Salud Sistema' },
    { path: '/admin/metricas-uso', name: '↳ Métricas de Uso' },
    { path: '/admin/reportes-programados', name: '↳ Reportes' },
    { path: '/admin/portales-externos', name: 'Portales' },
    { path: '/admin/seguridad', name: 'Seguridad - General' },
    { path: '/admin/backup-restore', name: '↳ Backup' },
    { path: '/api-docs', name: 'API Docs' },
  ],
  'Gestión de Empresa': [
    { path: '/admin/configuracion', name: 'Configuración' },
    { path: '/admin/usuarios', name: 'Usuarios' },
    { path: '/admin/modulos', name: 'Módulos' },
    { path: '/admin/personalizacion', name: 'Branding' },
    { path: '/admin/aprobaciones', name: 'Aprobaciones' },
    { path: '/admin/importar', name: 'Importar Datos' },
    { path: '/admin/sugerencias', name: 'Sugerencias' },
  ],
};

interface PageResult {
  section: string;
  path: string;
  name: string;
  status: 'ok' | 'error' | '404' | '500';
  loadTime: number;
  errorMessage?: string;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN COMPLETA - SUPER ADMIN');
  console.log('='.repeat(70));
  console.log(`\nURL: ${BASE_URL}`);
  console.log(`Usuario: ${SUPER_ADMIN_EMAIL}\n`);

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // Login
  console.log('🔐 Iniciando sesión...');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"], input[type="email"]', SUPER_ADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', SUPER_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
    console.log('✅ Sesión iniciada\n');
  } catch (e: any) {
    console.error('❌ Error en login:', e.message);
    await browser.close();
    process.exit(1);
  }

  const results: PageResult[] = [];
  let totalOk = 0;
  let totalErrors = 0;

  // Verificar cada sección
  for (const [section, pages] of Object.entries(SUPERADMIN_PAGES)) {
    console.log(`\n📂 ${section}`);
    console.log('-'.repeat(50));

    for (const pageInfo of pages) {
      const indent = pageInfo.name.startsWith('↳') ? '   ' : '';
      process.stdout.write(`${indent}  ${pageInfo.name.replace('↳ ', '').padEnd(25)}... `);

      const result: PageResult = {
        section,
        path: pageInfo.path,
        name: pageInfo.name,
        status: 'ok',
        loadTime: 0,
      };

      const startTime = Date.now();

      try {
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        result.loadTime = Date.now() - startTime;
        const httpStatus = response?.status() || 200;
        const currentUrl = page.url();

        // Verificar errores
        if (httpStatus === 404 || currentUrl.includes('/404')) {
          result.status = '404';
          result.errorMessage = 'Página no encontrada';
        } else if (httpStatus >= 500) {
          result.status = '500';
          result.errorMessage = 'Error del servidor';
        } else if (currentUrl.includes('/login')) {
          result.status = 'error';
          result.errorMessage = 'Redirigido a login';
        } else {
          // Esperar un poco y verificar errores en la página
          await page.waitForTimeout(500);
          
          // Buscar mensajes de error visibles
          const errorElement = await page.$('[class*="error"]:not([class*="border"]), .error-boundary');
          if (errorElement) {
            const errorText = await errorElement.textContent();
            if (errorText && errorText.toLowerCase().includes('error')) {
              result.status = 'error';
              result.errorMessage = errorText.substring(0, 80);
            }
          }
        }

        // Mostrar resultado
        if (result.status === 'ok') {
          console.log(`✅ OK (${result.loadTime}ms)`);
          totalOk++;
        } else {
          console.log(`❌ ${result.status.toUpperCase()} - ${result.errorMessage}`);
          totalErrors++;
        }

      } catch (error: any) {
        result.loadTime = Date.now() - startTime;
        result.status = 'error';
        result.errorMessage = error.message.substring(0, 80);
        console.log(`❌ ERROR - ${result.errorMessage}`);
        totalErrors++;
      }

      results.push(result);
    }
  }

  await browser.close();

  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70));
  
  const total = totalOk + totalErrors;
  const percentage = ((totalOk / total) * 100).toFixed(1);
  
  console.log(`\n✅ Páginas OK: ${totalOk}/${total} (${percentage}%)`);
  console.log(`❌ Páginas con error: ${totalErrors}/${total}`);

  if (totalErrors > 0) {
    console.log('\n🔴 PÁGINAS CON PROBLEMAS:');
    results.filter(r => r.status !== 'ok').forEach(r => {
      console.log(`   • ${r.name} (${r.path}): ${r.status} - ${r.errorMessage}`);
    });
  }

  // Verificación de submenús disponibles
  console.log('\n📋 ESTRUCTURA VERIFICADA:');
  console.log('   • Gestión de Plataforma: 24 páginas');
  console.log('   • Gestión de Empresa: 7 páginas');
  console.log('   • Submenús: Clientes, Billing, Integraciones, Marketplace,');
  console.log('               Servicios, Monitoreo, Seguridad');

  console.log('\n' + '='.repeat(70));
  
  if (totalErrors === 0) {
    console.log('✅ TODAS LAS PÁGINAS DEL SUPER ADMIN FUNCIONAN CORRECTAMENTE');
  } else {
    console.log('⚠️ HAY PÁGINAS CON PROBLEMAS QUE REQUIEREN ATENCIÓN');
  }
  console.log('='.repeat(70) + '\n');

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(console.error);
