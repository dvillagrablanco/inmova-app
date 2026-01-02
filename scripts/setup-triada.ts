#!/usr/bin/env ts-node
/**
 * 🛡️ Setup Interactivo de la Triada de Mantenimiento
 * 
 * Este script te guía paso a paso para obtener y configurar:
 * 1. Sentry DSN
 * 2. Crisp Website ID
 * 3. BetterStack Status Page URL
 * 
 * Duración total: ~15 minutos
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function pause() {
  await question(colors.cyan + '\nPresiona Enter para continuar...' + colors.reset);
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateDSN(dsn: string): boolean {
  // Formato: https://[key]@[org].ingest.sentry.io/[project_id]
  const regex = /^https:\/\/[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io\/\d+$/;
  return regex.test(dsn);
}

function validateCrispId(id: string): boolean {
  // Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  return regex.test(id);
}

async function updateEnvFile(key: string, value: string) {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  // Leer archivo existente o crear nuevo
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Verificar si la variable ya existe
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    // Actualizar existente
    envContent = envContent.replace(regex, `${key}="${value}"`);
  } else {
    // Añadir nueva
    envContent += `\n${key}="${value}"\n`;
  }

  // Guardar
  fs.writeFileSync(envPath, envContent);
}

async function openBrowser(url: string) {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      execSync(`open "${url}"`);
    } else if (platform === 'win32') {
      execSync(`start "${url}"`);
    } else {
      execSync(`xdg-open "${url}"`);
    }
    return true;
  } catch {
    return false;
  }
}

// ============================================
// PASO 1: SENTRY
// ============================================

async function setupSentry() {
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  1️⃣  EL CENTINELA - Configurar Sentry', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('Sentry captura automáticamente todos los errores de tu app.', 'blue');
  log('Plan gratuito: 5,000 errores/mes\n', 'green');

  const hasAccount = await question('¿Ya tienes cuenta en Sentry? (s/n): ');

  if (hasAccount.toLowerCase() !== 's') {
    log('\n📝 Pasos para crear cuenta:\n', 'yellow');
    log('1. Abre https://sentry.io/signup/', 'cyan');
    log('2. Regístrate con tu email (o GitHub/Google)', 'cyan');
    log('3. Selecciona plan "Developer" (gratis)', 'cyan');
    
    const openIt = await question('\n¿Abrir Sentry en el navegador? (s/n): ');
    if (openIt.toLowerCase() === 's') {
      await openBrowser('https://sentry.io/signup/');
    }

    await pause();
  }

  // Obtener DSN
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  Obteniendo Sentry DSN', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('📝 Pasos para obtener tu DSN:\n', 'yellow');
  log('1. Ve a https://sentry.io/', 'cyan');
  log('2. Click en "Create Project"', 'cyan');
  log('3. Selecciona "Next.js" como plataforma', 'cyan');
  log('4. Dale un nombre: "inmova-app"', 'cyan');
  log('5. Copia el DSN que aparece (formato: https://xxx@yyy.ingest.sentry.io/zzz)', 'cyan');

  const openProject = await question('\n¿Abrir página de proyectos? (s/n): ');
  if (openProject.toLowerCase() === 's') {
    await openBrowser('https://sentry.io/projects/new/');
  }

  let dsn = '';
  let valid = false;

  while (!valid) {
    dsn = await question('\nPega tu Sentry DSN aquí: ');
    
    if (!dsn) {
      log('❌ El DSN no puede estar vacío', 'red');
      continue;
    }

    if (!validateDSN(dsn)) {
      log('❌ DSN inválido. Debe tener formato: https://[key]@[org].ingest.sentry.io/[id]', 'red');
      const retry = await question('¿Intentar de nuevo? (s/n): ');
      if (retry.toLowerCase() !== 's') {
        log('⏭️  Saltando Sentry...', 'yellow');
        return null;
      }
      continue;
    }

    valid = true;
  }

  // Guardar
  await updateEnvFile('NEXT_PUBLIC_SENTRY_DSN', dsn);
  
  log('\n✅ Sentry DSN configurado correctamente!', 'green');
  await pause();
  
  return dsn;
}

// ============================================
// PASO 2: CRISP
// ============================================

async function setupCrisp() {
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  2️⃣  EL ESCUDO - Configurar Crisp Chat', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('Crisp es el chat en vivo para dar soporte 24/7.', 'blue');
  log('Plan gratuito: 2 agentes, mensajes ilimitados\n', 'green');

  const hasAccount = await question('¿Ya tienes cuenta en Crisp? (s/n): ');

  if (hasAccount.toLowerCase() !== 's') {
    log('\n📝 Pasos para crear cuenta:\n', 'yellow');
    log('1. Abre https://crisp.chat/', 'cyan');
    log('2. Click en "Try Crisp Free"', 'cyan');
    log('3. Regístrate con tu email', 'cyan');
    log('4. Completa el onboarding (nombre de la web, etc.)', 'cyan');
    
    const openIt = await question('\n¿Abrir Crisp en el navegador? (s/n): ');
    if (openIt.toLowerCase() === 's') {
      await openBrowser('https://crisp.chat/');
    }

    await pause();
  }

  // Obtener Website ID
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  Obteniendo Crisp Website ID', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('📝 Pasos para obtener tu Website ID:\n', 'yellow');
  log('1. Ve a https://app.crisp.chat/', 'cyan');
  log('2. Settings (⚙️) → Website Settings', 'cyan');
  log('3. Click en "Setup Instructions"', 'cyan');
  log('4. Busca "Website ID" (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)', 'cyan');
  log('5. Copia el ID', 'cyan');

  const openSettings = await question('\n¿Abrir configuración de Crisp? (s/n): ');
  if (openSettings.toLowerCase() === 's') {
    await openBrowser('https://app.crisp.chat/settings/');
  }

  let websiteId = '';
  let valid = false;

  while (!valid) {
    websiteId = await question('\nPega tu Crisp Website ID aquí: ');
    
    if (!websiteId) {
      log('❌ El Website ID no puede estar vacío', 'red');
      continue;
    }

    if (!validateCrispId(websiteId)) {
      log('❌ Website ID inválido. Debe tener formato UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'red');
      const retry = await question('¿Intentar de nuevo? (s/n): ');
      if (retry.toLowerCase() !== 's') {
        log('⏭️  Saltando Crisp...', 'yellow');
        return null;
      }
      continue;
    }

    valid = true;
  }

  // Guardar
  await updateEnvFile('NEXT_PUBLIC_CRISP_WEBSITE_ID', websiteId);
  
  log('\n✅ Crisp Website ID configurado correctamente!', 'green');
  await pause();
  
  return websiteId;
}

// ============================================
// PASO 3: BETTERSTACK STATUS PAGE
// ============================================

async function setupStatusPage() {
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  3️⃣  LA TRANSPARENCIA - Status Page', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('Status Page muestra si tu app está operativa o caída.', 'blue');
  log('BetterStack plan gratuito: 10 monitores, check cada 3 min\n', 'green');

  const hasAccount = await question('¿Ya tienes cuenta en BetterStack? (s/n): ');

  if (hasAccount.toLowerCase() !== 's') {
    log('\n📝 Pasos para crear cuenta:\n', 'yellow');
    log('1. Abre https://betterstack.com/uptime', 'cyan');
    log('2. Click en "Start Free"', 'cyan');
    log('3. Regístrate con tu email', 'cyan');
    
    const openIt = await question('\n¿Abrir BetterStack en el navegador? (s/n): ');
    if (openIt.toLowerCase() === 's') {
      await openBrowser('https://betterstack.com/uptime');
    }

    await pause();
  }

  // Crear monitor y status page
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  Configurando Monitor y Status Page', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('📝 Pasos para configurar:\n', 'yellow');
  log('1. Ve a tu dashboard de BetterStack', 'cyan');
  log('2. Click en "Add Monitor"', 'cyan');
  log('3. Configuración:', 'cyan');
  log('   - URL: https://inmovaapp.com/api/health (o tu dominio)', 'cyan');
  log('   - Name: Inmova App', 'cyan');
  log('   - Check frequency: 3 minutos', 'cyan');
  log('4. Click en "Create Monitor"', 'cyan');
  log('5. Luego ve a "Status Pages" (menú lateral)', 'cyan');
  log('6. Click en "Create Status Page"', 'cyan');
  log('7. Dale un nombre: "Inmova Status"', 'cyan');
  log('8. Selecciona el monitor que creaste', 'cyan');
  log('9. Click en "Create Status Page"', 'cyan');
  log('10. Copia la URL pública (ej: https://inmova.betteruptime.com)', 'cyan');

  const openDashboard = await question('\n¿Abrir BetterStack dashboard? (s/n): ');
  if (openDashboard.toLowerCase() === 's') {
    await openBrowser('https://uptime.betterstack.com/');
  }

  let statusUrl = '';
  let valid = false;

  while (!valid) {
    statusUrl = await question('\nPega la URL de tu Status Page: ');
    
    if (!statusUrl) {
      log('⏭️  Puedes configurar esto después. Saltando...', 'yellow');
      return null;
    }

    if (!validateUrl(statusUrl)) {
      log('❌ URL inválida', 'red');
      const retry = await question('¿Intentar de nuevo? (s/n): ');
      if (retry.toLowerCase() !== 's') {
        log('⏭️  Saltando Status Page...', 'yellow');
        return null;
      }
      continue;
    }

    valid = true;
  }

  // Guardar
  await updateEnvFile('NEXT_PUBLIC_STATUS_PAGE_URL', statusUrl);
  
  log('\n✅ Status Page URL configurada correctamente!', 'green');
  await pause();
  
  return statusUrl;
}

// ============================================
// VERIFICACIÓN FINAL
// ============================================

async function verifySetup() {
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  ✅ Verificando Configuración', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ No se encontró archivo .env.local', 'red');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const checks = [
    {
      name: 'Sentry DSN',
      regex: /NEXT_PUBLIC_SENTRY_DSN="https:\/\/.+"/,
      icon: '🔴',
    },
    {
      name: 'Crisp Website ID',
      regex: /NEXT_PUBLIC_CRISP_WEBSITE_ID="[a-f0-9-]{36}"/,
      icon: '💬',
    },
    {
      name: 'Status Page URL',
      regex: /NEXT_PUBLIC_STATUS_PAGE_URL="https?:\/\/.+"/,
      icon: '📊',
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    const passed = check.regex.test(envContent);
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    
    log(`${check.icon} ${check.name}: ${status}`, color);
    
    if (!passed) allPassed = false;
  }

  return allPassed;
}

async function showNextSteps() {
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  🎉 ¡Configuración Completada!', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('📋 Próximos pasos:\n', 'yellow');
  
  log('1. Inicia la aplicación:', 'cyan');
  log('   npm run dev\n', 'bright');
  
  log('2. Verifica que todo funciona:', 'cyan');
  log('   ✓ Abre http://localhost:3000', 'green');
  log('   ✓ Verifica consola: "[Sentry] Inicializado"', 'green');
  log('   ✓ Widget de Crisp en esquina inferior derecha', 'green');
  log('   ✓ Footer: Link "Estado del Sistema"', 'green');

  log('\n3. Para producción:', 'cyan');
  log('   - Añade las mismas variables a Vercel/Railway', 'green');
  log('   - Deploy: git push origin main', 'green');

  log('\n4. Test de error:', 'cyan');
  log('   - Fuerza un error en cualquier página', 'green');
  log('   - Ve a Sentry dashboard → deberías ver el error', 'green');

  log('\n📚 Documentación:', 'yellow');
  log('   - docs/TRIADA-MANTENIMIENTO.md', 'cyan');
  log('   - TRIADA-MANTENIMIENTO-RESUMEN.md', 'cyan');
  log('   - docs/PROTOCOLO-ZERO-HEADACHE.md', 'cyan');

  log('\n🎯 ¡Tu app ahora está blindada para producción!', 'green');
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.clear();
  log('═══════════════════════════════════════════════', 'bright');
  log('  🛡️  SETUP DE LA TRIADA DE MANTENIMIENTO', 'bright');
  log('═══════════════════════════════════════════════\n', 'bright');

  log('Este asistente te guiará para configurar:', 'blue');
  log('  1️⃣  Sentry (Error Tracking)', 'cyan');
  log('  2️⃣  Crisp (Chat de Soporte)', 'cyan');
  log('  3️⃣  BetterStack (Status Page)', 'cyan');

  log('\n⏱️  Duración: ~15 minutos', 'yellow');
  log('💰 Costo: $0 (planes gratuitos)\n', 'green');

  const start = await question('¿Comenzar? (s/n): ');
  
  if (start.toLowerCase() !== 's') {
    log('\n👋 Setup cancelado. Puedes ejecutarlo cuando quieras con:', 'yellow');
    log('   npm run setup:triada\n', 'cyan');
    rl.close();
    return;
  }

  // Ejecutar setup
  const sentryDsn = await setupSentry();
  const crispId = await setupCrisp();
  const statusUrl = await setupStatusPage();

  // Verificar
  const allConfigured = await verifySetup();

  if (allConfigured) {
    await showNextSteps();
  } else {
    log('\n⚠️  Algunas configuraciones faltan.', 'yellow');
    log('Puedes configurarlas manualmente editando .env.local\n', 'cyan');
  }

  rl.close();
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
