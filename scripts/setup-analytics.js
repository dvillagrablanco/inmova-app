#!/usr/bin/env node

/**
 * Script interactivo para configurar Analytics IDs
 * Uso: node scripts/setup-analytics.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  log('\n🔧 CONFIGURACIÓN DE ANALYTICS - INMOVA LANDING PAGE\n', 'bright');
  log('Este script te ayudará a configurar las IDs de analytics.\n');
  
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';
  
  // Leer .env.local existente si existe
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
    log('✅ Archivo .env.local encontrado\n', 'green');
  } else {
    log('⚠️  Archivo .env.local no encontrado, se creará uno nuevo\n', 'yellow');
  }
  
  // Función para actualizar o añadir variable
  function updateEnv(key, value) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
      log(`✅ ${key} actualizado`, 'green');
    } else {
      envContent += `\n${key}=${value}`;
      log(`✅ ${key} añadido`, 'green');
    }
  }
  
  // Configurar Google Analytics
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('1️⃣  GOOGLE ANALYTICS 4 (OBLIGATORIO)', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
  log('Obtén tu ID en: https://analytics.google.com');
  log('Admin → Data Streams → Web → Measurement ID\n');
  
  const gaId = await question('Ingresa tu Google Analytics ID (G-XXXXXXXXXX) o Enter para saltar: ');
  
  if (gaId && gaId.startsWith('G-')) {
    updateEnv('NEXT_PUBLIC_GA_ID', gaId);
  } else if (gaId) {
    log('❌ ID inválido. Debe empezar con "G-"', 'red');
  } else {
    log('⏭️  Saltado', 'yellow');
  }
  
  // Configurar Hotjar
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('2️⃣  HOTJAR (OPCIONAL - Heatmaps & Recordings)', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
  log('Obtén tu ID en: https://www.hotjar.com');
  log('Add new site → Copiar Site ID (número)\n');
  
  const hotjarId = await question('Ingresa tu Hotjar ID (número de 7 dígitos) o Enter para saltar: ');
  
  if (hotjarId && /^\d{7}$/.test(hotjarId)) {
    updateEnv('NEXT_PUBLIC_HOTJAR_ID', hotjarId);
  } else if (hotjarId) {
    log('❌ ID inválido. Debe ser un número de 7 dígitos', 'red');
  } else {
    log('⏭️  Saltado', 'yellow');
  }
  
  // Configurar Clarity
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('3️⃣  MICROSOFT CLARITY (OPCIONAL - IA Insights)', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
  log('Obtén tu ID en: https://clarity.microsoft.com');
  log('Create project → Copiar Project ID\n');
  
  const clarityId = await question('Ingresa tu Clarity ID o Enter para saltar: ');
  
  if (clarityId && clarityId.length > 5) {
    updateEnv('NEXT_PUBLIC_CLARITY_ID', clarityId);
  } else if (clarityId) {
    log('❌ ID inválido', 'red');
  } else {
    log('⏭️  Saltado', 'yellow');
  }
  
  // Guardar archivo
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('💾 GUARDANDO CONFIGURACIÓN', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
  
  fs.writeFileSync(envLocalPath, envContent.trim() + '\n');
  log('✅ Configuración guardada en .env.local\n', 'green');
  
  // Resumen
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log('✅ CONFIGURACIÓN COMPLETADA', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'green');
  
  log('📋 PRÓXIMOS PASOS:');
  log('1. Reiniciar servidor de desarrollo: yarn dev');
  log('2. Verificar en navegador que los scripts carguen');
  log('3. Para producción, configurar en Vercel:');
  log('   https://vercel.com/dashboard → Settings → Environment Variables\n');
  
  log('📖 Guía completa: VERCEL_ENV_SETUP.md\n');
  
  rl.close();
}

main().catch(console.error);
