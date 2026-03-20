import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/banking/setup-status
 *
 * Diagnóstico completo del estado de la integración bancaria.
 * Verifica credenciales, conectividad y estado en BD.
 * Solo accesible para super_admin y administrador.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!['super_admin', 'administrador'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      integrations: {
        enablebanking: await checkEnableBanking(),
        nordigen: await checkNordigen(),
        saltedge: await checkSaltEdge(),
        gocardless: await checkGoCardless(),
        tink: checkTink(),
      },
      database: await checkDatabase(session.user.companyId),
      recommendations: [] as string[],
    };

    // Generar recomendaciones
    const ebOk =
      (status.integrations as any).enablebanking?.configured &&
      (status.integrations as any).enablebanking?.connected;
    const nordigenOk =
      status.integrations.nordigen.configured && status.integrations.nordigen.connected;
    const saltEdgeOk =
      status.integrations.saltedge.configured && status.integrations.saltedge.connected;

    if (!ebOk && !nordigenOk && !saltEdgeOk) {
      status.recommendations.push(
        'ACCIÓN REQUERIDA: Añadir ENABLE_BANKING_PRIVATE_KEY al .env.production. ' +
          'Descargar desde Enable Banking Dashboard → Applications → ' +
          '66042e75-0fb2-4105-894a-1c55e518efa0 → Keys. ' +
          'ENABLE_BANKING_APP_ID ya está configurado.'
      );
    } else if (ebOk) {
      // Enable Banking está OK — no hace falta recomendación
    } else if (!nordigenOk && !saltEdgeOk) {
      status.recommendations.push(
        'Open Banking: usar importación manual CAMT.053 desde Bankinter (disponible en Finanzas → Conciliación → Importar) ' +
          'mientras se configura Enable Banking.'
      );
    }
    if (!status.integrations.gocardless.configured) {
      status.recommendations.push(
        'Configurar GoCardless Payments para cobro SEPA Direct Debit a inquilinos. ' +
          'Registro en: https://manage.gocardless.com/'
      );
    }
    if (
      status.integrations.gocardless.configured &&
      status.integrations.gocardless.environment === 'sandbox'
    ) {
      status.recommendations.push(
        'GoCardless está en modo SANDBOX. Para producción: cambiar GOCARDLESS_ENVIRONMENT=live y usar token live_...'
      );
    }
    if (status.database.pendingReconciliation > 0) {
      status.recommendations.push(
        `Hay ${status.database.pendingReconciliation} pagos SEPA confirmados sin conciliar. ` +
          'Ejecutar conciliación desde /api/banking/reconcile-unified'
      );
    }

    return NextResponse.json(status);
  } catch (error: any) {
    logger.error('[Banking Setup Status Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// ENABLE BANKING CHECK
// ─────────────────────────────────────────────────────────────

async function checkEnableBanking() {
  const appId = process.env.ENABLE_BANKING_APP_ID;
  const privateKey = process.env.ENABLE_BANKING_PRIVATE_KEY;

  if (!appId) {
    return {
      configured: false,
      connected: false,
      note: 'ENABLE_BANKING_APP_ID no configurado. App ID disponible: 66042e75-0fb2-4105-894a-1c55e518efa0',
    };
  }

  if (!privateKey) {
    return {
      configured: false,
      connected: false,
      appIdPresent: true,
      note: 'ENABLE_BANKING_PRIVATE_KEY falta. Descarga la clave privada desde Enable Banking Dashboard → Applications → tu app → Keys',
      dashboardUrl: 'https://enablebanking.com/dashboard',
    };
  }

  try {
    const { testConnection, getBankinterInfo } = await import('@/lib/enablebanking-service');
    const test = await testConnection();
    if (!test.ok) {
      return { configured: true, connected: false, error: test.message };
    }
    const bankinter = await getBankinterInfo();
    return {
      configured: true,
      connected: true,
      message: test.message,
      bankinterAvailable: !!bankinter,
    };
  } catch (err: any) {
    return { configured: true, connected: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// SALT EDGE CHECK
// ─────────────────────────────────────────────────────────────

async function checkSaltEdge() {
  const appId = process.env.SALTEDGE_APP_ID;
  const secret = process.env.SALTEDGE_SECRET;

  if (!appId || !secret) {
    return {
      configured: false,
      connected: false,
      note: 'Alternativa a Nordigen. Sin licencia TPP. Registro: https://www.saltedge.com/partner_program',
    };
  }

  try {
    const { testConnection, getBankinterProvider } = await import('@/lib/saltedge-service');
    const test = await testConnection();
    if (!test.ok) {
      return { configured: true, connected: false, error: test.message };
    }
    const bankinter = await getBankinterProvider();
    return {
      configured: true,
      connected: true,
      message: test.message,
      bankinterAvailable: !!bankinter,
      bankinterCode: bankinter?.code || null,
    };
  } catch (err: any) {
    return { configured: true, connected: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// NORDIGEN CHECK
// ─────────────────────────────────────────────────────────────

async function checkNordigen() {
  const secretId = process.env.NORDIGEN_SECRET_ID;
  const secretKey = process.env.NORDIGEN_SECRET_KEY;

  if (!secretId || !secretKey) {
    return {
      configured: false,
      connected: false,
      error: 'NORDIGEN_SECRET_ID o NORDIGEN_SECRET_KEY no configurados',
      setupUrl: 'https://bankaccountdata.gocardless.com/',
    };
  }

  try {
    const tokenRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return {
        configured: true,
        connected: false,
        error: `Auth failed (${tokenRes.status}): ${err.substring(0, 200)}`,
      };
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.access) {
      return {
        configured: true,
        connected: false,
        error: 'No se obtuvo token de acceso',
      };
    }

    // Verificar que Bankinter está disponible
    const banksRes = await fetch(
      'https://bankaccountdata.gocardless.com/api/v2/institutions/?country=ES',
      {
        headers: { Authorization: `Bearer ${tokenData.access}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    let bankinterFound = false;
    let bankinterInstitutionId = 'BANKINTER_BKBKESMMXXX';
    let totalBanks = 0;

    if (banksRes.ok) {
      const banks: any[] = await banksRes.json();
      totalBanks = banks.length;
      const bankinter = banks.find(
        (b: any) => b.name.toLowerCase().includes('bankinter') || b.id === 'BANKINTER_BKBKESMMXXX'
      );
      if (bankinter) {
        bankinterFound = true;
        bankinterInstitutionId = bankinter.id;
      }
    }

    return {
      configured: true,
      connected: true,
      totalBanksES: totalBanks,
      bankinterAvailable: bankinterFound,
      bankinterInstitutionId,
      tokenExpiresAt: tokenData.access_expires
        ? new Date(tokenData.access_expires * 1000).toISOString()
        : null,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      error: `Network error: ${err.message}`,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// GOCARDLESS PAYMENTS CHECK
// ─────────────────────────────────────────────────────────────

async function checkGoCardless() {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN;
  const env = process.env.GOCARDLESS_ENVIRONMENT || 'live';
  const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;

  if (!token) {
    return {
      configured: false,
      connected: false,
      error: 'GOCARDLESS_ACCESS_TOKEN no configurado',
      setupUrl: 'https://manage.gocardless.com/sign-up',
    };
  }

  const baseUrl =
    env === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';

  try {
    const res = await fetch(`${baseUrl}/creditors`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'GoCardless-Version': '2015-07-06',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as any).error?.message || res.statusText;
      return {
        configured: true,
        connected: false,
        environment: env,
        error: `API error (${res.status}): ${msg}`,
        webhookConfigured: !!webhookSecret,
      };
    }

    const data = await res.json();
    const creditors: any[] = data.creditors || [];
    const creditor = creditors[0];

    const schemes =
      creditor?.scheme_identifiers?.map((s: any) => ({
        scheme: s.scheme,
        reference: s.reference,
        status: s.status,
      })) || [];

    const sepaActive = schemes.some(
      (s: any) => (s.scheme === 'sepa_core' || s.scheme === 'sepa_cor1') && s.status === 'active'
    );

    return {
      configured: true,
      connected: true,
      environment: env,
      isLive: env === 'live',
      creditorName: creditor?.name,
      creditorCountry: creditor?.country_code,
      schemes,
      sepaActive,
      webhookConfigured: !!webhookSecret,
      webhookUrl: 'https://inmovaapp.com/api/gocardless/webhook',
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      environment: env,
      error: `Network error: ${err.message}`,
      webhookConfigured: !!webhookSecret,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// TINK CHECK (solo configuración, sin llamada API)
// ─────────────────────────────────────────────────────────────

function checkTink() {
  const clientId = process.env.TINK_CLIENT_ID;
  const clientSecret = process.env.TINK_CLIENT_SECRET;
  const env = process.env.TINK_ENVIRONMENT || 'production';

  return {
    configured: !!(clientId && clientSecret),
    environment: env,
    note: 'Tink requiere licencia TPP en producción. Se recomienda usar Nordigen (GoCardless Bank Account Data) como alternativa sin licencia.',
  };
}

// ─────────────────────────────────────────────────────────────
// DATABASE CHECK
// ─────────────────────────────────────────────────────────────

async function checkDatabase(companyId?: string) {
  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const [
      activeConnections,
      activeMandates,
      totalMandates,
      pendingRecon,
      bankTxTotal,
      bankTxPending,
    ] = await Promise.all([
      prisma.bankConnection.count({
        where: { estado: 'conectado', ...(companyId ? { companyId } : {}) },
      }),
      prisma.sepaMandate.count({
        where: { status: 'active', ...(companyId ? { companyId } : {}) },
      }),
      prisma.sepaMandate.count({
        where: { ...(companyId ? { companyId } : {}) },
      }),
      prisma.sepaPayment.count({
        where: {
          conciliado: false,
          status: { in: ['confirmed', 'paid_out'] },
          ...(companyId ? { companyId } : {}),
        },
      }),
      prisma.bankTransaction.count({
        where: { ...(companyId ? { companyId } : {}) },
      }),
      prisma.bankTransaction.count({
        where: {
          estado: 'pendiente_revision',
          ...(companyId ? { companyId } : {}),
        },
      }),
    ]);

    // Obtener conexiones con detalles
    const connections = await prisma.bankConnection.findMany({
      where: { ...(companyId ? { companyId } : {}) },
      select: {
        id: true,
        proveedor: true,
        nombreBanco: true,
        estado: true,
        ultimaSync: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      bankConnections: {
        active: activeConnections,
        list: connections.map((c) => ({
          id: c.id,
          provider: c.proveedor,
          bank: c.nombreBanco,
          status: c.estado,
          lastSync: c.ultimaSync?.toISOString() ?? null,
        })),
      },
      sepaMandates: { active: activeMandates, total: totalMandates },
      pendingReconciliation: pendingRecon,
      bankTransactions: { total: bankTxTotal, pendingReview: bankTxPending },
    };
  } catch (err: any) {
    return {
      error: `DB error: ${err.message.substring(0, 100)}`,
      bankConnections: { active: 0, list: [] },
      sepaMandates: { active: 0, total: 0 },
      pendingReconciliation: 0,
      bankTransactions: { total: 0, pendingReview: 0 },
    };
  }
}
