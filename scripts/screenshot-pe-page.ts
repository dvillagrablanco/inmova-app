/**
 * Script to login, navigate to PE page, wait for data, take screenshot and report.
 * Run: npx playwright test scripts/screenshot-pe-page.ts --config=playwright.prod.config.ts
 * Or: npx tsx scripts/screenshot-pe-page.ts (standalone)
 */
import { chromium } from 'playwright';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const LOGIN_EMAIL = 'admin@inmova.app';
const LOGIN_PASSWORD = 'Admin123!';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'es-ES',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    console.log('1. Navigating to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#email', { timeout: 10000 });

    console.log('2. Filling login form...');
    await page.fill('#email', LOGIN_EMAIL);
    await page.fill('#password', LOGIN_PASSWORD);

    console.log('3. Submitting login...');
    await page.click('button[type="submit"]');

    // Wait for redirect or error - give time for NextAuth
    await page.waitForTimeout(5000);
    const urlAfterLogin = page.url();
    console.log('4. URL after login:', urlAfterLogin);

    if (urlAfterLogin.includes('/login')) {
      const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);
      console.log('   Login may have failed. Error:', errorMsg);
      await page.screenshot({ path: path.join(process.cwd(), 'login-failed.png') });
    }

    // If still on login, try navigating to PE - might need to be logged in first
    if (urlAfterLogin.includes('/login')) {
      console.log('   Attempting direct navigation to PE page...');
      await page.goto(`${BASE_URL}/family-office/pe`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      const peUrl = page.url();
      console.log('   PE page URL:', peUrl);
      if (peUrl.includes('/login')) {
        console.log('   Redirected to login - not authenticated. Cannot proceed.');
        await browser.close();
        process.exit(1);
      }
    }

    console.log('5. Navigating to /family-office/pe...');
    await page.goto(`${BASE_URL}/family-office/pe`, { waitUntil: 'networkidle', timeout: 15000 });

    console.log('6. Waiting 5 seconds for data to load...');
    await page.waitForTimeout(5000);

    // Extract KPI values - first grid has 8 cards: Fondos, Comprometido, Llamado, etc.
    const kpiGrid = page.locator('div.grid').filter({ has: page.locator('text=Fondos') }).first();
    const kpiLabels = await kpiGrid.locator('[class*="text-[10px]"]').allTextContents().catch(() => []);
    const kpiCards = await kpiGrid.locator('.text-lg').allTextContents().catch(() => []);

    // Table: check for "Activos en Crecimiento" and fund names
    const tableTitle = await page.locator('text=Activos en Crecimiento').first().textContent().catch(() => null);
    const emptyMessage = await page.locator('text=Sin participaciones PE registradas').isVisible().catch(() => false);
    const tableRows = await page.locator('table tbody tr').all();
    const fundNames: string[] = [];
    for (const row of tableRows) {
      const firstCell = await row.locator('td').first().textContent().catch(() => '');
      if (firstCell && firstCell.trim() !== 'TOTAL') fundNames.push(firstCell.trim());
    }

    // Take screenshot
    const screenshotPath = path.join(process.cwd(), 'pe-page-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('7. Screenshot saved to:', screenshotPath);

    // Report
    console.log('\n========== REPORT ==========');
    console.log('KPI Cards:');
    for (let i = 0; i < Math.min(kpiLabels.length, kpiCards.length); i++) {
      console.log(`  ${kpiLabels[i]?.trim()}: ${kpiCards[i]?.trim()}`);
    }
    console.log('\nTable "Activos en Crecimiento":');
    console.log('  Title:', tableTitle);
    console.log('  Empty message visible:', emptyMessage);
    console.log('  Fund rows (excluding TOTAL):', fundNames.length);
    console.log('  Fund names:', fundNames);

    const allZero =
      (kpiCards[0]?.trim() === '0' || !kpiCards[0]) &&
      (kpiCards[1]?.trim() === '0' || kpiCards[1]?.includes('0') || !kpiCards[1]) &&
      fundNames.length === 0;

    console.log('\n========== SUMMARY ==========');
    if (allZero || emptyMessage) {
      console.log('RESULT: Everything shows 0 or empty. No PE data loaded.');
    } else {
      console.log('RESULT: Data is populated. KPIs and table have values.');
    }
  } catch (err) {
    console.error('Error:', err);
    await page.screenshot({ path: path.join(process.cwd(), 'pe-page-error.png'), fullPage: true });
    throw err;
  } finally {
    await browser.close();
  }
}

main();
