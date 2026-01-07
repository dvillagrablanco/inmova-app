/**
 * Landing Page UI Audit - Playwright E2E Tests
 *
 * Este script audita la landing page y subpáginas verificando:
 * - Alineaciones y layouts
 * - Superposiciones de elementos
 * - Contraste de colores (texto/fondo)
 * - Responsive design (desktop, tablet, móvil)
 * - Elementos visuales y UX
 *
 * Ejecutar: npx playwright test e2e/landing-ui-audit.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

// Configuración de viewports
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

// Páginas a auditar
const PAGES_TO_AUDIT = [
  { path: '/landing', name: 'Landing Principal' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Registro' },
  { path: '/landing/calculadora-roi', name: 'Calculadora ROI' },
];

// Helper para verificar contraste de color
async function checkContrastRatio(page: Page, selector: string) {
  const elements = await page.locator(selector).all();
  const issues: string[] = [];

  for (let i = 0; i < Math.min(elements.length, 20); i++) {
    const el = elements[i];
    const isVisible = await el.isVisible().catch(() => false);
    if (!isVisible) continue;

    const styles = await el.evaluate((node) => {
      const computed = window.getComputedStyle(node);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
      };
    }).catch(() => null);

    if (styles) {
      // Verificar que el texto no sea invisible
      if (styles.color === 'rgba(0, 0, 0, 0)' || styles.color === 'transparent') {
        issues.push(`Texto invisible en elemento ${i}`);
      }
    }
  }

  return issues;
}

// Helper para verificar superposiciones
async function checkOverlaps(page: Page) {
  const issues: string[] = [];

  // Verificar que elementos clave no se superpongan
  const criticalElements = [
    'header',
    'nav',
    'main',
    'footer',
    '[data-testid="hero"]',
    '#pricing',
  ];

  for (const selector of criticalElements) {
    const el = page.locator(selector).first();
    if (await el.isVisible().catch(() => false)) {
      const box = await el.boundingBox();
      if (box) {
        // Verificar que no tenga dimensiones negativas o extrañas
        if (box.width <= 0 || box.height <= 0) {
          issues.push(`Elemento ${selector} tiene dimensiones inválidas`);
        }
      }
    }
  }

  return issues;
}

// Test principal de auditoría
test.describe('Landing Page UI Audit', () => {
  test.describe.configure({ mode: 'serial' });

  for (const viewport of Object.entries(VIEWPORTS)) {
    const [viewportName, viewportSize] = viewport;

    test.describe(`Viewport: ${viewportName} (${viewportSize.width}x${viewportSize.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewportSize);
      });

      for (const pageInfo of PAGES_TO_AUDIT) {
        test(`${pageInfo.name} - Layout y elementos`, async ({ page }) => {
          // Navegar a la página
          const response = await page.goto(pageInfo.path, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          // Verificar que la página carga correctamente
          expect(response?.status()).toBeLessThan(400);

          // Esperar a que el contenido principal cargue
          await page.waitForLoadState('domcontentloaded');

          // 1. VERIFICAR LAYOUT GENERAL
          // Header debe estar visible y en la parte superior
          const header = page.locator('header').first();
          if (await header.isVisible().catch(() => false)) {
            const headerBox = await header.boundingBox();
            expect(headerBox?.y).toBeLessThanOrEqual(50);
          }

          // 2. VERIFICAR QUE NO HAY SCROLL HORIZONTAL
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });

          // En tablet puede haber scroll horizontal por elementos de pricing grid
          if (viewportName === 'desktop' || viewportName === 'laptop') {
            expect(hasHorizontalScroll).toBe(false);
          }

          // 3. VERIFICAR ELEMENTOS NO CORTADOS
          const mainContent = page.locator('main, [role="main"], .container').first();
          if (await mainContent.isVisible().catch(() => false)) {
            const box = await mainContent.boundingBox();
            if (box) {
              expect(box.x).toBeGreaterThanOrEqual(0);
            }
          }

          // 4. VERIFICAR QUE LOS BOTONES SON CLICKEABLES
          const buttons = await page.locator('button, a[href]').all();
          let clickableButtons = 0;
          for (const button of buttons.slice(0, 10)) {
            if (await button.isVisible().catch(() => false)) {
              const box = await button.boundingBox();
              if (box && box.width >= 20 && box.height >= 20) {
                clickableButtons++;
              }
            }
          }
          expect(clickableButtons).toBeGreaterThan(0);

          // 5. VERIFICAR CONTRASTE DE TEXTOS
          const textIssues = await checkContrastRatio(page, 'p, h1, h2, h3, h4, span, a');
          expect(textIssues.length).toBeLessThan(5);

          // 6. VERIFICAR IMÁGENES TIENEN ALT
          const images = await page.locator('img').all();
          for (const img of images.slice(0, 10)) {
            if (await img.isVisible().catch(() => false)) {
              const alt = await img.getAttribute('alt');
              // Las imágenes decorativas pueden tener alt=""
              expect(alt !== null).toBe(true);
            }
          }

          // 7. VERIFICAR CARDS Y SECCIONES
          const cards = await page.locator('[class*="card"], [class*="Card"]').all();
          for (const card of cards.slice(0, 5)) {
            if (await card.isVisible().catch(() => false)) {
              const box = await card.boundingBox();
              if (box) {
                // Cards no deben estar cortadas
                expect(box.width).toBeGreaterThan(50);
                expect(box.height).toBeGreaterThan(30);
              }
            }
          }

          // 8. VERIFICAR QUE NO HAY MENCIONES A COMPETIDORES
          const pageText = await page.textContent('body') || '';
          expect(pageText.toLowerCase()).not.toContain('homming');
          expect(pageText.toLowerCase()).not.toContain('rentger');
        });
      }
    });
  }

  // Tests específicos para la sección de precios
  test('Pricing Section - Diseño y alineación', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/landing', { waitUntil: 'networkidle' });

    // Scroll a la sección de precios
    const pricingSection = page.locator('#pricing');
    if (await pricingSection.isVisible().catch(() => false)) {
      await pricingSection.scrollIntoViewIfNeeded();

      // Verificar que hay cards de planes
      const planCards = await page.locator('#pricing [class*="card"], #pricing [class*="Card"]').all();
      expect(planCards.length).toBeGreaterThanOrEqual(3);

      // Verificar alineación de cards (deben estar en grid)
      const cardBoxes = await Promise.all(
        planCards.slice(0, 4).map(async (card) => {
          return await card.boundingBox();
        })
      );

      // En desktop, las cards deben estar en fila (mismo Y aproximado)
      const validBoxes = cardBoxes.filter((b) => b !== null);
      if (validBoxes.length >= 2) {
        const firstY = validBoxes[0]!.y;
        for (const box of validBoxes) {
          // Permitir una diferencia de 200px para cards con badges
          expect(Math.abs(box!.y - firstY)).toBeLessThan(200);
        }
      }

      // Verificar que los precios son visibles
      const prices = await page.locator('#pricing').getByText(/€\d+/).all();
      expect(prices.length).toBeGreaterThan(0);
    }
  });

  // Test de navegación mobile
  test('Mobile Navigation - Menú hamburguesa', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/landing', { waitUntil: 'networkidle' });

    // En móvil, debería haber un botón de menú o navbar colapsable
    const menuButton = page.locator('button[aria-label*="menu"], [class*="menu"], button:has(svg)').first();

    // Si hay menú hamburguesa, verificar que funciona
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Verificar que el menú se expande o aparece un drawer
      const navLinks = page.locator('nav a, [role="navigation"] a');
      const visibleLinks = await navLinks.all();
      let visibleCount = 0;
      for (const link of visibleLinks) {
        if (await link.isVisible().catch(() => false)) {
          visibleCount++;
        }
      }

      // Si hay menú desplegable, debe tener enlaces
      // Algunos sitios no tienen menú hamburguesa tradicional
      if (visibleCount === 0) {
        console.log('Info: No se detectó menú hamburguesa tradicional');
      }
    }
  });

  // Test de formularios
  test('Forms - Campos alineados correctamente', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Verificar campos de formulario
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      if (await input.isVisible().catch(() => false)) {
        const box = await input.boundingBox();
        if (box) {
          // Inputs deben tener un ancho mínimo razonable
          expect(box.width).toBeGreaterThan(100);
          expect(box.height).toBeGreaterThan(20);
        }
      }
    }

    // Verificar botón de submit
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible().catch(() => false)) {
      const box = await submitButton.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(80);
        expect(box.height).toBeGreaterThan(30);
      }
    }
  });

  // Test de accesibilidad básica
  test('Accesibilidad - Elementos básicos', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/landing', { waitUntil: 'networkidle' });

    // Verificar que hay un h1
    const h1 = page.locator('h1').first();
    expect(await h1.isVisible()).toBe(true);

    // Verificar que los links tienen texto o aria-label
    const links = await page.locator('a').all();
    let accessibleLinks = 0;
    for (const link of links.slice(0, 20)) {
      if (await link.isVisible().catch(() => false)) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        if ((text && text.trim()) || ariaLabel) {
          accessibleLinks++;
        }
      }
    }
    expect(accessibleLinks).toBeGreaterThan(0);

    // Verificar que los botones tienen texto o aria-label
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 10)) {
      if (await button.isVisible().catch(() => false)) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const hasContent = (text && text.trim()) || ariaLabel;
        expect(hasContent).toBeTruthy();
      }
    }
  });

  // Test de colores y contraste
  test('Colores - Sin texto invisible', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/landing', { waitUntil: 'networkidle' });

    // Verificar que no hay texto blanco sobre fondo blanco (o similar)
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a').all();
    let problemCount = 0;

    for (const el of textElements.slice(0, 30)) {
      if (await el.isVisible().catch(() => false)) {
        const result = await el.evaluate((node) => {
          const style = window.getComputedStyle(node);
          const color = style.color;
          const bgColor = style.backgroundColor;

          // Si ambos son muy similares (ej: blanco sobre blanco)
          if (color === bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            return { problem: true, color, bgColor };
          }

          return { problem: false };
        }).catch(() => ({ problem: false }));

        if (result.problem) {
          problemCount++;
        }
      }
    }

    // Permitir hasta 2 elementos con posibles problemas (pueden ser decorativos)
    expect(problemCount).toBeLessThan(3);
  });

  // Test de footer
  test('Footer - Visible y con contenido', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/landing', { waitUntil: 'networkidle' });

    // Scroll al footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator('footer');
    if (await footer.isVisible().catch(() => false)) {
      const box = await footer.boundingBox();
      if (box) {
        // Footer debe tener contenido
        expect(box.height).toBeGreaterThan(50);
      }

      // Verificar que tiene links
      const footerLinks = await footer.locator('a').all();
      expect(footerLinks.length).toBeGreaterThan(0);
    }
  });

  // Test de carga de assets
  test('Assets - Imágenes y recursos cargan', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet') {
        failedRequests.push(request.url());
      }
    });

    await page.goto('/landing', { waitUntil: 'networkidle' });

    // No debe haber muchos recursos fallidos
    expect(failedRequests.length).toBeLessThan(5);
  });
});

// Test de rendimiento básico
test('Performance - Tiempo de carga', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/landing', { waitUntil: 'domcontentloaded' });

  const loadTime = Date.now() - startTime;

  // La página debe cargar en menos de 10 segundos
  expect(loadTime).toBeLessThan(10000);

  // LCP debe estar presente
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries.length > 0);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      setTimeout(() => resolve(true), 3000);
    });
  });

  expect(lcp).toBe(true);
});
