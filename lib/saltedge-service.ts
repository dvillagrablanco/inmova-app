/**
 * SALT EDGE — API v6
 *
 * Alternativa a GoCardless Bank Account Data (Nordigen) dado que
 * Nordigen ha desactivado nuevos registros en 2025.
 *
 * Salt Edge actúa como AISP/agregador. Para el Partner Program sin licencia PSD2,
 * el acceso se hace mediante web-scraping de los portales bancarios.
 *
 * API v6 BASE URL: https://www.saltedge.com/api/v6
 * Connect Widget:  https://www.saltedge.com/connect
 *
 * DIFERENCIAS v1 vs v6:
 *   v1 (deprecado): POST /connect_sessions/create → connect_url, necesita customer_secret
 *   v6 (actual):    URL directa al widget con query params (app_id + customer_id)
 *                   Sin customer_secret — autenticación solo App-id + Secret
 *
 * Registro: https://www.saltedge.com/partner_program
 * Docs:     https://docs.saltedge.com/v6/
 *
 * Variables env: SALTEDGE_APP_ID, SALTEDGE_SECRET
 *
 * @module lib/saltedge-service
 */

import logger from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const SALTEDGE_APP_ID = process.env.SALTEDGE_APP_ID || '';
const SALTEDGE_SECRET = process.env.SALTEDGE_SECRET || '';
const SALTEDGE_BASE_URL = 'https://www.saltedge.com/api/v6';
const SALTEDGE_CONNECT_URL = 'https://www.saltedge.com/connect';

export function isSaltEdgeConfigured(): boolean {
  return !!(SALTEDGE_APP_ID && SALTEDGE_SECRET);
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SaltEdgeCustomer {
  id: string; // customer_id numérico como string
  identifier: string; // tu ID interno
  createdAt: string;
}

export interface SaltEdgeConnection {
  id: string;
  customerId: string;
  providerCode: string;
  providerName: string;
  status: 'active' | 'inactive' | 'disabled' | 'expired' | 'errored';
  createdAt: string;
  updatedAt: string;
  lastSuccessAt?: string;
  countryCode: string;
}

export interface SaltEdgeAccount {
  id: string;
  connectionId: string;
  name: string;
  nature: string;
  balance: number;
  currencyCode: string;
  iban?: string;
  status: string;
  createdAt: string;
  extra?: {
    iban?: string;
    swiftCode?: string;
    accountName?: string;
  };
}

export interface SaltEdgeTransaction {
  id: string;
  duplicated: boolean;
  mode: string;
  status: 'posted' | 'pending';
  madeOn: string;
  amount: number;
  currencyCode: string;
  description: string;
  category: string;
  accountId: string;
  connectionId: string;
  createdAt: string;
  extra?: {
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
  status: string;
  countryCode: string;
  mode: string;
  logoUrl?: string;
  homeUrl?: string;
}

// ═══════════════════════════════════════════════════════════════
// HTTP HELPER
// ═══════════════════════════════════════════════════════════════

async function saltEdgeRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  queryParams?: Record<string, string>,
  body?: unknown
): Promise<T> {
  const url = new URL(`${SALTEDGE_BASE_URL}${path}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'App-id': SALTEDGE_APP_ID,
      Secret: SALTEDGE_SECRET,
    },
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
    return { ok: false, message: 'SALTEDGE_APP_ID y SALTEDGE_SECRET no configurados' };
  }

  try {
    const providers = await saltEdgeRequest<SaltEdgeProvider[]>('GET', '/providers', {
      country_code: 'ES',
      per_page: '5',
    });
    const count = Array.isArray(providers) ? providers.length : 0;
    return { ok: true, message: `Conectado correctamente. ${count} providers en España.` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// PROVIDERS (bancos disponibles)
// ═══════════════════════════════════════════════════════════════

export async function getProviders(countryCode = 'ES'): Promise<SaltEdgeProvider[]> {
  if (!isSaltEdgeConfigured()) return [];

  try {
    const providers = await saltEdgeRequest<SaltEdgeProvider[]>('GET', '/providers', {
      country_code: countryCode,
      per_page: '200',
    });
    return Array.isArray(providers) ? providers : [];
  } catch (err: any) {
    logger.error('[SaltEdge] Error listando providers:', err.message);
    return [];
  }
}

export async function getBankinterProvider(): Promise<SaltEdgeProvider | null> {
  const providers = await getProviders('ES');
  return (
    providers.find(
      (p) => p.code === 'bankinter_es' || p.name.toLowerCase().includes('bankinter')
    ) || null
  );
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════

export async function createCustomer(identifier: string): Promise<SaltEdgeCustomer> {
  const raw = await saltEdgeRequest<any>('POST', '/customers', undefined, { identifier });
  return {
    id: String(raw.customer_id || raw.id),
    identifier: raw.identifier,
    createdAt: raw.created_at,
  };
}

export async function listCustomers(): Promise<SaltEdgeCustomer[]> {
  const raw = await saltEdgeRequest<any[]>('GET', '/customers');
  const list = Array.isArray(raw) ? raw : [];
  return list.map((c) => ({
    id: String(c.customer_id || c.id),
    identifier: c.identifier,
    createdAt: c.created_at,
  }));
}

export async function getCustomerByIdentifier(
  identifier: string
): Promise<SaltEdgeCustomer | null> {
  try {
    const customers = await listCustomers();
    return customers.find((c) => c.identifier === identifier) || null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CONNECT URL (v6: URL directa al widget, sin API de sesión)
// ═══════════════════════════════════════════════════════════════

/**
 * Genera la URL del widget de conexión de Salt Edge (v6).
 *
 * En v6 ya no existe el endpoint /connect_sessions/create.
 * El widget se accede directamente con query params.
 *
 * El usuario es redirigido a esta URL, entra sus credenciales bancarias
 * en la interfaz de Salt Edge, y Salt Edge redirige de vuelta a callbackUrl
 * con `connection_id` como query param.
 */
export function generateConnectUrl(params: {
  customerId: string;
  callbackUrl: string;
  providerCode?: string;
  countryCode?: string;
}): string {
  const url = new URL(SALTEDGE_CONNECT_URL);
  url.searchParams.set('app_id', SALTEDGE_APP_ID);
  url.searchParams.set('customer_id', params.customerId);
  url.searchParams.set('return_to', params.callbackUrl);
  if (params.providerCode) {
    url.searchParams.set('provider_code', params.providerCode);
  }
  if (params.countryCode) {
    url.searchParams.set('country_code', params.countryCode);
  }
  return url.toString();
}

// Alias para compatibilidad con los endpoints existentes
export async function createConnectSession(params: {
  customerId: string;
  callbackUrl: string;
  providerCode?: string;
  companyId?: string;
  fromDate?: string;
  // customer_secret ya no se usa en v6
  customerSecret?: string;
}): Promise<{ connectUrl: string; expiresAt: string }> {
  const connectUrl = generateConnectUrl({
    customerId: params.customerId,
    callbackUrl: params.callbackUrl,
    providerCode: params.providerCode,
    countryCode: 'ES',
  });
  // v6 no devuelve expiresAt — usar 1 hora como valor nominal
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return { connectUrl, expiresAt };
}

// ═══════════════════════════════════════════════════════════════
// CONNECTIONS
// ═══════════════════════════════════════════════════════════════

export async function listConnections(customerId: string): Promise<SaltEdgeConnection[]> {
  try {
    const raw = await saltEdgeRequest<any[]>('GET', '/connections', { customer_id: customerId });
    if (!Array.isArray(raw)) return [];
    return raw.map(mapConnection);
  } catch (err: any) {
    logger.error('[SaltEdge] Error listando connections:', err.message);
    return [];
  }
}

export async function getConnection(
  connectionId: string,
  _customerSecret?: string
): Promise<SaltEdgeConnection | null> {
  try {
    const raw = await saltEdgeRequest<any>('GET', `/connections/${connectionId}`);
    return raw ? mapConnection(raw) : null;
  } catch {
    return null;
  }
}

export async function deleteConnection(
  connectionId: string,
  _customerSecret?: string
): Promise<boolean> {
  try {
    await saltEdgeRequest<unknown>('DELETE', `/connections/${connectionId}`);
    logger.info(`[SaltEdge] Connection ${connectionId} eliminada`);
    return true;
  } catch (err: any) {
    logger.error('[SaltEdge] Error eliminando connection:', err.message);
    return false;
  }
}

function mapConnection(c: any): SaltEdgeConnection {
  return {
    id: String(c.id),
    customerId: String(c.customer_id),
    providerCode: c.provider_code,
    providerName: c.provider_name || c.provider_code,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    lastSuccessAt: c.last_success_at,
    countryCode: c.country_code,
  };
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════════

/**
 * Lista cuentas de un customer (todas las conexiones) o de una conexión específica.
 * En v6 el customer_id va como query param.
 */
export async function listAccounts(
  connectionIdOrCustomerId: string,
  _customerSecret?: string
): Promise<SaltEdgeAccount[]> {
  try {
    // Intentar primero como connection_id
    const raw = await saltEdgeRequest<any[]>('GET', '/accounts', {
      connection_id: connectionIdOrCustomerId,
    }).catch(() => null);

    if (raw && Array.isArray(raw)) {
      return raw.map(mapAccount);
    }

    // Fallback: tratar como customer_id
    const raw2 = await saltEdgeRequest<any[]>('GET', '/accounts', {
      customer_id: connectionIdOrCustomerId,
    });
    return Array.isArray(raw2) ? raw2.map(mapAccount) : [];
  } catch (err: any) {
    logger.error('[SaltEdge] Error listando accounts:', err.message);
    return [];
  }
}

export async function listAccountsForCustomer(customerId: string): Promise<SaltEdgeAccount[]> {
  try {
    const raw = await saltEdgeRequest<any[]>('GET', '/accounts', { customer_id: customerId });
    return Array.isArray(raw) ? raw.map(mapAccount) : [];
  } catch (err: any) {
    logger.error('[SaltEdge] Error listando accounts por customer:', err.message);
    return [];
  }
}

function mapAccount(a: any): SaltEdgeAccount {
  return {
    id: String(a.id),
    connectionId: String(a.connection_id),
    name: a.name,
    nature: a.nature,
    balance: parseFloat(a.balance || '0'),
    currencyCode: a.currency_code || 'EUR',
    iban: a.extra?.iban || undefined,
    status: a.status,
    createdAt: a.created_at,
    extra: a.extra,
  };
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene transacciones de una conexión específica.
 * En v6 se requiere connection_id (no account_id ni customer_secret).
 */
export async function getTransactions(
  connectionId: string,
  _customerSecret?: string,
  fromDate?: string,
  toDate?: string,
  maxPages = 20
): Promise<SaltEdgeTransaction[]> {
  const transactions: SaltEdgeTransaction[] = [];

  const params: Record<string, string> = {
    connection_id: connectionId,
    per_page: '1000',
  };
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  let page = 0;
  let nextId: string | null = null;

  while (page < maxPages) {
    const p = { ...params };
    if (nextId) p.next_id = nextId;

    try {
      const url = new URL(`${SALTEDGE_BASE_URL}/transactions`);
      Object.entries(p).forEach(([k, v]) => url.searchParams.set(k, v));

      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'App-id': SALTEDGE_APP_ID,
          Secret: SALTEDGE_SECRET,
        },
      });

      if (!response.ok) break;

      const json = await response.json();
      const batch: any[] = json.data || [];
      transactions.push(...batch.map(mapTransaction));

      nextId = json.meta?.next_id || null;
      page++;

      if (!nextId || batch.length === 0) break;
    } catch (err: any) {
      logger.error(`[SaltEdge] Error en página ${page} de transacciones:`, err.message);
      break;
    }
  }

  logger.info(`[SaltEdge] ${transactions.length} transacciones para connection ${connectionId}`);
  return transactions;
}

function mapTransaction(t: any): SaltEdgeTransaction {
  return {
    id: String(t.id),
    duplicated: t.duplicated || false,
    mode: t.mode || 'normal',
    status: t.status || 'posted',
    madeOn: t.made_on,
    amount: parseFloat(t.amount || '0'),
    currencyCode: t.currency_code || 'EUR',
    description: t.description || '',
    category: t.category || '',
    accountId: String(t.account_id),
    connectionId: String(t.connection_id),
    createdAt: t.created_at,
    extra: t.extra,
  };
}

// ═══════════════════════════════════════════════════════════════
// SYNC — descargar y guardar en BD
// ═══════════════════════════════════════════════════════════════

/**
 * Descarga todas las transacciones nuevas de las conexiones Salt Edge
 * activas de una empresa y las guarda en BankTransaction.
 *
 * accessToken almacena el connection_id de Salt Edge (no customer_secret).
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

  if (!isSaltEdgeConfigured()) return result;

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const dbConnections = await prisma.bankConnection.findMany({
    where: {
      companyId,
      proveedor: 'saltedge',
      estado: 'conectado',
      accessToken: { not: null },
    },
    select: {
      id: true,
      accessToken: true, // Salt Edge connection_id
      refreshToken: true, // customer_id (guardado aquí)
      ultimaSync: true,
      nombreBanco: true,
    },
  });

  result.connections = dbConnections.length;
  if (dbConnections.length === 0) return result;

  for (const conn of dbConnections) {
    try {
      const connectionId = conn.accessToken!;
      if (!connectionId || connectionId.startsWith('saltedge_')) {
        // Skip entradas de grupo que tienen ID compuesto
        continue;
      }

      // Rango de fechas
      const fromDate = conn.ultimaSync
        ? new Date(conn.ultimaSync.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Obtener cuentas de la conexión
      const accounts = await listAccounts(connectionId);

      for (const account of accounts) {
        try {
          const txs = await getTransactions(connectionId, undefined, fromDate);

          for (const tx of txs) {
            const txId = `saltedge_${tx.id}`;
            try {
              const existing = await prisma.bankTransaction.findUnique({
                where: { proveedorTxId: txId },
                select: { id: true },
              });

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

      await prisma.bankConnection.update({
        where: { id: conn.id },
        data: { ultimaSync: new Date() },
      });

      logger.info(`[SaltEdge] ${conn.nombreBanco}: +${result.newTransactions} nuevas`);
    } catch (e: any) {
      logger.error(`[SaltEdge] Error en connection ${conn.id}:`, e);
      result.errors.push(`Connection ${conn.id}: ${e.message}`);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// BANCOS ESPAÑOLES CONOCIDOS (provider codes de v6)
// ═══════════════════════════════════════════════════════════════

export const SPANISH_BANKS_SALTEDGE = [
  { code: 'bankinter_es', name: 'Bankinter', popular: true },
  { code: 'santander_es', name: 'Santander', popular: true },
  { code: 'la_caixa_es', name: 'CaixaBank', popular: true },
  { code: 'santander_empresas_es', name: 'Santander Empresas', popular: true },
  { code: 'bbva_es', name: 'BBVA', popular: true },
  { code: 'kutxabank_es', name: 'Kutxabank', popular: false },
  { code: 'ibercaja_es', name: 'Ibercaja', popular: false },
  { code: 'evobanco_es', name: 'EVO Banco', popular: false },
  { code: 'arquia_es', name: 'Arquia', popular: false },
];

export default {
  isSaltEdgeConfigured,
  testConnection,
  getProviders,
  getBankinterProvider,
  createCustomer,
  listCustomers,
  getCustomerByIdentifier,
  generateConnectUrl,
  createConnectSession,
  listConnections,
  getConnection,
  deleteConnection,
  listAccounts,
  listAccountsForCustomer,
  getTransactions,
  syncSaltEdgeTransactions,
  SPANISH_BANKS_SALTEDGE,
};
