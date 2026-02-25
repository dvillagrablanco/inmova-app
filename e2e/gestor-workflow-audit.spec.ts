/**
 * E2E: Auditoría completa del flujo del gestor
 *
 * Navega todas las páginas core como un gestor real.
 * Toma screenshots, verifica botones, detecta errores.
 *
 * Run:
 *   npx playwright test e2e/gestor-workflow-audit.spec.ts --config=e2e/playwright-audit.config.ts
 */

import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://inmovaapp.com';
const CREDENTIALS = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

const SCREENSHOT_DIR = 'test-results/audit';
const REPORT_PATH = 'test-results/audit/audit-report.json';

interface PageAuditResult {
  page: string;
  url: string;
  status: 'ok' | 'error' | 'warning' | 'not_found';
  loadTimeMs: number;
  screenshotFile: string;
  httpStatus?: number;
  consoleErrors: string[];
  visibleButtons: number;
  visibleInputs: number;
  visibleSelects: number;
  visibleLinks: number;
  hasBlankBody: boolean;
  hasServerError: boolean;
  has404: boolean;
  hasLoadingStuck: boolean;
  formFields: Record<string, boolean>;
  notes: string[];
}

const auditResults: PageAuditResult[] = [];

async function snap(page: Page, name: string): Promise<string> {
  const filePath = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function auditPage(
  page: Page,
  name: string,
  url: string,
  customChecks?: (page: Page, result: PageAuditResult) => Promise<void>
): Promise<PageAuditResult> {
  const consoleErrors: string[] = [];

  const onConsoleMsg = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text().substring(0, 200));
    }
  };
  page.on('console', onConsoleMsg);

  const start = Date.now();
  let httpStatus: number | undefined;

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });
    httpStatus = response?.status();
  } catch (e: any) {
    const elapsed = Date.now() - start;
    const ssFile = await snap(page, name).catch(() => '');
    const result: PageAuditResult = {
      page: name,
      url,
      status: 'error',
      loadTimeMs: elapsed,
      screenshotFile: ssFile,
      httpStatus,
      consoleErrors,
      visibleButtons: 0,
      visibleInputs: 0,
      visibleSelects: 0,
      visibleLinks: 0,
      hasBlankBody: true,
      hasServerError: false,
      has404: false,
      hasLoadingStuck: true,
      formFields: {},
      notes: [`Navigation failed: ${e.message?.substring(0, 150)}`],
    };
    auditResults.push(result);
    page.off('console', onConsoleMsg);
    return result;
  }

  const loadTime = Date.now() - start;

  await page.waitForTimeout(500);

  const ssFile = await snap(page, name);

  const content = await page.content();
  const bodyText = await page
    .locator('body')
    .innerText()
    .catch(() => '');

  const hasServerError =
    (content.includes('Internal Server Error') && content.includes('500')) ||
    content.includes('Application error') ||
    content.includes('NEXT_NOT_FOUND') ||
    httpStatus === 500;

  const has404 =
    httpStatus === 404 ||
    content.includes('This page could not be found') ||
    content.includes('404');

  const hasBlankBody = bodyText.trim().length < 30;

  const hasLoadingStuck =
    (bodyText.includes('Cargando') || bodyText.includes('Loading')) && bodyText.trim().length < 100;

  const visibleButtons = await page.locator('button:visible').count();
  const visibleInputs = await page.locator('input:visible').count();
  const visibleSelects = await page.locator('select:visible, [role="combobox"]:visible').count();
  const visibleLinks = await page.locator('a:visible').count();

  const result: PageAuditResult = {
    page: name,
    url,
    status: hasServerError
      ? 'error'
      : has404
        ? 'not_found'
        : hasBlankBody || hasLoadingStuck
          ? 'warning'
          : 'ok',
    loadTimeMs: loadTime,
    screenshotFile: ssFile,
    httpStatus,
    consoleErrors: consoleErrors.slice(0, 10),
    visibleButtons,
    visibleInputs,
    visibleSelects,
    visibleLinks,
    hasBlankBody,
    hasServerError,
    has404,
    hasLoadingStuck,
    formFields: {},
    notes: [],
  };

  if (httpStatus && httpStatus >= 400) {
    result.notes.push(`HTTP ${httpStatus}`);
  }
  if (loadTime > 5000) {
    result.notes.push(`Slow load: ${loadTime}ms`);
  }
  if (consoleErrors.length > 0) {
    result.notes.push(`${consoleErrors.length} console error(s)`);
  }

  if (customChecks) {
    await customChecks(page, result);
  }

  auditResults.push(result);
  page.off('console', onConsoleMsg);
  return result;
}

async function checkFormField(
  page: Page,
  result: PageAuditResult,
  fieldName: string,
  selector: string
): Promise<boolean> {
  try {
    const el = page.locator(selector).first();
    const visible = await el.isVisible({ timeout: 2000 });
    result.formFields[fieldName] = visible;
    if (!visible) result.notes.push(`Form field missing: ${fieldName}`);
    return visible;
  } catch {
    result.formFields[fieldName] = false;
    result.notes.push(`Form field missing: ${fieldName}`);
    return false;
  }
}

async function checkSelectHasOptions(
  page: Page,
  result: PageAuditResult,
  selectorLabel: string,
  selector: string
): Promise<boolean> {
  try {
    const el = page.locator(selector).first();
    const visible = await el.isVisible({ timeout: 2000 });
    if (!visible) {
      result.notes.push(`Dropdown not found: ${selectorLabel}`);
      return false;
    }

    if (await el.evaluate((e) => e.tagName === 'SELECT')) {
      const optionCount = await el.locator('option').count();
      const hasOptions = optionCount > 1;
      result.notes.push(
        `Dropdown "${selectorLabel}": ${optionCount} options (${hasOptions ? 'populated' : 'EMPTY'})`
      );
      return hasOptions;
    }

    return true;
  } catch {
    result.notes.push(`Dropdown check failed: ${selectorLabel}`);
    return false;
  }
}

test.describe.serial('Auditoría Completa del Gestor', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(auditResults, null, 2));
    console.log(`\nAudit report saved to: ${REPORT_PATH}`);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('  AUDIT SUMMARY');
    console.log('='.repeat(80));

    const ok = auditResults.filter((r) => r.status === 'ok');
    const errors = auditResults.filter((r) => r.status === 'error');
    const warnings = auditResults.filter((r) => r.status === 'warning');
    const notFound = auditResults.filter((r) => r.status === 'not_found');

    console.log(`\n  OK:       ${ok.length} pages`);
    console.log(`  ERRORS:   ${errors.length} pages`);
    console.log(`  WARNINGS: ${warnings.length} pages`);
    console.log(`  404:      ${notFound.length} pages`);

    if (errors.length > 0) {
      console.log('\n  BROKEN PAGES:');
      errors.forEach((r) => console.log(`    - ${r.page}: ${r.notes.join(', ')}`));
    }
    if (warnings.length > 0) {
      console.log('\n  WARNING PAGES:');
      warnings.forEach((r) => console.log(`    - ${r.page}: ${r.notes.join(', ')}`));
    }
    if (notFound.length > 0) {
      console.log('\n  NOT FOUND:');
      notFound.forEach((r) => console.log(`    - ${r.page}: ${r.url}`));
    }

    console.log('\n' + '='.repeat(80));

    await page.close();
  });

  test('01 - Login', async () => {
    await page.goto(`${BASE}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await snap(page, '01-login-page');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    await emailInput.fill(CREDENTIALS.email);
    await passwordInput.fill(CREDENTIALS.password);
    await submitBtn.click();

    await page.waitForURL(/\/(dashboard|traditional-rental|admin|gestor)/, {
      timeout: 20000,
    });
    await page.waitForLoadState('networkidle');
    await snap(page, '01-after-login');

    console.log('Login successful, redirected to:', page.url());
  });

  test('02 - Dashboard /traditional-rental', async () => {
    await auditPage(
      page,
      '02-dashboard-traditional-rental',
      `${BASE}/traditional-rental`,
      async (p, r) => {
        const cards = await p.locator('[class*="card" i]:visible').count();
        r.notes.push(`${cards} card elements visible`);

        const sidebar = p.locator('nav, [class*="sidebar" i], aside').first();
        const sidebarVisible = await sidebar.isVisible().catch(() => false);
        r.notes.push(`Sidebar visible: ${sidebarVisible}`);

        const hasKPIs = await p
          .locator('text=/\\d+/')
          .first()
          .isVisible()
          .catch(() => false);
        r.notes.push(`KPI numbers present: ${hasKPIs}`);
      }
    );
  });

  test('03 - Edificios lista', async () => {
    await auditPage(page, '03-edificios-list', `${BASE}/edificios`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      const cards = await p.locator('[class*="card" i]:visible').count();
      r.notes.push(`Table rows: ${tableRows}, Cards: ${cards}`);

      const createBtn = p
        .locator(
          'a:has-text("Nuevo"), a:has-text("Crear"), button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Añadir"), a:has-text("Añadir")'
        )
        .first();
      const hasCreate = await createBtn.isVisible().catch(() => false);
      r.notes.push(`Create button visible: ${hasCreate}`);
    });
  });

  test('04 - Edificio detalle (first building)', async () => {
    await page.goto(`${BASE}/edificios`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    const firstBuildingLink = page
      .locator('a[href*="/edificios/c"], a[href*="/edificios/cl"]')
      .first();
    const hasBuildingLink = await firstBuildingLink.isVisible().catch(() => false);

    if (hasBuildingLink) {
      const href = await firstBuildingLink.getAttribute('href');
      await firstBuildingLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const ssFile = await snap(page, '04-edificio-detail');

      const content = await page.content();
      const bodyText = await page
        .locator('body')
        .innerText()
        .catch(() => '');

      const result: PageAuditResult = {
        page: '04-edificio-detail',
        url: page.url(),
        status: bodyText.trim().length < 30 ? 'warning' : 'ok',
        loadTimeMs: 0,
        screenshotFile: ssFile,
        consoleErrors: [],
        visibleButtons: await page.locator('button:visible').count(),
        visibleInputs: await page.locator('input:visible').count(),
        visibleSelects: 0,
        visibleLinks: await page.locator('a:visible').count(),
        hasBlankBody: bodyText.trim().length < 30,
        hasServerError: content.includes('Internal Server Error'),
        has404: content.includes('could not be found'),
        hasLoadingStuck: false,
        formFields: {},
        notes: [],
      };

      const hasMap = await page
        .locator('[class*="map" i], [class*="mapbox" i], canvas, iframe[src*="map"]')
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Map visible: ${hasMap}`);

      const hasPhotos = await page
        .locator(
          '[class*="photo" i], [class*="gallery" i], [class*="image" i], img[src*="amazonaws"], img[src*="s3"]'
        )
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Photos/Gallery visible: ${hasPhotos}`);

      const editBtn = await page
        .locator('button:has-text("Editar"), a:has-text("Editar")')
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Edit button: ${editBtn}`);

      const deleteBtn = await page
        .locator('button:has-text("Eliminar"), button:has-text("Borrar")')
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Delete button: ${deleteBtn}`);

      auditResults.push(result);
    } else {
      auditResults.push({
        page: '04-edificio-detail',
        url: `${BASE}/edificios/*`,
        status: 'warning',
        loadTimeMs: 0,
        screenshotFile: '',
        consoleErrors: [],
        visibleButtons: 0,
        visibleInputs: 0,
        visibleSelects: 0,
        visibleLinks: 0,
        hasBlankBody: false,
        hasServerError: false,
        has404: false,
        hasLoadingStuck: false,
        formFields: {},
        notes: ['No buildings found to click into'],
      });
    }
  });

  test('05 - Unidades lista', async () => {
    await auditPage(page, '05-unidades-list', `${BASE}/unidades`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      const cards = await p.locator('[class*="card" i]:visible').count();
      r.notes.push(`Table rows: ${tableRows}, Cards: ${cards}`);

      const createBtn = p
        .locator(
          'a:has-text("Nuevo"), a:has-text("Crear"), button:has-text("Nuevo"), button:has-text("Crear")'
        )
        .first();
      const hasCreate = await createBtn.isVisible().catch(() => false);
      r.notes.push(`Create button visible: ${hasCreate}`);
    });
  });

  test('06 - Inquilinos lista', async () => {
    await auditPage(page, '06-inquilinos-list', `${BASE}/inquilinos`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      r.notes.push(`Table rows: ${tableRows}`);

      const createBtn = p
        .locator('a:has-text("Nuevo"), button:has-text("Nuevo"), a:has-text("Añadir")')
        .first();
      const hasCreate = await createBtn.isVisible().catch(() => false);
      r.notes.push(`Create button visible: ${hasCreate}`);

      const searchInput = p
        .locator(
          'input[placeholder*="buscar" i], input[placeholder*="search" i], input[type="search"]'
        )
        .first();
      const hasSearch = await searchInput.isVisible().catch(() => false);
      r.notes.push(`Search input visible: ${hasSearch}`);
    });
  });

  test('07 - Inquilino nuevo (form fields)', async () => {
    await auditPage(page, '07-inquilino-nuevo', `${BASE}/inquilinos/nuevo`, async (p, r) => {
      await checkFormField(
        p,
        r,
        'nombre',
        'input[name="nombre"], input[name="name"], input[id*="nombre" i], input[placeholder*="nombre" i]'
      );
      await checkFormField(
        p,
        r,
        'apellidos',
        'input[name="apellidos"], input[name="apellido"], input[id*="apellido" i], input[placeholder*="apellido" i]'
      );
      await checkFormField(
        p,
        r,
        'email',
        'input[name="email"], input[type="email"], input[placeholder*="email" i]'
      );
      await checkFormField(
        p,
        r,
        'telefono',
        'input[name="telefono"], input[name="phone"], input[type="tel"], input[placeholder*="teléfono" i], input[placeholder*="telefono" i]'
      );
      await checkFormField(
        p,
        r,
        'dni/nie',
        'input[name="dni"], input[name="nie"], input[name="documentNumber"], input[placeholder*="DNI" i], input[placeholder*="NIE" i]'
      );

      const submitBtn = p
        .locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")')
        .first();
      const hasSubmit = await submitBtn.isVisible().catch(() => false);
      r.notes.push(`Submit button visible: ${hasSubmit}`);
    });
  });

  test('08 - Contratos lista', async () => {
    await auditPage(page, '08-contratos-list', `${BASE}/contratos`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      r.notes.push(`Table rows: ${tableRows}`);

      const createBtn = p
        .locator('a:has-text("Nuevo"), button:has-text("Nuevo"), a:has-text("Crear")')
        .first();
      const hasCreate = await createBtn.isVisible().catch(() => false);
      r.notes.push(`Create button visible: ${hasCreate}`);

      const statusFilters = await p
        .locator('[class*="badge" i], [class*="chip" i], [class*="tag" i]')
        .count();
      r.notes.push(`Status badges/tags: ${statusFilters}`);
    });
  });

  test('09 - Contrato nuevo (cascading filter)', async () => {
    await auditPage(page, '09-contrato-nuevo', `${BASE}/contratos/nuevo`, async (p, r) => {
      const allSelects = await p
        .locator('select:visible, [role="combobox"]:visible, [role="listbox"]:visible')
        .count();
      r.notes.push(`Total selects/comboboxes: ${allSelects}`);

      await checkFormField(
        p,
        r,
        'edificio-selector',
        'select, [role="combobox"], button:has-text("edificio" i), button:has-text("Seleccionar edificio" i)'
      );

      await checkFormField(p, r, 'unidad-selector', 'select, [role="combobox"]');

      await checkFormField(p, r, 'inquilino-selector', 'select, [role="combobox"]');

      await checkFormField(
        p,
        r,
        'fecha-inicio',
        'input[type="date"], input[name*="fecha" i], input[name*="inicio" i], input[placeholder*="fecha" i]'
      );

      await checkFormField(
        p,
        r,
        'renta/precio',
        'input[name*="renta" i], input[name*="precio" i], input[name*="rent" i], input[name*="amount" i], input[placeholder*="renta" i]'
      );

      const submitBtn = p
        .locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")')
        .first();
      const hasSubmit = await submitBtn.isVisible().catch(() => false);
      r.notes.push(`Submit button visible: ${hasSubmit}`);
    });
  });

  test('10 - Pagos lista', async () => {
    await auditPage(page, '10-pagos-list', `${BASE}/pagos`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      r.notes.push(`Table rows: ${tableRows}`);

      const createBtn = p
        .locator('a:has-text("Nuevo"), button:has-text("Nuevo"), button:has-text("Registrar")')
        .first();
      const hasCreate = await createBtn.isVisible().catch(() => false);
      r.notes.push(`Create/Register button visible: ${hasCreate}`);

      const totalAmount = await p
        .locator('text=/\\d+.*€/, text=/€.*\\d+/')
        .first()
        .isVisible()
        .catch(() => false);
      r.notes.push(`Currency amounts visible: ${totalAmount}`);
    });
  });

  test('11 - Pago nuevo (contract dropdown)', async () => {
    await auditPage(page, '11-pago-nuevo', `${BASE}/pagos/nuevo`, async (p, r) => {
      const selects = await p.locator('select:visible, [role="combobox"]:visible').count();
      r.notes.push(`Total selects/comboboxes: ${selects}`);

      await checkFormField(p, r, 'contrato-selector', 'select, [role="combobox"]');

      await checkFormField(
        p,
        r,
        'monto/cantidad',
        'input[name*="monto" i], input[name*="amount" i], input[name*="cantidad" i], input[type="number"]'
      );

      await checkFormField(p, r, 'fecha-pago', 'input[type="date"], input[name*="fecha" i]');
    });
  });

  test('12 - Mantenimiento nuevo (building→unit filter)', async () => {
    await auditPage(page, '12-mantenimiento-nuevo', `${BASE}/mantenimiento/nuevo`, async (p, r) => {
      const selects = await p.locator('select:visible, [role="combobox"]:visible').count();
      r.notes.push(`Total selects/comboboxes: ${selects}`);

      await checkFormField(p, r, 'edificio-selector', 'select, [role="combobox"]');

      await checkFormField(
        p,
        r,
        'titulo/asunto',
        'input[name*="titulo" i], input[name*="title" i], input[name*="asunto" i], input[placeholder*="título" i]'
      );

      await checkFormField(p, r, 'descripcion', 'textarea, input[name*="descrip" i]');

      await checkFormField(p, r, 'prioridad', 'select, [role="combobox"]');
    });
  });

  test('13 - Valoración IA (both tabs)', async () => {
    await auditPage(page, '13-valoracion-ia', `${BASE}/valoracion-ia`, async (p, r) => {
      const tabs = await p.locator('[role="tab"], button[class*="tab" i]').count();
      r.notes.push(`Tabs found: ${tabs}`);

      const misActivosTab = p
        .locator(
          '[role="tab"]:has-text("Mis Activos"), button:has-text("Mis Activos"), [role="tab"]:has-text("Activos")'
        )
        .first();
      const hasMisActivos = await misActivosTab.isVisible().catch(() => false);
      r.notes.push(`"Mis Activos" tab visible: ${hasMisActivos}`);

      const mercadoTab = p
        .locator(
          '[role="tab"]:has-text("Mercado"), button:has-text("Mercado"), [role="tab"]:has-text("Análisis")'
        )
        .first();
      const hasMercado = await mercadoTab.isVisible().catch(() => false);
      r.notes.push(`"Mercado" tab visible: ${hasMercado}`);

      // Screenshot tab 1 content
      await snap(p, '13a-valoracion-tab1');

      // Click second tab if exists
      if (hasMercado) {
        await mercadoTab.click();
        await p.waitForTimeout(1500);
        await snap(p, '13b-valoracion-tab2-mercado');

        const addressInput = p
          .locator(
            'input[placeholder*="dirección" i], input[placeholder*="calle" i], input[placeholder*="Gran Vía" i], input[name*="address" i]'
          )
          .first();
        const hasAddress = await addressInput.isVisible().catch(() => false);
        r.notes.push(`Mercado tab - address input visible: ${hasAddress}`);
      }
    });
  });

  test('14 - Reportes financieros', async () => {
    await auditPage(
      page,
      '14-reportes-financieros',
      `${BASE}/reportes/financieros`,
      async (p, r) => {
        const cards = await p.locator('[class*="card" i]:visible').count();
        r.notes.push(`${cards} card elements`);

        const hasChart = await p
          .locator('canvas, svg[class*="chart" i], [class*="recharts" i], [class*="Chart" i]')
          .first()
          .isVisible()
          .catch(() => false);
        r.notes.push(`Chart visible: ${hasChart}`);

        const hasCurrencyValues = await p
          .locator('text=/\\d+.*€/, text=/€.*\\d+/')
          .first()
          .isVisible()
          .catch(() => false);
        r.notes.push(`Currency values visible: ${hasCurrencyValues}`);

        const dateFilters = await p
          .locator(
            'input[type="date"], [class*="datepicker" i], button:has-text("Mes"), button:has-text("Año")'
          )
          .count();
        r.notes.push(`Date filter elements: ${dateFilters}`);
      }
    );
  });

  test('15 - Impuestos', async () => {
    await auditPage(page, '15-impuestos', `${BASE}/impuestos`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      r.notes.push(`Table rows: ${tableRows}`);

      const cards = await p.locator('[class*="card" i]:visible').count();
      r.notes.push(`Card elements: ${cards}`);
    });
  });

  test('16 - Admin módulos', async () => {
    await auditPage(page, '16-admin-modulos', `${BASE}/admin/modulos`, async (p, r) => {
      const tabs = await p.locator('[role="tab"]').count();
      r.notes.push(`Tabs: ${tabs}`);

      const toggles = await p
        .locator('[role="switch"], input[type="checkbox"], [class*="toggle" i]')
        .count();
      r.notes.push(`Toggle/switch elements: ${toggles}`);

      const moduleCards = await p.locator('[class*="card" i]:visible').count();
      r.notes.push(`Module cards: ${moduleCards}`);
    });
  });

  test('17 - Propiedades lista', async () => {
    await auditPage(page, '17-propiedades-list', `${BASE}/propiedades`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      const cards = await p.locator('[class*="card" i]:visible').count();
      r.notes.push(`Table rows: ${tableRows}, Cards: ${cards}`);
    });
  });

  test('18 - Propiedad detalle (map)', async () => {
    await page.goto(`${BASE}/propiedades`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    const firstPropLink = page.locator('a[href*="/propiedades/c"]').first();
    const hasPropLink = await firstPropLink.isVisible().catch(() => false);

    if (hasPropLink) {
      await firstPropLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const ssFile = await snap(page, '18-propiedad-detail');
      const bodyText = await page
        .locator('body')
        .innerText()
        .catch(() => '');
      const content = await page.content();

      const result: PageAuditResult = {
        page: '18-propiedad-detail',
        url: page.url(),
        status: bodyText.trim().length < 30 ? 'warning' : 'ok',
        loadTimeMs: 0,
        screenshotFile: ssFile,
        consoleErrors: [],
        visibleButtons: await page.locator('button:visible').count(),
        visibleInputs: await page.locator('input:visible').count(),
        visibleSelects: 0,
        visibleLinks: await page.locator('a:visible').count(),
        hasBlankBody: bodyText.trim().length < 30,
        hasServerError: content.includes('Internal Server Error'),
        has404: false,
        hasLoadingStuck: false,
        formFields: {},
        notes: [],
      };

      const hasMap = await page
        .locator(
          '[class*="map" i], [class*="mapbox" i], canvas, iframe[src*="map"], [class*="leaflet" i]'
        )
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Map visible: ${hasMap}`);

      const hasImages = await page
        .locator('img[src*="amazonaws"], img[src*="s3"], img[loading="lazy"], [class*="gallery" i]')
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Images/Gallery visible: ${hasImages}`);

      const hasPrice = await page
        .locator('text=/\\d+.*€/, text=/€.*\\d+/')
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Price visible: ${hasPrice}`);

      const editBtn = await page
        .locator('button:has-text("Editar"), a:has-text("Editar")')
        .first()
        .isVisible()
        .catch(() => false);
      result.notes.push(`Edit button: ${editBtn}`);

      auditResults.push(result);
    } else {
      auditResults.push({
        page: '18-propiedad-detail',
        url: `${BASE}/propiedades/*`,
        status: 'warning',
        loadTimeMs: 0,
        screenshotFile: '',
        consoleErrors: [],
        visibleButtons: 0,
        visibleInputs: 0,
        visibleSelects: 0,
        visibleLinks: 0,
        hasBlankBody: false,
        hasServerError: false,
        has404: false,
        hasLoadingStuck: false,
        formFields: {},
        notes: ['No properties found to click into'],
      });
    }
  });

  test('19 - Gastos', async () => {
    await auditPage(page, '19-gastos', `${BASE}/gastos`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      r.notes.push(`Table rows: ${tableRows}`);
    });
  });

  test('20 - Documentos', async () => {
    await auditPage(page, '20-documentos', `${BASE}/documentos`, async (p, r) => {
      const items = await p
        .locator('table tbody tr, [class*="card" i]:visible, [class*="file" i]:visible')
        .count();
      r.notes.push(`Document items: ${items}`);
    });
  });

  test('21 - Calendario', async () => {
    await auditPage(page, '21-calendario', `${BASE}/calendario`, async (p, r) => {
      const hasCalendar = await p
        .locator('[class*="calendar" i], [class*="fc-" i], table')
        .first()
        .isVisible()
        .catch(() => false);
      r.notes.push(`Calendar component visible: ${hasCalendar}`);
    });
  });

  test('22 - Contabilidad', async () => {
    await auditPage(page, '22-contabilidad', `${BASE}/contabilidad`, async (p, r) => {
      const cards = await p.locator('[class*="card" i]:visible').count();
      r.notes.push(`Card elements: ${cards}`);
    });
  });

  test('23 - Conciliación bancaria', async () => {
    await auditPage(page, '23-conciliacion', `${BASE}/finanzas/conciliacion`, async (p, r) => {
      const tableRows = await p.locator('table tbody tr').count();
      r.notes.push(`Table rows: ${tableRows}`);
    });
  });

  test('24 - Comercial', async () => {
    await auditPage(page, '24-comercial', `${BASE}/comercial`, async (p, r) => {
      const cards = await p.locator('[class*="card" i]:visible').count();
      r.notes.push(`Card elements: ${cards}`);
    });
  });
});
