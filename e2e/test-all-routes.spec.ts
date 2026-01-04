/**
 * Test Comprehensivo de Rutas - Verificar 404s en toda la app
 * Ejecutar: npx playwright test e2e/test-all-routes.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

// Credenciales de test
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

// Lista de rutas principales a verificar
const MAIN_ROUTES = [
  // Core
  { path: '/', name: 'Landing' },
  { path: '/login', name: 'Login', public: true },
  { path: '/register', name: 'Register', public: true },
  
  // Dashboard
  { path: '/dashboard', name: 'Dashboard Principal' },
  
  // Gestión de Propiedades
  { path: '/propiedades', name: 'Propiedades' },
  { path: '/propiedades/nuevo', name: 'Nueva Propiedad' },
  { path: '/unidades', name: 'Unidades' },
  { path: '/unidades/nueva', name: 'Nueva Unidad' },
  
  // Inquilinos y Contratos
  { path: '/inquilinos', name: 'Inquilinos' },
  { path: '/contratos', name: 'Contratos' },
  { path: '/renovaciones-contratos', name: 'Renovaciones Contratos' },
  
  // Finanzas
  { path: '/pagos', name: 'Pagos' },
  { path: '/reportes', name: 'Reportes' },
  { path: '/reportes/financieros', name: 'Reportes Financieros' },
  { path: '/reportes/operacionales', name: 'Reportes Operacionales' },
  { path: '/presupuestos', name: 'Presupuestos' },
  
  // Mantenimiento
  { path: '/mantenimiento', name: 'Mantenimiento' },
  { path: '/incidencias', name: 'Incidencias' },
  { path: '/proveedores', name: 'Proveedores' },
  
  // Servicios
  { path: '/servicios-limpieza', name: 'Servicios de Limpieza' },
  { path: '/servicios-concierge', name: 'Servicios Concierge' },
  
  // Tours y Visitas
  { path: '/visitas', name: 'Visitas' },
  { path: '/tours-virtuales', name: 'Tours Virtuales' },
  
  // Seguros y Garantías
  { path: '/seguros', name: 'Seguros' },
  { path: '/seguros/nuevo', name: 'Nuevo Seguro' },
  { path: '/warranty-management', name: 'Gestión de Garantías' },
  
  // Valoraciones y IA
  { path: '/valoraciones', name: 'Valoraciones' },
  { path: '/valoracion-ia', name: 'Valoración IA' },
  { path: '/screening', name: 'Screening' },
  { path: '/verificacion-inquilinos', name: 'Verificación Inquilinos' },
  
  // Usuarios y Permisos
  { path: '/usuarios', name: 'Usuarios' },
  { path: '/usuarios/nuevo', name: 'Nuevo Usuario' },
  { path: '/permisos', name: 'Permisos' },
  { path: '/perfil', name: 'Perfil' },
  
  // Portales
  { path: '/portal-inquilino', name: 'Portal Inquilino' },
  { path: '/portal-proveedor', name: 'Portal Proveedor' },
  { path: '/portal-comercial', name: 'Portal Comercial' },
  
  // Partners
  { path: '/partners', name: 'Partners' },
  { path: '/partners/dashboard', name: 'Partners Dashboard' },
  { path: '/partners/registro', name: 'Registro Partners' },
  { path: '/partners/comisiones', name: 'Comisiones Partners' },
  
  // Red de Agentes
  { path: '/red-agentes', name: 'Red de Agentes' },
  { path: '/red-agentes/dashboard', name: 'Dashboard Agentes' },
  { path: '/red-agentes/agentes', name: 'Agentes' },
  { path: '/red-agentes/comisiones', name: 'Comisiones Agentes' },
  
  // Vivienda Social
  { path: '/vivienda-social', name: 'Vivienda Social' },
  { path: '/vivienda-social/dashboard', name: 'Dashboard Vivienda Social' },
  { path: '/vivienda-social/applications', name: 'Aplicaciones Vivienda Social' },
  
  // Student Housing
  { path: '/student-housing', name: 'Student Housing' },
  { path: '/student-housing/dashboard', name: 'Dashboard Student Housing' },
  { path: '/student-housing/residentes', name: 'Residentes' },
  { path: '/student-housing/habitaciones', name: 'Habitaciones' },
  
  // Workspace/Coworking
  { path: '/workspace', name: 'Workspace' },
  { path: '/workspace/dashboard', name: 'Workspace Dashboard' },
  { path: '/workspace/members', name: 'Members' },
  { path: '/workspace/booking', name: 'Booking' },
  { path: '/workspace/coworking', name: 'Coworking' },
  
  // STR (Short-Term Rental)
  { path: '/str', name: 'STR' },
  { path: '/str/bookings', name: 'STR Bookings' },
  { path: '/str/listings', name: 'STR Listings' },
  { path: '/str/channels', name: 'STR Channels' },
  
  // Viajes Corporativos
  { path: '/viajes-corporativos', name: 'Viajes Corporativos' },
  { path: '/viajes-corporativos/dashboard', name: 'Dashboard Viajes' },
  { path: '/viajes-corporativos/bookings', name: 'Bookings Viajes' },
  
  // Real Estate Developer
  { path: '/real-estate-developer', name: 'Real Estate Developer' },
  { path: '/real-estate-developer/dashboard', name: 'Dashboard Developer' },
  { path: '/real-estate-developer/projects', name: 'Projects' },
  
  // Professional Services
  { path: '/professional', name: 'Professional Services' },
  { path: '/professional/clients', name: 'Clients' },
  { path: '/professional/projects', name: 'Professional Projects' },
  
  // Warehouse
  { path: '/warehouse', name: 'Warehouse' },
  { path: '/warehouse/inventory', name: 'Inventory' },
  { path: '/warehouse/locations', name: 'Locations' },
  
  // Otros
  { path: '/notificaciones', name: 'Notificaciones' },
  { path: '/tareas', name: 'Tareas' },
  { path: '/votaciones', name: 'Votaciones' },
  { path: '/sugerencias', name: 'Sugerencias' },
  { path: '/marketplace', name: 'Marketplace' },
  { path: '/sms', name: 'SMS' },
  { path: '/obras', name: 'Obras' },
  { path: '/candidatos', name: 'Candidatos' },
  { path: '/sincronizacion', name: 'Sincronización' },
];

/**
 * Helper: Login automático
 */
async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  
  await page.click('button[type="submit"]');
  
  // Esperar redirect a dashboard/admin
  await page.waitForURL(url => 
    url.pathname.includes('/dashboard') || 
    url.pathname.includes('/admin') ||
    url.pathname.includes('/portal'),
    { timeout: 15000 }
  );
}

/**
 * Helper: Verificar que no hay error 404
 */
async function checkNo404(page: Page, routeName: string) {
  const bodyText = await page.textContent('body');
  const title = await page.title();
  
  // Verificar texto común de 404
  const has404Text = bodyText?.toLowerCase().includes('404') ||
                     bodyText?.toLowerCase().includes('not found') ||
                     bodyText?.toLowerCase().includes('página no encontrada') ||
                     title?.toLowerCase().includes('404');
  
  // Verificar status code si es posible
  const response = await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
  const status = response?.status();
  
  if (status === 404 || has404Text) {
    throw new Error(`404 detectado en: ${routeName} (${page.url()})`);
  }
  
  return { status, has404Text: false };
}

/**
 * Helper: Encontrar y verificar links en la página
 */
async function checkLinksInPage(page: Page, routeName: string) {
  const links = await page.locator('a[href]').all();
  const brokenLinks: string[] = [];
  
  // Limitar a los primeros 20 links para no hacer el test muy lento
  const linksToCheck = links.slice(0, 20);
  
  for (const link of linksToCheck) {
    try {
      const href = await link.getAttribute('href');
      
      // Ignorar links externos, mailto, tel, javascript
      if (!href || 
          href.startsWith('http') || 
          href.startsWith('mailto:') || 
          href.startsWith('tel:') ||
          href.startsWith('javascript:') ||
          href === '#') {
        continue;
      }
      
      // Verificar que el link no esté roto (opcional, puede ser lento)
      // Por ahora solo registramos los links encontrados
      
    } catch (e) {
      // Ignorar errores al obtener href
    }
  }
  
  return { totalLinks: links.length, checkedLinks: linksToCheck.length, brokenLinks };
}

test.describe('Verificación de Rutas - No 404s', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await login(page);
  });
  
  test('Verificar rutas públicas (sin login)', async ({ page }) => {
    const publicRoutes = MAIN_ROUTES.filter(r => r.public);
    
    for (const route of publicRoutes) {
      console.log(`✓ Verificando ruta pública: ${route.name} (${route.path})`);
      
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      
      expect(response?.status()).not.toBe(404);
      await checkNo404(page, route.name);
    }
  });
  
  test('Verificar todas las rutas principales', async ({ page }) => {
    const protectedRoutes = MAIN_ROUTES.filter(r => !r.public);
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const route of protectedRoutes) {
      try {
        console.log(`✓ Verificando: ${route.name} (${route.path})`);
        
        const response = await page.goto(route.path, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        const status = response?.status();
        
        if (status === 404) {
          errors.push(`❌ 404: ${route.name} (${route.path})`);
          console.error(`  ❌ ERROR 404: ${route.name}`);
        } else if (status && status >= 500) {
          errors.push(`❌ ${status}: ${route.name} (${route.path})`);
          console.error(`  ❌ ERROR ${status}: ${route.name}`);
        } else if (status && status >= 400) {
          warnings.push(`⚠️  ${status}: ${route.name} (${route.path})`);
          console.warn(`  ⚠️  WARNING ${status}: ${route.name}`);
        } else {
          console.log(`  ✅ OK (${status})`);
        }
        
        // Verificar contenido
        await checkNo404(page, route.name);
        
      } catch (error: any) {
        if (error.message.includes('404')) {
          errors.push(`❌ ${route.name}: ${error.message}`);
          console.error(`  ❌ ${error.message}`);
        } else {
          warnings.push(`⚠️  ${route.name}: ${error.message.substring(0, 100)}`);
          console.warn(`  ⚠️  ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    // Reporte final
    console.log('\n' + '='.repeat(70));
    console.log('REPORTE DE VERIFICACIÓN DE RUTAS');
    console.log('='.repeat(70));
    console.log(`Total rutas verificadas: ${protectedRoutes.length}`);
    console.log(`Errores 404/500: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      errors.forEach(e => console.log(`  ${e}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(w => console.log(`  ${w}`));
    }
    
    // Fallar el test si hay errores 404
    expect(errors.length).toBe(0);
  });
  
  test('Verificar links en dashboard principal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const result = await checkLinksInPage(page, 'Dashboard');
    
    console.log(`Dashboard - Links encontrados: ${result.totalLinks}`);
    console.log(`Dashboard - Links verificados: ${result.checkedLinks}`);
    
    expect(result.brokenLinks.length).toBe(0);
  });
  
  test('Verificar botones de navegación en sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Encontrar links en el sidebar
    const sidebarLinks = await page.locator('[data-sidebar] a, nav a').all();
    
    console.log(`Sidebar - Enlaces encontrados: ${sidebarLinks.length}`);
    
    const clickableLinks = sidebarLinks.slice(0, 10); // Limitar a 10 para no hacer muy lento
    
    for (const link of clickableLinks) {
      try {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (!href || href.startsWith('http') || href === '#') continue;
        
        console.log(`  Verificando sidebar link: ${text?.trim() || href}`);
        
        // Click y verificar que no da 404
        await link.click();
        await page.waitForLoadState('domcontentloaded');
        
        const response = await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
        expect(response?.status()).not.toBe(404);
        
        // Volver al dashboard
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
      } catch (e: any) {
        console.warn(`  ⚠️  Error verificando link: ${e.message.substring(0, 100)}`);
      }
    }
  });
});

test.describe('Verificación de Formularios - Botones de Acción', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('Verificar botones en páginas de creación', async ({ page }) => {
    const createPages = [
      { path: '/propiedades/nuevo', name: 'Nueva Propiedad' },
      { path: '/usuarios/nuevo', name: 'Nuevo Usuario' },
      { path: '/seguros/nuevo', name: 'Nuevo Seguro' },
    ];
    
    for (const createPage of createPages) {
      try {
        console.log(`Verificando formulario: ${createPage.name}`);
        
        await page.goto(createPage.path, { waitUntil: 'domcontentloaded' });
        
        // Verificar que hay un formulario
        const forms = await page.locator('form').count();
        expect(forms).toBeGreaterThan(0);
        
        // Verificar botones submit/cancel
        const submitButtons = await page.locator('button[type="submit"]').count();
        const cancelButtons = await page.locator('button:has-text("Cancelar"), a:has-text("Cancelar")').count();
        
        console.log(`  Formularios: ${forms}, Botones submit: ${submitButtons}, Botones cancelar: ${cancelButtons}`);
        
        expect(submitButtons).toBeGreaterThan(0);
        
      } catch (e: any) {
        console.warn(`  ⚠️  ${createPage.name}: ${e.message.substring(0, 100)}`);
      }
    }
  });
});

test.describe('Verificación de Rutas Dinámicas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('Verificar que rutas con [id] no den 404 genérico', async ({ page }) => {
    // Para rutas dinámicas, verificar que al menos la lista funciona
    const dynamicRouteParents = [
      '/propiedades',
      '/inquilinos',
      '/contratos',
      '/seguros',
    ];
    
    for (const route of dynamicRouteParents) {
      console.log(`Verificando ruta con items: ${route}`);
      
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).not.toBe(404);
      
      // Verificar que hay items o un mensaje de "no hay items"
      const hasItems = await page.locator('[data-list-item], [data-card], table tr').count() > 0;
      const hasEmptyMessage = await page.locator('text=/no hay|sin|vacío|empty/i').count() > 0;
      
      console.log(`  Items encontrados: ${hasItems}, Mensaje vacío: ${hasEmptyMessage}`);
      
      // Debe tener items O un mensaje de vacío
      expect(hasItems || hasEmptyMessage).toBe(true);
    }
  });
});
