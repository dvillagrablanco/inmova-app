#!/usr/bin/env npx tsx
/**
 * 🚀 Pre-Deployment Check Script
 *
 * EJECUTAR ANTES DE CADA DEPLOYMENT.
 * Verifica que todo está listo para producción.
 *
 * Uso: npx tsx scripts/pre-deployment-check.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const CHECKS = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };
  console.log(`${icons[type]} ${message}`);
}

function runCheck(name: string, fn: () => boolean | Promise<boolean>): Promise<void> {
  return Promise.resolve(fn())
    .then((passed) => {
      if (passed) {
        log(`${name}`, 'success');
        CHECKS.passed++;
      } else {
        log(`${name} - FALLÓ`, 'error');
        CHECKS.failed++;
      }
    })
    .catch((error) => {
      log(`${name} - ERROR: ${error.message}`, 'error');
      CHECKS.failed++;
    });
}

// ============================================
// CHECKS
// ============================================

async function checkTypeScript(): Promise<boolean> {
  try {
    execSync('npx tsc --noEmit -p tsconfig.predeploy.json', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function checkLint(): Promise<boolean> {
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function checkBuild(): Promise<boolean> {
  try {
    // Solo verificamos que el build anterior existe
    return fs.existsSync('.next');
  } catch {
    return false;
  }
}

async function checkCriticalPages(): Promise<boolean> {
  const criticalPages = [
    'app/page.tsx',
    'app/login/page.tsx',
    'app/dashboard/page.tsx',
    'app/admin/clientes/page.tsx',
    'app/admin/clientes/[id]/editar/page.tsx',
  ];

  for (const page of criticalPages) {
    if (!fs.existsSync(page)) {
      log(`  Página faltante: ${page}`, 'warning');
      return false;
    }
  }
  return true;
}

async function checkCriticalAPIs(): Promise<boolean> {
  const criticalAPIs = [
    'app/api/health/route.ts',
    'app/api/auth/[...nextauth]/route.ts',
    'app/api/admin/companies/route.ts',
    'app/api/admin/companies/[id]/route.ts',
    'app/api/admin/subscription-plans/route.ts',
    'app/api/public/subscription-plans/route.ts',
  ];

  for (const api of criticalAPIs) {
    if (!fs.existsSync(api)) {
      log(`  API faltante: ${api}`, 'warning');
      return false;
    }
  }
  return true;
}

async function checkEnvVariables(): Promise<boolean> {
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];

  // Verificar en .env.production o .env
  const envFiles = ['.env.production', '.env'];
  let envContent = '';

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      envContent += fs.readFileSync(file, 'utf-8');
    }
  }

  for (const varName of requiredVars) {
    if (!envContent.includes(varName) && !process.env[varName]) {
      log(`  Variable faltante: ${varName}`, 'warning');
      return false;
    }
  }
  return true;
}

async function checkAPIConsistency(): Promise<boolean> {
  // Verificar que las APIs devuelven formatos consistentes
  // Este es un check estático del código

  const companiesRoute = fs.readFileSync('app/api/admin/companies/route.ts', 'utf-8');

  // POST debe devolver { company: ... }
  if (!companiesRoute.includes('{ company }')) {
    log('  API POST /companies no devuelve formato { company }', 'warning');
    return false;
  }

  return true;
}

async function checkHooksMatchAPIs(): Promise<boolean> {
  // Verificar que los hooks esperan el mismo formato que las APIs
  const useCompanies = fs.readFileSync('lib/hooks/admin/useCompanies.ts', 'utf-8');

  // Hook debe leer data.company
  if (!useCompanies.includes('data.company')) {
    log('  Hook useCompanies no lee data.company', 'warning');
    return false;
  }

  return true;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n🚀 PRE-DEPLOYMENT CHECK\n');
  console.log('='.repeat(50));

  // Checks críticos
  console.log('\n📋 Verificaciones Críticas:\n');

  await runCheck('Páginas críticas existen', checkCriticalPages);
  await runCheck('APIs críticas existen', checkCriticalAPIs);
  await runCheck('Variables de entorno configuradas', checkEnvVariables);
  await runCheck('Consistencia API (formato respuesta)', checkAPIConsistency);
  await runCheck('Hooks coinciden con APIs', checkHooksMatchAPIs);

  // Checks opcionales
  console.log('\n📋 Verificaciones de Calidad:\n');

  await runCheck('TypeScript sin errores', checkTypeScript);
  await runCheck('Lint sin errores', checkLint);
  await runCheck('Build existe', checkBuild);

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 RESUMEN:\n');
  console.log(`   ✅ Pasaron: ${CHECKS.passed}`);
  console.log(`   ❌ Fallaron: ${CHECKS.failed}`);
  console.log(`   ⚠️ Advertencias: ${CHECKS.warnings}`);

  if (CHECKS.failed > 0) {
    console.log('\n❌ PRE-DEPLOYMENT CHECK FALLÓ');
    console.log('Corrige los errores antes de deployar.\n');
    process.exit(1);
  } else {
    console.log('\n✅ PRE-DEPLOYMENT CHECK PASÓ');
    console.log('Listo para deployment.\n');
    process.exit(0);
  }
}

main().catch(console.error);
