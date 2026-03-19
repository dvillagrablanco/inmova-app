#!/usr/bin/env npx tsx
/* eslint-disable no-console */
/**
 * Script de diagnóstico de integración bancaria
 *
 * Verifica el estado de todas las integraciones bancarias:
 * - GoCardless Bank Account Data (Nordigen)
 * - GoCardless Payments (SEPA Direct Debit)
 * - Tink (si está configurado)
 *
 * Uso:
 *   npx tsx scripts/verify-banking-setup.ts
 *   node --loader ts-node/esm scripts/verify-banking-setup.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar .env.production o .env.local
const envFile = fs.existsSync(path.join(process.cwd(), '.env.production'))
  ? '.env.production'
  : '.env.local';
dotenv.config({ path: path.join(process.cwd(), envFile) });

// ============================================================
// COLORES
// ============================================================

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function ok(msg: string) {
  console.log(`  ${C.green}✅${C.reset} ${msg}`);
}
function fail(msg: string) {
  console.log(`  ${C.red}❌${C.reset} ${msg}`);
}
function warn(msg: string) {
  console.log(`  ${C.yellow}⚠️${C.reset}  ${msg}`);
}
function info(msg: string) {
  console.log(`  ${C.blue}ℹ️${C.reset}  ${msg}`);
}
function section(title: string) {
  console.log(`\n${C.bold}${C.cyan}${title}${C.reset}`);
  console.log('─'.repeat(60));
}

// ============================================================
// CHECKS
// ============================================================

interface CheckResult {
  name: string;
  status: 'ok' | 'fail' | 'warn' | 'skip';
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'ok' | 'fail' | 'warn' | 'skip', message: string) {
  results.push({ name, status, message });
  if (status === 'ok') ok(`${name}: ${message}`);
  else if (status === 'fail') fail(`${name}: ${message}`);
  else if (status === 'warn') warn(`${name}: ${message}`);
  else info(`${name}: ${message} (skipped)`);
}

// ============================================================
// 1. VARIABLES DE ENTORNO
// ============================================================

async function checkEnvVars() {
  section('1. Variables de Entorno');

  const vars = {
    // Nordigen / GoCardless Bank Account Data
    NORDIGEN_SECRET_ID: { label: 'Nordigen Secret ID', required: false },
    NORDIGEN_SECRET_KEY: { label: 'Nordigen Secret Key', required: false },
    // GoCardless Payments (SEPA Direct Debit)
    GOCARDLESS_ACCESS_TOKEN: { label: 'GoCardless Access Token', required: false },
    GOCARDLESS_ENVIRONMENT: { label: 'GoCardless Environment', required: false },
    GOCARDLESS_WEBHOOK_SECRET: { label: 'GoCardless Webhook Secret', required: false },
    // Tink
    TINK_CLIENT_ID: { label: 'Tink Client ID', required: false },
    TINK_CLIENT_SECRET: { label: 'Tink Client Secret', required: false },
    // App URL
    NEXT_PUBLIC_APP_URL: { label: 'App URL', required: false },
    NEXTAUTH_URL: { label: 'NextAuth URL', required: true },
    DATABASE_URL: { label: 'Database URL', required: true },
  };

  for (const [key, { label, required }] of Object.entries(vars)) {
    const val = process.env[key];
    if (!val) {
      if (required) {
        addResult(label, 'fail', `${key} no configurado (REQUERIDO)`);
      } else {
        addResult(label, 'warn', `${key} no configurado`);
      }
    } else if (val.includes('placeholder') || val.includes('dummy') || val === 'undefined') {
      addResult(label, 'fail', `${key} tiene valor placeholder: ${val.substring(0, 30)}...`);
    } else {
      const preview = val.length > 20 ? `${val.substring(0, 15)}...` : val;
      addResult(label, 'ok', `Configurado (${preview})`);
    }
  }

  // Validación específica de GoCardless
  const gcToken = process.env.GOCARDLESS_ACCESS_TOKEN || '';
  const gcEnv = process.env.GOCARDLESS_ENVIRONMENT || '';
  if (gcToken && gcEnv === 'sandbox' && !gcToken.startsWith('sandbox_')) {
    addResult('GC Env Check', 'warn', 'ENVIRONMENT=sandbox pero token no parece sandbox');
  }
  if (gcToken && gcEnv === 'live' && gcToken.startsWith('sandbox_')) {
    addResult(
      'GC Env Check',
      'fail',
      'ENVIRONMENT=live pero el token es de SANDBOX. Usar token live_...'
    );
  }
  if (gcToken && gcEnv === 'live' && gcToken.startsWith('live_')) {
    addResult('GC Env Check', 'ok', 'Token y entorno GoCardless son ambos LIVE');
  }
}

// ============================================================
// 2. SALT EDGE (alternativa a Nordigen)
// ============================================================

async function checkSaltEdge() {
  section('2. Salt Edge (Alternativa recomendada a Nordigen)');

  const appId = process.env.SALTEDGE_APP_ID;
  const secret = process.env.SALTEDGE_SECRET;

  if (!appId || !secret) {
    addResult(
      'Salt Edge Credentials',
      'skip',
      'No configurado. Registro en: https://www.saltedge.com/partner_program (sin licencia TPP)'
    );
    return;
  }

  try {
    info('Conectando a Salt Edge Partners API...');
    const res = await fetch(
      'https://www.saltedge.com/api/partners/v1/providers?country_code=ES&mode=oauth&status=active&per_page=5',
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'App-id': appId,
          Secret: secret,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      addResult('Salt Edge Connection', 'fail', `HTTP ${res.status}: ${err.substring(0, 150)}`);
      return;
    }

    const json = await res.json();
    const providers: any[] = json.data || [];
    addResult('Salt Edge Connection', 'ok', `Conectado. ${providers.length} providers de muestra`);

    // Buscar Bankinter
    const bankinter = providers.find(
      (p: any) => p.code?.includes('bankinter') || p.name?.toLowerCase().includes('bankinter')
    );
    if (bankinter) {
      addResult(
        'Bankinter (Salt Edge)',
        'ok',
        `Code: ${bankinter.code}, Status: ${bankinter.status}`
      );
    } else {
      // Hacer búsqueda específica de Bankinter
      const bankinterRes = await fetch(
        'https://www.saltedge.com/api/partners/v1/providers?country_code=ES&mode=oauth&status=active&per_page=100',
        {
          headers: { Accept: 'application/json', 'App-id': appId, Secret: secret },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (bankinterRes.ok) {
        const allJson = await bankinterRes.json();
        const all: any[] = allJson.data || [];
        const bk = all.find(
          (p: any) => p.code?.includes('bankinter') || p.name?.toLowerCase().includes('bankinter')
        );
        if (bk) {
          addResult('Bankinter (Salt Edge)', 'ok', `Code: ${bk.code}, Status: ${bk.status}`);
          info(`  Code para conectar: ${bk.code}`);
        } else {
          addResult(
            'Bankinter (Salt Edge)',
            'warn',
            'No encontrado en la lista. Puede que el code sea diferente.'
          );
          info('  Prueba a conectar con code: bankinter_xo_es');
        }
      }
    }
  } catch (err: any) {
    addResult('Salt Edge Connectivity', 'fail', `Error: ${err.message}`);
  }
}

// ============================================================
// NORDIGEN (desactivado para nuevos registros)
// ============================================================

async function checkNordigen() {
  section('3. GoCardless Bank Account Data (Nordigen) — Nuevos registros desactivados');

  const secretId = process.env.NORDIGEN_SECRET_ID;
  const secretKey = process.env.NORDIGEN_SECRET_KEY;

  if (!secretId || !secretKey) {
    addResult(
      'Nordigen Credentials',
      'skip',
      'No configurado. NOTA: GoCardless ha desactivado nuevos registros en 2025. Usar Salt Edge en su lugar.'
    );
    return;
  }

  try {
    info('Generando token Nordigen...');
    const tokenRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      addResult('Nordigen Token', 'fail', `HTTP ${tokenRes.status}: ${err.substring(0, 100)}`);
      return;
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.access) {
      addResult(
        'Nordigen Token',
        'fail',
        `Respuesta sin campo 'access': ${JSON.stringify(tokenData).substring(0, 100)}`
      );
      return;
    }

    addResult('Nordigen Token', 'ok', 'Token generado correctamente');

    // Listar bancos de España
    info('Listando bancos de España...');
    const banksRes = await fetch(
      'https://bankaccountdata.gocardless.com/api/v2/institutions/?country=ES',
      { headers: { Authorization: `Bearer ${tokenData.access}` } }
    );

    if (!banksRes.ok) {
      addResult('Nordigen Banks ES', 'fail', `HTTP ${banksRes.status}`);
      return;
    }

    const banks: any[] = await banksRes.json();
    addResult('Nordigen Banks ES', 'ok', `${banks.length} bancos disponibles`);

    // Buscar Bankinter
    const bankinter = banks.find(
      (b: any) => b.name.toLowerCase().includes('bankinter') || b.id === 'BANKINTER_BKBKESMMXXX'
    );
    if (bankinter) {
      addResult(
        'Bankinter',
        'ok',
        `Encontrado: ID=${bankinter.id}, Historial=${bankinter.transaction_total_days} días`
      );
      info(`  Institution ID correcto: ${bankinter.id}`);
    } else {
      addResult(
        'Bankinter',
        'warn',
        'No encontrado con ID BANKINTER_BKBKESMMXXX. Buscar en la lista completa'
      );
      // Mostrar los primeros 10 bancos
      info('  Primeros bancos disponibles:');
      banks.slice(0, 10).forEach((b: any) => info(`    - ${b.id}: ${b.name}`));
    }
  } catch (err: any) {
    addResult('Nordigen Connectivity', 'fail', `Error de red: ${err.message}`);
  }
}

// ============================================================
// 3. CONECTIVIDAD GOCARDLESS PAYMENTS
// ============================================================

async function checkGoCardless() {
  section('3. GoCardless Payments (SEPA Direct Debit)');

  const token = process.env.GOCARDLESS_ACCESS_TOKEN;
  const env = process.env.GOCARDLESS_ENVIRONMENT || 'live';

  if (!token) {
    addResult(
      'GoCardless Credentials',
      'skip',
      'GOCARDLESS_ACCESS_TOKEN no configurado. Ver: https://manage.gocardless.com/developers/access-tokens'
    );
    return;
  }

  const baseUrl =
    env === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';

  try {
    info(`Conectando a GoCardless ${env.toUpperCase()}...`);
    const res = await fetch(`${baseUrl}/creditors`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'GoCardless-Version': '2015-07-06',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as any).error?.message || res.statusText;
      addResult('GoCardless Connection', 'fail', `HTTP ${res.status}: ${msg}`);

      if (res.status === 401) {
        fail('  Token inválido o expirado. Generar uno nuevo en el dashboard.');
      } else if (res.status === 403) {
        fail('  Token sin permisos suficientes. Usar token con acceso read_write.');
      }
      return;
    }

    const data = await res.json();
    const creditors: any[] = data.creditors || [];

    if (creditors.length === 0) {
      addResult(
        'GoCardless Creditor',
        'warn',
        'Sin creditor configurado. Añadir cuenta bancaria en el dashboard.'
      );
    } else {
      const c = creditors[0];
      addResult('GoCardless Connection', 'ok', `Conectado como: ${c.name} (${c.country_code})`);

      const schemes = (c.scheme_identifiers || [])
        .map((s: any) => `${s.scheme}:${s.status}`)
        .join(', ');
      if (schemes) {
        addResult('SEPA Schemes', 'ok', schemes);
      } else {
        addResult(
          'SEPA Schemes',
          'warn',
          'Sin scheme SEPA activo. Completar verificación KYB en GoCardless.'
        );
      }
    }

    // Contar mandatos activos
    const mandatesRes = await fetch(`${baseUrl}/mandates?status=active&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'GoCardless-Version': '2015-07-06',
      },
    });
    if (mandatesRes.ok) {
      const mData = await mandatesRes.json();
      const total = mData.meta?.total_count ?? '?';
      addResult('Active Mandates', 'ok', `${total} mandatos activos`);
    }
  } catch (err: any) {
    addResult('GoCardless Connectivity', 'fail', `Error de red: ${err.message}`);
  }
}

// ============================================================
// 4. CONECTIVIDAD TINK
// ============================================================

async function checkTink() {
  section('4. Tink (Open Banking)');

  const clientId = process.env.TINK_CLIENT_ID;
  const clientSecret = process.env.TINK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    addResult(
      'Tink Credentials',
      'skip',
      'No configurado. RECOMENDACIÓN: Usar Nordigen en su lugar (sin licencia TPP requerida)'
    );
    return;
  }

  try {
    const res = await fetch('https://api.tink.com/api/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'accounts:read',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      addResult('Tink Token', 'fail', `HTTP ${res.status}: ${err.substring(0, 100)}`);
      if (res.status === 401) {
        warn('  Credenciales de Tink inválidas. Verificar en https://console.tink.com');
        warn('  IMPORTANTE: Tink production requiere licencia TPP (Third Party Provider)');
        warn('  El proceso de aprobación tarda 6-18 meses en el Banco de España');
        warn('  → Alternativa recomendada: GoCardless Bank Account Data (Nordigen)');
      }
    } else {
      const data = await res.json();
      addResult(
        'Tink Token',
        'ok',
        `Token obtenido. Entorno: ${process.env.TINK_ENVIRONMENT || 'production'}`
      );
    }
  } catch (err: any) {
    addResult('Tink Connectivity', 'fail', `Error de red: ${err.message}`);
  }
}

// ============================================================
// 5. BASE DE DATOS - conexiones activas
// ============================================================

async function checkDatabase() {
  section('5. Estado en Base de Datos');

  try {
    // Import dinámico para evitar error si no hay DB
    const { getPrismaClient } = await import('../lib/db');
    const prisma = getPrismaClient();

    // Conexiones bancarias
    const connections = await prisma.bankConnection.findMany({
      select: {
        id: true,
        proveedor: true,
        nombreBanco: true,
        estado: true,
        ultimaSync: true,
        companyId: true,
      },
    });

    if (connections.length === 0) {
      addResult('Bank Connections', 'warn', 'No hay conexiones bancarias registradas en BD');
    } else {
      addResult('Bank Connections', 'ok', `${connections.length} conexiones encontradas`);
      connections.forEach((c) => {
        const syncInfo = c.ultimaSync
          ? `última sync: ${new Date(c.ultimaSync).toLocaleDateString()}`
          : 'sin sync';
        info(`  - ${c.proveedor} / ${c.nombreBanco || 'N/A'} → ${c.estado} (${syncInfo})`);
      });
    }

    // Mandatos SEPA
    const mandates = await prisma.sepaMandate.count({ where: { status: 'active' } });
    const totalMandates = await prisma.sepaMandate.count();
    addResult(
      'SEPA Mandates',
      totalMandates > 0 ? 'ok' : 'warn',
      `${mandates} activos / ${totalMandates} total`
    );

    // Pagos SEPA pendientes de conciliar
    const pendingRecon = await prisma.sepaPayment.count({
      where: { conciliado: false, status: { in: ['confirmed', 'paid_out'] } },
    });
    if (pendingRecon > 0) {
      addResult('Pending Reconciliation', 'warn', `${pendingRecon} pagos SEPA sin conciliar`);
    } else {
      addResult('Pending Reconciliation', 'ok', 'Todo conciliado');
    }

    // Transacciones bancarias
    const bankTx = await prisma.bankTransaction.count();
    const pendingTx = await prisma.bankTransaction.count({
      where: { estado: 'pendiente_revision' },
    });
    addResult(
      'Bank Transactions',
      bankTx > 0 ? 'ok' : 'warn',
      `${bankTx} total, ${pendingTx} pendientes de revisar`
    );
  } catch (err: any) {
    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('connect')) {
      addResult('Database', 'fail', 'No se puede conectar a la BD. Verificar DATABASE_URL');
    } else {
      addResult('Database', 'warn', `Error: ${err.message.substring(0, 100)}`);
    }
  }
}

// ============================================================
// RESUMEN FINAL
// ============================================================

function printSummary() {
  section('RESUMEN');

  const counts = {
    ok: results.filter((r) => r.status === 'ok').length,
    fail: results.filter((r) => r.status === 'fail').length,
    warn: results.filter((r) => r.status === 'warn').length,
    skip: results.filter((r) => r.status === 'skip').length,
  };

  console.log(`  ${C.green}✅ OK: ${counts.ok}${C.reset}`);
  console.log(`  ${C.red}❌ ERRORES: ${counts.fail}${C.reset}`);
  console.log(`  ${C.yellow}⚠️  ADVERTENCIAS: ${counts.warn}${C.reset}`);
  console.log(`  ${C.blue}ℹ️  OMITIDOS: ${counts.skip}${C.reset}`);

  if (counts.fail > 0) {
    console.log(`\n${C.red}${C.bold}PROBLEMAS CRÍTICOS:${C.reset}`);
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        console.log(`  ${C.red}→ ${r.name}: ${r.message}${C.reset}`);
      });
  }

  console.log(`\n${C.bold}Próximos pasos según lo faltante:${C.reset}`);

  const saltEdgeMissing = results.some(
    (r) => r.name.includes('Salt Edge Credentials') && r.status === 'skip'
  );
  const gcMissing = results.some(
    (r) => r.name.includes('GoCardless Credentials') && r.status === 'skip'
  );

  if (saltEdgeMissing) {
    console.log(`\n  ${C.cyan}SALT EDGE — RECOMENDADO para leer movimientos Bankinter:${C.reset}`);
    console.warn(
      `  ${C.yellow}⚠️  GoCardless Bank Account Data (Nordigen) ha desactivado nuevos registros.${C.reset}`
    );
    console.log('  1. Regístrate en: https://www.saltedge.com/partner_program');
    console.log('     (Partner Program: sin licencia TPP requerida)');
    console.log('  2. Dashboard → API Keys → copiar App ID y Secret');
    console.log('  3. Añadir a .env.production:');
    console.log('     SALTEDGE_APP_ID=tu_app_id');
    console.log('     SALTEDGE_SECRET=tu_secret');
    console.log('  4. pm2 restart inmova-app --update-env');
    console.log('  5. Ir a /finanzas/bancaria-setup → Salt Edge → Conectar Bankinter');
    console.log('');
    console.log(`  ${C.blue}ALTERNATIVA INMEDIATA (sin API):${C.reset}`);
    console.log('  Bankinter → Mis cuentas → Movimientos → Exportar → XML ISO 20022 (CAMT.053)');
    console.log('  Inmova → /finanzas/conciliacion → Importar Extracto → subir el XML');
  }

  if (gcMissing) {
    console.log(`\n  ${C.cyan}GOCARDLESS PAYMENTS (cobro SEPA):${C.reset}`);
    console.log('  1. Crear cuenta en https://manage.gocardless.com/sign-up');
    console.log('  2. Completar verificación KYB (2-5 días)');
    console.log('  3. Añadir cuenta Bankinter como creditor');
    console.log('  4. Crear access token en Developers → Access tokens');
    console.log('  5. Crear webhook: https://inmovaapp.com/api/gocardless/webhook');
    console.log('  6. Añadir a .env.production:');
    console.log('     GOCARDLESS_ACCESS_TOKEN=live_xxxx');
    console.log('     GOCARDLESS_ENVIRONMENT=live');
    console.log('     GOCARDLESS_WEBHOOK_SECRET=whsec_xxxx');
  }

  console.log(`\n  Ver guía completa: ${C.cyan}GUIA_PRODUCCION_BANCARIA.md${C.reset}\n`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(
    `\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗${C.reset}`
  );
  console.log(
    `${C.bold}${C.cyan}║   DIAGNÓSTICO DE INTEGRACIÓN BANCARIA — GRUPO VIDARO    ║${C.reset}`
  );
  console.log(
    `${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════╝${C.reset}`
  );
  console.log(`  Entorno cargado: ${envFile}`);
  console.log(`  Fecha: ${new Date().toLocaleString('es-ES')}`);

  await checkEnvVars();
  await checkSaltEdge();
  await checkNordigen();
  await checkGoCardless();
  await checkTink();
  await checkDatabase();
  printSummary();
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
