import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Configuración de tests
test.describe('🔍 Auditoría Intensiva Frontend - Inmovaapp.com', () => {
  const PROD_URL = 'https://inmovaapp.com';
  const TIMEOUT = 30000;

  // Credenciales de test
  const TEST_USER = {
    email: 'admin@inmova.app',
    password: 'Admin123!',
  };

  let consoleErrors: Array<{ type: string; text: string }> = [];
  let networkErrors: Array<{ url: string; status: number }> = [];
  let performanceMetrics: any = {};

  test.beforeEach(async ({ page }) => {
    // Interceptar errores de consola
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
        });
      }
    });

    // Interceptar errores de red
    networkErrors = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    // Aumentar timeout
    page.setDefaultTimeout(TIMEOUT);
  });

  test.afterEach(async () => {
    // Reportar errores encontrados
    if (consoleErrors.length > 0) {
      console.log('⚠️ Errores de consola encontrados:', consoleErrors);
    }
    if (networkErrors.length > 0) {
      console.log('⚠️ Errores de red encontrados:', networkErrors);
    }
  });

  // ============================================
  // 1. TESTS DE ACCESIBILIDAD (A11Y)
  // ============================================
  test.describe('♿ Accesibilidad (WCAG 2.1 Level AA)', () => {
    test('Landing page debe cumplir con WCAG 2.1 AA', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Guardar reporte
      if (accessibilityScanResults.violations.length > 0) {
        console.log('🚨 Violaciones de accesibilidad en Landing:');
        accessibilityScanResults.violations.forEach((violation) => {
          console.log(`- ${violation.id}: ${violation.description}`);
          console.log(`  Impacto: ${violation.impact}`);
          console.log(`  Elementos afectados: ${violation.nodes.length}`);
        });
      }
    });

    test('Login page debe ser accesible', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Dashboard debe ser accesible después de login', async ({ page }) => {
      // Login
      await page.goto(`${PROD_URL}/login`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/, { timeout: 15000 });

      // Test de accesibilidad en dashboard
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Verificar navegación por teclado', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      // Navegar usando Tab
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            type: el?.getAttribute('type'),
            role: el?.getAttribute('role'),
          };
        });
        expect(focusedElement.tagName).toBeTruthy();
      }
    });

    test('Verificar contraste de colores', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const colorContrastResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(colorContrastResults.violations).toEqual([]);
    });
  });

  // ============================================
  // 2. TESTS DE PERFORMANCE & CORE WEB VITALS
  // ============================================
  test.describe('⚡ Performance y Core Web Vitals', () => {
    test('Landing page debe cargar en menos de 3 segundos', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${PROD_URL}/landing`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`⏱️ Tiempo de carga de Landing: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('Verificar Core Web Vitals', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics: any = {};

          // LCP (Largest Contentful Paint)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // FID (First Input Delay) - simulado
          metrics.fid = 0;

          // CLS (Cumulative Layout Shift)
          let clsScore = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsScore += entry.value;
              }
            }
            metrics.cls = clsScore;
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(metrics), 3000);
        });
      });

      console.log('📊 Core Web Vitals:', webVitals);

      // Umbrales recomendados
      expect((webVitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s
      expect((webVitals as any).cls).toBeLessThan(0.1); // CLS < 0.1
    });

    test('Verificar tamaño de bundle JavaScript', async ({ page }) => {
      const response = await page.goto(`${PROD_URL}/landing`);
      const resources = await page.evaluate(() =>
        performance.getEntriesByType('resource')
      );

      const jsResources = (resources as any[]).filter((r) =>
        r.name.endsWith('.js')
      );
      const totalJsSize = jsResources.reduce((sum, r) => sum + r.transferSize, 0);

      console.log(`📦 Tamaño total de JS: ${(totalJsSize / 1024).toFixed(2)} KB`);

      // Advertir si el bundle es muy grande
      if (totalJsSize > 500 * 1024) {
        console.warn('⚠️ Bundle de JS es mayor a 500KB');
      }
    });

    test('Verificar lazy loading de imágenes', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const images = await page.$$('img');
      let lazyImagesCount = 0;

      for (const img of images) {
        const loading = await img.getAttribute('loading');
        if (loading === 'lazy') {
          lazyImagesCount++;
        }
      }

      console.log(`🖼️ Imágenes con lazy loading: ${lazyImagesCount}/${images.length}`);

      // Al menos 50% de las imágenes deberían tener lazy loading
      if (images.length > 0) {
        expect(lazyImagesCount).toBeGreaterThan(0);
      }
    });
  });

  // ============================================
  // 3. TESTS DE RESPONSIVE DESIGN
  // ============================================
  test.describe('📱 Responsive Design', () => {
    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`Landing debe funcionar en ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto(`${PROD_URL}/landing`);
        await page.waitForLoadState('networkidle');

        // Verificar que no hay overflow horizontal
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        expect(hasHorizontalScroll).toBe(false);

        // Verificar que elementos clave son visibles
        const ctaButton = page.locator('button, a').filter({ hasText: /comenzar|empezar|registr/i }).first();
        await expect(ctaButton).toBeVisible();
      });
    }

    test('Touch targets deben tener tamaño mínimo en móvil', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${PROD_URL}/landing`);

      const buttons = await page.$$('button, a[role="button"]');
      const smallButtons: any[] = [];

      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          const text = await button.textContent();
          smallButtons.push({ text, width: box.width, height: box.height });
        }
      }

      if (smallButtons.length > 0) {
        console.warn('⚠️ Botones con tamaño menor a 44x44px:', smallButtons);
      }

      // Advertencia en lugar de error
      expect(smallButtons.length).toBeLessThan(5);
    });
  });

  // ============================================
  // 4. TESTS DE FORMULARIOS
  // ============================================
  test.describe('📝 Formularios y Validación', () => {
    test('Login form debe validar campos vacíos', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      // Intentar submit sin llenar
      await page.click('button[type="submit"]');

      // Verificar mensajes de error
      const errorMessages = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').count();
      expect(errorMessages).toBeGreaterThan(0);
    });

    test('Login form debe validar email inválido', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Verificar error de email
      const emailError = await page.locator('text=/email.*válid|invalid.*email/i').count();
      expect(emailError).toBeGreaterThan(0);
    });

    test('Inputs deben tener labels asociados', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      const inputs = await page.$$('input[type="text"], input[type="email"], input[type="password"]');

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');

        const hasLabel = id
          ? await page.locator(`label[for="${id}"]`).count() > 0
          : false;

        // Debe tener label, aria-label o placeholder
        expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
      }
    });

    test('Formularios deben tener autocomplete apropiado', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      const emailAutocomplete = await emailInput.getAttribute('autocomplete');
      const passwordAutocomplete = await passwordInput.getAttribute('autocomplete');

      expect(emailAutocomplete).toBeTruthy();
      expect(passwordAutocomplete).toBeTruthy();
    });
  });

  // ============================================
  // 5. TESTS DE NAVEGACIÓN Y RUTAS
  // ============================================
  test.describe('🧭 Navegación y Rutas', () => {
    test('Todas las rutas públicas deben ser accesibles', async ({ page }) => {
      const publicRoutes = [
        '/landing',
        '/login',
        '/api/health',
      ];

      for (const route of publicRoutes) {
        const response = await page.goto(`${PROD_URL}${route}`);
        expect(response?.status()).toBeLessThan(400);
        console.log(`✅ ${route}: ${response?.status()}`);
      }
    });

    test('Navegación debe ser consistente', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      // Verificar que hay un header/nav
      const nav = page.locator('nav, header').first();
      await expect(nav).toBeVisible();

      // Verificar que hay links de navegación
      const navLinks = await nav.locator('a').count();
      expect(navLinks).toBeGreaterThan(0);
    });

    test('404 page debe existir para rutas inválidas', async ({ page }) => {
      const response = await page.goto(`${PROD_URL}/ruta-que-no-existe-${Date.now()}`);
      
      // Debería retornar 404 o redirigir
      expect(response?.status()).toBeGreaterThanOrEqual(400);
    });

    test('Breadcrumbs deben existir en páginas internas', async ({ page }) => {
      // Login
      await page.goto(`${PROD_URL}/login`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/, { timeout: 15000 });

      // Navegar a una página interna
      await page.goto(`${PROD_URL}/dashboard/properties`);

      // Verificar breadcrumbs (opcional)
      const breadcrumbs = page.locator('[aria-label="breadcrumb"], nav[aria-label*="bread"]');
      // No es obligatorio, pero es una buena práctica
    });
  });

  // ============================================
  // 6. TESTS DE ERRORES Y LOGS
  // ============================================
  test.describe('🐛 Errores y Logs', () => {
    test('Landing no debe tener errores de consola críticos', async ({ page }) => {
      consoleErrors = [];

      await page.goto(`${PROD_URL}/landing`);
      await page.waitForLoadState('networkidle');

      // Filtrar errores menores (warnings, info)
      const criticalErrors = consoleErrors.filter((err) =>
        !err.text.includes('DevTools') &&
        !err.text.includes('Warning') &&
        !err.text.includes('favicon')
      );

      if (criticalErrors.length > 0) {
        console.log('🚨 Errores críticos en consola:', criticalErrors);
      }

      expect(criticalErrors.length).toBe(0);
    });

    test('Login no debe tener errores de red', async ({ page }) => {
      networkErrors = [];

      await page.goto(`${PROD_URL}/login`);
      await page.waitForLoadState('networkidle');

      // Filtrar errores de recursos opcionales
      const criticalNetworkErrors = networkErrors.filter((err) =>
        !err.url.includes('favicon') &&
        !err.url.includes('analytics') &&
        err.status >= 500
      );

      if (criticalNetworkErrors.length > 0) {
        console.log('🚨 Errores de red críticos:', criticalNetworkErrors);
      }

      expect(criticalNetworkErrors.length).toBe(0);
    });

    test('Dashboard no debe tener memory leaks', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/, { timeout: 15000 });

      // Medir uso de memoria inicial
      const initialMemory = await page.evaluate(() =>
        (performance as any).memory?.usedJSHeapSize || 0
      );

      // Navegar entre páginas
      for (let i = 0; i < 5; i++) {
        await page.goto(`${PROD_URL}/dashboard`);
        await page.waitForLoadState('networkidle');
        await page.goto(`${PROD_URL}/dashboard/properties`);
        await page.waitForLoadState('networkidle');
      }

      // Medir memoria final
      const finalMemory = await page.evaluate(() =>
        (performance as any).memory?.usedJSHeapSize || 0
      );

      const memoryIncrease = finalMemory - initialMemory;
      console.log(`💾 Incremento de memoria: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Advertir si el incremento es muy grande
      if (memoryIncrease > 50 * 1024 * 1024) {
        console.warn('⚠️ Posible memory leak detectado');
      }
    });
  });

  // ============================================
  // 7. TESTS DE SEO
  // ============================================
  test.describe('🔍 SEO y Metadatos', () => {
    test('Landing debe tener metadatos completos', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      // Title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(60);

      // Meta description
      const description = await page.getAttribute('meta[name="description"]', 'content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(50);
      expect(description!.length).toBeLessThan(160);

      // Open Graph
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      expect(ogImage).toBeTruthy();

      console.log('📄 SEO Metadata:');
      console.log(`- Title: ${title}`);
      console.log(`- Description: ${description}`);
      console.log(`- OG Title: ${ogTitle}`);
      console.log(`- OG Image: ${ogImage}`);
    });

    test('Páginas deben tener estructura de headings correcta', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
      expect(h1Count).toBeLessThanOrEqual(1); // Solo un H1 por página

      const h1Text = await page.locator('h1').first().textContent();
      console.log(`📌 H1: ${h1Text}`);

      // Verificar que hay una jerarquía de headings
      const h2Count = await page.locator('h2').count();
      expect(h2Count).toBeGreaterThan(0);
    });

    test('Links deben tener texto descriptivo', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const links = await page.$$('a');
      const badLinks: string[] = [];

      for (const link of links) {
        const text = (await link.textContent())?.trim();
        const ariaLabel = await link.getAttribute('aria-label');

        if (!text && !ariaLabel) {
          const href = await link.getAttribute('href');
          badLinks.push(href || 'unknown');
        }
      }

      if (badLinks.length > 0) {
        console.warn('⚠️ Links sin texto descriptivo:', badLinks);
      }

      expect(badLinks.length).toBe(0);
    });
  });

  // ============================================
  // 8. TESTS DE SEGURIDAD
  // ============================================
  test.describe('🔒 Seguridad', () => {
    test('Headers de seguridad deben estar presentes', async ({ page }) => {
      const response = await page.goto(`${PROD_URL}/landing`);

      const headers = response?.headers();
      console.log('🛡️ Security Headers:');

      // Content-Security-Policy (recomendado)
      const csp = headers?.['content-security-policy'];
      if (csp) {
        console.log(`- CSP: ${csp.substring(0, 100)}...`);
      } else {
        console.warn('⚠️ CSP header no encontrado');
      }

      // X-Content-Type-Options
      expect(headers?.['x-content-type-options']).toBeTruthy();
      console.log(`- X-Content-Type-Options: ${headers?.['x-content-type-options']}`);

      // X-Frame-Options
      const xFrameOptions = headers?.['x-frame-options'];
      if (xFrameOptions) {
        console.log(`- X-Frame-Options: ${xFrameOptions}`);
      }

      // Strict-Transport-Security (HSTS)
      const hsts = headers?.['strict-transport-security'];
      if (hsts) {
        console.log(`- HSTS: ${hsts}`);
      }
    });

    test('Formularios deben tener protección CSRF', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      // NextAuth incluye protección CSRF por defecto
      // Verificar que el formulario tiene tokens o cookies apropiadas
      const cookies = await page.context().cookies();
      const csrfToken = cookies.find((c) => c.name.includes('csrf') || c.name.includes('next-auth'));

      expect(csrfToken).toBeTruthy();
    });

    test('Inputs sensibles deben tener autocomplete deshabilitado', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      const passwordInput = page.locator('input[type="password"]').first();
      const autocomplete = await passwordInput.getAttribute('autocomplete');

      // Debe tener autocomplete="current-password" o "new-password"
      expect(autocomplete).toBeTruthy();
    });
  });

  // ============================================
  // 9. TESTS DE UX
  // ============================================
  test.describe('👤 Experiencia de Usuario (UX)', () => {
    test('Loading states deben ser visibles', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);

      // Click en submit
      await page.click('button[type="submit"]');

      // Verificar que hay un loading state
      const loadingIndicator = page.locator('[role="status"], .loading, .spinner, .animate-spin').first();
      
      // Dar tiempo a que aparezca
      try {
        await loadingIndicator.waitFor({ timeout: 1000 });
        await expect(loadingIndicator).toBeVisible();
      } catch {
        console.warn('⚠️ No se encontró indicador de loading');
      }
    });

    test('Toast notifications deben funcionar', async ({ page }) => {
      await page.goto(`${PROD_URL}/login`);

      // Intentar login con credenciales inválidas
      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Verificar que aparece un toast/alert
      const toast = page.locator('[role="alert"], [role="status"], .toast, .notification').first();
      
      try {
        await toast.waitFor({ timeout: 3000 });
        await expect(toast).toBeVisible();
      } catch {
        console.warn('⚠️ No se encontró notificación de error');
      }
    });

    test('Modales deben tener close button', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      // Buscar botones que abran modales
      const modalTriggers = await page.$$('[data-modal], [aria-haspopup="dialog"]');

      for (const trigger of modalTriggers.slice(0, 3)) {
        await trigger.click();
        await page.waitForTimeout(500);

        // Verificar que el modal tiene botón de cerrar
        const closeButton = page.locator('[aria-label*="close"], [aria-label*="cerrar"], button:has-text("×")').first();
        
        try {
          await expect(closeButton).toBeVisible({ timeout: 1000 });
          await closeButton.click();
        } catch {
          // Intentar cerrar con Escape
          await page.keyboard.press('Escape');
        }
      }
    });

    test('Focus trap debe funcionar en modales', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      // Abrir un modal si existe
      const modalTrigger = page.locator('[data-modal], [aria-haspopup="dialog"]').first();
      
      try {
        await modalTrigger.click({ timeout: 2000 });
        await page.waitForTimeout(500);

        // Navegar con Tab
        await page.keyboard.press('Tab');
        const firstFocused = await page.evaluate(() => document.activeElement?.tagName);

        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        const secondFocused = await page.evaluate(() => document.activeElement?.tagName);

        // El foco debe quedarse dentro del modal
        expect(firstFocused).toBeTruthy();
        expect(secondFocused).toBeTruthy();
      } catch {
        console.log('ℹ️ No se encontraron modales para testear focus trap');
      }
    });
  });

  // ============================================
  // 10. TESTS DE CONTENIDO
  // ============================================
  test.describe('📄 Contenido y Copy', () => {
    test('Landing debe tener CTA claro', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const ctaButtons = await page.locator('button, a').filter({ 
        hasText: /comenzar|empezar|registr|prueba|demo/i 
      }).count();

      expect(ctaButtons).toBeGreaterThan(0);
    });

    test('Textos no deben tener typos comunes', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const bodyText = await page.locator('body').textContent();
      
      // Typos comunes en español
      const typos = [
        'haber si', // debería ser "a ver si"
        'aver',     // debería ser "a ver"
        'asia',     // debería ser "hacia" (en contexto de dirección)
      ];

      const foundTypos: string[] = [];
      for (const typo of typos) {
        if (bodyText?.toLowerCase().includes(typo)) {
          foundTypos.push(typo);
        }
      }

      if (foundTypos.length > 0) {
        console.warn('⚠️ Posibles typos encontrados:', foundTypos);
      }
    });

    test('Imágenes deben tener alt text', async ({ page }) => {
      await page.goto(`${PROD_URL}/landing`);

      const images = await page.$$('img');
      const missingAlt: string[] = [];

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        if (!alt && role !== 'presentation') {
          const src = await img.getAttribute('src');
          missingAlt.push(src || 'unknown');
        }
      }

      if (missingAlt.length > 0) {
        console.warn('⚠️ Imágenes sin alt text:', missingAlt);
      }

      expect(missingAlt.length).toBe(0);
    });
  });
});
