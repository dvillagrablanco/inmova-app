import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script Playwright para diagnóstico profundo de Landing
 * Detecta errores JavaScript, problemas de renderizado, pantalla en blanco
 */

async function testLanding() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  console.log('🔍 ANÁLISIS PROFUNDO DE LANDING CON PLAYWRIGHT');
  console.log('='.repeat(60));
  
  // Arrays para capturar errores
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  
  // Capturar errores de console
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });
  
  // Capturar errores de página
  page.on('pageerror', (error) => {
    pageErrors.push(`[PAGE ERROR] ${error.message}`);
  });
  
  // Capturar requests fallidos
  page.on('requestfailed', (request) => {
    failedRequests.push(`[FAILED REQUEST] ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('\n1. Navegando a landing...');
    const response = await page.goto('http://localhost:3000/landing', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`   Status: ${response?.status()}`);
    
    // Esperar un poco para que JavaScript se ejecute
    await page.waitForTimeout(5000);
    
    // Screenshot inicial
    console.log('\n2. Capturando screenshot inicial...');
    await page.screenshot({ path: '/tmp/landing-initial.png', fullPage: true });
    console.log('   ✅ Screenshot guardado: /tmp/landing-initial.png');
    
    // Verificar si hay contenido visible
    console.log('\n3. Verificando contenido visible...');
    
    const checks = [
      { name: 'Logo INMOVA', selector: 'text=INMOVA' },
      { name: 'Título "6 Verticales"', selector: 'text=6 Verticales' },
      { name: 'Botón "Empezar Gratis"', selector: 'text=Empezar Gratis' },
      { name: 'Plan "Starter"', selector: 'text=Starter' },
      { name: 'Plan "Professional"', selector: 'text=Professional' },
      { name: 'Plan "Enterprise"', selector: 'text=Enterprise' },
    ];
    
    let visibleCount = 0;
    for (const check of checks) {
      try {
        const element = await page.locator(check.selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 });
        if (isVisible) {
          console.log(`   ✅ ${check.name}: Visible`);
          visibleCount++;
        } else {
          console.log(`   ❌ ${check.name}: NO visible`);
        }
      } catch (e) {
        console.log(`   ❌ ${check.name}: NO encontrado`);
      }
    }
    
    // Verificar si la página está en blanco
    console.log('\n4. Verificando si página está en blanco...');
    const bodyText = await page.locator('body').textContent();
    const bodyLength = bodyText?.length || 0;
    console.log(`   Texto en body: ${bodyLength} caracteres`);
    
    if (bodyLength < 100) {
      console.log('   ❌ PÁGINA ESTÁ EN BLANCO (< 100 caracteres)');
    } else {
      console.log(`   ✅ Página tiene contenido`);
    }
    
    // Verificar elementos React
    console.log('\n5. Verificando estructura React...');
    const reactRoot = await page.locator('#__next').count();
    console.log(`   React root (#__next): ${reactRoot > 0 ? '✅' : '❌'}`);
    
    // Contar divs
    const divCount = await page.locator('div').count();
    console.log(`   Total de <div>: ${divCount}`);
    
    // Contar botones
    const buttonCount = await page.locator('button').count();
    console.log(`   Total de <button>: ${buttonCount}`);
    
    // Test responsive móvil
    console.log('\n6. Test en vista móvil...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    // Screenshot móvil
    await page.screenshot({ path: '/tmp/landing-mobile.png', fullPage: true });
    console.log('   ✅ Screenshot móvil: /tmp/landing-mobile.png');
    
    // Verificar menú hamburguesa
    try {
      const menuButton = await page.locator('button[aria-label*="menú"], button:has-text("☰"), svg.lucide-menu').first();
      const menuVisible = await menuButton.isVisible({ timeout: 2000 });
      console.log(`   Menú hamburguesa: ${menuVisible ? '✅ Visible' : '❌ NO visible'}`);
    } catch (e) {
      console.log('   ❌ Menú hamburguesa: NO encontrado');
    }
    
    // Reportar errores capturados
    console.log('\n7. Errores capturados durante navegación:');
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Page errors: ${pageErrors.length}`);
    console.log(`   Failed requests: ${failedRequests.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n   📛 CONSOLE ERRORS:');
      consoleErrors.slice(0, 5).forEach(err => console.log(`      ${err}`));
    }
    
    if (pageErrors.length > 0) {
      console.log('\n   📛 PAGE ERRORS:');
      pageErrors.slice(0, 5).forEach(err => console.log(`      ${err}`));
    }
    
    if (failedRequests.length > 0) {
      console.log('\n   📛 FAILED REQUESTS:');
      failedRequests.slice(0, 5).forEach(err => console.log(`      ${err}`));
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN:');
    console.log('='.repeat(60));
    console.log(`Contenido visible: ${visibleCount}/${checks.length}`);
    console.log(`Caracteres en body: ${bodyLength}`);
    console.log(`Elementos React: ${divCount} divs, ${buttonCount} botones`);
    console.log(`Errores totales: ${consoleErrors.length + pageErrors.length + failedRequests.length}`);
    
    if (visibleCount < checks.length / 2 || bodyLength < 100) {
      console.log('\n❌ PROBLEMA DETECTADO: LANDING EN BLANCO O INCOMPLETA');
      console.log('\nPosibles causas:');
      if (pageErrors.length > 0) console.log('  - Errores JavaScript rompen renderizado');
      if (failedRequests.length > 0) console.log('  - Recursos no cargan correctamente');
      if (bodyLength < 100) console.log('  - Página completamente en blanco');
      if (visibleCount === 0) console.log('  - Componentes no se renderizan');
    } else {
      console.log('\n✅ LANDING FUNCIONA CORRECTAMENTE');
    }
    
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    
    // Screenshot en caso de error
    try {
      await page.screenshot({ path: '/tmp/landing-error.png', fullPage: true });
      console.log('Screenshot de error guardado: /tmp/landing-error.png');
    } catch {}
  } finally {
    await browser.close();
  }
}

// Ejecutar
testLanding().catch(console.error);
