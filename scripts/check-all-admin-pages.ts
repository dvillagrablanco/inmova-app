/**
 * Script para verificar TODAS las páginas admin existentes
 */
import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';
const SUPER_ADMIN_EMAIL = 'admin@inmova.app';
const SUPER_ADMIN_PASSWORD = 'Admin123!';

// TODAS las páginas admin que existen en el filesystem
const ALL_ADMIN_PAGES = [
  // Gestión de Plataforma (en sidebar)
  { path: '/admin/dashboard', name: 'Dashboard', inSidebar: true },
  { path: '/admin/clientes', name: 'Clientes B2B', inSidebar: true },
  { path: '/admin/clientes/comparar', name: 'Comparar Clientes', inSidebar: false },
  { path: '/admin/planes', name: 'Billing/Planes', inSidebar: true },
  { path: '/admin/cupones', name: 'Cupones', inSidebar: true },
  { path: '/admin/partners', name: 'Partners', inSidebar: true },
  { path: '/admin/marketplace', name: 'Marketplace', inSidebar: true },
  { path: '/admin/activity', name: 'Monitoreo/Actividad', inSidebar: true },
  { path: '/admin/portales-externos', name: 'Portales Externos', inSidebar: true },
  { path: '/admin/seguridad', name: 'Seguridad', inSidebar: true },
  
  // Gestión de Empresa (en sidebar)
  { path: '/admin/configuracion', name: 'Configuración', inSidebar: true },
  { path: '/admin/usuarios', name: 'Usuarios', inSidebar: true },
  { path: '/admin/modulos', name: 'Módulos', inSidebar: true },
  { path: '/admin/personalizacion', name: 'Branding', inSidebar: true },
  { path: '/admin/aprobaciones', name: 'Aprobaciones', inSidebar: true },
  { path: '/admin/importar', name: 'Importar Datos', inSidebar: true },
  { path: '/admin/sugerencias', name: 'Sugerencias', inSidebar: true },
  
  // Páginas existentes NO en sidebar (ocultas/legado)
  { path: '/admin/plantillas-sms', name: 'Plantillas SMS', inSidebar: false },
  { path: '/admin/integraciones-contables', name: 'Integraciones Contables', inSidebar: false },
  { path: '/admin/legal', name: 'Legal', inSidebar: false },
  { path: '/admin/salud-sistema', name: 'Salud Sistema', inSidebar: false },
  { path: '/admin/ocr-import', name: 'OCR Import', inSidebar: false },
  { path: '/admin/firma-digital', name: 'Firma Digital', inSidebar: false },
  { path: '/admin/recuperar-contrasena', name: 'Recuperar Contraseña', inSidebar: false },
  { path: '/admin/reportes-programados', name: 'Reportes Programados', inSidebar: false },
  { path: '/admin/facturacion-b2b', name: 'Facturación B2B', inSidebar: false },
  { path: '/admin/metricas-uso', name: 'Métricas de Uso', inSidebar: false },
  { path: '/admin/backup-restore', name: 'Backup y Restore', inSidebar: false },
  { path: '/admin/addons', name: 'Addons', inSidebar: false },
  { path: '/admin/alertas', name: 'Alertas', inSidebar: false },
  
  // Otras rutas
  { path: '/dashboard/integrations', name: 'Integraciones Dashboard', inSidebar: true },
  { path: '/api-docs', name: 'API Docs', inSidebar: true },
];

interface PageResult {
  path: string;
  name: string;
  inSidebar: boolean;
  status: 'ok' | 'error' | '404' | '500' | 'redirect';
  httpStatus?: number;
  errorMessage?: string;
  loadTime?: number;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN COMPLETA DE PÁGINAS ADMIN');
  console.log('='.repeat(70) + '\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // Login
  console.log('🔐 Iniciando sesión...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"], input[type="email"]', SUPER_ADMIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', SUPER_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
  console.log('✅ Sesión iniciada\n');

  const results: PageResult[] = [];

  // Verificar cada página
  for (const adminPage of ALL_ADMIN_PAGES) {
    process.stdout.write(`  ${adminPage.inSidebar ? '📌' : '🔒'} ${adminPage.name.padEnd(25)}... `);
    
    const result: PageResult = {
      path: adminPage.path,
      name: adminPage.name,
      inSidebar: adminPage.inSidebar,
      status: 'ok'
    };

    const startTime = Date.now();

    try {
      const response = await page.goto(`${BASE_URL}${adminPage.path}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      result.loadTime = Date.now() - startTime;
      result.httpStatus = response?.status() || 200;

      const currentUrl = page.url();
      
      if (result.httpStatus === 404 || currentUrl.includes('/404')) {
        result.status = '404';
        result.errorMessage = 'Página no encontrada';
      } else if (result.httpStatus >= 500) {
        result.status = '500';
        result.errorMessage = 'Error del servidor';
      } else if (currentUrl.includes('/login')) {
        result.status = 'error';
        result.errorMessage = 'Redirigido a login';
      } else if (!currentUrl.includes(adminPage.path)) {
        result.status = 'redirect';
        result.errorMessage = `Redirigido a ${currentUrl}`;
      }

      // Verificar errores en contenido
      await page.waitForTimeout(1000);
      const errorElement = await page.$('[class*="error"], .error-boundary, [data-error]');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        if (errorText && errorText.toLowerCase().includes('error')) {
          result.status = 'error';
          result.errorMessage = errorText.substring(0, 100);
        }
      }

    } catch (error: any) {
      result.loadTime = Date.now() - startTime;
      result.status = 'error';
      result.errorMessage = error.message.substring(0, 100);
    }

    results.push(result);

    const statusIcons = { 'ok': '✅', 'error': '❌', '404': '🔍', '500': '💥', 'redirect': '↪️' };
    console.log(`${statusIcons[result.status]} ${result.status.toUpperCase()} (${result.loadTime}ms)`);
  }

  await browser.close();

  // Resumen
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN');
  console.log('='.repeat(70) + '\n');

  const inSidebar = results.filter(r => r.inSidebar);
  const notInSidebar = results.filter(r => !r.inSidebar);

  console.log('📌 PÁGINAS EN SIDEBAR:');
  const sidebarOk = inSidebar.filter(r => r.status === 'ok').length;
  const sidebarError = inSidebar.filter(r => r.status !== 'ok').length;
  console.log(`   ✅ OK: ${sidebarOk}  ❌ Con problemas: ${sidebarError}\n`);

  if (sidebarError > 0) {
    console.log('   Problemas:');
    inSidebar.filter(r => r.status !== 'ok').forEach(r => {
      console.log(`   - ${r.name} (${r.path}): ${r.status} - ${r.errorMessage}`);
    });
    console.log();
  }

  console.log('🔒 PÁGINAS OCULTAS (no en sidebar):');
  const hiddenOk = notInSidebar.filter(r => r.status === 'ok').length;
  const hiddenError = notInSidebar.filter(r => r.status !== 'ok').length;
  console.log(`   ✅ OK: ${hiddenOk}  ❌ Con problemas: ${hiddenError}\n`);

  if (hiddenError > 0) {
    console.log('   Problemas:');
    notInSidebar.filter(r => r.status !== 'ok').forEach(r => {
      console.log(`   - ${r.name} (${r.path}): ${r.status} - ${r.errorMessage}`);
    });
    console.log();
  }

  // Lista de páginas que funcionan pero no están en sidebar
  const workingHidden = notInSidebar.filter(r => r.status === 'ok');
  if (workingHidden.length > 0) {
    console.log('📋 PÁGINAS FUNCIONALES NO EN SIDEBAR (considerar agregar):');
    workingHidden.forEach(r => {
      console.log(`   - ${r.name}: ${r.path}`);
    });
    console.log();
  }

  // Guardar JSON
  const fs = await import('fs');
  fs.writeFileSync('/tmp/all-admin-pages-check.json', JSON.stringify(results, null, 2));
  console.log('📄 Resultados guardados en: /tmp/all-admin-pages-check.json\n');
}

main().catch(console.error);
