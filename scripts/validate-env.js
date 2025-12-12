#!/usr/bin/env node
/**
 * Script de validación de variables de entorno
 * Verifica que todas las variables requeridas estén configuradas
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Variables requeridas por categoría
const requiredVars = {
  'Base': [
    'NEXT_PUBLIC_APP_URL',
    'NODE_ENV',
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ],
  'Stripe (Pagos)': [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY'
  ],
  'Email (SendGrid)': [
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL'
  ]
};

// Variables opcionales
const optionalVars = {
  'Channel Manager': [
    'BOOKING_CLIENT_ID',
    'BOOKING_CLIENT_SECRET',
    'VRBO_API_KEY',
    'GOOGLE_CLIENT_ID'
  ],
  'Comunicación': [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'WHATSAPP_ACCESS_TOKEN'
  ],
  'Cron Jobs': [
    'CRON_SECRET',
    'CRON_ENABLED'
  ],
  'Almacenamiento': [
    'AWS_BUCKET_NAME'
  ]
};

function validateEnv() {
  log('\n🔍 Validando configuración de variables de entorno...\n', 'blue');

  let hasErrors = false;
  let warnings = 0;

  // Cargar .env
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ ERROR: Archivo .env no encontrado', 'red');
    log('Ejecuta: cp .env.example .env', 'yellow');
    process.exit(1);
  }

  require('dotenv').config({ path: envPath });

  // Validar variables requeridas
  log('📦 Variables Requeridas:', 'blue');
  for (const [category, vars] of Object.entries(requiredVars)) {
    log(`\n${category}:`);
    for (const varName of vars) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        log(`  ❌ ${varName}: NO CONFIGURADA`, 'red');
        hasErrors = true;
      } else {
        const displayValue = varName.includes('SECRET') || varName.includes('KEY') 
          ? '***' + value.slice(-4)
          : value.length > 50 ? value.slice(0, 47) + '...' : value;
        log(`  ✅ ${varName}: ${displayValue}`, 'green');
      }
    }
  }

  // Validar variables opcionales
  log('\n\n🔧 Variables Opcionales:', 'blue');
  for (const [category, vars] of Object.entries(optionalVars)) {
    log(`\n${category}:`);
    for (const varName of vars) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        log(`  ⚠️  ${varName}: No configurada (opcional)`, 'yellow');
        warnings++;
      } else {
        const displayValue = varName.includes('SECRET') || varName.includes('KEY') 
          ? '***' + value.slice(-4)
          : value.length > 50 ? value.slice(0, 47) + '...' : value;
        log(`  ✅ ${varName}: ${displayValue}`, 'green');
      }
    }
  }

  // Resumen
  log('\n' + '='.repeat(60), 'blue');
  if (hasErrors) {
    log('\n❌ VALIDACIÓN FALLIDA', 'red');
    log('\nHay variables requeridas sin configurar.', 'yellow');
    log('Consulta ACTIVAR_PRODUCCION.md para obtener las credenciales.\n', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ VALIDACIÓN EXITOSA', 'green');
    if (warnings > 0) {
      log(`\n⚠️  ${warnings} variables opcionales no configuradas`, 'yellow');
      log('El sistema funcionará, pero algunas funcionalidades estarán limitadas.', 'yellow');
    }
    log('\n🚀 El sistema está listo para funcionar\n', 'green');
  }
}

// Ejecutar validación
try {
  validateEnv();
} catch (error) {
  log(`\n❌ Error durante la validación: ${error.message}\n`, 'red');
  process.exit(1);
}
