/**
 * Test Visual - Inspección de Login
 * Pruebas visuales exhaustivas para identificar problemas en las páginas de login
 */

import { test, expect, Page } from '@playwright/test';

// Configuración de viewports para pruebas responsive
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  smallMobile: { width: 320, height: 568 },
};

// URLs de las diferentes páginas de login
const LOGIN_PAGES = [
  { url: '/login', name: 'login-principal' },
  { url: '/portal-propietario/login', name: 'login-propietario' },
  { url: '/portal-inquilino/login', name: 'login-inquilino' },
  { url: '/portal-proveedor/login', name: 'login-proveedor' },
  { url: '/partners/login', name: 'login-partners' },
];

/**
 * Helper para capturar screenshot con contexto
 */
async function captureScreenshot(page: Page, name: string, viewport: string, state: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${viewport}-${state}.png`,
    fullPage: true,
  });
}

/**
 * Helper para validar elementos visuales comunes
 */
async function validateCommonElements(page: Page, pageName: string) {
  const issues: string[] = [];

  // Verificar que existe un formulario de login
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');

  if (!(await emailInput.isVisible())) {
    issues.push(`❌ ${pageName}: Input de email no visible`);
  }

  if (!(await passwordInput.isVisible())) {
    issues.push(`❌ ${pageName}: Input de contraseña no visible`);
  }

  if (!(await submitButton.isVisible())) {
    issues.push(`❌ ${pageName}: Botón de submit no visible`);
  }

  // Verificar contraste de texto
  const heading = page.locator('h1, h2').first();
  if (await heading.isVisible()) {
    const color = await heading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    console.log(`${pageName} - Color del heading: ${color}`);
  }

  // Verificar que no hay elementos superpuestos
  const inputs = await page.locator('input').all();
  for (const input of inputs) {
    const box = await input.boundingBox();
    if (box && (box.width === 0 || box.height === 0)) {
      issues.push(`❌ ${pageName}: Input con dimensiones zero`);
    }
  }

  return issues;
}

test.describe('Inspección Visual - Páginas de Login', () => {
  test.beforeEach(async ({ page }) => {
    // Esperar a que las fuentes y estilos se carguen
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  // Test 1: Capturar estado inicial de todas las páginas en diferentes viewports
  for (const viewport of Object.entries(VIEWPORTS)) {
    const [viewportName, size] = viewport;

    test(`Captura inicial - ${viewportName}`, async ({ page }) => {
      await page.setViewportSize(size);

      for (const loginPage of LOGIN_PAGES) {
        await page.goto(loginPage.url);
        await page.waitForLoadState('networkidle');

        // Screenshot inicial
        await captureScreenshot(page, loginPage.name, viewportName, 'initial');

        // Validar elementos comunes
        const issues = await validateCommonElements(page, loginPage.name);
        if (issues.length > 0) {
          console.log(`\n⚠️  Problemas encontrados en ${loginPage.name}:`);
          issues.forEach((issue) => console.log(issue));
        }
      }
    });
  }

  // Test 2: Estados de interacción (focus, hover, error)
  test('Estados de interacción - Desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      // Estado con focus en email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.focus();
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'desktop', 'email-focus');

      // Estado con focus en password
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.focus();
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'desktop', 'password-focus');

      // Estado con datos ingresados
      await emailInput.fill('test@ejemplo.com');
      await passwordInput.fill('password123');
      await captureScreenshot(page, loginPage.name, 'desktop', 'filled');

      // Estado de error (intentar submit con datos inválidos)
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000); // Esperar respuesta del servidor
      await captureScreenshot(page, loginPage.name, 'desktop', 'error');

      // Limpiar
      await emailInput.clear();
      await passwordInput.clear();
    }
  });

  // Test 3: Validación de responsive design
  test('Validación responsive - Transiciones', async ({ page }) => {
    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      // Mobile portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'mobile-portrait', 'responsive');

      // Mobile landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'mobile-landscape', 'responsive');

      // Tablet portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'tablet-portrait', 'responsive');

      // Desktop large
      await page.setViewportSize({ width: 2560, height: 1440 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'desktop-large', 'responsive');
    }
  });

  // Test 4: Verificación de elementos visibles sin scroll
  test('Above the fold - Elementos visibles', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);

    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      const issues: string[] = [];

      // Verificar que elementos críticos están visibles sin scroll
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      const emailVisible = await emailInput.isInViewport();
      const passwordVisible = await passwordInput.isInViewport();
      const submitVisible = await submitButton.isInViewport();

      if (!emailVisible) {
        issues.push(`❌ ${loginPage.name}: Email input no visible sin scroll`);
      }
      if (!passwordVisible) {
        issues.push(`❌ ${loginPage.name}: Password input no visible sin scroll`);
      }
      if (!submitVisible) {
        issues.push(`❌ ${loginPage.name}: Botón submit no visible sin scroll`);
      }

      if (issues.length > 0) {
        console.log(`\n⚠️  Problemas "above the fold" en ${loginPage.name}:`);
        issues.forEach((issue) => console.log(issue));
      }

      await captureScreenshot(page, loginPage.name, 'mobile', 'above-fold');
    }
  });

  // Test 5: Verificación de accesibilidad visual
  test('Accesibilidad visual - Contraste y tamaño', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      const issues: string[] = [];

      // Verificar tamaño de fuentes
      const labels = await page.locator('label').all();
      for (const label of labels) {
        const fontSize = await label.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        const fontSizeNum = parseInt(fontSize);
        if (fontSizeNum < 14) {
          issues.push(`⚠️  ${loginPage.name}: Label con fuente pequeña (${fontSize})`);
        }
      }

      // Verificar tamaño de botones
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (box.height < 44 || box.width < 44)) {
          issues.push(
            `⚠️  ${loginPage.name}: Botón pequeño para touch (${box.width}x${box.height})`
          );
        }
      }

      // Verificar espaciado entre elementos
      const inputs = await page.locator('input').all();
      for (let i = 0; i < inputs.length - 1; i++) {
        const box1 = await inputs[i].boundingBox();
        const box2 = await inputs[i + 1].boundingBox();
        if (box1 && box2) {
          const spacing = box2.y - (box1.y + box1.height);
          if (spacing < 16) {
            issues.push(`⚠️  ${loginPage.name}: Poco espaciado entre inputs (${spacing}px)`);
          }
        }
      }

      if (issues.length > 0) {
        console.log(`\n⚠️  Problemas de accesibilidad visual en ${loginPage.name}:`);
        issues.forEach((issue) => console.log(issue));
      }
    }
  });

  // Test 6: Estado de carga (loading state)
  test('Estado de carga - Visual feedback', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      // Llenar formulario
      await page.fill('input[type="email"]', 'test@ejemplo.com');
      await page.fill('input[type="password"]', 'password123');

      // Click y capturar inmediatamente (estado loading)
      const submitButton = page.locator('button[type="submit"]').first();

      // Capturar el momento del click
      const clickPromise = submitButton.click();
      await page.waitForTimeout(100); // Pequeña espera para capturar el loading
      await captureScreenshot(page, loginPage.name, 'desktop', 'loading');

      await clickPromise;
      await page.waitForTimeout(1000);
    }
  });

  // Test 7: Dark mode (si está disponible)
  test('Dark mode - Comparación visual', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    for (const loginPage of LOGIN_PAGES) {
      // Modo claro
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');
      await captureScreenshot(page, loginPage.name, 'desktop', 'light-mode');

      // Intentar activar dark mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'desktop', 'dark-mode');

      // Volver a light mode
      await page.emulateMedia({ colorScheme: 'light' });
    }
  });

  // Test 8: Overflow y scroll
  test('Overflow y scroll - Problemas de contenedor', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.smallMobile);

    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      // Verificar si hay overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        console.log(`⚠️  ${loginPage.name}: Tiene scroll horizontal en mobile`);
      }

      // Capturar página completa
      await captureScreenshot(page, loginPage.name, 'small-mobile', 'overflow-check');

      // Scroll hasta el final
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await captureScreenshot(page, loginPage.name, 'small-mobile', 'scrolled-bottom');
    }
  });

  // Test 9: Validación de imágenes y logos
  test('Imágenes y logos - Carga y visualización', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      const issues: string[] = [];

      // Verificar todas las imágenes
      const images = await page.locator('img').all();
      for (const img of images) {
        const isVisible = await img.isVisible();
        if (isVisible) {
          const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
          const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
          const src = await img.getAttribute('src');

          if (naturalWidth === 0 || naturalHeight === 0) {
            issues.push(`❌ ${loginPage.name}: Imagen no cargada: ${src}`);
          }
        }
      }

      if (issues.length > 0) {
        console.log(`\n⚠️  Problemas con imágenes en ${loginPage.name}:`);
        issues.forEach((issue) => console.log(issue));
      }
    }
  });

  // Test 10: Comparación entre páginas
  test('Reporte de inconsistencias - Entre páginas', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    const pageData: any[] = [];

    // Recopilar datos de todas las páginas
    for (const loginPage of LOGIN_PAGES) {
      await page.goto(loginPage.url);
      await page.waitForLoadState('networkidle');

      const data = {
        name: loginPage.name,
        title: await page.title(),
        hasEmailInput: (await page.locator('input[type="email"]').count()) > 0,
        hasPasswordInput: (await page.locator('input[type="password"]').count()) > 0,
        submitButtonText: await page.locator('button[type="submit"]').first().textContent(),
        backgroundColor: await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        }),
      };

      pageData.push(data);
    }

    // Analizar inconsistencias
    console.log('\n📊 COMPARACIÓN ENTRE PÁGINAS DE LOGIN:\n');
    pageData.forEach((data) => {
      console.log(`\n${data.name}:`);
      console.log(`  - Título: ${data.title}`);
      console.log(`  - Texto del botón: ${data.submitButtonText}`);
      console.log(`  - Color de fondo: ${data.backgroundColor}`);
      console.log(`  - Input email: ${data.hasEmailInput ? '✓' : '✗'}`);
      console.log(`  - Input password: ${data.hasPasswordInput ? '✓' : '✗'}`);
    });

    // Verificar consistencia de textos en botones
    const buttonTexts = pageData.map((d) => d.submitButtonText?.trim());
    const uniqueTexts = [...new Set(buttonTexts)];
    if (uniqueTexts.length > 2) {
      console.log('\n⚠️  INCONSISTENCIA: Múltiples variaciones del texto del botón de login');
      uniqueTexts.forEach((text) => console.log(`  - "${text}"`));
    }
  });
});
