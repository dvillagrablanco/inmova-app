/**
 * ENABLE BANKING — Open Banking PSD2 para España
 *
 * Reemplazo directo de GoCardless Bank Account Data (Nordigen).
 * Enable Banking actúa como AISP regulado — sin licencia TPP requerida.
 *
 * Cobertura: Bankinter, BBVA, Santander, CaixaBank, Sabadell y más (vía PSD2 OAuth).
 *
 * Autenticación: JWT RS256 firmado con clave privada del portal.
 *
 * Registro: https://enablebanking.com/get-started
 * Dashboard: https://enablebanking.com/dashboard
 * Docs API:  https://enablebanking.com/docs/api/reference/
 *
 * Variables env:
 *   ENABLE_BANKING_APP_ID      — Application UUID del dashboard
 *   ENABLE_BANKING_PRIVATE_KEY — Clave privada RSA en formato PEM (descarga del dashboard)
 *
 * @module lib/enablebanking-service
 */

import logger from '@/lib/logger';
import jwt from 'jsonwebtoken';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const APP_ID = process.env.ENABLE_BANKING_APP_ID || '';
const PRIVATE_KEY_RAW = process.env.ENABLE_BANKING_PRIVATE_KEY || '';
const BASE_URL = 'https://api.enablebanking.com';

// La clave privada puede venir con \n literales desde la variable de entorno
function getPrivateKey(): string {
  if (!PRIVATE_KEY_RAW) return '';
  return PRIVATE_KEY_RAW.replace(/\\n/g, '\n');
}

export function isEnableBankingConfigured(): boolean {
  return !!(APP_ID && PRIVATE_KEY_RAW);
}

// ═══════════════════════════════════════════════════════════════
// JWT AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Genera un JWT RS256 firmado con la clave privada para autenticar
 * peticiones a la API de Enable Banking.
 *
 * Formato según la documentación oficial de Enable Banking:
 * - Header: { alg: "RS256", kid: APP_ID }
 * - Payload: { iss: "enablebanking.com", aud: "api.enablebanking.com", iat, exp }
 *
 * La clave privada es el archivo .pem generado por Enable Banking durante
 * el registro de la aplicación.
 */
function generateJWT(): string {
  const privateKey = getPrivateKey();
  if (!privateKey) throw new Error('ENABLE_BANKING_PRIVATE_KEY no configurado');

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      iat: now,
      exp: now + 3600,
    },
    privateKey,
    {
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
        kid: APP_ID,
      } as any,
    }
  );
}

/**
 * Calcula la fecha de expiración del consentimiento.
 * Enable Banking soporta un máximo de ~180 días (15552000 segundos).
 * Usamos 90 días como valor seguro.
 */
function getConsentValidUntil(days = 90): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d
    .toISOString()
    .replace('.000Z', 'Z')
    .replace(/\.\d+Z$/, 'Z');
}

// ═══════════════════════════════════════════════════════════════
// HTTP HELPER
// ═══════════════════════════════════════════════════════════════

async function ebRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const token = generateJWT();

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.message || (err as any)?.error || response.statusText;
    throw new Error(`Enable Banking ${method} ${path} (${response.status}): ${msg}`);
  }

  return response.json() as Promise<T>;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface EBBank {
  name: string;
  country: string;
  bic?: string;
  logo?: string;
  maxConsentValidity?: number;
}

export interface EBAuthSession {
  url: string; // URL a la que redirigir el usuario
  id?: string; // Session ID (algunos bancos lo devuelven)
  expiresAt?: string;
}

export interface EBAccount {
  uid: string;
  iban?: string;
  bban?: string;
  currency: string;
  status: string;
  name?: string;
  product?: string;
  balances?: EBBalance[];
}

export interface EBBalance {
  name: string;
  balanceAmount: { amount: string; currency: string };
  balanceType: string;
  referenceDate?: string;
}

export interface EBTransaction {
  uid: string;
  transactionAmount: { amount: string; currency: string };
  bookingDate?: string;
  valueDate?: string;
  transactionDate?: string;
  creditorName?: string;
  debtorName?: string;
  creditorIban?: string;
  debtorIban?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationStructured?: string;
  endToEndId?: string;
  status: 'booked' | 'pending';
}

// ═══════════════════════════════════════════════════════════════
// TEST DE CONEXIÓN
// ═══════════════════════════════════════════════════════════════

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isEnableBankingConfigured()) {
    return {
      ok: false,
      message:
        'ENABLE_BANKING_APP_ID o ENABLE_BANKING_PRIVATE_KEY no configurados. Dashboard: https://enablebanking.com/dashboard',
    };
  }

  try {
    const banks = await getBanks('ES');
    const count = Array.isArray(banks) ? banks.length : 0;
    return { ok: true, message: `Conectado. ${count} bancos disponibles en España.` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// BANCOS DISPONIBLES
// ═══════════════════════════════════════════════════════════════

export async function getBanks(country = 'ES'): Promise<EBBank[]> {
  if (!isEnableBankingConfigured()) return [];

  try {
    const data = await ebRequest<any>('GET', '/aspsps/', { country });
    const banks = Array.isArray(data) ? data : data.aspsps || data.data || [];
    logger.info(`[EnableBanking] ${banks.length} bancos para ${country}`);
    return banks;
  } catch (err: any) {
    logger.error('[EnableBanking] Error listando bancos:', err.message);
    return [];
  }
}

export async function getBankinterInfo(): Promise<EBBank | null> {
  const banks = await getBanks('ES');
  return (
    banks.find((b) => b.name?.toLowerCase().includes('bankinter') || b.bic === 'BKBKESMMXXX') ||
    null
  );
}

// ═══════════════════════════════════════════════════════════════
// INICIAR AUTORIZACIÓN (OAuth2 redirect)
// ═══════════════════════════════════════════════════════════════

/**
 * Inicia el flujo de autorización PSD2 OAuth2.
 * Devuelve la URL a la que redirigir el usuario para que autorice
 * el acceso a su cuenta bancaria.
 *
 * El flujo es idéntico al de Nordigen:
 *   1. Llamar a esta función → obtener URL
 *   2. Redirigir al usuario a esa URL
 *   3. El banco redirige de vuelta al callbackUrl con `code` y `state`
 *   4. Llamar a completeAuth() con el `code`
 */
export async function startAuth(params: {
  bankName: string; // e.g. "Bankinter"
  countryCode?: string; // e.g. "ES"
  callbackUrl: string; // Tu URL de callback
  validUntil?: string; // ISO date — hasta cuando es válido el consentimiento
  psuType?: 'personal' | 'business';
  state?: string; // Para CSRF protection
}): Promise<EBAuthSession> {
  const body = {
    access: {
      // Máximo 180 días. Usamos 90 días para estar dentro del límite.
      valid_until: params.validUntil || getConsentValidUntil(90),
    },
    aspsp: {
      name: params.bankName,
      country: params.countryCode || 'ES',
    },
    redirect_url: params.callbackUrl,
    psu_type: params.psuType || 'business',
    ...(params.state ? { state: params.state } : {}),
  };

  const data = await ebRequest<any>('POST', '/auth', body);

  logger.info(`[EnableBanking] Auth session iniciada para ${params.bankName}`);

  return {
    url: data.url || data.redirect_url || data.authorization_url,
    id: data.id || data.session_id,
    expiresAt: data.expires_at,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPLETAR AUTORIZACIÓN (callback)
// ═══════════════════════════════════════════════════════════════

/**
 * Completa el flujo OAuth2. Se llama desde el callback del banco.
 * Devuelve el auth_token que se usa para acceder a las cuentas.
 */
/**
 * Intercambia el authorization code por una sesión de Enable Banking.
 * Enable Banking usa POST /sessions (no /sessions/token).
 * El session uid resultante se usa como session_id en las llamadas posteriores.
 */
export async function completeAuth(params: { code: string; state?: string }): Promise<{
  authToken: string;
  sessionId: string;
  accounts: string[];
  bank?: string;
}> {
  const data = await ebRequest<any>('POST', '/sessions', {
    code: params.code,
  });

  // El uid de la sesión es el identificador que se usa para obtener cuentas
  const sessionId = String(data.uid || data.session_id || data.id || '');
  logger.info(`[EnableBanking] Sesión creada: uid=${sessionId} bank=${data.aspsp?.name}`);

  return {
    authToken: sessionId,
    sessionId,
    accounts: data.accounts || [],
    bank: data.aspsp?.name,
  };
}

// ═══════════════════════════════════════════════════════════════
// CUENTAS Y SALDOS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene las cuentas de una sesión de Enable Banking.
 * La forma correcta: GET /sessions/{session_id} → campo "accounts" (UIDs)
 * NO llamar a GET /accounts directamente (devuelve 404 sin contexto de sesión).
 */
export async function getAccounts(sessionId: string): Promise<EBAccount[]> {
  try {
    // La sesión contiene directamente los UIDs y accounts_data
    const session = await ebRequest<any>('GET', `/sessions/${sessionId}`);
    const accountUids: string[] = session.accounts || [];
    const accountsData: any[] = session.accounts_data || [];

    if (accountUids.length === 0) {
      logger.warn(`[EnableBanking] Sesión ${sessionId} sin cuentas`);
      return [];
    }

    logger.info(`[EnableBanking] ${accountUids.length} cuentas en sesión ${sessionId}`);

    // Construir accounts desde accounts_data + UIDs
    return accountUids.map((uid, i) => {
      const data = accountsData[i] || {};
      return {
        uid,
        currency: 'EUR',
        status: 'enabled',
        name: data.name || uid.substring(0, 8),
        extra: data,
      } as EBAccount;
    });
  } catch (err: any) {
    logger.error('[EnableBanking] Error obteniendo cuentas de sesión:', err.message);
    return [];
  }
}

/**
 * Obtiene cuentas usando la sesión desde el endpoint /sessions/{id}.
 * Devuelve los UIDs directamente para usarlos en balances y transacciones.
 */
export async function getAccountUidsFromSession(sessionId: string): Promise<string[]> {
  try {
    const session = await ebRequest<any>('GET', `/sessions/${sessionId}`);
    return session.accounts || [];
  } catch (err: any) {
    logger.error('[EnableBanking] Error obteniendo UIDs de sesión:', err.message);
    return [];
  }
}

export async function getAccountBalances(
  accountUid: string,
  authToken: string
): Promise<EBBalance[]> {
  try {
    const data = await ebRequest<any>('GET', `/accounts/${accountUid}/balances`, undefined, {
      session_id: authToken, // Enable Banking usa session_id (mismo valor que auth_token)
    });
    return data.balances || [];
  } catch (err: any) {
    logger.error('[EnableBanking] Error obteniendo saldos:', err.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSACCIONES
// ═══════════════════════════════════════════════════════════════

export async function getTransactions(
  accountUid: string,
  sessionId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ booked: EBTransaction[]; pending: EBTransaction[] }> {
  try {
    // Enable Banking requiere session_id como query param para acceder a transacciones
    const params: Record<string, string> = { session_id: sessionId };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const data = await ebRequest<any>(
      'GET',
      `/accounts/${accountUid}/transactions`,
      undefined,
      params
    );

    // Enable Banking devuelve { transactions: [...] } donde cada tx tiene entry_reference, etc.
    const allTx = data.transactions || data.booked || data || [];
    const txArray = Array.isArray(allTx) ? allTx : [];
    const booked = txArray.filter((t: any) => t.status !== 'pending');
    const pending = txArray.filter((t: any) => t.status === 'pending');

    logger.info(`[EnableBanking] ${booked.length} booked, ${pending.length} pending`);
    return { booked, pending };
  } catch (err: any) {
    logger.error('[EnableBanking] Error obteniendo transacciones:', err.message);
    return { booked: [], pending: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// SYNC — descargar y guardar en BD
// ═══════════════════════════════════════════════════════════════

/**
 * Descarga transacciones de todas las conexiones Enable Banking activas
 * de una empresa y las guarda en BankTransaction.
 *
 * accessToken almacena el auth_token de Enable Banking.
 * refreshToken almacena los account UIDs (separados por coma).
 */
export async function syncEnableBankingTransactions(companyId: string): Promise<{
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

  if (!isEnableBankingConfigured()) return result;

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const dbConnections = await prisma.bankConnection.findMany({
    where: {
      companyId,
      proveedor: 'enablebanking',
      estado: 'conectado',
      accessToken: { not: null },
    },
    select: {
      id: true,
      accessToken: true, // Enable Banking auth_token
      refreshToken: true, // account UIDs separados por coma (opcional)
      ultimaSync: true,
      nombreBanco: true,
    },
  });

  result.connections = dbConnections.length;
  if (dbConnections.length === 0) return result;

  for (const conn of dbConnections) {
    try {
      const sessionId = conn.accessToken!;
      if (!sessionId || sessionId.startsWith('pending_') || sessionId.startsWith('saltedge_')) {
        continue;
      }

      // Obtener UIDs de cuentas desde la sesión (método correcto)
      const accountUids = await getAccountUidsFromSession(sessionId);
      if (accountUids.length === 0) {
        logger.warn(`[EnableBanking] Sin cuentas para sesión ${sessionId.substring(0, 20)}`);
        continue;
      }

      const fromDate = conn.ultimaSync
        ? new Date(conn.ultimaSync.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      logger.info(
        `[EnableBanking] Sync ${conn.nombreBanco}: ${accountUids.length} cuentas, desde ${fromDate}`
      );

      for (const accountUid of accountUids) {
        try {
          // Usar session_id como query param (método correcto para Enable Banking)
          const { booked, pending } = await getTransactions(accountUid, sessionId, fromDate);
          const allTx = [...booked, ...pending];

          for (const tx of allTx) {
            // Enable Banking usa entry_reference como identificador único
            const txId = `eb_${tx.uid || (tx as any).entry_reference || Date.now()}`;
            const rawTx = tx as any;
            const txAmount = rawTx.transaction_amount || tx.transactionAmount || {};
            const amount = parseFloat(txAmount.amount || '0');
            // Descripción: remittance_information.unstructured es un array en Enable Banking
            const ri = rawTx.remittance_information || {};
            const unstructured = Array.isArray(ri.unstructured)
              ? ri.unstructured[0]
              : ri.unstructured;
            const desc =
              unstructured ||
              tx.remittanceInformationUnstructured ||
              tx.creditorName ||
              rawTx.creditor_name ||
              tx.debtorName ||
              rawTx.debtor_name ||
              'Sin descripción';

            try {
              const existing = await prisma.bankTransaction.findUnique({
                where: { proveedorTxId: txId },
                select: { id: true },
              });

              const creditor = rawTx.creditor || {};
              const debtor = rawTx.debtor || {};
              const txData = {
                descripcion: desc,
                monto: amount,
                creditorName: tx.creditorName || creditor.name || rawTx.creditor_name || null,
                debtorName: tx.debtorName || debtor.name || rawTx.debtor_name || null,
                creditorIban: tx.creditorIban || creditor.account?.iban || null,
                debtorIban: tx.debtorIban || debtor.account?.iban || null,
              };

              if (existing) {
                await prisma.bankTransaction.update({
                  where: { proveedorTxId: txId },
                  data: txData,
                });
                result.updatedTransactions++;
              } else {
                const bookingDate = tx.bookingDate || tx.transactionDate || tx.valueDate;
                await prisma.bankTransaction.create({
                  data: {
                    companyId,
                    connectionId: conn.id,
                    proveedorTxId: txId,
                    fecha: bookingDate ? new Date(bookingDate) : new Date(),
                    fechaContable: tx.valueDate ? new Date(tx.valueDate) : null,
                    descripcion: desc,
                    monto: amount,
                    moneda: tx.transactionAmount.currency || 'EUR',
                    creditorName: txData.creditorName,
                    debtorName: txData.debtorName,
                    creditorIban: txData.creditorIban,
                    debtorIban: txData.debtorIban,
                    referencia: tx.endToEndId || null,
                    rawData: tx as any,
                    estado: 'pendiente_revision',
                  },
                });
                result.newTransactions++;
              }
            } catch (e: any) {
              if (!e.message?.includes('Unique constraint')) {
                result.errors.push(`Tx ${tx.uid}: ${e.message}`);
              }
            }
          }
        } catch (e: any) {
          result.errors.push(`Account ${account.uid}: ${e.message}`);
        }
      }

      await prisma.bankConnection.update({
        where: { id: conn.id },
        data: { ultimaSync: new Date() },
      });

      logger.info(
        `[EnableBanking] ${conn.nombreBanco}: +${result.newTransactions} nuevas, ${result.updatedTransactions} actualizadas`
      );
    } catch (e: any) {
      logger.error(`[EnableBanking] Error en connection ${conn.id}:`, e);
      result.errors.push(`Connection ${conn.id}: ${e.message}`);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// BANCOS ESPAÑOLES CONOCIDOS
// ═══════════════════════════════════════════════════════════════

export const SPANISH_BANKS_EB: Array<{ name: string; country: string; popular: boolean }> = [
  { name: 'Bankinter', country: 'ES', popular: true },
  { name: 'Banco Santander', country: 'ES', popular: true },
  { name: 'BBVA', country: 'ES', popular: true },
  { name: 'CaixaBank', country: 'ES', popular: true },
  { name: 'Banco Sabadell', country: 'ES', popular: true },
  { name: 'ING', country: 'ES', popular: false },
  { name: 'Bankia', country: 'ES', popular: false },
  { name: 'Kutxabank', country: 'ES', popular: false },
  { name: 'Unicaja Banco', country: 'ES', popular: false },
  { name: 'Abanca', country: 'ES', popular: false },
];

export default {
  isEnableBankingConfigured,
  testConnection,
  getBanks,
  getBankinterInfo,
  startAuth,
  completeAuth,
  getAccounts,
  getAccountBalances,
  getTransactions,
  syncEnableBankingTransactions,
  SPANISH_BANKS_EB,
};
