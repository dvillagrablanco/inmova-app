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
 * El JWT tiene validez de 5 minutos y debe regenerarse para cada sesión.
 */
function generateJWT(): string {
  const privateKey = getPrivateKey();
  if (!privateKey) throw new Error('ENABLE_BANKING_PRIVATE_KEY no configurado');

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: APP_ID,
      iat: now,
      exp: now + 300, // 5 minutos
    },
    privateKey,
    { algorithm: 'RS256' }
  );
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
      valid_until:
        params.validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
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
export async function completeAuth(params: { code: string; state?: string }): Promise<{
  authToken: string;
  accounts: string[];
  bank?: string;
}> {
  const data = await ebRequest<any>('POST', '/sessions/token', {
    code: params.code,
    ...(params.state ? { state: params.state } : {}),
  });

  logger.info(`[EnableBanking] Auth completada — token obtenido`);

  return {
    authToken: data.token || data.access_token || data.auth_token,
    accounts: data.accounts || [],
    bank: data.aspsp?.name,
  };
}

// ═══════════════════════════════════════════════════════════════
// CUENTAS Y SALDOS
// ═══════════════════════════════════════════════════════════════

export async function getAccounts(authToken: string): Promise<EBAccount[]> {
  try {
    const data = await ebRequest<any>('GET', '/accounts', undefined, {
      auth_token: authToken,
    });
    const accounts = Array.isArray(data) ? data : data.accounts || [];
    logger.info(`[EnableBanking] ${accounts.length} cuentas obtenidas`);
    return accounts;
  } catch (err: any) {
    logger.error('[EnableBanking] Error obteniendo cuentas:', err.message);
    return [];
  }
}

export async function getAccountBalances(
  accountUid: string,
  authToken: string
): Promise<EBBalance[]> {
  try {
    const data = await ebRequest<any>('GET', `/accounts/${accountUid}/balances`, undefined, {
      auth_token: authToken,
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
  authToken: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ booked: EBTransaction[]; pending: EBTransaction[] }> {
  try {
    const params: Record<string, string> = { auth_token: authToken };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const data = await ebRequest<any>(
      'GET',
      `/accounts/${accountUid}/transactions`,
      undefined,
      params
    );

    const booked = data.transactions?.booked || data.booked || [];
    const pending = data.transactions?.pending || data.pending || [];

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
      const authToken = conn.accessToken!;

      // Obtener cuentas
      const accounts = await getAccounts(authToken);
      if (accounts.length === 0) {
        logger.warn(`[EnableBanking] Sin cuentas para connection ${conn.id}`);
        continue;
      }

      const fromDate = conn.ultimaSync
        ? new Date(conn.ultimaSync.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const account of accounts) {
        try {
          const { booked, pending } = await getTransactions(account.uid, authToken, fromDate);
          const allTx = [...booked, ...pending];

          for (const tx of allTx) {
            const txId = `eb_${tx.uid}`;
            const amount = parseFloat(tx.transactionAmount.amount);
            const desc =
              tx.remittanceInformationUnstructured ||
              tx.remittanceInformationStructured ||
              tx.creditorName ||
              tx.debtorName ||
              'Sin descripción';

            try {
              const existing = await prisma.bankTransaction.findUnique({
                where: { proveedorTxId: txId },
                select: { id: true },
              });

              const txData = {
                descripcion: desc,
                monto: amount,
                creditorName: tx.creditorName || null,
                debtorName: tx.debtorName || null,
                creditorIban: tx.creditorIban || null,
                debtorIban: tx.debtorIban || null,
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
