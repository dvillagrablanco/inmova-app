#!/usr/bin/env node

/**
 * Script to check if all required environment variables are set
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'AWS_REGION',
  'AWS_BUCKET_NAME',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'ABACUSAI_API_KEY',
  'NEXT_PUBLIC_VIDEO_URL',
  'CRON_SECRET',
  'ENCRYPTION_KEY',
];

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function checkEnvVars() {
  console.log(`\n${colors.cyan}========================================`);
  console.log('  Verificación de Variables de Entorno');
  console.log(`========================================${colors.reset}\n`);

  let missingRequired = [];
  let missingOptional = [];
  let presentVars = [];

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      presentVars.push(varName);
      console.log(`${colors.green}✓${colors.reset} ${varName}`);
    } else {
      missingRequired.push(varName);
      console.log(`${colors.red}✗${colors.reset} ${varName} ${colors.red}(REQUERIDA)${colors.reset}`);
    }
  });

  console.log(`\n${colors.cyan}Variables Opcionales:${colors.reset}\n`);

  // Check optional variables
  optionalEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      presentVars.push(varName);
      console.log(`${colors.green}✓${colors.reset} ${varName}`);
    } else {
      missingOptional.push(varName);
      console.log(`${colors.yellow}⚠${colors.reset} ${varName} ${colors.yellow}(opcional)${colors.reset}`);
    }
  });

  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`Resumen:`);
  console.log(`  Total variables: ${requiredEnvVars.length + optionalEnvVars.length}`);
  console.log(`  ${colors.green}Configuradas: ${presentVars.length}${colors.reset}`);
  console.log(`  ${colors.red}Faltantes (requeridas): ${missingRequired.length}${colors.reset}`);
  console.log(`  ${colors.yellow}Faltantes (opcionales): ${missingOptional.length}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (missingRequired.length > 0) {
    console.log(`${colors.red}ERROR: Faltan variables de entorno requeridas:${colors.reset}`);
    missingRequired.forEach((varName) => {
      console.log(`  - ${varName}`);
    });
    console.log(`\n${colors.yellow}Por favor, configura estas variables antes de desplegar.${colors.reset}\n`);
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.log(`${colors.yellow}ADVERTENCIA: Faltan algunas variables opcionales:${colors.reset}`);
    missingOptional.forEach((varName) => {
      console.log(`  - ${varName}`);
    });
    console.log(`\n${colors.yellow}La aplicación funcionará, pero algunas features pueden no estar disponibles.${colors.reset}\n`);
  }

  console.log(`${colors.green}✓ Todas las variables de entorno requeridas están configuradas${colors.reset}\n`);
  process.exit(0);
}

checkEnvVars();
