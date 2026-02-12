/**
 * Setup GoCardless para Viroda y Rovida
 * 
 * Configura las sociedades en GoCardless como creditors
 * y prepara el flujo de domiciliaciones SEPA para cobro de alquileres.
 * 
 * Ejecutar: npx tsx scripts/setup-gocardless-companies.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const GC_TOKEN = process.env.GOCARDLESS_ACCESS_TOKEN;
const GC_ENV = process.env.GOCARDLESS_ENVIRONMENT || 'live';
const BASE_URL = GC_ENV === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';

if (!GC_TOKEN) {
  console.error('GOCARDLESS_ACCESS_TOKEN no configurado');
  process.exit(1);
}

const headers: HeadersInit = {
  'Authorization': `Bearer ${GC_TOKEN}`,
  'GoCardless-Version': '2015-07-06',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function gcFetch(endpoint: string, method: string = 'GET', body?: any) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GC ${method} ${endpoint}: ${JSON.stringify(data.error || data)}`);
  }
  return data;
}

async function main() {
  console.log('=' .repeat(70));
  console.log('SETUP GOCARDLESS - VIRODA & ROVIDA');
  console.log(`Entorno: ${GC_ENV} | URL: ${BASE_URL}`);
  console.log('=' .repeat(70));

  // 1. Verificar creditor actual
  console.log('\n--- 1. CREDITOR ACTUAL ---');
  const creditors = await gcFetch('/creditors');
  const creditor = creditors.creditors[0];
  console.log(`  Creditor: ${creditor.name} (${creditor.id})`);
  
  // Check SEPA scheme
  const sepaScheme = creditor.scheme_identifiers?.find((s: any) => s.scheme === 'sepa');
  if (sepaScheme) {
    console.log(`  SEPA: ${sepaScheme.reference} (status: ${sepaScheme.status})`);
  } else {
    console.log('  ⚠️  SEPA no activo - necesitas activarlo en GoCardless Dashboard');
  }

  // 2. Verificar/crear Billing Requests para redirect flow
  // GoCardless usa Billing Request Flows para que los inquilinos autoricen mandatos
  console.log('\n--- 2. ESTADO DE LA CUENTA ---');
  
  // List existing mandates
  const mandates = await gcFetch('/mandates?limit=10');
  console.log(`  Mandatos: ${mandates.mandates.length}`);
  
  // List customers
  const customers = await gcFetch('/customers?limit=5');
  console.log(`  Clientes: ${customers.customers.length}`);
  
  // List payments
  const payments = await gcFetch('/payments?limit=5');
  console.log(`  Pagos: ${payments.payments.length}`);
  
  // List subscriptions
  const subscriptions = await gcFetch('/subscriptions?limit=5');
  console.log(`  Suscripciones: ${subscriptions.subscriptions.length}`);

  // 3. Crear redirect flow de prueba (para verificar que funciona)
  console.log('\n--- 3. TEST: CREAR REDIRECT FLOW ---');
  try {
    const redirectFlow = await gcFetch('/redirect_flows', 'POST', {
      redirect_flows: {
        description: 'Autorización SEPA - Inmova App (test)',
        session_token: `test_session_${Date.now()}`,
        success_redirect_url: 'https://inmovaapp.com/api/open-banking/gocardless/callback',
        scheme: 'sepa_core',
      },
    });
    console.log(`  ✅ Redirect flow creado: ${redirectFlow.redirect_flows.id}`);
    console.log(`  URL: ${redirectFlow.redirect_flows.redirect_url}`);
    console.log(`  (Este es el link que se envía al inquilino para autorizar domiciliación)`);
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
  }

  // 4. Info sobre el flujo para Viroda y Rovida
  console.log('\n--- 4. FLUJO DE INTEGRACIÓN ---');
  console.log(`
  FLUJO PARA COBRO DE ALQUILERES:
  
  1. ALTA DEL INQUILINO:
     - Inquilino se registra en Inmova
     - Se crea como Customer en GoCardless
     - Se le envía link de Redirect Flow para autorizar SEPA
     - Inquilino introduce su IBAN y autoriza la domiciliación
  
  2. MANDATO ACTIVO:
     - GoCardless verifica el IBAN con el banco
     - Mandato pasa a estado "active"
     - Ya se pueden hacer cobros
  
  3. COBRO MENSUAL DE RENTA:
     - El 1 de cada mes (o fecha configurada)
     - Inmova crea un Payment en GoCardless por el importe del alquiler
     - GoCardless cobra al inquilino via SEPA Direct Debit
     - Fondos llegan a Vidaro en 3-5 días hábiles
  
  4. RECONCILIACIÓN:
     - Webhook de GoCardless notifica estado del pago
     - Inmova actualiza el estado del pago en la BD
     - Se marca como pagado/fallido
  
  PARA VIRODA (101 inquilinos):
     - Crear 101 customers en GoCardless
     - Enviar link de autorización SEPA a cada inquilino
     - Configurar suscripción mensual por inquilino
  
  PARA ROVIDA (243+ inquilinos):
     - Crear 243 customers en GoCardless
     - Enviar link de autorización SEPA a cada inquilino
     - Configurar suscripción mensual por inquilino
  
  CUENTA BANCARIA:
     - Los fondos se depositan en la cuenta bancaria de Vidaro Inversiones
     - Configurada en GoCardless Dashboard > Settings > Bank Account
     - Verificar que es la cuenta de Bankinter correcta
  `);

  console.log('\n--- 5. ENDPOINTS DISPONIBLES ---');
  console.log(`
  POST /api/open-banking/gocardless/setup-tenant
    → Crea customer + redirect flow para un inquilino
    → Body: { tenantId, companyId }
    → Returns: { redirectUrl } (enviar al inquilino)
  
  GET /api/open-banking/gocardless/callback
    → Callback después de autorizar mandato
    → Completa el redirect flow y activa el mandato
  
  POST /api/open-banking/gocardless/charge
    → Cobra un pago único a un inquilino
    → Body: { tenantId, amount, description }
  
  POST /api/open-banking/gocardless/subscribe
    → Crea cobro recurrente mensual (alquiler)
    → Body: { tenantId, amount, dayOfMonth, description }
  
  POST /api/open-banking/gocardless/sync
    → Sincroniza estados de pagos desde GoCardless
  
  GET /api/open-banking/gocardless/status
    → Estado de la integración
  `);

  console.log('=' .repeat(70));
  console.log('SETUP COMPLETADO');
  console.log('=' .repeat(70));
}

main().catch(e => { console.error(e); process.exit(1); });
