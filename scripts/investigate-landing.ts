#!/usr/bin/env tsx
/**
 * Investigación profunda de landing con Playwright
 * Según .cursorrules: Playwright para E2E y debugging
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'landing-investigation');

interface InvestigationResult {
  url: string;
  timestamp: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  htmlPreview: string;
  title: string;
  metaDescription: string;
  bodyText: string;
  screenshot: string;
  redirects: Array<{
    from: string;
    to: string;
    status: number;
  }>;
  networkRequests: Array<{
    url: string;
    method: string;
    status: number;
    cached: boolean;
  }>;
  consoleErrors: string[];
  pageErrors: string[];
}

async function investigateLanding(url: string): Promise<InvestigationResult> {
  console.log(`\n🔍 Investigando: ${url}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // Colectores de datos
  const redirects: Array<{ from: string; to: string; status: number }> = [];
  const networkRequests: Array<{ url: string; method: string; status: number; cached: boolean }> = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  
  // Interceptar redirects
  page.on('response', async (response) => {
    const status = response.status();
    if (status >= 300 && status < 400) {
      const location = response.headers()['location'];
      if (location) {
        redirects.push({
          from: response.url(),
          to: location,
          status,
        });
      }
    }
    
    // Registrar requests
    networkRequests.push({
      url: response.url(),
      method: response.request().method(),
      status: response.status(),
      cached: response.fromCache(),
    });
  });
  
  // Capturar errores de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Capturar errores de página
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  
  // Navegar
  const response = await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  
  // Esperar a que cargue
  await page.waitForTimeout(3000);
  
  // Extraer información
  const finalUrl = page.url();
  const statusCode = response?.status() || 0;
  const headers = response?.headers() || {};
  
  const title = await page.title();
  const metaDescription = await page.locator('meta[name="description"]').getAttribute('content') || '';
  
  // HTML Preview (primeros 2000 caracteres)
  const html = await page.content();
  const htmlPreview = html.substring(0, 2000);
  
  // Texto visible
  const bodyText = await page.locator('body').innerText().catch(() => '');
  
  // Screenshot
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  const screenshotPath = path.join(RESULTS_DIR, `screenshot-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  await browser.close();
  
  return {
    url,
    timestamp: new Date().toISOString(),
    finalUrl,
    statusCode,
    headers,
    htmlPreview,
    title,
    metaDescription,
    bodyText: bodyText.substring(0, 1000),
    screenshot: screenshotPath,
    redirects,
    networkRequests: networkRequests.slice(0, 20), // Primeros 20
    consoleErrors,
    pageErrors,
  };
}

async function compareWithExpected(result: InvestigationResult) {
  console.log('\n📊 ANÁLISIS DE RESULTADOS\n');
  
  // Verificar título
  const expectedTitleKeywords = ['inmova', 'gestión', 'inmobiliaria', 'proptech'];
  const titleLower = result.title.toLowerCase();
  const titleMatch = expectedTitleKeywords.some(kw => titleLower.includes(kw));
  
  console.log('✅ Título:', result.title);
  console.log(`   Match esperado: ${titleMatch ? '✅' : '❌'}`);
  
  // Verificar URL final
  console.log('\n✅ URL Final:', result.finalUrl);
  if (result.redirects.length > 0) {
    console.log('   Redirects detectados:');
    result.redirects.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.status}: ${r.from} → ${r.to}`);
    });
  }
  
  // Verificar headers importantes
  console.log('\n📋 Headers Clave:');
  const importantHeaders = ['x-nextjs-cache', 'cf-cache-status', 'cache-control', 'age'];
  importantHeaders.forEach(header => {
    if (result.headers[header]) {
      console.log(`   ${header}: ${result.headers[header]}`);
    }
  });
  
  // Verificar si es landing antigua
  const oldLandingIndicators = [
    'landing antigua',
    'versión anterior',
    'old version',
    // Añadir más indicadores si conoces el contenido antiguo
  ];
  
  const bodyLower = result.bodyText.toLowerCase();
  const htmlLower = result.htmlPreview.toLowerCase();
  
  const isOldLanding = oldLandingIndicators.some(
    indicator => bodyLower.includes(indicator) || htmlLower.includes(indicator)
  );
  
  console.log('\n🔍 Detección de Landing Antigua:');
  console.log(`   Indicadores encontrados: ${isOldLanding ? '⚠️ SÍ' : '✅ NO'}`);
  
  // Verificar errores
  if (result.consoleErrors.length > 0) {
    console.log('\n❌ Errores de Consola:');
    result.consoleErrors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }
  
  if (result.pageErrors.length > 0) {
    console.log('\n❌ Errores de Página:');
    result.pageErrors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }
  
  // Verificar cache
  const cachedRequests = result.networkRequests.filter(r => r.cached);
  if (cachedRequests.length > 0) {
    console.log(`\n💾 Requests Cacheados: ${cachedRequests.length}/${result.networkRequests.length}`);
    console.log('   Primeros 5 cacheados:');
    cachedRequests.slice(0, 5).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.url}`);
    });
  }
  
  // Preview de contenido
  console.log('\n📄 Preview de Contenido (primeros 500 caracteres):');
  console.log('─────────────────────────────────────────────────────');
  console.log(result.bodyText.substring(0, 500));
  console.log('─────────────────────────────────────────────────────');
  
  return {
    titleMatch,
    isOldLanding,
    hasCacheIssues: result.headers['cf-cache-status'] === 'HIT' || result.headers['x-nextjs-cache'] === 'HIT',
    hasErrors: result.consoleErrors.length > 0 || result.pageErrors.length > 0,
  };
}

async function main() {
  console.log('🚀 INVESTIGACIÓN DE LANDING - INMOVA APP\n');
  console.log('Basado en .cursorrules: Debugging con Playwright\n');
  
  const urls = [
    'https://inmova.app',
    'https://www.inmova.app',
    'http://inmova.app',
  ];
  
  const results: InvestigationResult[] = [];
  
  for (const url of urls) {
    try {
      const result = await investigateLanding(url);
      results.push(result);
      
      const analysis = await compareWithExpected(result);
      
      console.log('\n🎯 DIAGNÓSTICO:');
      if (analysis.isOldLanding) {
        console.log('   ⚠️  Landing ANTIGUA detectada');
      }
      if (analysis.hasCacheIssues) {
        console.log('   ⚠️  Problemas de CACHE detectados');
      }
      if (analysis.hasErrors) {
        console.log('   ❌ ERRORES detectados en página');
      }
      if (!analysis.titleMatch) {
        console.log('   ⚠️  Título NO coincide con esperado');
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    } catch (error: any) {
      console.error(`❌ Error investigando ${url}:`, error.message);
    }
  }
  
  // Guardar resultados
  const reportPath = path.join(RESULTS_DIR, `investigation-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✅ Investigación completa`);
  console.log(`📁 Resultados guardados en: ${RESULTS_DIR}`);
  console.log(`📊 Reporte JSON: ${reportPath}`);
  
  // Resumen final
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESUMEN FINAL');
  console.log('='.repeat(80));
  
  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.url}`);
    console.log(`   Final URL: ${result.finalUrl}`);
    console.log(`   Status: ${result.statusCode}`);
    console.log(`   Título: ${result.title}`);
    console.log(`   Screenshot: ${result.screenshot}`);
    
    if (result.headers['cf-cache-status']) {
      console.log(`   ⚠️  Cloudflare Cache: ${result.headers['cf-cache-status']}`);
    }
    if (result.headers['x-nextjs-cache']) {
      console.log(`   ⚠️  Next.js Cache: ${result.headers['x-nextjs-cache']}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
