#!/usr/bin/env node

/**
 * DocuSign Setup Script para Inmova App
 * 
 * Genera RSA key pair, muestra los pasos de configuración
 * y actualiza .env.local / .env.production con las credenciales.
 * 
 * Uso: node scripts/setup-docusign.mjs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = '') {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  log('\n══════════════════════════════════════════════════════', COLORS.cyan);
  log('  INMOVA — DocuSign Setup', COLORS.bold + COLORS.cyan);
  log('══════════════════════════════════════════════════════\n', COLORS.cyan);

  const INTEGRATION_KEY = 'cf89d1eb-8df4-4714-a3a5-15bb98ca873f';

  log(`Integration Key (App ID): ${INTEGRATION_KEY}`, COLORS.green);
  log(`Entorno: DEMO (sandbox)\n`, COLORS.yellow);

  // Step 1: Generate RSA Key Pair
  log('─── PASO 1: Generando RSA Key Pair ───', COLORS.bold);

  const keysDir = path.join(ROOT, '.keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const privatePath = path.join(keysDir, 'docusign-private.pem');
  const publicPath = path.join(keysDir, 'docusign-public.pem');

  if (fs.existsSync(privatePath)) {
    const overwrite = await ask('Ya existe un key pair. ¿Regenerar? (s/N): ');
    if (overwrite.toLowerCase() !== 's') {
      log('Usando key pair existente.\n', COLORS.yellow);
    } else {
      generateKeyPair(privatePath, publicPath);
    }
  } else {
    generateKeyPair(privatePath, publicPath);
  }

  const publicKey = fs.readFileSync(publicPath, 'utf8');
  const privateKey = fs.readFileSync(privatePath, 'utf8');

  // Ensure .keys is in .gitignore
  ensureGitignore();

  // Step 2: Guide user to upload public key to DocuSign
  log('\n─── PASO 2: Subir Public Key a DocuSign ───', COLORS.bold);
  log('\nVe a la consola de DocuSign Developer:', COLORS.cyan);
  log('  https://admindemo.docusign.com/apps-and-keys\n', COLORS.blue);
  log('1. Busca tu app: cf89d1eb-8df4-4714-a3a5-15bb98ca873f');
  log('2. En la sección "Service Integration", click "ADD RSA KEYPAIR"');
  log('3. Pega esta Public Key:\n');
  log('──────── PUBLIC KEY (copiar todo) ────────', COLORS.yellow);
  console.log(publicKey);
  log('──────── FIN PUBLIC KEY ────────\n', COLORS.yellow);

  await ask('Pulsa ENTER cuando hayas subido la Public Key a DocuSign...');

  // Step 3: Get User ID and Account ID
  log('\n─── PASO 3: Obtener User ID y Account ID ───', COLORS.bold);
  log('\nEn la misma consola de DocuSign:', COLORS.cyan);
  log('  https://admindemo.docusign.com/apps-and-keys\n', COLORS.blue);
  log('- "API Account ID" → es tu DOCUSIGN_ACCOUNT_ID');
  log('- "User ID" (debajo de tu nombre) → es tu DOCUSIGN_USER_ID\n');

  const userId = await ask('DOCUSIGN_USER_ID (pega el User ID): ');
  const accountId = await ask('DOCUSIGN_ACCOUNT_ID (pega el Account ID): ');

  if (!userId || !accountId) {
    log('\nUser ID y Account ID son obligatorios. Ejecútalo de nuevo cuando los tengas.', COLORS.red);
    process.exit(1);
  }

  // Step 4: Optional - Secret Key for webhooks
  log('\n─── PASO 4: Webhook Secret (opcional) ───', COLORS.bold);
  log('En DocuSign Admin → Connect → Crear configuración');
  log('URL: https://inmovaapp.com/api/webhooks/docusign');
  log('Si configuraste un HMAC Secret, pégalo aquí.\n');

  const webhookSecret = await ask('DOCUSIGN_WEBHOOK_SECRET (o ENTER para omitir): ');

  // Step 5: Configure Redirect URIs
  log('\n─── PASO 5: Configurar Redirect URIs en DocuSign ───', COLORS.bold);
  log('\nVe a tu app en DocuSign Developer Console:', COLORS.cyan);
  log('  https://admindemo.docusign.com/apps-and-keys\n', COLORS.blue);
  log('En "Additional settings" → "Redirect URIs", añade:');
  log(`  ${COLORS.green}https://inmovaapp.com/api/integrations/docusign/callback${COLORS.reset}`);
  log(`  ${COLORS.green}http://localhost:3000/api/integrations/docusign/callback${COLORS.reset}\n`);

  await ask('Pulsa ENTER cuando hayas configurado las Redirect URIs...');

  // Step 6: Write .env files
  log('\n─── PASO 6: Escribiendo configuración ───', COLORS.bold);

  const privateKeyOneLine = privateKey.replace(/\n/g, '\\n');

  const envBlock = [
    '',
    '# ── DocuSign (configurado por setup-docusign.mjs) ──',
    `DOCUSIGN_INTEGRATION_KEY=${INTEGRATION_KEY}`,
    `DOCUSIGN_USER_ID=${userId}`,
    `DOCUSIGN_ACCOUNT_ID=${accountId}`,
    `DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi`,
    `DOCUSIGN_PRIVATE_KEY="${privateKeyOneLine}"`,
    webhookSecret ? `DOCUSIGN_WEBHOOK_SECRET=${webhookSecret}` : '# DOCUSIGN_WEBHOOK_SECRET=',
    `DOCUSIGN_SECRET_KEY=${webhookSecret || ''}`,
  ].join('\n');

  // Update .env.local (development)
  const envLocalPath = path.join(ROOT, '.env.local');
  updateEnvFile(envLocalPath, envBlock, 'DocuSign');

  // Update .env.production if it exists
  const envProdPath = path.join(ROOT, '.env.production');
  if (fs.existsSync(envProdPath)) {
    updateEnvFile(envProdPath, envBlock, 'DocuSign');
  }

  // Step 7: Grant Consent
  log('\n─── PASO 7: Conceder Consent (obligatorio, una sola vez) ───', COLORS.bold);
  log('\nAbre esta URL en tu navegador e inicia sesión con tu cuenta DocuSign:', COLORS.cyan);
  
  const consentUrl = `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${INTEGRATION_KEY}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/integrations/docusign/callback')}`;
  
  log(`\n  ${consentUrl}\n`, COLORS.blue);
  log('Usuario: dvillagra@vidaroinversiones.com');
  log('Acepta los permisos solicitados.\n');

  await ask('Pulsa ENTER cuando hayas concedido el consent...');

  // Summary
  log('\n══════════════════════════════════════════════════════', COLORS.green);
  log('  CONFIGURACIÓN COMPLETADA', COLORS.bold + COLORS.green);
  log('══════════════════════════════════════════════════════\n', COLORS.green);

  log('Variables configuradas:');
  log(`  DOCUSIGN_INTEGRATION_KEY = ${INTEGRATION_KEY}`, COLORS.green);
  log(`  DOCUSIGN_USER_ID         = ${userId}`, COLORS.green);
  log(`  DOCUSIGN_ACCOUNT_ID      = ${accountId}`, COLORS.green);
  log(`  DOCUSIGN_BASE_PATH       = https://demo.docusign.net/restapi`, COLORS.green);
  log(`  DOCUSIGN_PRIVATE_KEY     = [RSA key configurada]`, COLORS.green);
  log(`  DOCUSIGN_WEBHOOK_SECRET  = ${webhookSecret ? '[configurado]' : '[pendiente]'}`, webhookSecret ? COLORS.green : COLORS.yellow);

  log('\nArchivos actualizados:', COLORS.cyan);
  log(`  ${envLocalPath}`);
  if (fs.existsSync(envProdPath)) log(`  ${envProdPath}`);
  log(`  ${privatePath} (PRIVATE KEY — NO compartir)`);
  log(`  ${publicPath} (PUBLIC KEY — subida a DocuSign)`);

  log('\nPróximos pasos:', COLORS.yellow);
  log('  1. Arranca el servidor: npm run dev');
  log('  2. Ve a /admin/integraciones/docusign para verificar');
  log('  3. Si ves "consent_required", visita /api/integrations/docusign/consent');
  log('  4. Prueba enviar un contrato a firma desde /dashboard/contracts\n');

  log('Para producción, cambia DOCUSIGN_BASE_PATH a:', COLORS.yellow);
  log('  https://www.docusign.net/restapi\n');
}

function generateKeyPair(privatePath, publicPath) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(privatePath, privateKey, { mode: 0o600 });
  fs.writeFileSync(publicPath, publicKey, { mode: 0o644 });
  log(`RSA key pair generado:`, COLORS.green);
  log(`  Private: ${privatePath}`);
  log(`  Public:  ${publicPath}`);
}

function ensureGitignore() {
  const gitignorePath = path.join(ROOT, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (!content.includes('.keys/')) {
      fs.appendFileSync(gitignorePath, '\n# DocuSign RSA keys\n.keys/\n');
      log('.keys/ añadido a .gitignore', COLORS.green);
    }
  }
}

function updateEnvFile(filePath, envBlock, sectionName) {
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
  }

  // Remove existing DocuSign block if present
  const lines = content.split('\n');
  const filtered = [];
  let skipping = false;

  for (const line of lines) {
    if (line.includes('DocuSign') && (line.startsWith('#') || line.startsWith('DOCUSIGN_'))) {
      skipping = true;
      continue;
    }
    if (skipping && (line.startsWith('DOCUSIGN_') || line.trim() === '')) {
      continue;
    }
    skipping = false;
    filtered.push(line);
  }

  const newContent = filtered.join('\n').trimEnd() + '\n' + envBlock + '\n';
  fs.writeFileSync(filePath, newContent);
  log(`Actualizado: ${filePath}`, COLORS.green);
}

main().catch((err) => {
  log(`\nError: ${err.message}`, COLORS.red);
  process.exit(1);
});
