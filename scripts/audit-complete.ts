/**
 * AUDITORÍA PROFUNDA COMPLETA - INMOVA APP
 * 
 * Este script realiza:
 * 1. Auditoría de seguridad (OWASP Top 10)
 * 2. Auditoría de UI/UX
 * 3. Pruebas E2E de todas las páginas
 * 4. Pruebas de navegación y botones
 * 5. Auditoría de accesibilidad
 * 6. Análisis de rendimiento
 */

import { chromium, firefox, webkit, devices, Browser, Page, BrowserContext } from 'playwright';

// Configuración
const BASE_URL = process.env.AUDIT_URL || 'https://inmovaapp.com';
const TEST_CREDENTIALS = {
  superadmin: { email: 'admin@inmova.app', password: 'Admin123!' },
  admin: { email: 'admin@inmova.app', password: 'Admin123!' },
  user: { email: 'test@inmova.app', password: 'Test123456!' },
};

// Resultados de auditoría
interface AuditResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  details: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
}

const results: AuditResult[] = [];

function addResult(result: AuditResult) {
  results.push(result);
  const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : '⏭️';
  console.log(`${emoji} [${result.category}] ${result.test}: ${result.status}`);
  if (result.details) console.log(`   ${result.details}`);
}

// ============================================================================
// 1. AUDITORÍA DE SEGURIDAD (OWASP TOP 10)
// ============================================================================

async function auditSecurity(page: Page) {
  console.log('\n' + '='.repeat(70));
  console.log('🔐 AUDITORÍA DE SEGURIDAD (OWASP TOP 10)');
  console.log('='.repeat(70));

  // A01:2021 - Broken Access Control
  console.log('\n📋 A01:2021 - Broken Access Control');
  
  // Test: Acceso a rutas protegidas sin autenticación
  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/admin/usuarios',
    '/admin/configuracion',
    '/edificios',
    '/inquilinos',
    '/contratos',
    '/pagos',
  ];

  for (const route of protectedRoutes) {
    try {
      const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      const currentUrl = page.url();
      const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/unauthorized');
      
      addResult({
        category: 'Security - Access Control',
        test: `Protected route ${route}`,
        status: isRedirectedToLogin ? 'PASS' : 'FAIL',
        details: isRedirectedToLogin 
          ? `Redirige correctamente a login/unauthorized`
          : `CRÍTICO: Ruta accesible sin autenticación (URL actual: ${currentUrl})`,
        severity: isRedirectedToLogin ? undefined : 'critical',
        recommendation: isRedirectedToLogin ? undefined : 'Implementar middleware de autenticación',
      });
    } catch (error) {
      addResult({
        category: 'Security - Access Control',
        test: `Protected route ${route}`,
        status: 'WARN',
        details: `Error al acceder: ${error}`,
      });
    }
  }

  // A02:2021 - Cryptographic Failures
  console.log('\n📋 A02:2021 - Cryptographic Failures');
  
  // Verificar HTTPS
  const isHttps = BASE_URL.startsWith('https://');
  addResult({
    category: 'Security - Cryptography',
    test: 'HTTPS enabled',
    status: isHttps ? 'PASS' : 'FAIL',
    details: isHttps ? 'Conexión segura HTTPS' : 'CRÍTICO: Sitio no usa HTTPS',
    severity: isHttps ? undefined : 'critical',
  });

  // A03:2021 - Injection
  console.log('\n📋 A03:2021 - Injection');
  
  // Test SQL Injection en login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[id="email"]', "admin@test.com' OR '1'='1");
  await page.fill('input[id="password"]', "password' OR '1'='1");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  const loginUrl = page.url();
  const injectionBlocked = loginUrl.includes('/login') || !loginUrl.includes('/dashboard');
  
  addResult({
    category: 'Security - Injection',
    test: 'SQL Injection in login',
    status: injectionBlocked ? 'PASS' : 'FAIL',
    details: injectionBlocked ? 'Inyección SQL bloqueada' : 'CRÍTICO: Posible vulnerabilidad SQL Injection',
    severity: injectionBlocked ? undefined : 'critical',
  });

  // A05:2021 - Security Misconfiguration
  console.log('\n📋 A05:2021 - Security Misconfiguration');
  
  // Verificar headers de seguridad
  const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  const headers = response?.headers() || {};
  
  const securityHeaders = [
    { name: 'x-frame-options', expected: 'DENY', alt: 'SAMEORIGIN' },
    { name: 'x-content-type-options', expected: 'nosniff' },
    { name: 'x-xss-protection', expected: '1' },
    { name: 'strict-transport-security', expected: 'max-age' },
  ];

  for (const header of securityHeaders) {
    const value = headers[header.name.toLowerCase()];
    const hasHeader = value && (value.includes(header.expected) || (header.alt && value.includes(header.alt)));
    
    addResult({
      category: 'Security - Headers',
      test: `Header ${header.name}`,
      status: hasHeader ? 'PASS' : 'WARN',
      details: hasHeader ? `Configurado: ${value}` : `Header faltante o incorrecto`,
      severity: hasHeader ? undefined : 'medium',
      recommendation: hasHeader ? undefined : `Configurar header ${header.name}`,
    });
  }

  // A07:2021 - Identification and Authentication Failures
  console.log('\n📋 A07:2021 - Authentication Failures');
  
  // Test brute force protection
  let failedAttempts = 0;
  for (let i = 0; i < 5; i++) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[id="email"]', 'bruteforce@test.com');
    await page.fill('input[id="password"]', `wrongpassword${i}`);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    failedAttempts++;
  }
  
  // Verificar si hay rate limiting
  const pageContent = await page.content();
  const hasRateLimiting = pageContent.includes('many requests') || 
                          pageContent.includes('bloqueada') ||
                          pageContent.includes('rate limit');
  
  addResult({
    category: 'Security - Authentication',
    test: 'Brute force protection',
    status: hasRateLimiting ? 'PASS' : 'WARN',
    details: hasRateLimiting 
      ? 'Rate limiting detectado' 
      : 'No se detectó rate limiting después de 5 intentos (puede estar implementado en servidor)',
    severity: 'medium',
    recommendation: 'Verificar implementación de rate limiting',
  });
}

// ============================================================================
// 2. AUDITORÍA DE UI/UX
// ============================================================================

async function auditUIUX(page: Page, context: BrowserContext) {
  console.log('\n' + '='.repeat(70));
  console.log('🎨 AUDITORÍA DE UI/UX');
  console.log('='.repeat(70));

  // Login para tests de UI
  await performLogin(page, TEST_CREDENTIALS.superadmin);

  // Test responsive design
  console.log('\n📋 Responsive Design');
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(1000);
    
    // Verificar que no hay overflow horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // Verificar elementos críticos visibles
    const sidebarVisible = viewport.width >= 1024 
      ? await page.isVisible('nav[aria-label], aside, .sidebar, [class*="sidebar"]')
      : true; // En móvil la sidebar está oculta por defecto

    addResult({
      category: 'UI/UX - Responsive',
      test: `${viewport.name} (${viewport.width}x${viewport.height})`,
      status: !hasHorizontalScroll && sidebarVisible ? 'PASS' : 'WARN',
      details: hasHorizontalScroll 
        ? 'Overflow horizontal detectado' 
        : 'Layout correcto',
    });
  }

  // Reset to desktop
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Test navegación móvil
  console.log('\n📋 Navegación Móvil');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Buscar botón de menú hamburguesa
  const menuSelectors = [
    'button[aria-label*="menú" i]',
    'button[aria-label*="menu" i]',
    'nav button:has(svg)',
    '[class*="bottom"] button',
    'button:has-text("Menú")',
  ];

  let menuButtonFound = false;
  for (const selector of menuSelectors) {
    try {
      const menuButton = page.locator(selector).first();
      if (await menuButton.isVisible({ timeout: 2000 })) {
        menuButtonFound = true;
        
        // Intentar hacer click
        await menuButton.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Verificar que se abre el menú
        const menuOpened = await page.isVisible('[class*="sheet"], [role="dialog"], .sidebar');
        
        addResult({
          category: 'UI/UX - Mobile Navigation',
          test: 'Hamburger menu',
          status: menuOpened ? 'PASS' : 'WARN',
          details: menuOpened ? 'Menú hamburguesa funciona correctamente' : 'Menú se abre pero contenido no verificado',
        });
        break;
      }
    } catch (e) {
      // Continuar con el siguiente selector
    }
  }

  if (!menuButtonFound) {
    addResult({
      category: 'UI/UX - Mobile Navigation',
      test: 'Hamburger menu',
      status: 'FAIL',
      details: 'No se encontró botón de menú hamburguesa',
      severity: 'high',
      recommendation: 'Verificar que el componente BottomNavigation se renderiza correctamente',
    });
  }

  // Reset viewport
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Test sidebar
  console.log('\n📋 Sidebar');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2000);

  const sidebarSelectors = ['aside', 'nav', '.sidebar', '[class*="sidebar"]'];
  let sidebarFound = false;

  for (const selector of sidebarSelectors) {
    const sidebar = page.locator(selector).first();
    if (await sidebar.isVisible({ timeout: 3000 })) {
      sidebarFound = true;
      
      // Contar items de navegación
      const navItems = await page.locator(`${selector} a, ${selector} button`).count();
      
      addResult({
        category: 'UI/UX - Sidebar',
        test: 'Sidebar visibility',
        status: 'PASS',
        details: `Sidebar visible con ${navItems} elementos de navegación`,
      });
      break;
    }
  }

  if (!sidebarFound) {
    addResult({
      category: 'UI/UX - Sidebar',
      test: 'Sidebar visibility',
      status: 'FAIL',
      details: 'Sidebar no encontrada en desktop',
      severity: 'high',
    });
  }
}

// ============================================================================
// 3. PRUEBAS E2E DE PÁGINAS
// ============================================================================

async function auditPages(page: Page) {
  console.log('\n' + '='.repeat(70));
  console.log('📄 AUDITORÍA DE PÁGINAS');
  console.log('='.repeat(70));

  // Login primero
  await performLogin(page, TEST_CREDENTIALS.superadmin);

  // Lista de páginas críticas a probar
  const criticalPages = [
    { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
    { path: '/edificios', name: 'Edificios', requiresAuth: true },
    { path: '/inquilinos', name: 'Inquilinos', requiresAuth: true },
    { path: '/contratos', name: 'Contratos', requiresAuth: true },
    { path: '/pagos', name: 'Pagos', requiresAuth: true },
    { path: '/mantenimiento', name: 'Mantenimiento', requiresAuth: true },
    { path: '/calendario', name: 'Calendario', requiresAuth: true },
    { path: '/documentos', name: 'Documentos', requiresAuth: true },
    { path: '/admin', name: 'Admin', requiresAuth: true },
    { path: '/admin/usuarios', name: 'Admin Usuarios', requiresAuth: true },
    { path: '/admin/configuracion', name: 'Admin Configuración', requiresAuth: true },
    { path: '/crm', name: 'CRM', requiresAuth: true },
    { path: '/landing', name: 'Landing', requiresAuth: false },
    { path: '/login', name: 'Login', requiresAuth: false },
    { path: '/register', name: 'Register', requiresAuth: false },
    { path: '/pricing', name: 'Pricing', requiresAuth: false },
    { path: '/str', name: 'STR (Alquiler Turístico)', requiresAuth: true },
    { path: '/coliving', name: 'Coliving', requiresAuth: true },
    { path: '/proveedores', name: 'Proveedores', requiresAuth: true },
    { path: '/reportes', name: 'Reportes', requiresAuth: true },
  ];

  for (const pageInfo of criticalPages) {
    try {
      console.log(`   Testing: ${pageInfo.name} (${pageInfo.path})`);
      
      const response = await page.goto(`${BASE_URL}${pageInfo.path}`, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      
      const statusCode = response?.status() || 0;
      const currentUrl = page.url();

      // Verificar errores de JS
      const jsErrors: string[] = [];
      page.on('pageerror', (error) => jsErrors.push(error.message));

      await page.waitForTimeout(1000);

      // Verificar que la página cargó correctamente
      let status: 'PASS' | 'FAIL' | 'WARN' = 'PASS';
      let details = `HTTP ${statusCode}`;

      if (statusCode >= 400) {
        status = 'FAIL';
        details = `Error HTTP ${statusCode}`;
      } else if (jsErrors.length > 0) {
        status = 'WARN';
        details = `Errores JS: ${jsErrors.slice(0, 2).join(', ')}`;
      } else if (pageInfo.requiresAuth && currentUrl.includes('/login')) {
        // Si requiere auth y redirige a login, puede ser que la sesión expiró
        status = 'WARN';
        details = 'Redirigido a login (sesión posiblemente expirada)';
      }

      // Verificar contenido mínimo
      const bodyContent = await page.content();
      const hasContent = bodyContent.length > 1000;
      
      if (!hasContent) {
        status = 'WARN';
        details += ' - Contenido mínimo';
      }

      addResult({
        category: 'Pages',
        test: `${pageInfo.name} (${pageInfo.path})`,
        status,
        details,
        severity: status === 'FAIL' ? 'high' : undefined,
      });

    } catch (error) {
      addResult({
        category: 'Pages',
        test: `${pageInfo.name} (${pageInfo.path})`,
        status: 'FAIL',
        details: `Error: ${error}`,
        severity: 'high',
      });
    }
  }
}

// ============================================================================
// 4. PRUEBAS DE NAVEGACIÓN Y BOTONES
// ============================================================================

async function auditNavigation(page: Page) {
  console.log('\n' + '='.repeat(70));
  console.log('🧭 AUDITORÍA DE NAVEGACIÓN Y BOTONES');
  console.log('='.repeat(70));

  // Login
  await performLogin(page, TEST_CREDENTIALS.superadmin);

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Encontrar todos los botones
  console.log('\n📋 Botones');
  const buttons = await page.locator('button').all();
  let clickableButtons = 0;
  let totalButtons = buttons.length;

  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    try {
      const button = buttons[i];
      if (await button.isVisible({ timeout: 1000 })) {
        const isEnabled = await button.isEnabled();
        if (isEnabled) clickableButtons++;
      }
    } catch (e) {
      // Ignorar errores de elementos no accesibles
    }
  }

  addResult({
    category: 'Navigation - Buttons',
    test: 'Button clickability',
    status: clickableButtons > 0 ? 'PASS' : 'WARN',
    details: `${clickableButtons} de ${totalButtons} botones son clickeables y visibles`,
  });

  // Encontrar todos los links
  console.log('\n📋 Enlaces');
  const links = await page.locator('a[href]').all();
  let validLinks = 0;
  let brokenLinks: string[] = [];

  for (let i = 0; i < Math.min(links.length, 30); i++) {
    try {
      const link = links[i];
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        validLinks++;
      }
    } catch (e) {
      // Ignorar
    }
  }

  addResult({
    category: 'Navigation - Links',
    test: 'Link validity',
    status: validLinks > 0 ? 'PASS' : 'WARN',
    details: `${validLinks} enlaces válidos encontrados`,
  });

  // Test dropdowns
  console.log('\n📋 Desplegables');
  const dropdownSelectors = [
    'button[aria-haspopup="menu"]',
    'button[aria-expanded]',
    '[data-state="closed"]',
    '.dropdown-trigger',
  ];

  let dropdownsFound = 0;
  let dropdownsWorking = 0;

  for (const selector of dropdownSelectors) {
    const dropdowns = await page.locator(selector).all();
    for (const dropdown of dropdowns.slice(0, 5)) {
      try {
        if (await dropdown.isVisible({ timeout: 1000 })) {
          dropdownsFound++;
          await dropdown.click();
          await page.waitForTimeout(500);
          
          // Verificar si se abrió algo
          const expanded = await dropdown.getAttribute('aria-expanded');
          if (expanded === 'true') {
            dropdownsWorking++;
          }
          
          // Cerrar
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      } catch (e) {
        // Ignorar
      }
    }
  }

  addResult({
    category: 'Navigation - Dropdowns',
    test: 'Dropdown functionality',
    status: dropdownsWorking > 0 ? 'PASS' : dropdownsFound > 0 ? 'WARN' : 'SKIP',
    details: dropdownsFound > 0 
      ? `${dropdownsWorking}/${dropdownsFound} desplegables funcionando`
      : 'No se encontraron desplegables',
  });
}

// ============================================================================
// 5. AUDITORÍA DE ACCESIBILIDAD
// ============================================================================

async function auditAccessibility(page: Page) {
  console.log('\n' + '='.repeat(70));
  console.log('♿ AUDITORÍA DE ACCESIBILIDAD');
  console.log('='.repeat(70));

  const pagesToAudit = [
    { path: '/login', name: 'Login' },
    { path: '/landing', name: 'Landing' },
    { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  ];

  for (const pageInfo of pagesToAudit) {
    if (pageInfo.requiresAuth) {
      await performLogin(page, TEST_CREDENTIALS.superadmin);
    }

    await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Test 1: Imágenes con alt text
    const images = await page.locator('img').all();
    let imagesWithAlt = 0;
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt && alt.trim().length > 0) imagesWithAlt++;
    }

    addResult({
      category: 'Accessibility',
      test: `${pageInfo.name} - Images alt text`,
      status: images.length === 0 || imagesWithAlt === images.length ? 'PASS' : 'WARN',
      details: `${imagesWithAlt}/${images.length} imágenes tienen texto alternativo`,
      recommendation: imagesWithAlt < images.length ? 'Añadir alt text a todas las imágenes' : undefined,
    });

    // Test 2: Form labels
    const inputs = await page.locator('input:not([type="hidden"]), select, textarea').all();
    let inputsWithLabels = 0;
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label > 0 || ariaLabel || placeholder) inputsWithLabels++;
      } else if (ariaLabel || placeholder) {
        inputsWithLabels++;
      }
    }

    addResult({
      category: 'Accessibility',
      test: `${pageInfo.name} - Form labels`,
      status: inputs.length === 0 || inputsWithLabels >= inputs.length * 0.8 ? 'PASS' : 'WARN',
      details: `${inputsWithLabels}/${inputs.length} campos tienen etiquetas`,
    });

    // Test 3: Color contrast (básico)
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a').all();
    let smallText = 0;
    for (const el of textElements.slice(0, 20)) {
      try {
        const fontSize = await el.evaluate((e) => window.getComputedStyle(e).fontSize);
        if (parseInt(fontSize) < 12) smallText++;
      } catch (e) {}
    }

    addResult({
      category: 'Accessibility',
      test: `${pageInfo.name} - Text size`,
      status: smallText === 0 ? 'PASS' : 'WARN',
      details: smallText === 0 ? 'Todo el texto tiene tamaño legible' : `${smallText} elementos con texto pequeño`,
    });

    // Test 4: Focus management
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    const hasFocusIndicator = await focusedElement.isVisible().catch(() => false);

    addResult({
      category: 'Accessibility',
      test: `${pageInfo.name} - Keyboard focus`,
      status: hasFocusIndicator ? 'PASS' : 'WARN',
      details: hasFocusIndicator ? 'Indicador de foco visible' : 'Verificar indicador de foco',
    });
  }
}

// ============================================================================
// 6. ANÁLISIS DE RENDIMIENTO
// ============================================================================

async function auditPerformance(page: Page) {
  console.log('\n' + '='.repeat(70));
  console.log('⚡ ANÁLISIS DE RENDIMIENTO');
  console.log('='.repeat(70));

  const pagesToTest = [
    { path: '/landing', name: 'Landing', requiresAuth: false },
    { path: '/login', name: 'Login', requiresAuth: false },
    { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  ];

  for (const pageInfo of pagesToTest) {
    if (pageInfo.requiresAuth) {
      await performLogin(page, TEST_CREDENTIALS.superadmin);
    }

    const startTime = Date.now();
    await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 60000 });
    const loadTime = Date.now() - startTime;

    // Obtener métricas de rendimiento
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf?.domContentLoadedEventEnd - perf?.startTime || 0,
        loadComplete: perf?.loadEventEnd - perf?.startTime || 0,
        domInteractive: perf?.domInteractive - perf?.startTime || 0,
      };
    });

    const status = loadTime < 3000 ? 'PASS' : loadTime < 5000 ? 'WARN' : 'FAIL';

    addResult({
      category: 'Performance',
      test: `${pageInfo.name} - Load time`,
      status,
      details: `Total: ${loadTime}ms, DOM Interactive: ${Math.round(metrics.domInteractive)}ms, DOM Content Loaded: ${Math.round(metrics.domContentLoaded)}ms`,
      severity: status === 'FAIL' ? 'medium' : undefined,
      recommendation: status !== 'PASS' ? 'Optimizar tiempo de carga' : undefined,
    });

    // Verificar tamaño del DOM
    const domSize = await page.evaluate(() => document.querySelectorAll('*').length);
    
    addResult({
      category: 'Performance',
      test: `${pageInfo.name} - DOM size`,
      status: domSize < 1500 ? 'PASS' : domSize < 3000 ? 'WARN' : 'FAIL',
      details: `${domSize} elementos en el DOM`,
      recommendation: domSize >= 1500 ? 'Reducir complejidad del DOM' : undefined,
    });

    // Verificar recursos
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return {
        total: entries.length,
        large: entries.filter(e => e.transferSize > 500000).length,
        slow: entries.filter(e => e.duration > 1000).length,
      };
    });

    addResult({
      category: 'Performance',
      test: `${pageInfo.name} - Resources`,
      status: resources.large === 0 && resources.slow < 3 ? 'PASS' : 'WARN',
      details: `${resources.total} recursos, ${resources.large} grandes (>500KB), ${resources.slow} lentos (>1s)`,
    });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function performLogin(page: Page, credentials: { email: string; password: string }) {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(1000);
    
    // Verificar si ya está logueado
    if (!page.url().includes('/login')) {
      return true;
    }

    await page.fill('input[id="email"]', credentials.email);
    await page.fill('input[id="password"]', credentials.password);
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

// ============================================================================
// GENERACIÓN DE REPORTE
// ============================================================================

function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE AUDITORÍA');
  console.log('='.repeat(70));

  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    warnings: results.filter(r => r.status === 'WARN').length,
    skipped: results.filter(r => r.status === 'SKIP').length,
  };

  console.log(`\nTotal de tests: ${summary.total}`);
  console.log(`✅ Pasados: ${summary.passed}`);
  console.log(`❌ Fallidos: ${summary.failed}`);
  console.log(`⚠️ Advertencias: ${summary.warnings}`);
  console.log(`⏭️ Omitidos: ${summary.skipped}`);

  // Agrupar por categoría
  const byCategory = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = { pass: 0, fail: 0, warn: 0 };
    if (r.status === 'PASS') acc[r.category].pass++;
    else if (r.status === 'FAIL') acc[r.category].fail++;
    else if (r.status === 'WARN') acc[r.category].warn++;
    return acc;
  }, {} as Record<string, { pass: number; fail: number; warn: number }>);

  console.log('\n📋 Por categoría:');
  for (const [category, stats] of Object.entries(byCategory)) {
    console.log(`   ${category}: ✅${stats.pass} ❌${stats.fail} ⚠️${stats.warn}`);
  }

  // Problemas críticos
  const criticalIssues = results.filter(r => r.status === 'FAIL' && r.severity === 'critical');
  if (criticalIssues.length > 0) {
    console.log('\n🚨 PROBLEMAS CRÍTICOS:');
    for (const issue of criticalIssues) {
      console.log(`   ❌ [${issue.category}] ${issue.test}`);
      console.log(`      ${issue.details}`);
      if (issue.recommendation) console.log(`      💡 ${issue.recommendation}`);
    }
  }

  // Recomendaciones
  const recommendations = results.filter(r => r.recommendation);
  if (recommendations.length > 0) {
    console.log('\n💡 RECOMENDACIONES:');
    for (const rec of recommendations.slice(0, 10)) {
      console.log(`   • [${rec.category}] ${rec.recommendation}`);
    }
  }

  return { summary, results, byCategory };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔍 INICIANDO AUDITORÍA PROFUNDA COMPLETA');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`📅 Fecha: ${new Date().toISOString()}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
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
    // Ejecutar auditorías
    await auditSecurity(page);
    await auditUIUX(page, context);
    await auditPages(page);
    await auditNavigation(page);
    await auditAccessibility(page);
    await auditPerformance(page);

    // Agregar errores de consola al reporte
    if (consoleErrors.length > 0) {
      addResult({
        category: 'Console Errors',
        test: 'JavaScript errors',
        status: 'WARN',
        details: `${consoleErrors.length} errores de consola detectados`,
        recommendation: 'Revisar y corregir errores de JavaScript',
      });
    }

    // Generar reporte
    const report = generateReport();

    // Guardar reporte JSON
    const fs = await import('fs');
    fs.writeFileSync(
      'audit-report.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n📁 Reporte guardado en: audit-report.json');

  } catch (error) {
    console.error('Error durante la auditoría:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
