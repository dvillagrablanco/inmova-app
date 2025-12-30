#!/usr/bin/env tsx
/**
 * 🚀 AUDITORÍA VISUAL RÁPIDA - PÁGINAS CRÍTICAS
 * 
 * Audita solo las páginas más importantes para detectar errores rápidamente
 */

import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const OUTPUT_DIR = path.join(process.cwd(), 'quick-audit-results');
const LOGS_FILE = path.join(OUTPUT_DIR, 'errors.txt');

// Páginas críticas a auditar
const CRITICAL_ROUTES = [
  '/',
  '/landing',
  '/login',
  '/dashboard',
  '/edificios',
  '/unidades',
  '/inquilinos',
  '/contratos',
  '/pagos',
  '/mantenimiento',
  '/calendario',
  '/chat',
  '/documentos',
  '/configuracion',
  '/admin/dashboard',
  '/analytics',
  '/api-docs',
];

interface ErrorLog {
  page: string;
  type: 'console' | 'network' | 'javascript';
  message: string;
  timestamp: string;
}

const errors: ErrorLog[] = [];

function logError(page: string, type: ErrorLog['type'], message: string) {
  errors.push({
    page,
    type,
    message,
    timestamp: new Date().toISOString(),
  });
  console.log(`   ⚠️  [${type}] ${message}`);
}

async function auditPage(page: Page, route: string): Promise<void> {
  console.log(`\n🔍 Auditando: ${route}`);
  
  try {
    // Listeners para errores
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logError(route, 'console', msg.text());
      }
    });

    page.on('pageerror', (err) => {
      logError(route, 'javascript', err.message);
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        logError(route, 'network', `${response.status()} ${response.url()}`);
      }
    });

    // Navegar
    await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Screenshot
    const screenshotPath = path.join(OUTPUT_DIR, `${route.replace(/\//g, '_')}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    console.log(`   ✓ Screenshot guardado`);

  } catch (error: any) {
    logError(route, 'javascript', `Error loading page: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 INICIANDO AUDITORÍA VISUAL RÁPIDA\n');
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log(`📋 Páginas críticas: ${CRITICAL_ROUTES.length}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  // Crear directorio
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Iniciar browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Login (si es necesario)
  console.log('🔐 Intentando login...');
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|admin|portal/, { timeout: 10000 });
    console.log('   ✓ Login exitoso\n');
  } catch (error) {
    console.log('   ⚠️  Login falló o no necesario\n');
  }

  // Auditar cada página
  for (const route of CRITICAL_ROUTES) {
    await auditPage(page, route);
  }

  await browser.close();

  // Guardar errores
  const errorReport = errors.map(e => 
    `[${e.timestamp}] ${e.page} | ${e.type.toUpperCase()} | ${e.message}`
  ).join('\n');
  
  fs.writeFileSync(LOGS_FILE, errorReport);

  // Resumen
  console.log('\n\n════════════════════════════════════════');
  console.log('📊 RESUMEN DE AUDITORÍA');
  console.log('════════════════════════════════════════');
  console.log(`✓ Páginas auditadas: ${CRITICAL_ROUTES.length}`);
  console.log(`⚠️  Errores encontrados: ${errors.length}`);
  console.log(`📁 Screenshots: ${OUTPUT_DIR}`);
  console.log(`📝 Log de errores: ${LOGS_FILE}`);
  
  if (errors.length > 0) {
    console.log('\n🔴 ERRORES POR TIPO:');
    const byType = errors.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log('\n🔴 TOP 10 ERRORES:');
    errors.slice(0, 10).forEach(e => {
      console.log(`   ${e.page} | ${e.type} | ${e.message.substring(0, 80)}`);
    });
  }
  
  console.log('\n════════════════════════════════════════\n');
}

main().catch(console.error);
