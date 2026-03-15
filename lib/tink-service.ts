/**
 * TINK INTEGRATION SERVICE (by Visa)
 * 
 * Open Banking PSD2 — Lectura de cuentas y movimientos bancarios
 * Soporta 6000+ bancos en Europa incluyendo todos los españoles:
 * Bankinter, Santander, BBVA, CaixaBank, Sabadell, ING, etc.
 * 
 * Features:
 * - AIS: Lectura de saldos y movimientos
 * - PIS: Iniciación de pagos (futuro)
 * - Verificación de ingresos de inquilinos
 * 
 * Credenciales: TINK_CLIENT_ID, TINK_CLIENT_SECRET, TINK_ENVIRONMENT
 * 
 * @module lib/tink-service
 */

import logger from '@/lib/logger';

// ============================================================================
// CONFIG
// ============================================================================

const TINK_CLIENT_ID = process.env.TINK_CLIENT_ID || '';
const TINK_CLIENT_SECRET = process.env.TINK_CLIENT_SECRET || '';
const TINK_ENV = process.env.TINK_ENVIRONMENT || 'production';
const TINK_LINK_ACTOR_CLIENT_ID =
  process.env.TINK_LINK_ACTOR_CLIENT_ID || 'df05e4b379934cd09963197cc855bfe9';

const BASE_URL = 'https://api.tink.com';

export function buildTinkUserId(companyId: string, userId: string): string {
  return `inmova_${companyId}_${userId}`;
}

export function buildTinkExternalUserId(companyId: string, userId: string): string {
  return buildTinkUserId(companyId, userId);
}

// ============================================================================
// TYPES
// ============================================================================

export interface TinkAccount {
  id: string;
  name: string;
  type: string; // CHECKING, SAVINGS, CREDIT_CARD, etc.
  iban?: string;
  balance: {
    amount: { value: { unscaledValue: string; scale: string }; currencyCode: string };
  };
  identifiers?: { iban?: { iban: string; bban?: string } };
  financialInstitutionId?: string;
}

export interface TinkTransaction {
  id: string;
  accountId: string;
  amount: { value: { unscaledValue: string; scale: string }; currencyCode: string };
  descriptions: { original?: string; display?: string };
  dates: { booked?: string; value?: string };
  status: string; // BOOKED, PENDING
  types?: { type?: string };
  identifiers?: { providerTransactionId?: string };
  merchantInformation?: { merchantName?: string };
  reference?: string;
}

export interface TinkProvider {
  id: string;
  displayName: string;
  country: string;
  type: string;
  financialInstitutionId: string;
  capabilities: string[];
  status: string;
}

// ============================================================================
// AUTH
// ============================================================================

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtiene un token de acceso para la API de Tink (client credentials)
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const response = await fetch(`${BASE_URL}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TINK_CLIENT_ID,
      client_secret: TINK_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'accounts:read,transactions:read,provider-consents:read,user:create,authorization:grant',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tink auth failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Genera un token de usuario para autorización bancaria
 */
async function getUserAccessToken(
  userId: string,
  scope: string,
  idHint?: string
): Promise<string> {
  const clientToken = await getAccessToken();

  const response = await fetch(`${BASE_URL}/api/v1/oauth/authorization-grant/delegate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${clientToken}`,
    },
    body: new URLSearchParams({
      user_id: userId,
      id_hint: idHint || userId,
      actor_client_id: TINK_LINK_ACTOR_CLIENT_ID,
      scope,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tink user token failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.code;
}

// ============================================================================
// HELPER
// ============================================================================

async function tinkRequest(path: string, token: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tink API ${path}: ${response.status} ${error}`);
  }

  return response.json();
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Verifica si Tink está configurado
 */
export function isTinkConfigured(): boolean {
  return !!(TINK_CLIENT_ID && TINK_CLIENT_SECRET);
}

/**
 * Test de conexión con Tink
 */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isTinkConfigured()) {
    return { ok: false, message: 'TINK_CLIENT_ID y TINK_CLIENT_SECRET no configurados' };
  }

  try {
    const token = await getAccessToken();
    return { ok: true, message: `Token obtenido (${token.substring(0, 20)}...)` };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

/**
 * Lista los proveedores/bancos disponibles para un mercado
 */
export async function listProviders(market: string = 'ES'): Promise<TinkProvider[]> {
  const token = await getAccessToken();
  const data = await tinkRequest(`/api/v1/providers/${market}`, token);
  return data || [];
}

/**
 * Crea un usuario en Tink (necesario antes de conectar banco)
 */
export async function createUser(externalUserId: string, market: string = 'ES', locale: string = 'es_ES'): Promise<string> {
  const token = await getAccessToken();
  const data = await tinkRequest('/api/v1/user/create', token, {
    method: 'POST',
    body: JSON.stringify({
      external_user_id: externalUserId,
      market,
      locale,
    }),
  });
  return data.user_id;
}

/**
 * Genera un enlace de Tink Link para que el usuario conecte su banco
 */
export async function generateTinkLink(params: {
  userId: string;
  idHint?: string;
  market?: string;
  locale?: string;
  redirectUri: string;
  test?: boolean;
}): Promise<string> {
  const authCode = await getUserAccessToken(
    params.userId,
    'authorization:read,authorization:grant,credentials:refresh,credentials:read,credentials:write,providers:read,user:read',
    params.idHint
  );

  const tinkLinkUrl = new URL('https://link.tink.com/1.0/transactions/connect-accounts');
  tinkLinkUrl.searchParams.set('client_id', TINK_CLIENT_ID);
  tinkLinkUrl.searchParams.set('redirect_uri', params.redirectUri);
  tinkLinkUrl.searchParams.set('market', params.market || 'ES');
  tinkLinkUrl.searchParams.set('locale', params.locale || 'es_ES');
  tinkLinkUrl.searchParams.set('authorization_code', authCode);
  if (params.test) {
    tinkLinkUrl.searchParams.set('test', 'true');
  }

  return tinkLinkUrl.toString();
}

/**
 * Lista cuentas bancarias de un usuario
 */
export async function listAccounts(userId: string): Promise<TinkAccount[]> {
  const authCode = await getUserAccessToken(userId, 'accounts:read');
  
  // Exchange code for user token
  const tokenResponse = await fetch(`${BASE_URL}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TINK_CLIENT_ID,
      client_secret: TINK_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: authCode,
    }),
  });
  const tokenData = await tokenResponse.json();

  const data = await tinkRequest('/data/v2/accounts', tokenData.access_token);
  return data.accounts || [];
}

/**
 * Lista transacciones de un usuario
 */
export async function listTransactions(userId: string, params?: {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  pageToken?: string;
}): Promise<{ transactions: TinkTransaction[]; nextPageToken?: string }> {
  const authCode = await getUserAccessToken(userId, 'transactions:read');
  
  const tokenResponse = await fetch(`${BASE_URL}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TINK_CLIENT_ID,
      client_secret: TINK_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: authCode,
    }),
  });
  const tokenData = await tokenResponse.json();

  const queryParams = new URLSearchParams();
  if (params?.accountId) queryParams.set('accountIdIn', params.accountId);
  if (params?.dateFrom) queryParams.set('bookedDateGte', params.dateFrom);
  if (params?.dateTo) queryParams.set('bookedDateLte', params.dateTo);
  if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize));
  if (params?.pageToken) queryParams.set('pageToken', params.pageToken);

  const data = await tinkRequest(`/data/v2/transactions?${queryParams}`, tokenData.access_token);
  return {
    transactions: data.transactions || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Parsea el importe de Tink a número
 */
export function parseTinkAmount(amount: TinkTransaction['amount']): number {
  const unscaled = parseInt(amount.value.unscaledValue);
  const scale = parseInt(amount.value.scale);
  return unscaled / Math.pow(10, scale);
}

/**
 * Bancos españoles principales en Tink
 */
export const SPANISH_BANKS = [
  { id: 'es-bankinter-ob', name: 'Bankinter', popular: true },
  { id: 'es-santander-ob', name: 'Banco Santander', popular: true },
  { id: 'es-bbva-ob', name: 'BBVA', popular: true },
  { id: 'es-caixabank-ob', name: 'CaixaBank', popular: true },
  { id: 'es-sabadell-ob', name: 'Banco Sabadell', popular: true },
  { id: 'es-ing-ob', name: 'ING', popular: true },
  { id: 'es-unicaja-ob', name: 'Unicaja', popular: false },
  { id: 'es-kutxabank-ob', name: 'Kutxabank', popular: false },
  { id: 'es-abanca-ob', name: 'Abanca', popular: false },
  { id: 'es-laboral-ob', name: 'Laboral Kutxa', popular: false },
  { id: 'es-openbank-ob', name: 'Openbank', popular: false },
  { id: 'es-evo-ob', name: 'EVO Banco', popular: false },
];

export default {
  buildTinkUserId,
  buildTinkExternalUserId,
  isTinkConfigured,
  testConnection,
  listProviders,
  createUser,
  generateTinkLink,
  listAccounts,
  listTransactions,
  parseTinkAmount,
  SPANISH_BANKS,
};
