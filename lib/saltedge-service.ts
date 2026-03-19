/**
 * SALT EDGE PARTNER PROGRAM — Open Banking sin licencia TPP
 *
 * Alternativa a GoCardless Bank Account Data (Nordigen) dado que
 * Nordigen ha desactivado nuevos registros en 2025.
 *
 * Salt Edge actúa como AISP regulado. Tú accedes a sus datos
 * como partner sin necesitar licencia PSD2 propia.
 *
 * Cobertura: 2500+ bancos EU incluyendo Bankinter, BBVA, Santander, etc.
 *
 * Registro: https://www.saltedge.com/partner_program
 * Docs API: https://docs.saltedge.com/partners/v1/
 * Dashboard: https://www.saltedge.com/dashboard
 *
 * Variables env requeridas:
 *   SALTEDGE_APP_ID     — App ID del dashboard
 *   SALTEDGE_SECRET     — Secret del dashboard
 *   SALTEDGE_CUSTOMER_SECRET — Secret del customer (generado al crear customer)
 *
 * @module lib/saltedge-service
 */

import logger from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const SALTEDGE_APP_ID = process.env.SALTEDGE_APP_ID || '';
const SALTEDGE_SECRET = process.env.SALTEDGE_SECRET || '';
const SALTEDGE_BASE_URL = 'https://www.saltedge.com/api/partners/v1';

export function isSaltEdgeConfigured(): boolean {
  return !!(SALTEDGE_APP_ID && SALTEDGE_SECRET);
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SaltEdgeCustomer {
  id: string;
  identifier: string; // tu ID interno para este customer
  secret: string; // necesario para las peticiones del customer
  createdAt: string;
  updatedAt: string;
}

export interface SaltEdgeConnection {
  id: string;
  customerId: string;
  providerCode: string; // e.g. "bankinter_xo_es"
  providerName: string; // e.g. "Bankinter"
  status: 'active' | 'inactive' | 'disabled' | 'expired' | 'errored';
  categorized: boolean;
  createdAt: string;
  updatedAt: string;
  lastSuccessAt?: string;
  lastFail?: { at: string; message: string; class: string };
  countryCode: string;
}

export interface SaltEdgeAccount {
  id: string;
  connectionId: string;
  name: string;
  nature: 'account' | 'card' | 'savings' | 'bonus' | 'checking';
  balance: number;
  currencyCode: string;
  iban?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  extra?: {
    iban?: string;
    swiftCode?: string;
    sortCode?: string;
    accountName?: string;
  };
}

export interface SaltEdgeTransaction {
  id: string;
  duplicated: boolean;
  mode: 'normal' | 'fee' | 'transfer';
  status: 'posted' | 'pending';
  madeOn: string; // YYYY-MM-DD
  amount: number;
  currencyCode: string;
  description: string;
  category: string;
  accountId: string;
  connectionId: string;
  createdAt: string;
  updatedAt: string;
  extra?: {
    originalAmount?: number;
    originalCurrencyCode?: string;
    creditorName?: string;
    debtorName?: string;
    creditorIban?: string;
    debtorIban?: string;
    payee?: string;
    payer?: string;
    payeeInformation?: string;
    payerInformation?: string;
  };
}

export interface SaltEdgeProvider {
  code: string;
  name: string;
  status: 'active' | 'inactive' | 'disabled';
  countryCode: string;
  homepage?: string;
  logoUrl?: string;
  mode: 'oauth' | 'web' | 'api' | 'file';
  authorizationMethod?: string;
  instructionalDocumentUrl?: string;
}

export interface SaltEdgeConnectSession {
  connectUrl: string;
  expiresAt: string;
  token?: string;
}

// ═══════════════════════════════════════════════════════════════
// HTTP HELPER
// ═══════════════════════════════════════════════════════════════

async function saltEdgeRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
  customerSecret?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'App-id': SALTEDGE_APP_ID,
    Secret: SALTEDGE_SECRET,
  };

  if (customerSecret) {
    headers['Customer-secret'] = customerSecret;
  }

  const response = await fetch(`${SALTEDGE_BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify({ data: body }) } : {}),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || (err as any)?.error?.class || response.statusText;
    throw new Error(`Salt Edge ${method} ${path} (${response.status}): ${msg}`);
  }

  const json = await response.json();
  return json.data as T;
}

// ═══════════════════════════════════════════════════════════════
// TEST DE CONEXIÓN
// ═══════════════════════════════════════════════════════════════

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSaltEdgeConfigured()) {
    return {
      ok: false,
      message:
        'SALTEDGE_APP_ID y SALTEDGE_SECRET no configurados. Registro en https://www.saltedge.com/partner_program',
    };
  }

  try {
    // Listar providers es una llamada pública autenticada — buen test
    const providers = await saltEdgeRequest<SaltEdgeProvider[]>(
      'GET',
      '/providers?country_code=ES&mode=oauth&status=active&per_page=5'
    );
    return {
      ok: true,
      message: `Conectado. ${Array.isArray(providers) ? providers.length : '?'} providers activos en España (muestra)`,
    };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// PROVIDERS (bancos disponibles)
// ═══════════════════════════════════════════════════════════════

/**
 * Lista bancos disponibles para un país
 */
export async function getProviders(countryCode = 'ES'): Promise<SaltEdgeProvider[]> {
  if (!isSaltEdgeConfigured()) return [];

  try {
    const providers = await saltEdgeRequest<SaltEdgeProvider[]>(
      'GET',
      `/providers?country_code=${countryCode}&mode=oauth&status=active&per_page=100`
    );
    logger.info(
      `[SaltEdge] ${Array.isArray(providers) ? providers.length : 0} providers para ${countryCode}`
    );
    return Array.isArray(providers) ? providers : [];
  } catch (err: any) {
    logger.error('[SaltEdge] Error listando providers:', err.message);
    return [];
  }
}

/**
 * Busca el provider de Bankinter
 */
export async function getBankinterProvider(): Promise<SaltEdgeProvider | null> {
  const providers = await getProviders('ES');
  return (
    providers.find(
      (p) =>
        p.code.toLowerCase().includes('bankinter') || p.name.toLowerCase().includes('bankinter')
    ) || null
  );
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS (uno por empresa/sociedad)
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un customer en Salt Edge.
 * Cada sociedad (ROVIDA, VIRODA) necesita su propio customer.
 * El `identifier` es tu ID interno (e.g. companyId de Inmova).
 */
export async function createCustomer(identifier: string): Promise<SaltEdgeCustomer> {
  const customer = await saltEdgeRequest<SaltEdgeCustomer>('POST', '/customers', {
    identifier,
  });
  logger.info(`[SaltEdge] Customer creado: ${customer.id} (${identifier})`);
  return customer;
}

/**
 * Obtiene un customer por su identifier interno
 */
export async function getCustomerByIdentifier(
  identifier: string
): Promise<SaltEdgeCustomer | null> {
  try {
    const customers = await saltEdgeRequest<SaltEdgeCustomer[]>(
      'GET',
      `/customers?identifier=${encodeURIComponent(identifier)}`
    );
    return Array.isArray(customers) && customers.length > 0 ? customers[0] : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CONNECT SESSION (autorización bancaria)
// ═══════════════════════════════════════════════════════════════

/**
 * Crea una sesión de conexión.
 * Devuelve una URL a la que redirigir al usuario para que
 * autorice el acceso a su banco.
 *
 * Una vez completado, Salt Edge llama al callback con `connection_id` y `connection_secret`.
 */
export async function createConnectSession(params: {
  customerSecret: string;
  providerCode?: string; // si se conoce de antemano (e.g. "bankinter_xo_es")
  callbackUrl: string;
  companyId: string;
  fromDate?: string; // YYYY-MM-DD (histórico a cargar)
}): Promise<SaltEdgeConnectSession> {
  const body: Record<string, unknown> = {
    customer_secret: params.customerSecret,
    consent: {
      scopes: ['account_details', 'transactions_details'],
      from_date:
        params.fromDate ||
        new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 años atrás
    },
    attempt: {
      return_to: params.callbackUrl,
      store_credentials: true,
    },
  };

  if (params.providerCode) {
    body['provider_code'] = params.providerCode;
  }

  const session = await saltEdgeRequest<{ connect_url: string; expires_at: string }>(
    'POST',
    '/connect_sessions/create',
    body
  );

  logger.info(`[SaltEdge] Connect session creada → ${session.connect_url}`);

  return {
    connectUrl: session.connect_url,
    expiresAt: session.expires_at,
  };
}

// ═══════════════════════════════════════════════════════════════
// CONNECTIONS (conexiones bancarias)
// ═══════════════════════════════════════════════════════════════

/**
 * Lista conexiones de un customer
 */
export async function listConnections(customerSecret: string): Promise<SaltEdgeConnection[]> {
  try {
    const connections = await saltEdgeRequest<SaltEdgeConnection[]>(
      'GET',
      '/connections',
      undefined,
      customerSecret
    );
    return Array.isArray(connections) ? connections : [];
  } catch (err: any) {
    logger.error('[SaltEdge] Error listando connections:', err.message);
    return [];
  }
}

/**
 * Obtiene una conexión por ID
 */
export async function getConnection(
  connectionId: string,
  customerSecret: string
): Promise<SaltEdgeConnection | null> {
  try {
    const conn = await saltEdgeRequest<SaltEdgeConnection>(
      'GET',
      `/connections/${connectionId}`,
      undefined,
      customerSecret
    );
    return conn;
  } catch {
    return null;
  }
}

/**
 * Elimina (desconecta) una conexión bancaria
 */
export async function deleteConnection(
  connectionId: string,
  customerSecret: string
): Promise<boolean> {
  try {
    await saltEdgeRequest<unknown>(
      'DELETE',
      `/connections/${connectionId}`,
      undefined,
      customerSecret
    );
    logger.info(`[SaltEdge] Connection ${connectionId} eliminada`);
    return true;
  } catch (err: any) {
    logger.error('[SaltEdge] Error eliminando connection:', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNTS (cuentas bancarias)
// ═══════════════════════════════════════════════════════════════

/**
 * Lista cuentas de una conexión
 */
export async function listAccounts(
  connectionId: string,
  customerSecret: string
): Promise<SaltEdgeAccount[]> {
  try {
    const accounts = await saltEdgeRequest<SaltEdgeAccount[]>(
      'GET',
      `/accounts?connection_id=${connectionId}`,
      undefined,
      customerSecret
    );
    return Array.isArray(accounts) ? accounts : [];
  } catch (err: any) {
    logger.error('[SaltEdge] Error listando accounts:', err.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTIONS (movimientos bancarios)
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene transacciones de una cuenta.
 * Salt Edge pagina con `next_id` — esta función itera todas las páginas.
 *
 * @param accountId   ID de la cuenta en Salt Edge
 * @param customerSecret  Customer secret
 * @param fromDate    Fecha inicio YYYY-MM-DD (opcional)
 * @param toDate      Fecha fin YYYY-MM-DD (opcional)
 * @param maxPages    Máximo de páginas a obtener (seguridad, default 20)
 */
export async function getTransactions(
  accountId: string,
  customerSecret: string,
  fromDate?: string,
  toDate?: string,
  maxPages = 20
): Promise<SaltEdgeTransaction[]> {
  const transactions: SaltEdgeTransaction[] = [];

  let url = `/transactions?account_id=${accountId}&per_page=1000`;
  if (fromDate) url += `&from_date=${fromDate}`;
  if (toDate) url += `&to_date=${toDate}`;

  let page = 0;
  let nextId: string | null = null;

  while (page < maxPages) {
    const pageUrl = nextId ? `${url}&next_id=${nextId}` : url;

    try {
      const response = await fetch(`${SALTEDGE_BASE_URL}${pageUrl}`, {
        headers: {
          Accept: 'application/json',
          'App-id': SALTEDGE_APP_ID,
          Secret: SALTEDGE_SECRET,
          'Customer-secret': customerSecret,
        },
      });

      if (!response.ok) break;

      const json = await response.json();
      const batch: SaltEdgeTransaction[] = json.data || [];
      transactions.push(...batch);

      // Salt Edge devuelve meta.next_id para la siguiente página
      nextId = json.meta?.next_id || null;
      page++;

      if (!nextId || batch.length === 0) break;
    } catch (err: any) {
      logger.error(`[SaltEdge] Error en página ${page} de transacciones:`, err.message);
      break;
    }
  }

  logger.info(
    `[SaltEdge] ${transactions.length} transacciones obtenidas para account ${accountId}`
  );
  return transactions;
}

// ═══════════════════════════════════════════════════════════════
// SYNC (descargar y guardar en BD)
// ═══════════════════════════════════════════════════════════════

/**
 * Descarga todas las transacciones nuevas de todas las conexiones
 * Salt Edge activas de una empresa y las guarda en BankTransaction.
 */
export async function syncSaltEdgeTransactions(companyId: string): Promise<{
  connections: number;
  newTransactions: number;
  updatedTransactions: number;
  errors: string[];
}> {
  const result = {
    connections: 0,
    newTransactions: 0,
    updatedTransactions: 0,
    errors: [] as string[],
  };

  if (!isSaltEdgeConfigured()) {
    logger.info('[SaltEdge] No configurado, saltando sync');
    return result;
  }

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  // Buscar conexiones Salt Edge activas en BD
  const connections = await prisma.bankConnection.findMany({
    where: {
      companyId,
      proveedor: 'saltedge',
      estado: 'conectado',
      accessToken: { not: null },
    },
    select: {
      id: true,
      accessToken: true, // Salt Edge connection_id
      refreshToken: true, // Salt Edge customer_secret
      ultimaSync: true,
      nombreBanco: true,
    },
  });

  result.connections = connections.length;
  if (connections.length === 0) return result;

  for (const conn of connections) {
    try {
      const connectionId = conn.accessToken!;
      const customerSecret = conn.refreshToken!;
      if (!connectionId || !customerSecret) continue;

      // Obtener cuentas de la conexión
      const accounts = await listAccounts(connectionId, customerSecret);
      if (accounts.length === 0) {
        result.errors.push(`No accounts for connection ${connectionId}`);
        continue;
      }

      // Calcular rango de fechas
      const fromDate = conn.ultimaSync
        ? new Date(conn.ultimaSync.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];

      for (const account of accounts) {
        try {
          const txs = await getTransactions(account.id, customerSecret, fromDate, toDate);

          for (const tx of txs) {
            // Salt Edge usa IDs propios — usarlos como proveedorTxId
            const txId = `saltedge_${tx.id}`;

            try {
              const existing = await prisma.bankTransaction.findUnique({
                where: { proveedorTxId: txId },
                select: { id: true },
              });

              const iban = account.extra?.iban || account.iban;

              const txData = {
                descripcion: tx.description || tx.category || 'Sin descripción',
                monto: tx.amount,
                creditorName: tx.extra?.creditorName || tx.extra?.payee || null,
                debtorName: tx.extra?.debtorName || tx.extra?.payer || null,
                creditorIban: tx.extra?.creditorIban || null,
                debtorIban: tx.extra?.debtorIban || null,
              };

              if (existing) {
                await prisma.bankTransaction.update({
                  where: { proveedorTxId: txId },
                  data: txData,
                });
                result.updatedTransactions++;
              } else {
                await prisma.bankTransaction.create({
                  data: {
                    companyId,
                    connectionId: conn.id,
                    proveedorTxId: txId,
                    fecha: new Date(tx.madeOn),
                    descripcion: txData.descripcion,
                    monto: txData.monto,
                    moneda: tx.currencyCode || 'EUR',
                    creditorName: txData.creditorName,
                    debtorName: txData.debtorName,
                    creditorIban: txData.creditorIban,
                    debtorIban: txData.debtorIban,
                    // Guardar IBAN de la cuenta Inmova como referencia
                    ...(iban ? { referencia: iban } : {}),
                    rawData: tx as any,
                    estado: 'pendiente_revision',
                  },
                });
                result.newTransactions++;
              }
            } catch (e: any) {
              if (!e.message?.includes('Unique constraint')) {
                result.errors.push(`Tx ${tx.id}: ${e.message}`);
              }
            }
          }
        } catch (e: any) {
          result.errors.push(`Account ${account.id}: ${e.message}`);
        }
      }

      // Actualizar última sincronización
      await prisma.bankConnection.update({
        where: { id: conn.id },
        data: { ultimaSync: new Date() },
      });

      logger.info(
        `[SaltEdge] ${conn.nombreBanco}: +${result.newTransactions} nuevas, ${result.updatedTransactions} actualizadas`
      );
    } catch (e: any) {
      logger.error(`[SaltEdge] Error en connection ${conn.id}:`, e);
      result.errors.push(`Connection ${conn.id}: ${e.message}`);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// BANCOS ESPAÑOLES CONOCIDOS (para mostrar en la UI sin llamada API)
// ═══════════════════════════════════════════════════════════════

export const SPANISH_BANKS_SALTEDGE = [
  { code: 'bankinter_xo_es', name: 'Bankinter', popular: true },
  { code: 'santander_business_es', name: 'Banco Santander', popular: true },
  { code: 'bbva_xo_es', name: 'BBVA', popular: true },
  { code: 'caixabank_xo_es', name: 'CaixaBank', popular: true },
  { code: 'sabadell_xo_es', name: 'Banco Sabadell', popular: true },
  { code: 'ing_direct_xo_es', name: 'ING España', popular: false },
  { code: 'unicaja_xo_es', name: 'Unicaja', popular: false },
  { code: 'kutxabank_xo_es', name: 'Kutxabank', popular: false },
  { code: 'abanca_xo_es', name: 'Abanca', popular: false },
  { code: 'openbank_xo_es', name: 'Openbank', popular: false },
];

export default {
  isSaltEdgeConfigured,
  testConnection,
  getProviders,
  getBankinterProvider,
  createCustomer,
  getCustomerByIdentifier,
  createConnectSession,
  listConnections,
  getConnection,
  deleteConnection,
  listAccounts,
  getTransactions,
  syncSaltEdgeTransactions,
  SPANISH_BANKS_SALTEDGE,
};
