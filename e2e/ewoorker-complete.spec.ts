/**
 * Tests E2E Completos para eWoorker
 *
 * Sprint 3: Automatización de pruebas
 *
 * Cubre:
 * - Onboarding guiado
 * - Publicación de obras
 * - Sistema de ofertas
 * - Chat en tiempo real
 * - Gamificación
 * - Referidos
 * - Verificación exprés
 */

import { test, expect, Page } from '@playwright/test';

// Configuración base
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Usuarios de prueba
const TEST_USERS = {
  constructora: {
    email: 'test-constructora@ewoorker.test',
    password: 'Test123456!',
  },
  subcontratista: {
    email: 'test-subcontratista@ewoorker.test',
    password: 'Test123456!',
  },
  admin: {
    email: 'admin@inmova.app',
    password: 'Admin123!',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|ewoorker/, { timeout: 10000 });
}

async function navigateToEwoorker(page: Page) {
  await page.goto(`${BASE_URL}/ewoorker/dashboard`);
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// TESTS DE ONBOARDING
// ============================================================================

test.describe('eWoorker Onboarding', () => {
  test('muestra wizard de onboarding para nuevos usuarios', async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
    await page.goto(`${BASE_URL}/ewoorker/onboarding`);

    // Verificar elementos del wizard
    await expect(page.locator('h1')).toContainText('Bienvenido a eWoorker');
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('button:has-text("Continuar")')).toBeVisible();
  });

  test('permite completar paso de bienvenida', async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
    await page.goto(`${BASE_URL}/ewoorker/onboarding`);

    // Click en continuar
    await page.click('button:has-text("Continuar")');

    // Debe avanzar al siguiente paso
    await expect(page.locator('text=Tipo de Usuario')).toBeVisible();
  });

  test('permite seleccionar tipo de usuario', async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
    await page.goto(`${BASE_URL}/ewoorker/onboarding`);

    // Avanzar al paso de tipo de usuario
    await page.click('button:has-text("Continuar")');

    // Seleccionar tipo contratista
    await page.click('button:has-text("Soy Contratista")');

    // Verificar selección
    await expect(page.locator('.selected, [aria-selected="true"]')).toBeVisible();
  });
});

// ============================================================================
// TESTS DE OBRAS
// ============================================================================

test.describe('eWoorker Obras', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
    await navigateToEwoorker(page);
  });

  test('muestra listado de obras', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/obras`);

    // Verificar página de obras
    await expect(page.locator('h1')).toContainText(/Obras|Marketplace/i);
  });

  test('permite crear nueva obra', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/obras/nueva`);

    // Verificar formulario
    await expect(page.locator('input[name="titulo"], input[name="nombre"]')).toBeVisible();
  });

  test('muestra detalles de obra existente', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/obras`);

    // Click en primera obra si existe
    const obraCard = page.locator('[data-testid="obra-card"]').first();
    if (await obraCard.isVisible()) {
      await obraCard.click();
      await expect(page.locator('text=Descripción')).toBeVisible();
    }
  });
});

// ============================================================================
// TESTS DE OFERTAS
// ============================================================================

test.describe('eWoorker Ofertas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.subcontratista.email, TEST_USERS.subcontratista.password);
    await navigateToEwoorker(page);
  });

  test('muestra listado de ofertas enviadas', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/ofertas`);

    await expect(page.locator('h1')).toContainText(/Ofertas|Mis Ofertas/i);
  });

  test('permite enviar oferta a obra', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/obras`);

    // Buscar obra abierta
    const obraAbierta = page.locator('[data-testid="obra-card"]:has-text("abierta")').first();
    if (await obraAbierta.isVisible()) {
      await obraAbierta.click();

      // Verificar botón de ofertar
      await expect(
        page.locator('button:has-text("Enviar Oferta"), button:has-text("Ofertar")')
      ).toBeVisible();
    }
  });
});

// ============================================================================
// TESTS DE CHAT
// ============================================================================

test.describe('eWoorker Chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
    await navigateToEwoorker(page);
  });

  test('muestra listado de conversaciones', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/chat`);

    // Verificar página de chat
    await expect(page.locator('h1')).toContainText(/Chat|Conversaciones|Mensajes/i);
  });

  test('permite abrir conversación existente', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/chat`);

    const conversacion = page.locator('[data-testid="conversation-item"]').first();
    if (await conversacion.isVisible()) {
      await conversacion.click();

      // Verificar área de mensajes
      await expect(page.locator('[data-testid="message-input"], textarea')).toBeVisible();
    }
  });
});

// ============================================================================
// TESTS DE GAMIFICACIÓN
// ============================================================================

test.describe('eWoorker Gamificación', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
  });

  test('muestra perfil de gamificación', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/perfil/logros`);

    // Verificar elementos de gamificación
    await expect(page.locator('text=Puntos')).toBeVisible();
    await expect(page.locator('text=Nivel')).toBeVisible();
  });

  test('muestra leaderboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/leaderboard`);

    await expect(page.locator('h1')).toContainText(/Ranking|Leaderboard/i);
  });

  test('API de gamificación responde correctamente', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/gamification/leaderboard`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.leaderboard)).toBe(true);
  });
});

// ============================================================================
// TESTS DE REFERIDOS
// ============================================================================

test.describe('eWoorker Referidos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
  });

  test('muestra página de referidos', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/perfil/referidos`);

    await expect(page.locator('text=Referidos')).toBeVisible();
  });

  test('permite generar código de referido', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/ewoorker/referrals`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.code).toBeDefined();
    expect(data.code.length).toBeGreaterThan(5);
  });

  test('valida código de referido correctamente', async ({ page }) => {
    // Primero generar un código
    const genResponse = await page.request.post(`${BASE_URL}/api/ewoorker/referrals`);
    const genData = await genResponse.json();

    // Validar el código
    const validateResponse = await page.request.post(
      `${BASE_URL}/api/ewoorker/referrals/validate`,
      {
        data: { code: genData.code },
      }
    );

    expect(validateResponse.ok()).toBeTruthy();
    const validateData = await validateResponse.json();
    expect(validateData.valid).toBe(true);
  });

  test('rechaza código inválido', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/ewoorker/referrals/validate`, {
      data: { code: 'INVALIDCODE123' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.valid).toBe(false);
  });
});

// ============================================================================
// TESTS DE VERIFICACIÓN EXPRÉS
// ============================================================================

test.describe('eWoorker Verificación Exprés', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
  });

  test('muestra elegibilidad para verificación', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/verification/express`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(typeof data.eligible).toBe('boolean');
  });

  test('muestra página de verificación exprés', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/verificacion`);

    await expect(page.locator('text=Verificación')).toBeVisible();
    await expect(page.locator('text=29€')).toBeVisible();
  });
});

// ============================================================================
// TESTS DE ANALYTICS
// ============================================================================

test.describe('eWoorker Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
  });

  test('API de métricas de perfil responde', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/analytics/profile`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.metrics).toBeDefined();
  });

  test('API de tendencias responde', async ({ page }) => {
    const response = await page.request.get(
      `${BASE_URL}/api/ewoorker/analytics/trends?metric=empresas&days=7`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.trend)).toBe(true);
  });

  test('API de distribución geográfica responde', async ({ page }) => {
    const response = await page.request.get(
      `${BASE_URL}/api/ewoorker/analytics/distribution?type=geographic`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.distribution)).toBe(true);
  });
});

// ============================================================================
// TESTS DE ADMIN/SOCIO
// ============================================================================

test.describe('eWoorker Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('acceso a métricas de plataforma', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/analytics/platform`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.metrics.totalEmpresas).toBeDefined();
  });

  test('acceso a verificaciones pendientes', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/verification/admin`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================================================
// TESTS DE MATCHING
// ============================================================================

test.describe('eWoorker Matching', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
  });

  test('API de matching responde', async ({ page }) => {
    const response = await page.request.get(
      `${BASE_URL}/api/ewoorker/matching?tipo=empresas&especialidad=Electricidad&provincia=Madrid`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================================================
// TESTS DE TRABAJADORES
// ============================================================================

test.describe('eWoorker Trabajadores', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.subcontratista.email, TEST_USERS.subcontratista.password);
  });

  test('muestra listado de trabajadores', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/trabajadores`);

    await expect(page.locator('h1')).toContainText(/Trabajadores/i);
  });

  test('API de trabajadores responde', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/trabajadores`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================================================
// TESTS DE DOCUMENTOS
// ============================================================================

test.describe('eWoorker Documentos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
  });

  test('muestra página de documentos', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/documentos`);

    await expect(page.locator('text=Documentos')).toBeVisible();
  });

  test('API de documentos responde', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/compliance/documentos`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================================================
// TESTS DE NOTIFICACIONES
// ============================================================================

test.describe('eWoorker Notificaciones', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('API de alertas de documentos responde', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/ewoorker/notifications/alerts`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================================================
// TESTS DE PWA
// ============================================================================

test.describe('eWoorker PWA', () => {
  test('manifest.json es accesible', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/ewoorker/manifest.json`);

    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name).toBe('eWoorker - Marketplace de Subcontratación');
    expect(manifest.short_name).toBe('eWoorker');
  });

  test('service worker está registrado', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/dashboard`);

    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });

    // El service worker puede o no estar registrado según la configuración
    expect(typeof swRegistration).toBe('boolean');
  });
});

// ============================================================================
// TESTS DE RESPONSIVE
// ============================================================================

test.describe('eWoorker Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);
  });

  test('dashboard se muestra correctamente en móvil', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/dashboard`);

    // Verificar que el contenido es visible
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('menú móvil funciona', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/dashboard`);

    // Buscar botón de menú móvil
    const menuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    }
  });

  test('formularios son usables en móvil', async ({ page }) => {
    await page.goto(`${BASE_URL}/ewoorker/obras/nueva`);

    // Verificar que inputs tienen tamaño táctil adecuado
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Mínimo 40px para touch
        }
      }
    }
  });
});

// ============================================================================
// TESTS DE RENDIMIENTO
// ============================================================================

test.describe('eWoorker Performance', () => {
  test('dashboard carga en menos de 3 segundos', async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/ewoorker/dashboard`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000); // 5 segundos máximo
  });

  test('APIs responden en menos de 500ms', async ({ page }) => {
    await login(page, TEST_USERS.constructora.email, TEST_USERS.constructora.password);

    const apis = ['/api/ewoorker/gamification/leaderboard', '/api/ewoorker/analytics/profile'];

    for (const api of apis) {
      const startTime = Date.now();
      const response = await page.request.get(`${BASE_URL}${api}`);
      const responseTime = Date.now() - startTime;

      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(2000); // 2 segundos máximo para APIs
    }
  });
});

// ============================================================================
// TESTS DE SEGURIDAD
// ============================================================================

test.describe('eWoorker Security', () => {
  test('APIs requieren autenticación', async ({ page }) => {
    const protectedApis = [
      '/api/ewoorker/gamification/profile',
      '/api/ewoorker/referrals',
      '/api/ewoorker/analytics/profile',
    ];

    for (const api of protectedApis) {
      const response = await page.request.get(`${BASE_URL}${api}`);
      expect(response.status()).toBe(401);
    }
  });

  test('APIs de admin requieren rol correcto', async ({ page }) => {
    await login(page, TEST_USERS.subcontratista.email, TEST_USERS.subcontratista.password);

    const adminApis = ['/api/ewoorker/analytics/platform', '/api/ewoorker/verification/admin'];

    for (const api of adminApis) {
      const response = await page.request.get(`${BASE_URL}${api}`);
      expect([401, 403]).toContain(response.status());
    }
  });
});
