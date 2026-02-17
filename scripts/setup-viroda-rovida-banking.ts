/**
 * SETUP COMPLETO: VIRODA & ROVIDA con GoCardless + Bankinter
 *
 * Configura el flujo de cobros SEPA y conciliación bancaria para ambas sociedades.
 *
 * Flujo:
 *   1. Verifica creditor de GoCardless (cuenta donde se reciben fondos)
 *   2. Verifica/crea BankConnection para cada sociedad (Bankinter)
 *   3. Lista mandatos SEPA existentes
 *   4. Muestra resumen y próximos pasos
 *
 * Prerequisitos:
 *   - GOCARDLESS_ACCESS_TOKEN configurado
 *   - DATABASE_URL configurado
 *   - Sociedades Viroda y Rovida creadas como Company en la BD
 *
 * Ejecutar: npx tsx scripts/setup-viroda-rovida-banking.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GC_TOKEN = process.env.GOCARDLESS_ACCESS_TOKEN;
const GC_ENV = process.env.GOCARDLESS_ENVIRONMENT || 'live';
const BASE_URL = GC_ENV === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';

const HEADERS: HeadersInit = {
  'Authorization': `Bearer ${GC_TOKEN}`,
  'GoCardless-Version': '2015-07-06',
  'Content-Type': 'application/json',
};

// Datos de las sociedades
const SOCIEDADES = [
  {
    searchName: 'Rovida',
    fullName: 'ROVIDA S.L.',
    iban: 'ES5601280250590100083954',
    banco: 'Bankinter',
  },
  {
    searchName: 'Viroda',
    altSearchNames: ['Vidaro'],
    fullName: 'VIRODA INVERSIONES S.L.',
    iban: 'ES8801280250590100081826',
    banco: 'Bankinter',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

async function gcFetch(endpoint: string, method: string = 'GET', body?: any) {
  if (!GC_TOKEN) throw new Error('GOCARDLESS_ACCESS_TOKEN no configurado');
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GC ${method} ${endpoint}: ${JSON.stringify(data.error || data)}`);
  }
  return data;
}

function divider(title: string) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  SETUP BANCARIO: VIRODA & ROVIDA → GoCardless + Bankinter          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`  Entorno GC: ${GC_ENV} | Token: ${GC_TOKEN ? '***' + GC_TOKEN.slice(-8) : 'NO CONFIGURADO'}`);

  if (!GC_TOKEN) {
    console.error('\n  ERROR: GOCARDLESS_ACCESS_TOKEN no configurado.');
    console.error('  Configura la variable de entorno y vuelve a ejecutar.');
    process.exit(1);
  }

  // ─── 1. CREDITOR ───
  divider('1. CREDITOR GOCARDLESS (cuenta receptora de fondos)');

  try {
    const creditors = await gcFetch('/creditors');
    const creditor = creditors.creditors[0];
    console.log(`  Nombre: ${creditor.name}`);
    console.log(`  ID: ${creditor.id}`);
    console.log(`  País: ${creditor.country_code || '-'}`);
    console.log(`  Creado: ${creditor.created_at}`);

    if (creditor.scheme_identifiers) {
      const sepa = creditor.scheme_identifiers.find((s: any) => s.scheme === 'sepa_core');
      if (sepa) {
        console.log(`  SEPA ID: ${sepa.reference} (${sepa.status})`);
        if (sepa.status !== 'active') {
          console.log(`  ⚠️  SEPA no activo. Activar en GoCardless Dashboard.`);
        }
      } else {
        console.log(`  ⚠️  No hay scheme SEPA. Activar en GoCardless Dashboard.`);
      }
    }

    // Verificar cuenta bancaria donde llegan los fondos
    console.log(`\n  IMPORTANTE: Los fondos cobrados se depositan en la cuenta configurada`);
    console.log(`  en GoCardless Dashboard > Settings > Bank Account.`);
    console.log(`  Verificar que sea una cuenta de Bankinter de Viroda o Rovida.`);
  } catch (e: any) {
    console.error(`  Error: ${e.message}`);
  }

  // ─── 2. SOCIEDADES EN BD ───
  divider('2. SOCIEDADES EN BASE DE DATOS');

  for (const soc of SOCIEDADES) {
    const searchTerms = [soc.searchName, ...(soc.altSearchNames || [])];
    const company = await prisma.company.findFirst({
      where: {
        OR: searchTerms.map(t => ({
          nombre: { contains: t, mode: 'insensitive' as any },
        })),
      },
      select: {
        id: true,
        nombre: true,
        iban: true,
        cif: true,
        _count: {
          select: {
            tenants: true,
            buildings: true,
            sepaMandates: true,
            sepaPayments: true,
            gcPayouts: true,
            bankConnections: true,
          },
        },
      },
    });

    if (!company) {
      console.log(`\n  ❌ ${soc.fullName}: NO ENCONTRADA en BD`);
      continue;
    }

    console.log(`\n  ✅ ${soc.fullName}`);
    console.log(`     ID: ${company.id}`);
    console.log(`     CIF: ${company.cif || 'N/A'}`);
    console.log(`     IBAN BD: ${company.iban || 'NO CONFIGURADO'}`);
    console.log(`     IBAN real: ${soc.iban}`);
    console.log(`     Inquilinos: ${company._count.tenants}`);
    console.log(`     Edificios: ${company._count.buildings}`);
    console.log(`     Mandatos SEPA: ${company._count.sepaMandates}`);
    console.log(`     Pagos SEPA: ${company._count.sepaPayments}`);
    console.log(`     Payouts GC: ${company._count.gcPayouts}`);
    console.log(`     Conexiones bancarias: ${company._count.bankConnections}`);

    // Actualizar IBAN si no está configurado
    if (!company.iban && soc.iban) {
      await prisma.company.update({
        where: { id: company.id },
        data: { iban: soc.iban },
      });
      console.log(`     → IBAN actualizado a ${soc.iban}`);
    }

    // Verificar/crear BankConnection para Bankinter
    const existingConn = await prisma.bankConnection.findFirst({
      where: {
        companyId: company.id,
        proveedor: { in: ['bankinter_redsys', 'nordigen', 'gocardless'] },
      },
    });

    if (!existingConn) {
      // Crear conexión bancaria base para la sociedad
      await prisma.bankConnection.create({
        data: {
          companyId: company.id,
          proveedor: 'bankinter_redsys',
          provider: 'bankinter',
          nombreBanco: 'Bankinter',
          tipoCuenta: 'corriente',
          ultimosDigitos: soc.iban.slice(-4),
          moneda: 'EUR',
          estado: 'conectado',
          ultimaSync: new Date(),
          autoReconciliar: true,
        },
      });
      console.log(`     → BankConnection creada (Bankinter ****${soc.iban.slice(-4)})`);
    } else {
      console.log(`     → BankConnection existente: ${existingConn.proveedor} (${existingConn.estado})`);
    }
  }

  // ─── 3. ESTADO DE GOCARDLESS ───
  divider('3. ESTADO DE GOCARDLESS');

  try {
    const [mandates, payments, subscriptions, customers] = await Promise.all([
      gcFetch('/mandates?limit=100'),
      gcFetch('/payments?limit=5&sort_field=created_at&sort_direction=desc'),
      gcFetch('/subscriptions?limit=100'),
      gcFetch('/customers?limit=5'),
    ]);

    console.log(`  Mandatos totales: ${mandates.mandates.length}`);
    const activeM = mandates.mandates.filter((m: any) => m.status === 'active');
    console.log(`  Mandatos activos: ${activeM.length}`);

    console.log(`  Suscripciones: ${subscriptions.subscriptions.length}`);
    const activeSub = subscriptions.subscriptions.filter((s: any) => s.status === 'active');
    console.log(`  Suscripciones activas: ${activeSub.length}`);

    console.log(`  Últimos pagos:`);
    for (const p of payments.payments.slice(0, 3)) {
      console.log(`    ${p.id}: ${p.amount / 100}€ | ${p.status} | ${p.charge_date}`);
    }

    console.log(`  Clientes (muestra): ${customers.customers.length}`);
  } catch (e: any) {
    console.error(`  Error: ${e.message}`);
  }

  // ─── 4. TRANSACCIONES BANCARIAS IMPORTADAS ───
  divider('4. MOVIMIENTOS BANCARIOS IMPORTADOS (CAMT.053)');

  for (const soc of SOCIEDADES) {
    const searchTerms = [soc.searchName, ...(soc.altSearchNames || [])];
    const company = await prisma.company.findFirst({
      where: {
        OR: searchTerms.map(t => ({
          nombre: { contains: t, mode: 'insensitive' as any },
        })),
      },
      select: { id: true, nombre: true },
    });

    if (!company) continue;

    const txCount = await prisma.bankTransaction.count({
      where: { companyId: company.id },
    });

    const reconCount = await prisma.bankTransaction.count({
      where: { companyId: company.id, estado: 'conciliado' },
    });

    const pendCount = await prisma.bankTransaction.count({
      where: { companyId: company.id, estado: 'pendiente_revision' },
    });

    const lastTx = await prisma.bankTransaction.findFirst({
      where: { companyId: company.id },
      orderBy: { fecha: 'desc' },
      select: { fecha: true, monto: true, descripcion: true },
    });

    console.log(`\n  ${company.nombre}:`);
    console.log(`    Total movimientos: ${txCount}`);
    console.log(`    Conciliados: ${reconCount}`);
    console.log(`    Pendientes revisión: ${pendCount}`);
    if (lastTx) {
      console.log(`    Último: ${lastTx.fecha.toISOString().split('T')[0]} | ${lastTx.monto}€ | ${lastTx.descripcion?.substring(0, 50)}`);
    }
  }

  // ─── 5. PAGOS DE ALQUILER ───
  divider('5. PAGOS DE ALQUILER EN INMOVA');

  for (const soc of SOCIEDADES) {
    const searchTerms = [soc.searchName, ...(soc.altSearchNames || [])];
    const company = await prisma.company.findFirst({
      where: {
        OR: searchTerms.map(t => ({
          nombre: { contains: t, mode: 'insensitive' as any },
        })),
      },
      select: { id: true, nombre: true },
    });

    if (!company) continue;

    const [totalPay, pendPay, pagadoPay, vencidoPay] = await Promise.all([
      prisma.payment.count({ where: { contract: { unit: { building: { companyId: company.id } } } } }),
      prisma.payment.count({ where: { contract: { unit: { building: { companyId: company.id } } }, estado: 'pendiente' } }),
      prisma.payment.count({ where: { contract: { unit: { building: { companyId: company.id } } }, estado: 'pagado' } }),
      prisma.payment.count({ where: { contract: { unit: { building: { companyId: company.id } } }, estado: 'vencido' } }),
    ]);

    console.log(`\n  ${company.nombre}:`);
    console.log(`    Total pagos: ${totalPay}`);
    console.log(`    Pendientes: ${pendPay}`);
    console.log(`    Pagados: ${pagadoPay}`);
    console.log(`    Vencidos: ${vencidoPay}`);
  }

  // ─── 6. RESUMEN Y PRÓXIMOS PASOS ───
  divider('6. RESUMEN Y PRÓXIMOS PASOS');

  console.log(`
  ARQUITECTURA BANCARIA:

  ┌────────────────┐     SEPA DD      ┌──────────────┐
  │   INQUILINO    │ ──────────────── │  GoCardless  │
  │  (cuenta IBAN) │  Domiciliación   │   (cobros)   │
  └────────────────┘                  └──────┬───────┘
                                             │ Payout (3-5 días)
                                             ▼
                                     ┌───────────────┐
                                     │   BANKINTER   │
                                     │  Viroda/Rovida │
                                     │  (cuenta IBAN) │
                                     └───────┬───────┘
                                             │ Nordigen / CAMT.053
                                             ▼
                                     ┌───────────────┐
                                     │   INMOVA APP  │
                                     │ (conciliación)│
                                     └───────────────┘

  ENDPOINTS DISPONIBLES:

  Configuración inquilinos:
    POST /api/gocardless/setup-tenant     → Alta inquilino + mandato SEPA
    GET  /api/gocardless/callback         → Callback autorización mandato

  Cobros:
    POST /api/gocardless/payments         → Cobro único
    POST /api/gocardless/subscriptions    → Cobro recurrente mensual

  Gestión:
    GET  /api/gocardless/mandates         → Lista mandatos SEPA
    GET  /api/gocardless/payments         → Lista pagos
    GET  /api/gocardless/subscriptions    → Lista suscripciones
    GET  /api/gocardless/payouts          → Transferencias a Bankinter
    GET  /api/gocardless/stats            → Dashboard stats

  Conciliación:
    POST /api/gocardless/sync             → Sincronizar desde GC API
    POST /api/gocardless/reconcile        → Conciliar SEPA ↔ pagos alquiler
    POST /api/banking/reconcile-unified   → Conciliación 3 capas (GC+Bankinter+pagos)
    POST /api/gocardless/webhook          → Webhook eventos GC

  Lectura bancaria:
    POST /api/open-banking/nordigen/connect   → Conectar Bankinter via Nordigen
    POST /api/open-banking/bankinter/sync     → Sincronizar movimientos

  Dashboard:
    /pagos/sepa                          → Gestión pagos SEPA
    /finanzas/conciliacion               → Conciliación bancaria

  WEBHOOK GOCARDLESS:
    Configurar en Dashboard > Developers > Webhooks:
    URL: https://inmovaapp.com/api/gocardless/webhook
    Secret: guardar en GOCARDLESS_WEBHOOK_SECRET

  PASOS PARA ACTIVAR COBROS:

  1. Verificar que el SEPA Scheme está activo en GoCardless Dashboard
  2. Para cada inquilino con contrato activo:
     a. POST /api/gocardless/setup-tenant → obtener redirectUrl
     b. Enviar redirectUrl al inquilino (email/WhatsApp)
     c. Inquilino autoriza domiciliación SEPA
     d. POST /api/gocardless/subscriptions → cobro mensual automático
  3. Configurar webhook para conciliación automática
  4. Conectar cuentas Bankinter via Nordigen para lectura de movimientos
  `);

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  SETUP COMPLETADO                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
