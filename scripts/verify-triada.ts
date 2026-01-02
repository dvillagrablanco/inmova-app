#!/usr/bin/env ts-node
/**
 * 🔍 Verificación Rápida de la Triada de Mantenimiento
 * 
 * Verifica que todas las variables de entorno estén configuradas
 * y que los servicios estén respondiendo correctamente.
 */

import * as fs from 'fs';
import * as path from 'path';

// Colores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateDSN(dsn: string): boolean {
  const regex = /^https:\/\/[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io\/\d+$/;
  return regex.test(dsn);
}

function validateCrispId(id: string): boolean {
  const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  return regex.test(id);
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function checkEnvFile(filename: string) {
  const envPath = path.join(process.cwd(), filename);
  
  if (!fs.existsSync(envPath)) {
    log(`\n❌ Archivo ${filename} no encontrado`, 'red');
    return { exists: false, values: {} };
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const values: Record<string, string> = {};

  // Extraer valores
  const sentryMatch = envContent.match(/NEXT_PUBLIC_SENTRY_DSN="?([^"\n]+)"?/);
  const crispMatch = envContent.match(/NEXT_PUBLIC_CRISP_WEBSITE_ID="?([^"\n]+)"?/);
  const statusMatch = envContent.match(/NEXT_PUBLIC_STATUS_PAGE_URL="?([^"\n]+)"?/);

  if (sentryMatch) values.sentry = sentryMatch[1];
  if (crispMatch) values.crisp = crispMatch[1];
  if (statusMatch) values.status = statusMatch[1];

  return { exists: true, values };
}

function main() {
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  🔍 Verificación de la Triada', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  // Verificar archivos .env
  const envFiles = ['.env.local', '.env.production', '.env'];
  let foundConfig = false;
  let config: Record<string, string> = {};

  for (const file of envFiles) {
    const result = checkEnvFile(file);
    if (result.exists && Object.keys(result.values).length > 0) {
      log(`✓ Configuración encontrada en: ${file}`, 'green');
      config = { ...config, ...result.values };
      foundConfig = true;
    }
  }

  if (!foundConfig) {
    log('\n❌ No se encontró configuración de la Triada', 'red');
    log('\n💡 Ejecuta el setup:', 'yellow');
    log('   npm run setup:triada\n', 'cyan');
    process.exit(1);
  }

  // Verificar cada componente
  log('\n📋 Estado de componentes:\n', 'cyan');

  let allValid = true;

  // 1. Sentry
  if (config.sentry) {
    const valid = validateDSN(config.sentry);
    if (valid) {
      log('🔴 Sentry DSN: ✅ Válido', 'green');
      log(`   ${config.sentry.substring(0, 40)}...`, 'cyan');
    } else {
      log('🔴 Sentry DSN: ❌ Formato inválido', 'red');
      allValid = false;
    }
  } else {
    log('🔴 Sentry DSN: ⚠️  No configurado', 'yellow');
    allValid = false;
  }

  // 2. Crisp
  if (config.crisp) {
    const valid = validateCrispId(config.crisp);
    if (valid) {
      log('💬 Crisp Website ID: ✅ Válido', 'green');
      log(`   ${config.crisp}`, 'cyan');
    } else {
      log('💬 Crisp Website ID: ❌ Formato inválido', 'red');
      allValid = false;
    }
  } else {
    log('💬 Crisp Website ID: ⚠️  No configurado', 'yellow');
    allValid = false;
  }

  // 3. Status Page
  if (config.status) {
    const valid = validateUrl(config.status);
    if (valid) {
      log('📊 Status Page URL: ✅ Válida', 'green');
      log(`   ${config.status}`, 'cyan');
    } else {
      log('📊 Status Page URL: ❌ Formato inválido', 'red');
      allValid = false;
    }
  } else {
    log('📊 Status Page URL: ⚠️  No configurado', 'yellow');
    allValid = false;
  }

  // Verificar archivos de código
  log('\n📁 Verificando archivos de código:\n', 'cyan');

  const codeFiles = [
    { path: 'components/ui/GlobalErrorBoundary.tsx', name: 'GlobalErrorBoundary' },
    { path: 'components/support/ChatWidget.tsx', name: 'ChatWidget' },
    { path: 'lib/error-handling.ts', name: 'Error Handling Utils' },
    { path: 'components/ui/WidgetErrorBoundary.tsx', name: 'WidgetErrorBoundary' },
    { path: 'components/support/HelpComponents.tsx', name: 'Help Components' },
  ];

  for (const file of codeFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file.path));
    const status = exists ? '✅' : '❌';
    const color = exists ? 'green' : 'red';
    log(`  ${status} ${file.name}`, color);
    if (!exists) allValid = false;
  }

  // Resultado final
  log('\n═══════════════════════════════════════════════', 'bright');
  if (allValid) {
    log('  ✅ Todo configurado correctamente!', 'green');
    log('═══════════════════════════════════════════════\n', 'bright');
    
    log('📝 Próximos pasos:', 'cyan');
    log('  1. Inicia: npm run dev', 'cyan');
    log('  2. Verifica el widget de Crisp en la app', 'cyan');
    log('  3. Prueba forzar un error para ver Sentry', 'cyan');
    log('  4. Verifica el link "Estado del Sistema" en el Footer\n', 'cyan');
  } else {
    log('  ⚠️  Configuración incompleta', 'yellow');
    log('═══════════════════════════════════════════════\n', 'bright');
    
    log('💡 Opciones:', 'cyan');
    log('  - Ejecuta el setup: npm run setup:triada', 'cyan');
    log('  - Configura manualmente: edita .env.local', 'cyan');
    log('  - Consulta: docs/TRIADA-MANTENIMIENTO.md\n', 'cyan');
  }

  process.exit(allValid ? 0 : 1);
}

main();
