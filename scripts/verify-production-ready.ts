#!/usr/bin/env ts-node
/**
 * 🚀 Verificación de Preparación para Producción
 * 
 * Verifica que todas las configuraciones críticas estén listas
 * antes de lanzar con clientes reales.
 */

import * as fs from 'fs';
import * as path from 'path';

// Colores
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

function addCheck(name: string, status: 'pass' | 'fail' | 'warning', message: string, critical: boolean = false) {
  results.push({ name, status, message, critical });
}

// Verificar archivo de entorno
function checkEnvFile(): Record<string, string> {
  const envFiles = ['.env.production', '.env.local', '.env'];
  let envContent = '';
  let foundFile = '';

  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
      foundFile = file;
      break;
    }
  }

  if (!envContent) {
    addCheck('Archivo de entorno', 'fail', 'No se encontró .env.production, .env.local, ni .env', true);
    return {};
  }

  addCheck('Archivo de entorno', 'pass', `Encontrado: ${foundFile}`, false);

  // Parsear variables
  const vars: Record<string, string> = {};
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\n]+)["']?/);
    if (match) {
      vars[match[1]] = match[2];
    }
  }

  return vars;
}

// Verificar variables críticas
function checkCriticalVars(vars: Record<string, string>) {
  const criticalVars = [
    { key: 'DATABASE_URL', name: 'Base de Datos', production: true },
    { key: 'NEXTAUTH_SECRET', name: 'NextAuth Secret', production: true },
    { key: 'NEXTAUTH_URL', name: 'NextAuth URL', production: false },
    { key: 'ENCRYPTION_KEY', name: 'Encryption Key', production: true },
  ];

  for (const varDef of criticalVars) {
    const value = vars[varDef.key];
    
    if (!value) {
      addCheck(varDef.name, 'fail', `${varDef.key} no está definida`, true);
      continue;
    }

    // Verificar valores de desarrollo
    if (varDef.production) {
      const isDevelopment = 
        value.includes('localhost') ||
        value.includes('127.0.0.1') ||
        value.includes('your_') ||
        value.includes('change-this') ||
        value.includes('example') ||
        value.length < 16;

      if (isDevelopment) {
        addCheck(varDef.name, 'warning', `${varDef.key} parece ser un valor de desarrollo`, true);
      } else {
        addCheck(varDef.name, 'pass', `${varDef.key} configurada correctamente`, false);
      }
    } else {
      addCheck(varDef.name, 'pass', `${varDef.key} configurada`, false);
    }
  }
}

// Verificar Triada
function checkTriada(vars: Record<string, string>) {
  const triadaVars = [
    { key: 'NEXT_PUBLIC_SENTRY_DSN', name: 'Sentry DSN', regex: /^https:\/\/[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io\/\d+$/ },
    { key: 'NEXT_PUBLIC_CRISP_WEBSITE_ID', name: 'Crisp Website ID', regex: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/ },
    { key: 'NEXT_PUBLIC_STATUS_PAGE_URL', name: 'Status Page URL', regex: /^https?:\/\/.+/ },
  ];

  for (const varDef of triadaVars) {
    const value = vars[varDef.key];
    
    if (!value) {
      addCheck(`Triada: ${varDef.name}`, 'warning', `${varDef.key} no configurada (opcional pero recomendado)`, false);
      continue;
    }

    if (!varDef.regex.test(value)) {
      addCheck(`Triada: ${varDef.name}`, 'fail', `${varDef.key} tiene formato inválido`, false);
    } else {
      addCheck(`Triada: ${varDef.name}`, 'pass', `${varDef.key} válida`, false);
    }
  }
}

// Verificar Stripe
function checkStripe(vars: Record<string, string>) {
  const stripeKeys = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ];

  for (const key of stripeKeys) {
    const value = vars[key];
    
    if (!value) {
      addCheck(`Stripe: ${key}`, 'warning', `${key} no configurada`, false);
      continue;
    }

    // Verificar si es test key en producción
    if (value.includes('_test_')) {
      addCheck(`Stripe: ${key}`, 'warning', `${key} es una CLAVE DE TEST (cambiar a LIVE para producción)`, true);
    } else if (value.includes('_live_')) {
      addCheck(`Stripe: ${key}`, 'pass', `${key} configurada para PRODUCCIÓN`, false);
    } else {
      addCheck(`Stripe: ${key}`, 'warning', `${key} tiene formato desconocido`, false);
    }
  }
}

// Verificar archivos de código
function checkCodeFiles() {
  const requiredFiles = [
    { path: 'components/ui/GlobalErrorBoundary.tsx', name: 'GlobalErrorBoundary' },
    { path: 'components/support/ChatWidget.tsx', name: 'ChatWidget' },
    { path: 'lib/error-handling.ts', name: 'Error Handling Utils' },
    { path: 'components/ui/WidgetErrorBoundary.tsx', name: 'WidgetErrorBoundary' },
    { path: 'app/api/health/route.ts', name: 'Health Check API' },
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file.path));
    
    if (exists) {
      addCheck(`Código: ${file.name}`, 'pass', `${file.path} existe`, false);
    } else {
      addCheck(`Código: ${file.name}`, 'fail', `${file.path} no encontrado`, false);
    }
  }
}

// Verificar package.json scripts
function checkScripts() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    addCheck('Scripts', 'fail', 'package.json no encontrado', true);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const requiredScripts = ['dev', 'build', 'start', 'test'];

  for (const script of requiredScripts) {
    if (packageJson.scripts?.[script]) {
      addCheck(`Script: ${script}`, 'pass', `npm run ${script} disponible`, false);
    } else {
      addCheck(`Script: ${script}`, 'fail', `npm run ${script} no encontrado`, false);
    }
  }
}

// Main
function main() {
  console.clear();
  log('═══════════════════════════════════════════════════════════', 'bright');
  log('  🚀 Verificación de Preparación para Producción', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'bright');

  // Ejecutar verificaciones
  const vars = checkEnvFile();
  checkCriticalVars(vars);
  checkTriada(vars);
  checkStripe(vars);
  checkCodeFiles();
  checkScripts();

  // Mostrar resultados
  log('\n📋 Resultados:\n', 'cyan');

  let criticalFailures = 0;
  let warnings = 0;
  let passes = 0;

  for (const result of results) {
    let icon = '';
    let color: keyof typeof colors = 'reset';

    switch (result.status) {
      case 'pass':
        icon = '✅';
        color = 'green';
        passes++;
        break;
      case 'warning':
        icon = '⚠️ ';
        color = 'yellow';
        warnings++;
        break;
      case 'fail':
        icon = '❌';
        color = 'red';
        if (result.critical) criticalFailures++;
        break;
    }

    log(`${icon} ${result.name}`, color);
    log(`   ${result.message}`, color);
  }

  // Resumen
  log('\n═══════════════════════════════════════════════════════════', 'bright');
  log(`  Resumen: ${passes} ✅ | ${warnings} ⚠️  | ${criticalFailures} ❌`, 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'bright');

  if (criticalFailures > 0) {
    log('❌ NO ESTÁS LISTO PARA PRODUCCIÓN', 'red');
    log('\n🔧 Acciones requeridas:', 'yellow');
    
    const criticalIssues = results.filter(r => r.status === 'fail' && r.critical);
    for (const issue of criticalIssues) {
      log(`  - ${issue.message}`, 'red');
    }

    log('\n💡 Pasos siguientes:', 'cyan');
    log('  1. Configura la Triada: npm run setup:triada', 'cyan');
    log('  2. Genera secretos robustos: openssl rand -base64 32', 'cyan');
    log('  3. Actualiza .env.production con valores correctos', 'cyan');
    log('  4. Ejecuta de nuevo: npm run verify:production-ready\n', 'cyan');

    process.exit(1);
  } else if (warnings > 0) {
    log('⚠️  CASI LISTO - Hay advertencias', 'yellow');
    log('\n💡 Recomendaciones:', 'cyan');
    
    const warningIssues = results.filter(r => r.status === 'warning');
    for (const issue of warningIssues) {
      log(`  - ${issue.message}`, 'yellow');
    }

    log('\n✅ Puedes lanzar, pero considera resolver las advertencias primero.\n', 'green');
    process.exit(0);
  } else {
    log('🎉 ¡LISTO PARA PRODUCCIÓN!', 'green');
    log('\n📝 Checklist final:', 'cyan');
    log('  ✅ Variables de entorno configuradas', 'green');
    log('  ✅ Triada de Mantenimiento lista', 'green');
    log('  ✅ Archivos de código presentes', 'green');
    log('  ✅ Scripts de npm disponibles', 'green');

    log('\n🚀 Siguiente paso:', 'cyan');
    log('  git push origin main\n', 'bright');

    log('📖 Consulta el plan completo:', 'cyan');
    log('  docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md\n', 'cyan');

    process.exit(0);
  }
}

main();
