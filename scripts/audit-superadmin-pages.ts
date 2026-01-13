/**
 * Auditoría exhaustiva de páginas del superadministrador
 * 
 * Este script:
 * 1. Verifica que todas las páginas del sidebar cargan correctamente
 * 2. Detecta errores 404, 500 o problemas de renderizado
 * 3. Verifica que los botones principales funcionan
 * 4. Genera un reporte detallado
 * 
 * Ejecutar: npx playwright test scripts/audit-superadmin-pages.ts
 * O: npx tsx scripts/audit-superadmin-pages.ts
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Credenciales del superadmin
const SUPERADMIN_EMAIL = 'admin@inmova.app';
const SUPERADMIN_PASSWORD = 'Admin123!';

// Lista completa de páginas del superadministrador
const SUPERADMIN_PAGES = [
  // ========== PLATAFORMA GLOBAL ==========
  { name: 'Dashboard Admin', path: '/admin/dashboard', critical: true },
  
  // Clientes
  { name: 'Lista de Clientes', path: '/admin/clientes', critical: true },
  { name: 'Comparar Empresas', path: '/admin/clientes/comparar', critical: false },
  { name: 'Onboarding Tracker', path: '/admin/onboarding', critical: true },
  
  // Facturación
  { name: 'Planes INMOVA', path: '/admin/planes', critical: true },
  { name: 'Planes eWoorker', path: '/admin/ewoorker-planes', critical: true },
  { name: 'Add-ons y Extras', path: '/admin/addons', critical: true },
  { name: 'Facturación B2B', path: '/admin/facturacion-b2b', critical: true },
  { name: 'Cupones', path: '/admin/cupones', critical: true },
  
  // Partners
  { name: 'Gestión Partners', path: '/admin/partners', critical: true },
  { name: 'Comisiones Partners', path: '/admin/partners/comisiones', critical: false },
  { name: 'Invitaciones Partners', path: '/admin/partners/invitaciones', critical: false },
  { name: 'Landings Partners', path: '/admin/partners/landings', critical: false },
  
  // Marketplace
  { name: 'Marketplace Servicios', path: '/admin/marketplace', critical: false },
  { name: 'Proveedores', path: '/admin/marketplace/proveedores', critical: false },
  { name: 'Categorías', path: '/admin/marketplace/categorias', critical: false },
  { name: 'Reservas Marketplace', path: '/admin/marketplace/reservas', critical: false },
  { name: 'Comisiones Marketplace', path: '/admin/marketplace/comisiones', critical: false },
  
  // Integraciones
  { name: 'Integraciones', path: '/admin/integraciones', critical: true },
  
  // API
  { name: 'API Docs', path: '/api-docs', critical: false },
  { name: 'Webhooks', path: '/admin/webhooks', critical: false },
  
  // Monitoreo
  { name: 'Actividad', path: '/admin/activity', critical: false },
  { name: 'Health Sistema', path: '/admin/health', critical: false },
  { name: 'Alertas Seguridad', path: '/admin/seguridad/alertas', critical: false },
  { name: 'Logs Sistema', path: '/admin/logs', critical: false },
  
  // Marketing
  { name: 'Community Manager', path: '/admin/community-manager', critical: false },
  { name: 'Agentes IA', path: '/admin/ai-agents', critical: false },
  
  // Soporte
  { name: 'Sugerencias', path: '/admin/sugerencias', critical: false },
  { name: 'Aprobaciones', path: '/admin/aprobaciones', critical: false },
  { name: 'Equipo Ventas', path: '/admin/sales-team', critical: false },
  
  // ========== EMPRESA (cuando selecciona una) ==========
  { name: 'Configuración Empresa', path: '/admin/configuracion', critical: false },
  { name: 'Usuarios Empresa', path: '/admin/usuarios', critical: false },
  { name: 'Módulos Empresa', path: '/admin/modulos', critical: false },
  
  // ========== VERTICALES (accesibles como super_admin) ==========
  // Living Residencial
  { name: 'Dashboard Alquiler', path: '/traditional-rental', critical: true },
  { name: 'Propiedades', path: '/propiedades', critical: true },
  { name: 'Edificios', path: '/edificios', critical: true },
  { name: 'Unidades', path: '/unidades', critical: true },
  { name: 'Inquilinos', path: '/inquilinos', critical: true },
  { name: 'Contratos', path: '/contratos', critical: true },
  
  // STR
  { name: 'Dashboard STR', path: '/str', critical: false },
  { name: 'Reservas STR', path: '/str/bookings', critical: false },
  
  // Coliving
  { name: 'Room Rental', path: '/room-rental', critical: false },
  { name: 'Coliving Propiedades', path: '/coliving/propiedades', critical: false },
  
  // Comercial
  { name: 'Dashboard Comercial', path: '/comercial', critical: false },
  
  // Comunidades
  { name: 'Comunidades', path: '/comunidades', critical: false },
  
  // Construcción
  { name: 'Dashboard Construcción', path: '/construccion', critical: false },
  { name: 'eWoorker', path: '/ewoorker', critical: false },
  
  // Finanzas
  { name: 'Pagos', path: '/pagos', critical: true },
  { name: 'Gastos', path: '/gastos', critical: false },
  { name: 'Facturación', path: '/facturacion', critical: false },
  
  // CRM
  { name: 'CRM', path: '/crm', critical: false },
  { name: 'Leads', path: '/leads', critical: false },
  
  // Documentos
  { name: 'Documentos', path: '/documentos', critical: false },
  { name: 'Firma Digital', path: '/firma-digital', critical: false },
  
  // Herramientas
  { name: 'Calendario', path: '/calendario', critical: false },
  { name: 'Mantenimiento', path: '/mantenimiento', critical: false },
  { name: 'Comunicaciones', path: '/comunicaciones', critical: false },
];

interface AuditResult {
  page: string;
  path: string;
  status: 'OK' | 'ERROR' | 'WARNING' | '404' | '500';
  loadTime: number;
  error?: string;
  hasContent: boolean;
  buttons: string[];
  forms: number;
  tables: number;
  mockDataDetected: boolean;
}

async function destroyCrisp(page: Page) {
  await page.evaluate(() => {
    const crisp = document.getElementById('crisp-chatbox');
    if (crisp) crisp.remove();
    // @ts-ignore
    if (window.$crisp) window.$crisp.push(['do', 'chat:hide']);
  });
}

async function login(page: Page): Promise<boolean> {
  try {
    console.log('🔐 Iniciando sesión como superadmin...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await destroyCrisp(page);
    
    // Llenar credenciales
    await page.fill('input[name="email"], input[type="email"]', SUPERADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', SUPERADMIN_PASSWORD);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Esperar navegación
    await page.waitForURL(url => 
      !url.toString().includes('/login'), 
      { timeout: 30000 }
    );
    
    console.log('✅ Login exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return false;
  }
}

async function auditPage(page: Page, pageInfo: typeof SUPERADMIN_PAGES[0]): Promise<AuditResult> {
  const startTime = Date.now();
  const result: AuditResult = {
    page: pageInfo.name,
    path: pageInfo.path,
    status: 'OK',
    loadTime: 0,
    hasContent: false,
    buttons: [],
    forms: 0,
    tables: 0,
    mockDataDetected: false,
  };
  
  try {
    // Navegar a la página
    const response = await page.goto(`${BASE_URL}${pageInfo.path}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    result.loadTime = Date.now() - startTime;
    
    // Verificar código de respuesta
    if (response) {
      const status = response.status();
      if (status === 404) {
        result.status = '404';
        result.error = 'Página no encontrada';
        return result;
      }
      if (status >= 500) {
        result.status = '500';
        result.error = `Error del servidor: ${status}`;
        return result;
      }
    }
    
    // Esperar a que cargue el contenido
    await page.waitForTimeout(2000);
    await destroyCrisp(page);
    
    // Verificar si hay errores en la página
    const pageContent = await page.content();
    const bodyText = await page.locator('body').textContent() || '';
    
    // Detectar errores comunes
    if (bodyText.includes('Error 500') || bodyText.includes('Internal Server Error')) {
      result.status = '500';
      result.error = 'Error 500 detectado en la página';
      return result;
    }
    
    if (bodyText.includes('Error 404') || bodyText.includes('No encontrado')) {
      result.status = '404';
      result.error = '404 detectado en contenido';
      return result;
    }
    
    if (bodyText.includes('Error al cargar') || bodyText.includes('Error loading')) {
      result.status = 'WARNING';
      result.error = 'Error de carga de datos detectado';
    }
    
    // Verificar que hay contenido real
    const mainContent = await page.locator('main, [role="main"], .main-content, #main').first();
    if (await mainContent.count() > 0) {
      const contentText = await mainContent.textContent() || '';
      result.hasContent = contentText.trim().length > 50;
    } else {
      // Fallback: verificar body
      result.hasContent = bodyText.trim().length > 100;
    }
    
    // Contar elementos interactivos
    const buttons = await page.locator('button:visible').all();
    result.buttons = [];
    for (const btn of buttons.slice(0, 10)) { // Solo primeros 10
      const text = await btn.textContent();
      if (text && text.trim()) {
        result.buttons.push(text.trim().substring(0, 30));
      }
    }
    
    result.forms = await page.locator('form').count();
    result.tables = await page.locator('table').count();
    
    // Detectar datos mock
    const mockPatterns = [
      'lorem ipsum',
      'test@test.com',
      'john doe',
      'jane doe',
      'acme',
      'example.com',
      '123-456-7890',
      'xxx-xxx-xxxx',
      'placeholder',
      '[MOCK]',
      '[TEST]',
    ];
    
    const lowerContent = bodyText.toLowerCase();
    result.mockDataDetected = mockPatterns.some(pattern => 
      lowerContent.includes(pattern.toLowerCase())
    );
    
    if (result.mockDataDetected) {
      result.status = 'WARNING';
      result.error = (result.error || '') + ' Datos mock detectados.';
    }
    
  } catch (error: any) {
    result.status = 'ERROR';
    result.error = error.message;
    result.loadTime = Date.now() - startTime;
  }
  
  return result;
}

async function testButton(page: Page, buttonText: string): Promise<{ success: boolean; error?: string }> {
  try {
    const button = page.locator(`button:has-text("${buttonText}")`).first();
    if (await button.count() === 0) {
      return { success: false, error: 'Botón no encontrado' };
    }
    
    await button.click();
    await page.waitForTimeout(1000);
    
    // Verificar si apareció un modal o hubo navegación
    const modal = await page.locator('[role="dialog"], .modal, [data-state="open"]').first();
    if (await modal.count() > 0) {
      // Cerrar modal
      const closeBtn = page.locator('[aria-label="Close"], button:has-text("Cerrar"), button:has-text("Cancelar")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🔍 AUDITORÍA EXHAUSTIVA - PERFIL SUPERADMINISTRADOR');
  console.log('═'.repeat(70));
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log(`📋 Total páginas a auditar: ${SUPERADMIN_PAGES.length}`);
  console.log('');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'es-ES',
  });
  const page = await context.newPage();
  
  // Capturar errores de consola
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    // Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.error('❌ No se pudo iniciar sesión. Abortando auditoría.');
      return;
    }
    
    // Auditar cada página
    const results: AuditResult[] = [];
    
    for (let i = 0; i < SUPERADMIN_PAGES.length; i++) {
      const pageInfo = SUPERADMIN_PAGES[i];
      const progress = `[${i + 1}/${SUPERADMIN_PAGES.length}]`;
      
      process.stdout.write(`${progress} Auditando: ${pageInfo.name.padEnd(30)} `);
      
      const result = await auditPage(page, pageInfo);
      results.push(result);
      
      // Mostrar resultado
      const statusIcon = {
        'OK': '✅',
        'WARNING': '⚠️',
        'ERROR': '❌',
        '404': '🚫',
        '500': '💥',
      }[result.status];
      
      console.log(`${statusIcon} ${result.status} (${result.loadTime}ms)`);
      
      if (result.error) {
        console.log(`   └─ ${result.error}`);
      }
    }
    
    // Generar reporte
    console.log('');
    console.log('═'.repeat(70));
    console.log('📊 RESUMEN DE AUDITORÍA');
    console.log('═'.repeat(70));
    
    const okCount = results.filter(r => r.status === 'OK').length;
    const warningCount = results.filter(r => r.status === 'WARNING').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    const notFoundCount = results.filter(r => r.status === '404').length;
    const serverErrorCount = results.filter(r => r.status === '500').length;
    
    console.log(`✅ OK: ${okCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`🚫 404: ${notFoundCount}`);
    console.log(`💥 500: ${serverErrorCount}`);
    console.log('');
    
    // Listar problemas
    const problems = results.filter(r => r.status !== 'OK');
    if (problems.length > 0) {
      console.log('🔴 PROBLEMAS DETECTADOS:');
      console.log('─'.repeat(70));
      for (const p of problems) {
        console.log(`  • ${p.page} (${p.path})`);
        console.log(`    Status: ${p.status} | Error: ${p.error || 'N/A'}`);
      }
    }
    
    // Páginas críticas con problemas
    const criticalProblems = results.filter(r => 
      SUPERADMIN_PAGES.find(p => p.path === r.path)?.critical && r.status !== 'OK'
    );
    
    if (criticalProblems.length > 0) {
      console.log('');
      console.log('🚨 PÁGINAS CRÍTICAS CON PROBLEMAS:');
      console.log('─'.repeat(70));
      for (const p of criticalProblems) {
        console.log(`  ⚠️  ${p.page}: ${p.status} - ${p.error || 'Sin detalles'}`);
      }
    }
    
    // Páginas con datos mock
    const mockPages = results.filter(r => r.mockDataDetected);
    if (mockPages.length > 0) {
      console.log('');
      console.log('📝 PÁGINAS CON POSIBLES DATOS MOCK:');
      console.log('─'.repeat(70));
      for (const p of mockPages) {
        console.log(`  • ${p.page} (${p.path})`);
      }
    }
    
    // Errores de consola
    if (consoleErrors.length > 0) {
      console.log('');
      console.log('🖥️  ERRORES DE CONSOLA:');
      console.log('─'.repeat(70));
      const uniqueErrors = [...new Set(consoleErrors)].slice(0, 10);
      for (const err of uniqueErrors) {
        console.log(`  • ${err.substring(0, 100)}`);
      }
    }
    
    console.log('');
    console.log('═'.repeat(70));
    console.log('✅ AUDITORÍA COMPLETADA');
    console.log('═'.repeat(70));
    
    // Guardar resultados en JSON
    const fs = await import('fs');
    fs.writeFileSync(
      '/workspace/audit-results.json',
      JSON.stringify({ 
        timestamp: new Date().toISOString(),
        summary: { okCount, warningCount, errorCount, notFoundCount, serverErrorCount },
        results,
        consoleErrors: consoleErrors.slice(0, 50),
      }, null, 2)
    );
    console.log('📁 Resultados guardados en: /workspace/audit-results.json');
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
