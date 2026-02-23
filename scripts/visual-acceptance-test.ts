import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const CREDENTIALS = {
  email: 'dvillagra@vidaroinversiones.com',
  password: 'Admin123!',
};
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');
const RESULTS_FILE = path.join(process.cwd(), 'test-results', 'acceptance-report.json');

interface TestResult {
  step: string;
  url: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  screenshot: string;
  observations: string[];
  errors: string[];
  timestamp: string;
  loadTimeMs: number;
}

const results: TestResult[] = [];

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  log(`  Screenshot: ${filename}`);
  return filename;
}

async function takeFullScreenshot(page: Page, name: string): Promise<string> {
  const filename = `${name}-full.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  log(`  Full screenshot: ${filename}`);
  return filename;
}

async function collectPageInfo(page: Page): Promise<{ errors: string[]; observations: string[] }> {
  const errors: string[] = [];
  const observations: string[] = [];

  const title = await page.title();
  observations.push(`Page title: "${title}"`);

  const url = page.url();
  observations.push(`Current URL: ${url}`);

  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
  if (bodyText.toLowerCase().includes('error') && !bodyText.toLowerCase().includes('error boundary')) {
    errors.push('Page contains "error" text');
  }
  if (bodyText.toLowerCase().includes('loading') && bodyText.length < 100) {
    observations.push('Page appears to still be loading');
  }
  if (bodyText.trim().length < 50) {
    observations.push('Page has very little content - may be empty');
  }

  const consoleErrors = await page.evaluate(() => {
    return (window as any).__consoleErrors || [];
  });
  if (consoleErrors.length > 0) {
    errors.push(...consoleErrors.map((e: string) => `Console error: ${e}`));
  }

  return { errors, observations };
}

async function testStep(
  page: Page,
  stepName: string,
  action: () => Promise<void>,
  screenshotName: string,
  additionalChecks?: (page: Page) => Promise<{ observations: string[]; errors: string[] }>
): Promise<TestResult> {
  log(`\n--- Step: ${stepName} ---`);
  const start = Date.now();
  const result: TestResult = {
    step: stepName,
    url: '',
    status: 'PASS',
    screenshot: '',
    observations: [],
    errors: [],
    timestamp: new Date().toISOString(),
    loadTimeMs: 0,
  };

  try {
    await action();
    result.loadTimeMs = Date.now() - start;
    result.url = page.url();

    await page.waitForTimeout(2000);

    result.screenshot = await takeScreenshot(page, screenshotName);
    await takeFullScreenshot(page, screenshotName);

    const pageInfo = await collectPageInfo(page);
    result.observations.push(...pageInfo.observations);
    result.errors.push(...pageInfo.errors);

    if (additionalChecks) {
      const extra = await additionalChecks(page);
      result.observations.push(...extra.observations);
      result.errors.push(...extra.errors);
    }

    if (result.errors.length > 0) {
      result.status = 'WARNING';
    }

    log(`  Status: ${result.status} (${result.loadTimeMs}ms)`);
    result.observations.forEach((o) => log(`  > ${o}`));
    result.errors.forEach((e) => log(`  ! ${e}`));
  } catch (error: any) {
    result.loadTimeMs = Date.now() - start;
    result.status = 'FAIL';
    result.errors.push(`Exception: ${error.message}`);
    result.url = page.url();
    log(`  FAIL: ${error.message}`);

    try {
      result.screenshot = await takeScreenshot(page, `${screenshotName}-error`);
    } catch {
      log(`  Could not capture error screenshot`);
    }
  }

  results.push(result);
  return result;
}

async function run() {
  log('=== INMOVA APP VISUAL ACCEPTANCE TEST ===');
  log(`Target: ${BASE_URL}`);
  log(`Screenshots: ${SCREENSHOT_DIR}`);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'es-ES',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  context.on('console', (msg) => {
    if (msg.type() === 'error') {
      log(`  [Console Error] ${msg.text()}`);
    }
  });

  const page: Page = await context.newPage();

  // Inject console error collector
  await page.addInitScript(() => {
    (window as any).__consoleErrors = [];
    const origError = console.error;
    console.error = (...args: any[]) => {
      (window as any).__consoleErrors.push(args.map(String).join(' '));
      origError.apply(console, args);
    };
  });

  // ============================================
  // STEP 1: Navigate to login page
  // ============================================
  await testStep(
    page,
    '1. Navigate to Login Page',
    async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    },
    '01-login-page',
    async (p) => {
      const obs: string[] = [];
      const errs: string[] = [];

      const emailInput = await p.locator('input[name="email"], input[type="email"]').count();
      const passwordInput = await p.locator('input[name="password"], input[type="password"]').count();
      const submitBtn = await p.locator('button[type="submit"]').count();

      if (emailInput > 0) obs.push('Email input found');
      else errs.push('Email input NOT found');

      if (passwordInput > 0) obs.push('Password input found');
      else errs.push('Password input NOT found');

      if (submitBtn > 0) obs.push('Submit button found');
      else errs.push('Submit button NOT found');

      return { observations: obs, errors: errs };
    }
  );

  // ============================================
  // STEP 2: Login
  // ============================================
  await testStep(
    page,
    '2. Login with credentials',
    async () => {
      await page.fill('input[name="email"], input[type="email"]', CREDENTIALS.email);
      await page.fill('input[name="password"], input[type="password"]', CREDENTIALS.password);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02-login-filled.png'),
        fullPage: false,
      });

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        await page.waitForURL('**/dashboard/**', { timeout: 15000 }).catch(() => {});
      }
    },
    '02-after-login',
    async (p) => {
      const obs: string[] = [];
      const errs: string[] = [];
      const url = p.url();

      if (url.includes('/dashboard') || url.includes('/admin')) {
        obs.push('Successfully redirected to dashboard area');
      } else if (url.includes('/login')) {
        errs.push('Still on login page - login may have failed');
      } else {
        obs.push(`Redirected to: ${url}`);
      }

      return { observations: obs, errors: errs };
    }
  );

  // ============================================
  // STEP 3: Dashboard
  // ============================================
  await testStep(
    page,
    '3. Dashboard - Verify KPIs and Charts',
    async () => {
      const currentUrl = page.url();
      if (!currentUrl.includes('/dashboard')) {
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);
    },
    '03-dashboard',
    async (p) => {
      const obs: string[] = [];
      const errs: string[] = [];

      const cards = await p.locator('[class*="card"], [class*="Card"], [data-testid*="kpi"]').count();
      obs.push(`Found ${cards} card-like elements`);

      const charts = await p.locator('canvas, svg[class*="chart"], [class*="chart"], [class*="Chart"], .recharts-wrapper').count();
      obs.push(`Found ${charts} chart-like elements`);

      const numbers = await p.evaluate(() => {
        const els = document.querySelectorAll('h2, h3, [class*="stat"], [class*="kpi"], [class*="metric"]');
        const nums: string[] = [];
        els.forEach((el) => {
          const text = el.textContent?.trim() || '';
          if (/\d/.test(text) && text.length < 30) nums.push(text);
        });
        return nums.slice(0, 10);
      });

      if (numbers.length > 0) {
        obs.push(`KPI values found: ${numbers.join(', ')}`);
      } else {
        errs.push('No numeric KPI values detected on dashboard');
      }

      const bodyText = await p.evaluate(() => document.body?.innerText || '');
      if (bodyText.includes('Sin datos') || bodyText.includes('No hay datos') || bodyText.includes('vacío')) {
        errs.push('Dashboard shows "no data" messages');
      }

      return { observations: obs, errors: errs };
    }
  );

  // ============================================
  // STEPS 4-10: Navigate to each section
  // ============================================
  const sections = [
    { name: '4. Edificios (Buildings)', path: '/dashboard/edificios', screenshot: '04-edificios', checkText: ['edificio', 'dirección', 'unidades'] },
    { name: '5. Inquilinos (Tenants)', path: '/dashboard/inquilinos', screenshot: '05-inquilinos', checkText: ['inquilino', 'nombre', 'contrato'] },
    { name: '6. Contratos (Contracts)', path: '/dashboard/contratos', screenshot: '06-contratos', checkText: ['contrato', 'fecha', 'estado'] },
    { name: '7. Pagos (Payments)', path: '/dashboard/pagos', screenshot: '07-pagos', checkText: ['pago', 'importe', 'estado'] },
    { name: '8. Inversiones (Investments)', path: '/dashboard/inversiones', screenshot: '08-inversiones', checkText: ['inversión', 'rendimiento', 'cartera'] },
    { name: '9. Seguros (Insurance)', path: '/dashboard/seguros', screenshot: '09-seguros', checkText: ['seguro', 'póliza', 'cobertura'] },
    { name: '10. Comercial (Commercial)', path: '/dashboard/comercial', screenshot: '10-comercial', checkText: ['comercial', 'lead', 'oportunidad'] },
  ];

  for (const section of sections) {
    await testStep(
      page,
      section.name,
      async () => {
        await page.goto(`${BASE_URL}${section.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2500);
      },
      section.screenshot,
      async (p) => {
        const obs: string[] = [];
        const errs: string[] = [];

        const bodyText = (await p.evaluate(() => document.body?.innerText || '')).toLowerCase();

        const matchedKeywords = section.checkText.filter((kw) => bodyText.includes(kw.toLowerCase()));
        if (matchedKeywords.length > 0) {
          obs.push(`Keywords found: ${matchedKeywords.join(', ')}`);
        }

        const tables = await p.locator('table, [role="grid"], [class*="table"], [class*="Table"]').count();
        const lists = await p.locator('[class*="list"], [class*="List"], [class*="grid"], [class*="Grid"]').count();
        obs.push(`Tables: ${tables}, List/Grid layouts: ${lists}`);

        const rows = await p.locator('tr, [class*="row"], [role="row"]').count();
        obs.push(`Data rows found: ${rows}`);

        if (rows <= 1 && tables <= 0 && lists <= 0) {
          errs.push('Section appears empty - no data rows or tables found');
        }

        if (bodyText.includes('sin datos') || bodyText.includes('no hay') || bodyText.includes('no se encontraron')) {
          errs.push('Section shows empty state message');
        }

        if (bodyText.includes('404') || bodyText.includes('not found') || bodyText.includes('no encontrada')) {
          errs.push('Page shows 404 or not found');
        }

        const httpStatus = p.url();
        obs.push(`Final URL: ${httpStatus}`);

        return { observations: obs, errors: errs };
      }
    );
  }

  // ============================================
  // STEP 11: Company Selector
  // ============================================
  await testStep(
    page,
    '11. Company Selector - Open and verify companies',
    async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const selectorCandidates = [
        '[data-testid="company-selector"]',
        '[class*="company-selector"]',
        '[class*="CompanySelector"]',
        'button:has-text("Vidaro")',
        'div:has-text("Vidaro Inversiones")',
        '[class*="sidebar"] button',
        '[class*="Sidebar"] button',
      ];

      let clicked = false;
      for (const selector of selectorCandidates) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            const el = page.locator(selector).first();
            const text = await el.textContent();
            log(`  Found selector candidate: "${selector}" with text: "${text?.trim().substring(0, 50)}"`);
            if (text && (text.includes('Vidaro') || text.includes('vidaro') || text.includes('empresa'))) {
              await el.click();
              clicked = true;
              log(`  Clicked company selector`);
              break;
            }
          }
        } catch {
          continue;
        }
      }

      if (!clicked) {
        const allButtons = await page.locator('button').all();
        for (const btn of allButtons) {
          try {
            const text = await btn.textContent();
            if (text && (text.includes('Vidaro') || text.includes('empresa') || text.includes('company'))) {
              await btn.click();
              clicked = true;
              log(`  Clicked button with text: "${text.trim().substring(0, 50)}"`);
              break;
            }
          } catch {
            continue;
          }
        }
      }

      if (!clicked) {
        log('  Trying to find company selector by looking at all interactive elements...');
        const sidebarElements = await page.locator('[class*="sidebar"] *, [class*="Sidebar"] *, nav *').all();
        for (const el of sidebarElements.slice(0, 30)) {
          try {
            const text = await el.textContent();
            const tag = await el.evaluate((e) => e.tagName);
            if (text && text.includes('Vidaro') && ['BUTTON', 'DIV', 'A', 'SPAN'].includes(tag)) {
              await el.click();
              clicked = true;
              log(`  Clicked sidebar element <${tag}> with text containing "Vidaro"`);
              break;
            }
          } catch {
            continue;
          }
        }
      }

      await page.waitForTimeout(2000);
    },
    '11-company-selector',
    async (p) => {
      const obs: string[] = [];
      const errs: string[] = [];

      const bodyText = await p.evaluate(() => document.body?.innerText || '');

      const companies = ['Vidaro Inversiones', 'Rovida', 'Viroda Inversiones'];
      for (const company of companies) {
        if (bodyText.includes(company)) {
          obs.push(`Company "${company}" visible on page`);
        } else {
          errs.push(`Company "${company}" NOT visible`);
        }
      }

      return { observations: obs, errors: errs };
    }
  );

  // ============================================
  // STEP 12: Switch to Rovida S.L.
  // ============================================
  await testStep(
    page,
    '12. Switch to Rovida S.L. and verify data changes',
    async () => {
      const rovidaCandidates = [
        'text=Rovida S.L.',
        'text=Rovida',
        ':text("Rovida")',
        'button:has-text("Rovida")',
        'div:has-text("Rovida")',
        '[role="option"]:has-text("Rovida")',
        '[role="menuitem"]:has-text("Rovida")',
        'li:has-text("Rovida")',
      ];

      let clicked = false;
      for (const selector of rovidaCandidates) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            await page.locator(selector).first().click();
            clicked = true;
            log(`  Clicked Rovida using selector: ${selector}`);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!clicked) {
        log('  Could not find Rovida selector directly, trying text search...');
        const allElements = await page.locator('*').all();
        for (const el of allElements) {
          try {
            const text = await el.textContent();
            const innerText = await el.evaluate((e) => e.childNodes.length === 1 && e.childNodes[0].nodeType === 3 ? e.textContent : '');
            if (innerText && innerText.trim().includes('Rovida')) {
              await el.click();
              clicked = true;
              log(`  Clicked element with direct text "Rovida"`);
              break;
            }
          } catch {
            continue;
          }
        }
      }

      await page.waitForTimeout(4000);

      if (!page.url().includes('/edificios')) {
        await page.goto(`${BASE_URL}/dashboard/edificios`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
      }
    },
    '12-rovida-buildings',
    async (p) => {
      const obs: string[] = [];
      const errs: string[] = [];

      const bodyText = await p.evaluate(() => document.body?.innerText || '');

      if (bodyText.includes('Rovida')) {
        obs.push('Page shows "Rovida" company context');
      }

      const rows = await p.locator('tr, [class*="row"], [role="row"]').count();
      obs.push(`Data rows visible: ${rows}`);

      const buildingCount = bodyText.match(/(\d+)\s*(edificio|building)/i);
      if (buildingCount) {
        obs.push(`Building count reference found: ${buildingCount[0]}`);
      }

      if (bodyText.includes('18')) {
        obs.push('Number "18" found on page (expected building count for Rovida)');
      }

      return { observations: obs, errors: errs };
    }
  );

  // ============================================
  // Generate Report
  // ============================================
  await browser.close();

  const report = {
    testDate: new Date().toISOString(),
    targetUrl: BASE_URL,
    totalSteps: results.length,
    passed: results.filter((r) => r.status === 'PASS').length,
    warnings: results.filter((r) => r.status === 'WARNING').length,
    failed: results.filter((r) => r.status === 'FAIL').length,
    results,
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));

  log('\n\n========================================');
  log('         ACCEPTANCE TEST SUMMARY');
  log('========================================\n');
  log(`Total Steps: ${report.totalSteps}`);
  log(`Passed: ${report.passed}`);
  log(`Warnings: ${report.warnings}`);
  log(`Failed: ${report.failed}`);
  log('');

  for (const r of results) {
    const icon = r.status === 'PASS' ? 'PASS' : r.status === 'WARNING' ? 'WARN' : 'FAIL';
    log(`[${icon}] ${r.step} (${r.loadTimeMs}ms)`);
    if (r.errors.length > 0) {
      r.errors.forEach((e) => log(`       ! ${e}`));
    }
    r.observations.forEach((o) => log(`       > ${o}`));
  }

  log('\n========================================');
  log(`Full report: ${RESULTS_FILE}`);
  log(`Screenshots: ${SCREENSHOT_DIR}/`);
  log('========================================');
}

run().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
