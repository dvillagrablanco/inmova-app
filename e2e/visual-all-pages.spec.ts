/**
 * Verificación visual/smoke de TODAS las rutas detectables.
 *
 * - Descubre rutas desde `app/**/page.tsx` (App Router) y `pages/**/*` (Pages Router)
 * - Navega secuencialmente por cada ruta
 * - Falla si detecta HTTP 5xx o errores de consola/página
 *
 * Nota:
 * - Para rutas dinámicas ([id]) usa placeholders simples (por defecto "1").
 * - Captura screenshot solo en fallos para evitar miles de imágenes.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { globSync } from 'glob';

type Issue = {
  route: string;
  kind: 'http' | 'console' | 'pageerror' | 'navigation';
  message: string;
  details?: unknown;
};

const PLACEHOLDER_BY_PARAM: Record<string, string> = {
  id: '1',
  unitId: '1',
  roomId: '1',
  buildingId: '1',
  contractId: '1',
  paymentId: '1',
  listingId: '1',
  jobId: '1',
};

function normalizeSlashes(input: string): string {
  return input.replace(/\/{2,}/g, '/');
}

function appFileToRoute(file: string): string | null {
  // app/(group)/foo/page.tsx -> /foo
  // app/page.tsx -> /
  let route = file.replace(/^app\//, '/').replace(/\/page\.tsx$/, '');
  route = route.replace(/\(.*?\)\//g, ''); // quitar route groups
  route = route.replace(/\(.*?\)/g, ''); // por si hay grupos al final

  // Excluir API routes por seguridad (aunque el glob ya lo evita)
  if (route.startsWith('/api/')) return null;

  // Catch-all / optional catch-all: no se puede inventar fácilmente
  if (route.includes('[...') || route.includes('[[...')) return null;

  // Sustituir params dinámicos
  route = route.replace(/\[([^\]]+)\]/g, (_m, paramNameRaw: string) => {
    const paramName = String(paramNameRaw);
    return PLACEHOLDER_BY_PARAM[paramName] ?? '1';
  });

  route = normalizeSlashes(route);
  if (route === '') route = '/';
  if (!route.startsWith('/')) route = `/${route}`;
  return route;
}

function pagesFileToRoute(file: string): string | null {
  // pages/index.tsx -> /
  // pages/foo/bar.tsx -> /foo/bar
  // pages/api/* -> null
  let route = file.replace(/^pages\//, '/');
  route = route.replace(/\.(tsx|ts)$/, '');

  if (route.startsWith('/api/')) return null;
  if (route === '/_app' || route === '/_document' || route === '/_error') return null;

  route = route.replace(/\/index$/g, '/');
  if (route.includes('[...') || route.includes('[[...')) return null;

  route = route.replace(/\[([^\]]+)\]/g, (_m, paramNameRaw: string) => {
    const paramName = String(paramNameRaw);
    return PLACEHOLDER_BY_PARAM[paramName] ?? '1';
  });

  route = normalizeSlashes(route);
  if (!route.startsWith('/')) route = `/${route}`;
  return route;
}

function discoverRoutes(): string[] {
  const appPages = globSync('app/**/page.tsx', {
    ignore: ['**/node_modules/**', '**/.next/**', 'app/api/**'],
  });
  const pagesPages = globSync('pages/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/.next/**', 'pages/api/**'],
  });

  const routes = new Set<string>();
  for (const file of appPages) {
    const r = appFileToRoute(file);
    if (r) routes.add(r);
  }
  for (const file of pagesPages) {
    const r = pagesFileToRoute(file);
    if (r) routes.add(r);
  }

  // Rutas base útiles (por si no están en FS)
  routes.add('/login');

  return [...routes].sort();
}

async function tryLogin(page: any) {
  // Login best-effort: si falla (por env), el test seguirá.
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const email = page.locator('input[type="email"], input[name="email"]').first();
  const pass = page.locator('input[type="password"], input[name="password"]').first();
  const btn = page.getByRole('button', { name: /iniciar sesión|entrar|login/i }).first();

  if (await email.isVisible().catch(() => false)) {
    await email.fill(process.env.E2E_EMAIL || 'admin@inmova.com');
    await pass.fill(process.env.E2E_PASSWORD || 'admin123');
    await btn.click();
    await page.waitForURL(/\/(dashboard|home|login)/, { timeout: 15000 });
  }
}

test.describe('Verificación visual: todas las páginas', () => {
  test('debe navegar por todas las rutas sin 5xx ni errores de consola', async ({ page }) => {
    const routes = discoverRoutes();

    const issues: Issue[] = [];

    // Capturar errores globales
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      issues.push({ route: page.url(), kind: 'pageerror', message: err.message, details: err.stack });
    });

    // Intentar autenticación (best-effort)
    try {
      await tryLogin(page);
    } catch (e: any) {
      issues.push({
        route: '/login',
        kind: 'navigation',
        message: `Login falló (se continúa): ${e?.message || String(e)}`,
      });
    }

    for (const route of routes) {
      // Reset errores de consola entre rutas
      consoleErrors.length = 0;

      await test.step(route, async () => {
        let response;
        try {
          response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        } catch (e: any) {
          issues.push({
            route,
            kind: 'navigation',
            message: `Fallo navegando a ${route}: ${e?.message || String(e)}`,
          });
          await page.screenshot({
            path: path.join('test-results', `visual-all-pages-fail-${route.replace(/\//g, '_')}.png`),
            fullPage: true,
          });
          return;
        }

        const status = response?.status();
        if (typeof status === 'number' && status >= 500) {
          issues.push({
            route,
            kind: 'http',
            message: `HTTP ${status} en ${route}`,
            details: { url: response?.url(), status },
          });
          await page.screenshot({
            path: path.join('test-results', `visual-all-pages-5xx-${route.replace(/\//g, '_')}.png`),
            fullPage: true,
          });
        }

        if (consoleErrors.length) {
          issues.push({
            route,
            kind: 'console',
            message: `Errores de consola (${consoleErrors.length})`,
            details: consoleErrors.slice(0, 20),
          });
          await page.screenshot({
            path: path.join('test-results', `visual-all-pages-console-${route.replace(/\//g, '_')}.png`),
            fullPage: true,
          });
        }
      });
    }

    // Mostrar issues con buen formato al fallar
    expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
  });
});

