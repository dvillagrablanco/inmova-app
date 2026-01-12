/**
 * Script de auditoría de módulos
 * Compara las páginas existentes con las configuradas en el sidebar
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

// Obtener todas las páginas existentes
function getAllPages(): string[] {
  const pages: string[] = [];
  const appDir = path.join(process.cwd(), 'app');
  
  function scanDir(dir: string, basePath: string = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip special folders
        if (item.startsWith('_') || item.startsWith('.') || item === 'api' || item === 'node_modules') {
          continue;
        }
        
        // Handle route groups (parentheses)
        let newBasePath = basePath;
        if (!item.startsWith('(')) {
          newBasePath = `${basePath}/${item}`;
        }
        
        scanDir(fullPath, newBasePath);
      } else if (item === 'page.tsx') {
        pages.push(basePath || '/');
      }
    }
  }
  
  scanDir(appDir);
  return pages.sort();
}

// Páginas que se espera que NO estén en el sidebar (landing, auth, etc.)
const EXCLUDED_PATTERNS = [
  '/landing',
  '/login',
  '/register',
  '/forgot-password',
  '/legal',
  '/portal-inquilino',
  '/portal-propietario',
  '/portal-proveedor',
  '/portal-comercial',
  '/partners/login',
  '/partners/register',
  '/partners/landing',
  '/ewoorker/login',
  '/ewoorker/landing',
  '/ewoorker/registro',
  '/ewoorker/onboarding',
  '/offline',
  '/unauthorized',
  '/test-',
  '/ejemplo',
  '/guia-',
  '/api-docs',
  '/docs',
  '/p/',
  '/pricing',
];

// Módulos importantes que DEBEN tener páginas en el sidebar
const IMPORTANT_MODULES = [
  // Verticales
  { name: 'STR (Short Term Rental)', paths: ['/str', '/str/listings', '/str/bookings', '/str/channels'] },
  { name: 'Coliving', paths: ['/coliving', '/coliving/propiedades', '/coliving/reservas', '/coliving/eventos'] },
  { name: 'House Flipping', paths: ['/flipping', '/flipping/projects', '/flipping/calculator'] },
  { name: 'Construcción', paths: ['/construccion', '/construccion/proyectos'] },
  { name: 'eWoorker', paths: ['/ewoorker/dashboard', '/ewoorker/trabajadores', '/ewoorker/obras'] },
  { name: 'Comercial', paths: ['/comercial', '/comercial/oficinas', '/comercial/locales'] },
  { name: 'Student Housing', paths: ['/student-housing', '/student-housing/dashboard'] },
  { name: 'Viajes Corporativos', paths: ['/viajes-corporativos', '/viajes-corporativos/dashboard'] },
  { name: 'Vivienda Social', paths: ['/vivienda-social', '/vivienda-social/dashboard'] },
  { name: 'Real Estate Developer', paths: ['/real-estate-developer', '/real-estate-developer/dashboard'] },
  { name: 'Admin Fincas', paths: ['/admin-fincas', '/admin-fincas/comunidades'] },
  
  // Horizontales
  { name: 'Dashboard', paths: ['/dashboard'] },
  { name: 'Propiedades', paths: ['/propiedades', '/edificios', '/unidades'] },
  { name: 'Inquilinos', paths: ['/inquilinos'] },
  { name: 'Contratos', paths: ['/contratos'] },
  { name: 'Pagos', paths: ['/pagos'] },
  { name: 'Mantenimiento', paths: ['/mantenimiento', '/incidencias'] },
  { name: 'Finanzas', paths: ['/finanzas', '/gastos', '/facturacion'] },
  { name: 'CRM', paths: ['/crm', '/candidatos'] },
  { name: 'Comunicaciones', paths: ['/chat', '/notificaciones', '/sms'] },
  { name: 'Documentos', paths: ['/documentos', '/plantillas-legales', '/firma-digital'] },
  { name: 'Reportes', paths: ['/reportes', '/analytics', '/bi'] },
  { name: 'Marketplace', paths: ['/marketplace'] },
  { name: 'Automatización', paths: ['/automatizacion', '/workflows'] },
  { name: 'IA', paths: ['/asistente-ia', '/valoracion-ia'] },
  
  // Admin
  { name: 'Admin Dashboard', paths: ['/admin/dashboard', '/admin/clientes'] },
  { name: 'Admin Config', paths: ['/admin/configuracion', '/admin/modulos', '/admin/usuarios'] },
  { name: 'Admin Planes', paths: ['/admin/planes', '/admin/cupones'] },
  { name: 'Admin Partners', paths: ['/admin/partners'] },
  { name: 'Admin Marketplace', paths: ['/admin/marketplace'] },
];

async function login(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.fill('#email', TEST_USER);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
    return true;
  } catch (error) {
    console.error('Error en login:', error);
    return false;
  }
}

async function checkPageAccessible(page: Page, path: string): Promise<{ accessible: boolean; status: number }> {
  try {
    const response = await page.goto(`${BASE_URL}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    const status = response?.status() || 0;
    return { accessible: status >= 200 && status < 400, status };
  } catch {
    return { accessible: false, status: 0 };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🔍 AUDITORÍA COMPLETA DE MÓDULOS - INMOVA APP');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // 1. Obtener todas las páginas existentes
  const allPages = getAllPages();
  console.log(`📁 Total de páginas encontradas: ${allPages.length}\n`);

  // 2. Filtrar páginas que deberían estar en el sidebar
  const pagesForSidebar = allPages.filter(p => {
    return !EXCLUDED_PATTERNS.some(pattern => p.includes(pattern));
  });

  console.log(`📋 Páginas que deberían estar en sidebar: ${pagesForSidebar.length}\n`);

  // 3. Verificar módulos importantes
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📊 VERIFICACIÓN DE MÓDULOS IMPORTANTES');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginSuccess = await login(page);
  if (!loginSuccess) {
    console.error('❌ No se pudo iniciar sesión');
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Login exitoso\n');

  const moduleResults: { name: string; status: 'OK' | 'MISSING' | 'PARTIAL'; details: string[] }[] = [];

  for (const module of IMPORTANT_MODULES) {
    const results: { path: string; accessible: boolean; status: number }[] = [];
    
    for (const modulePath of module.paths) {
      const result = await checkPageAccessible(page, modulePath);
      results.push({ path: modulePath, ...result });
    }

    const accessibleCount = results.filter(r => r.accessible).length;
    const totalCount = results.length;

    let status: 'OK' | 'MISSING' | 'PARTIAL';
    if (accessibleCount === totalCount) {
      status = 'OK';
    } else if (accessibleCount === 0) {
      status = 'MISSING';
    } else {
      status = 'PARTIAL';
    }

    const details = results.map(r => 
      `${r.accessible ? '✅' : '❌'} ${r.path} (HTTP ${r.status})`
    );

    moduleResults.push({ name: module.name, status, details });

    const statusEmoji = status === 'OK' ? '✅' : status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${statusEmoji} ${module.name}: ${accessibleCount}/${totalCount} páginas accesibles`);
  }

  await browser.close();

  // 4. Resumen de problemas
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('📋 RESUMEN DE PROBLEMAS');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const missingModules = moduleResults.filter(m => m.status === 'MISSING');
  const partialModules = moduleResults.filter(m => m.status === 'PARTIAL');

  if (missingModules.length > 0) {
    console.log('❌ MÓDULOS COMPLETAMENTE FALTANTES:');
    for (const m of missingModules) {
      console.log(`   • ${m.name}`);
      for (const d of m.details) {
        console.log(`     ${d}`);
      }
    }
    console.log('');
  }

  if (partialModules.length > 0) {
    console.log('⚠️ MÓDULOS CON PÁGINAS FALTANTES:');
    for (const m of partialModules) {
      console.log(`   • ${m.name}`);
      for (const d of m.details) {
        console.log(`     ${d}`);
      }
    }
    console.log('');
  }

  const okModules = moduleResults.filter(m => m.status === 'OK');
  console.log(`\n✅ Módulos OK: ${okModules.length}/${moduleResults.length}`);
  console.log(`⚠️ Módulos parciales: ${partialModules.length}/${moduleResults.length}`);
  console.log(`❌ Módulos faltantes: ${missingModules.length}/${moduleResults.length}`);

  // 5. Listar páginas no categorizadas
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('📁 PÁGINAS EXISTENTES POR CATEGORÍA');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const categories: Record<string, string[]> = {
    'Admin': [],
    'Dashboard': [],
    'STR': [],
    'Coliving': [],
    'Flipping': [],
    'Construcción': [],
    'eWoorker': [],
    'Comercial': [],
    'Student Housing': [],
    'Viajes Corporativos': [],
    'Vivienda Social': [],
    'Real Estate': [],
    'Partners': [],
    'Comunidades': [],
    'Workspace': [],
    'Warehouse': [],
    'Otros': [],
  };

  for (const p of pagesForSidebar) {
    if (p.startsWith('/admin')) categories['Admin'].push(p);
    else if (p.startsWith('/dashboard')) categories['Dashboard'].push(p);
    else if (p.startsWith('/str')) categories['STR'].push(p);
    else if (p.startsWith('/coliving')) categories['Coliving'].push(p);
    else if (p.startsWith('/flipping')) categories['Flipping'].push(p);
    else if (p.startsWith('/construccion') || p.startsWith('/construction')) categories['Construcción'].push(p);
    else if (p.startsWith('/ewoorker')) categories['eWoorker'].push(p);
    else if (p.startsWith('/comercial')) categories['Comercial'].push(p);
    else if (p.startsWith('/student-housing')) categories['Student Housing'].push(p);
    else if (p.startsWith('/viajes-corporativos')) categories['Viajes Corporativos'].push(p);
    else if (p.startsWith('/vivienda-social')) categories['Vivienda Social'].push(p);
    else if (p.startsWith('/real-estate')) categories['Real Estate'].push(p);
    else if (p.startsWith('/partners')) categories['Partners'].push(p);
    else if (p.startsWith('/comunidad')) categories['Comunidades'].push(p);
    else if (p.startsWith('/workspace')) categories['Workspace'].push(p);
    else if (p.startsWith('/warehouse')) categories['Warehouse'].push(p);
    else categories['Otros'].push(p);
  }

  for (const [cat, pages] of Object.entries(categories)) {
    if (pages.length > 0) {
      console.log(`\n📂 ${cat} (${pages.length} páginas):`);
      for (const p of pages.slice(0, 10)) {
        console.log(`   ${p}`);
      }
      if (pages.length > 10) {
        console.log(`   ... y ${pages.length - 10} más`);
      }
    }
  }
}

main().catch(console.error);
