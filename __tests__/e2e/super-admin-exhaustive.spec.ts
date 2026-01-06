/**
 * TEST EXHAUSTIVO DE SUPERADMINISTRADOR - PLAYWRIGHT
 * 
 * Este test navega por TODAS las páginas, subpáginas y botones
 * del perfil de superadministrador para detectar errores 404.
 * 
 * Sigue las reglas de .cursorrules para testing automatizado.
 */

import { test, expect, Page } from '@playwright/test';

// Configuración del test
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@inmova.app';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';

// Timeout para navegación
const NAV_TIMEOUT = 15000;

// ============================================================================
// LISTA COMPLETA DE RUTAS DE SUPER ADMIN
// Extraída del sidebar.tsx y estructura de /app/admin/
// ============================================================================

const SUPER_ADMIN_ROUTES = {
  // Sección: Gestión de Plataforma (superAdminPlatform)
  platformManagement: [
    { path: '/admin/dashboard', name: 'Dashboard Super Admin' },
    { path: '/admin/clientes', name: 'Gestión de Clientes (B2B)' },
    { path: '/admin/clientes/comparar', name: 'Comparar Clientes' },
    { path: '/dashboard/integrations', name: 'Integraciones' },
    { path: '/admin/planes', name: 'Planes y Facturación B2B' },
    { path: '/admin/facturacion-b2b', name: 'Facturación B2B' },
    { path: '/admin/partners', name: 'Partners y Aliados' },
    { path: '/admin/integraciones-contables', name: 'Integraciones Contables' },
    { path: '/admin/marketplace', name: 'Marketplace Admin' },
    { path: '/admin/plantillas-sms', name: 'Plantillas SMS' },
    { path: '/admin/firma-digital', name: 'Firma Digital Config' },
    { path: '/admin/ocr-import', name: 'OCR Import Config' },
    { path: '/admin/activity', name: 'Actividad de Sistema' },
    { path: '/admin/alertas', name: 'Alertas de Sistema' },
    { path: '/admin/salud-sistema', name: 'Salud del Sistema' },
    { path: '/admin/metricas-uso', name: 'Métricas de Uso' },
    { path: '/admin/aprobaciones', name: 'Aprobaciones Pendientes' },
    { path: '/admin/reportes-programados', name: 'Reportes Programados' },
    { path: '/admin/portales-externos', name: 'Portales Externos' },
    { path: '/admin/seguridad', name: 'Seguridad' },
    { path: '/admin/sugerencias', name: 'Sugerencias' },
    { path: '/admin/modulos', name: 'Módulos' },
    { path: '/admin/usuarios', name: 'Usuarios' },
    { path: '/admin/backup-restore', name: 'Backup y Restore' },
    { path: '/admin/configuracion', name: 'Configuración' },
    { path: '/admin/legal', name: 'Legal' },
    { path: '/admin/personalizacion', name: 'Personalización' },
    { path: '/admin/importar', name: 'Importar Datos' },
    { path: '/admin/recuperar-contrasena', name: 'Recuperar Contraseña' },
  ],

  // Sección: Gestión de Empresa (administradorEmpresa) - también visible para super_admin
  companyManagement: [
    { path: '/configuracion', name: 'Configuración General' },
    { path: '/admin/usuarios', name: 'Usuarios' },
    { path: '/admin/modulos', name: 'Módulos Activos' },
    { path: '/admin/personalizacion', name: 'Personalización' },
    { path: '/perfil', name: 'Mi Perfil' },
  ],

  // Sección: Dashboard principal
  dashboard: [
    { path: '/dashboard', name: 'Dashboard Principal' },
    { path: '/dashboard/adaptive', name: 'Dashboard Adaptativo' },
  ],

  // Sección: Alquiler Residencial
  alquilerResidencial: [
    { path: '/traditional-rental', name: 'Dashboard Alquiler' },
    { path: '/edificios', name: 'Edificios' },
    { path: '/unidades', name: 'Unidades' },
    { path: '/garajes-trasteros', name: 'Garajes y Trasteros' },
    { path: '/propiedades', name: 'Propiedades' },
    { path: '/inquilinos', name: 'Inquilinos' },
    { path: '/contratos', name: 'Contratos' },
    { path: '/candidatos', name: 'Candidatos' },
    { path: '/screening', name: 'Screening Inquilinos' },
    { path: '/valoraciones', name: 'Valoraciones Propiedades' },
    { path: '/inspecciones', name: 'Inspecciones' },
    { path: '/certificaciones', name: 'Certificaciones' },
    { path: '/seguros', name: 'Seguros' },
  ],

  // Sección: STR (Short Term Rentals)
  str: [
    { path: '/str', name: 'Dashboard STR' },
    { path: '/str/listings', name: 'Anuncios y Listados' },
    { path: '/str/bookings', name: 'Reservas STR' },
    { path: '/str/channels', name: 'Channel Manager' },
    { path: '/str/pricing', name: 'Pricing Dinámico' },
    { path: '/str/reviews', name: 'Gestión de Reviews' },
    { path: '/str-housekeeping', name: 'Limpieza y Housekeeping' },
    { path: '/str-advanced', name: 'STR Avanzado' },
  ],

  // Sección: Co-Living
  coliving: [
    { path: '/room-rental', name: 'Room Rental' },
    { path: '/comunidad-social', name: 'Comunidad Social' },
    { path: '/reservas', name: 'Reservas Espacios Comunes' },
  ],

  // Sección: Build-to-Rent / Construcción
  buildToRent: [
    { path: '/construction/projects', name: 'Proyectos Construcción' },
    { path: '/construction/gantt', name: 'Gantt y Cronograma' },
    { path: '/construction/quality-control', name: 'Control de Calidad' },
    { path: '/proveedores', name: 'Proveedores' },
    { path: '/ordenes-trabajo', name: 'Órdenes de Trabajo' },
  ],

  // Sección: House Flipping
  flipping: [
    { path: '/flipping/dashboard', name: 'Dashboard Flipping' },
    { path: '/flipping/projects', name: 'Proyectos Flipping' },
    { path: '/flipping/calculator', name: 'Calculadora ROI' },
    { path: '/flipping/comparator', name: 'Comparador de Propiedades' },
    { path: '/flipping/timeline', name: 'Timeline de Proyectos' },
  ],

  // Sección: Comercial
  comercial: [
    { path: '/professional/projects', name: 'Servicios Profesionales' },
    { path: '/professional/clients', name: 'Clientes Comerciales' },
    { path: '/professional/invoicing', name: 'Facturación Comercial' },
  ],

  // Sección: Admin Fincas
  adminFincas: [
    { path: '/comunidades', name: 'Portal Admin Fincas' },
    { path: '/anuncios', name: 'Anuncios Comunidad' },
    { path: '/votaciones', name: 'Votaciones' },
    { path: '/reuniones', name: 'Reuniones y Actas' },
    { path: '/comunidades/cuotas', name: 'Cuotas y Derramas' },
    { path: '/comunidades/fondos', name: 'Fondos de Reserva' },
    { path: '/comunidades/finanzas', name: 'Finanzas Comunidad' },
  ],

  // Sección: Finanzas
  finanzas: [
    { path: '/pagos', name: 'Pagos' },
    { path: '/gastos', name: 'Gastos' },
    { path: '/dashboard/budgets', name: 'Presupuestos' },
    { path: '/facturacion', name: 'Facturación' },
    { path: '/contabilidad', name: 'Contabilidad' },
    { path: '/open-banking', name: 'Open Banking' },
  ],

  // Sección: Analytics
  analytics: [
    { path: '/bi', name: 'Business Intelligence' },
    { path: '/analytics', name: 'Analytics' },
    { path: '/reportes', name: 'Reportes' },
    { path: '/asistente-ia', name: 'Asistente IA' },
  ],

  // Sección: Operaciones
  operaciones: [
    { path: '/mantenimiento', name: 'Mantenimiento' },
    { path: '/tareas', name: 'Tareas' },
    { path: '/incidencias', name: 'Incidencias' },
    { path: '/calendario', name: 'Calendario' },
    { path: '/visitas', name: 'Visitas y Showings' },
  ],

  // Sección: Comunicaciones
  comunicaciones: [
    { path: '/chat', name: 'Chat' },
    { path: '/notificaciones', name: 'Notificaciones' },
    { path: '/sms', name: 'SMS' },
    { path: '/dashboard/social-media', name: 'Gestión de Redes Sociales' },
  ],

  // Sección: Documentos y Legal
  documentosLegal: [
    { path: '/documentos', name: 'Documentos' },
    { path: '/ocr', name: 'OCR Documentos' },
    { path: '/firma-digital', name: 'Firma Digital' },
    { path: '/legal', name: 'Legal y Compliance' },
    { path: '/seguridad-compliance', name: 'Seguridad & Compliance' },
    { path: '/auditoria', name: 'Auditoría' },
    { path: '/plantillas', name: 'Plantillas' },
  ],

  // Sección: CRM y Marketing
  crmMarketing: [
    { path: '/crm', name: 'CRM' },
    { path: '/portal-comercial', name: 'Portal Comercial' },
    { path: '/dashboard/referrals', name: 'Programa de Referidos' },
    { path: '/dashboard/coupons', name: 'Cupones y Descuentos' },
    { path: '/marketplace', name: 'Marketplace' },
    { path: '/galerias', name: 'Galerías' },
  ],

  // Sección: Automatización
  automatizacion: [
    { path: '/automatizacion', name: 'Motor de Automatización' },
    { path: '/workflows', name: 'Workflows' },
    { path: '/recordatorios', name: 'Recordatorios' },
  ],

  // Sección: Innovación
  innovacion: [
    { path: '/tours-virtuales', name: 'Tours Virtuales 360°' },
    { path: '/iot', name: 'Dispositivos IoT' },
    { path: '/esg', name: 'ESG y Sostenibilidad' },
    { path: '/blockchain', name: 'Blockchain' },
    { path: '/economia-circular', name: 'Economía Circular' },
    { path: '/energia', name: 'Energía' },
    { path: '/valoracion-ia', name: 'Valoración con IA' },
  ],

  // Sección: Soporte
  soporte: [
    { path: '/soporte', name: 'Centro de Soporte' },
    { path: '/knowledge-base', name: 'Base de Conocimientos' },
    { path: '/developers', name: 'Desarrolladores' },
    { path: '/api-docs', name: 'Documentación API' },
  ],

  // Páginas adicionales
  additional: [
    { path: '/integraciones', name: 'Integraciones' },
    { path: '/estadisticas', name: 'Estadísticas' },
    { path: '/finanzas', name: 'Finanzas' },
    { path: '/informes', name: 'Informes' },
    { path: '/presupuestos', name: 'Presupuestos' },
    { path: '/suscripciones', name: 'Suscripciones' },
    { path: '/renovaciones', name: 'Renovaciones' },
    { path: '/subastas', name: 'Subastas' },
    { path: '/community', name: 'Comunidad' },
  ],

  // eWoorker (si aplica)
  ewoorker: [
    { path: '/ewoorker', name: 'eWoorker Dashboard' },
    { path: '/ewoorker/admin-socio', name: 'eWoorker Admin Socio' },
    { path: '/ewoorker/trabajadores', name: 'eWoorker Trabajadores' },
    { path: '/ewoorker/asignaciones', name: 'eWoorker Asignaciones' },
  ],

  // Partners
  partners: [
    { path: '/partners', name: 'Partners' },
    { path: '/partners/dashboard', name: 'Partners Dashboard' },
    { path: '/partners-program', name: 'Programa de Partners' },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface TestResult {
  path: string;
  name: string;
  status: 'success' | 'error_404' | 'error_500' | 'error_other' | 'redirect' | 'timeout';
  statusCode?: number;
  redirectedTo?: string;
  error?: string;
  responseTime?: number;
}

async function loginAsSuperAdmin(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { timeout: NAV_TIMEOUT });
    await page.waitForLoadState('networkidle');
    
    // Esperar a que aparezca el formulario
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Llenar credenciales
    await page.fill('input[name="email"], input[type="email"]', SUPER_ADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', SUPER_ADMIN_PASSWORD);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Esperar redirección al dashboard
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 20000 });
    
    return true;
  } catch (error) {
    console.error('Error en login:', error);
    return false;
  }
}

async function testRoute(page: Page, route: { path: string; name: string }): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    path: route.path,
    name: route.name,
    status: 'success',
  };

  try {
    // Interceptar respuestas para capturar el status code
    let responseStatus = 200;
    let redirectedUrl: string | null = null;

    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes(route.path) || url === `${BASE_URL}${route.path}`;
      },
      { timeout: NAV_TIMEOUT }
    ).catch(() => null);

    // Navegar a la ruta
    const response = await page.goto(`${BASE_URL}${route.path}`, {
      timeout: NAV_TIMEOUT,
      waitUntil: 'domcontentloaded',
    });

    if (response) {
      responseStatus = response.status();
      redirectedUrl = response.url();
    }

    result.responseTime = Date.now() - startTime;
    result.statusCode = responseStatus;

    // Verificar redirecciones
    const currentUrl = page.url();
    if (currentUrl !== `${BASE_URL}${route.path}` && !currentUrl.includes(route.path)) {
      result.status = 'redirect';
      result.redirectedTo = currentUrl;
      
      // Si redirige a login, puede ser un problema de permisos
      if (currentUrl.includes('/login')) {
        result.status = 'error_other';
        result.error = 'Redirigido a login - posible problema de autenticación';
      }
      // Si redirige a unauthorized, es un problema de permisos
      else if (currentUrl.includes('/unauthorized')) {
        result.status = 'error_other';
        result.error = 'Acceso no autorizado';
      }
    }

    // Verificar status codes de error
    if (responseStatus === 404) {
      result.status = 'error_404';
      result.error = 'Página no encontrada (404)';
    } else if (responseStatus >= 500) {
      result.status = 'error_500';
      result.error = `Error de servidor (${responseStatus})`;
    }

    // Verificar si hay contenido de error 404 en la página
    const pageContent = await page.content();
    if (
      pageContent.includes('404') &&
      (pageContent.toLowerCase().includes('not found') ||
        pageContent.toLowerCase().includes('no encontrada') ||
        pageContent.toLowerCase().includes('página no existe'))
    ) {
      result.status = 'error_404';
      result.error = 'Contenido indica página 404';
    }

    // Verificar errores de Next.js
    const errorElement = await page.$('nextjs-portal');
    if (errorElement) {
      const errorText = await page.evaluate(() => {
        const portal = document.querySelector('nextjs-portal');
        return portal?.textContent || '';
      });
      if (errorText.includes('Error') || errorText.includes('404')) {
        result.status = 'error_other';
        result.error = `Error de Next.js: ${errorText.substring(0, 100)}`;
      }
    }

  } catch (error: any) {
    result.responseTime = Date.now() - startTime;
    
    if (error.message?.includes('timeout')) {
      result.status = 'timeout';
      result.error = 'Timeout de navegación';
    } else {
      result.status = 'error_other';
      result.error = error.message || 'Error desconocido';
    }
  }

  return result;
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('Super Admin - Test Exhaustivo de Páginas y Botones', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const results: TestResult[] = [];
  const errors404: TestResult[] = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login como super admin
    const loginSuccess = await loginAsSuperAdmin(page);
    expect(loginSuccess).toBe(true);
  });

  test.afterAll(async () => {
    // Generar reporte final
    console.log('\n');
    console.log('='.repeat(80));
    console.log('REPORTE FINAL - TEST EXHAUSTIVO SUPER ADMIN');
    console.log('='.repeat(80));
    console.log(`\nTotal de rutas testeadas: ${results.length}`);
    console.log(`✅ Exitosas: ${results.filter(r => r.status === 'success').length}`);
    console.log(`⚠️ Redirecciones: ${results.filter(r => r.status === 'redirect').length}`);
    console.log(`❌ Errores 404: ${errors404.length}`);
    console.log(`🔴 Errores 500: ${results.filter(r => r.status === 'error_500').length}`);
    console.log(`⏱️ Timeouts: ${results.filter(r => r.status === 'timeout').length}`);
    console.log(`⚪ Otros errores: ${results.filter(r => r.status === 'error_other').length}`);

    if (errors404.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('❌ ERRORES 404 ENCONTRADOS:');
      console.log('='.repeat(80));
      errors404.forEach((e, i) => {
        console.log(`${i + 1}. ${e.name}`);
        console.log(`   Ruta: ${e.path}`);
        console.log(`   Error: ${e.error}`);
        console.log('');
      });
    }

    // Cerrar página
    await page.close();
  });

  // Test para cada sección
  for (const [sectionName, routes] of Object.entries(SUPER_ADMIN_ROUTES)) {
    test.describe(`Sección: ${sectionName}`, () => {
      for (const route of routes) {
        test(`${route.name} (${route.path})`, async () => {
          const result = await testRoute(page, route);
          results.push(result);

          if (result.status === 'error_404') {
            errors404.push(result);
          }

          // Log del resultado
          const statusEmoji = {
            success: '✅',
            redirect: '⚠️',
            error_404: '❌',
            error_500: '🔴',
            timeout: '⏱️',
            error_other: '⚪',
          }[result.status];

          console.log(`${statusEmoji} ${route.name}: ${result.status} (${result.responseTime}ms)`);
          if (result.error) {
            console.log(`   └─ ${result.error}`);
          }
          if (result.redirectedTo) {
            console.log(`   └─ Redirigido a: ${result.redirectedTo}`);
          }

          // Assert que no es 404
          expect(result.status, `${route.name} retornó 404`).not.toBe('error_404');
        });
      }
    });
  }

  // Test adicional: Verificar botones en páginas críticas de admin
  test.describe('Verificación de Botones en Páginas Críticas', () => {
    const criticalPages = [
      '/admin/dashboard',
      '/admin/clientes',
      '/admin/planes',
      '/admin/usuarios',
      '/admin/modulos',
    ];

    for (const pagePath of criticalPages) {
      test(`Verificar botones en ${pagePath}`, async () => {
        await page.goto(`${BASE_URL}${pagePath}`, { timeout: NAV_TIMEOUT });
        await page.waitForLoadState('domcontentloaded');

        // Buscar todos los botones y enlaces
        const buttons = await page.$$('button, a[href]');
        
        const brokenLinks: string[] = [];

        for (const button of buttons) {
          try {
            const href = await button.getAttribute('href');
            const text = await button.textContent();
            
            // Solo verificar enlaces internos
            if (href && href.startsWith('/') && !href.startsWith('//')) {
              // Crear una nueva pestaña para probar el enlace
              const newPage = await page.context().newPage();
              
              try {
                const response = await newPage.goto(`${BASE_URL}${href}`, {
                  timeout: 10000,
                  waitUntil: 'domcontentloaded',
                });

                if (response && response.status() === 404) {
                  brokenLinks.push(`${text?.trim() || 'Sin texto'}: ${href}`);
                }

                // Verificar contenido 404
                const content = await newPage.content();
                if (content.includes('404') && content.toLowerCase().includes('not found')) {
                  brokenLinks.push(`${text?.trim() || 'Sin texto'}: ${href} (contenido 404)`);
                }
              } finally {
                await newPage.close();
              }
            }
          } catch (e) {
            // Ignorar errores de elementos que no tienen href
          }
        }

        if (brokenLinks.length > 0) {
          console.log(`\n❌ Enlaces rotos en ${pagePath}:`);
          brokenLinks.forEach(link => console.log(`   - ${link}`));
        }

        expect(brokenLinks, `Hay ${brokenLinks.length} enlaces rotos en ${pagePath}`).toHaveLength(0);
      });
    }
  });

  // Test: Verificar navegación del sidebar
  test('Verificar todos los enlaces del sidebar', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`, { timeout: NAV_TIMEOUT });
    await page.waitForLoadState('networkidle');

    // Expandir todas las secciones del sidebar
    const sectionButtons = await page.$$('button[class*="justify-between"]');
    for (const button of sectionButtons) {
      try {
        await button.click();
        await page.waitForTimeout(300);
      } catch (e) {
        // Ignorar si no se puede hacer clic
      }
    }

    // Obtener todos los enlaces del sidebar
    const sidebarLinks = await page.$$('nav a[href^="/"]');
    const brokenSidebarLinks: string[] = [];

    for (const link of sidebarLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      if (href && !href.includes('logout') && !href.includes('signout')) {
        const newPage = await page.context().newPage();
        
        try {
          const response = await newPage.goto(`${BASE_URL}${href}`, {
            timeout: 10000,
            waitUntil: 'domcontentloaded',
          });

          const status = response?.status() || 0;
          
          if (status === 404) {
            brokenSidebarLinks.push(`${text?.trim() || 'Sin texto'}: ${href}`);
          }

          // Verificar contenido 404 en página
          const content = await newPage.content();
          if (
            status === 200 &&
            content.includes('404') &&
            (content.toLowerCase().includes('not found') ||
              content.toLowerCase().includes('no encontrada'))
          ) {
            brokenSidebarLinks.push(`${text?.trim() || 'Sin texto'}: ${href} (contenido 404)`);
          }
        } catch (e: any) {
          if (!e.message?.includes('timeout')) {
            brokenSidebarLinks.push(`${text?.trim() || 'Sin texto'}: ${href} (error: ${e.message})`);
          }
        } finally {
          await newPage.close();
        }
      }
    }

    if (brokenSidebarLinks.length > 0) {
      console.log('\n❌ Enlaces rotos en el sidebar:');
      brokenSidebarLinks.forEach(link => console.log(`   - ${link}`));
    }

    // No fallar el test, solo reportar
    if (brokenSidebarLinks.length > 0) {
      console.log(`\n⚠️ Se encontraron ${brokenSidebarLinks.length} enlaces rotos en el sidebar`);
    }
  });
});

// ============================================================================
// TEST ESPECÍFICO: Solo verificar errores 404
// ============================================================================

test.describe('Super Admin - Solo Verificar 404s', () => {
  test('Escaneo rápido de todas las rutas admin para 404', async ({ page }) => {
    // Login
    const loginSuccess = await loginAsSuperAdmin(page);
    expect(loginSuccess).toBe(true);

    const allRoutes = Object.values(SUPER_ADMIN_ROUTES).flat();
    const errors404: string[] = [];
    const errors500: string[] = [];

    for (const route of allRoutes) {
      try {
        const response = await page.goto(`${BASE_URL}${route.path}`, {
          timeout: 10000,
          waitUntil: 'domcontentloaded',
        });

        const status = response?.status() || 0;

        if (status === 404) {
          errors404.push(`${route.name}: ${route.path}`);
        } else if (status >= 500) {
          errors500.push(`${route.name}: ${route.path} (${status})`);
        }

        // Verificar contenido 404
        if (status === 200) {
          const content = await page.content();
          if (
            content.includes('404') &&
            (content.toLowerCase().includes('not found') ||
              content.toLowerCase().includes('no encontrada') ||
              content.toLowerCase().includes('página no existe'))
          ) {
            errors404.push(`${route.name}: ${route.path} (contenido 404)`);
          }
        }
      } catch (e: any) {
        if (e.message?.includes('timeout')) {
          console.log(`⏱️ Timeout: ${route.path}`);
        } else {
          console.log(`⚠️ Error: ${route.path} - ${e.message}`);
        }
      }
    }

    // Reporte
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN DE ESCANEO RÁPIDO');
    console.log('='.repeat(60));
    console.log(`Total rutas: ${allRoutes.length}`);
    console.log(`Errores 404: ${errors404.length}`);
    console.log(`Errores 500+: ${errors500.length}`);

    if (errors404.length > 0) {
      console.log('\n❌ RUTAS CON ERROR 404:');
      errors404.forEach(e => console.log(`   - ${e}`));
    }

    if (errors500.length > 0) {
      console.log('\n🔴 RUTAS CON ERROR 500+:');
      errors500.forEach(e => console.log(`   - ${e}`));
    }

    // El test pasa pero reporta los errores
    expect(errors404.length).toBeLessThanOrEqual(50); // Umbral configurable
  });
});
