/**
 * Plaid Open Banking Service
 * 
 * Integración con Plaid para acceso a cuentas bancarias:
 * - Link: Conectar cuentas de usuario via Plaid Link
 * - Accounts: Listar cuentas y saldos
 * - Transactions: Obtener y sincronizar transacciones
 * - Identity: Verificar identidad del titular
 * 
 * Soporta bancos españoles via Plaid EU.
 * 
 * @module lib/plaid-service
 */

import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  type LinkTokenCreateRequest,
  type ItemPublicTokenExchangeRequest,
  type TransactionsSyncRequest,
  type AccountsGetRequest,
} from 'plaid';
import logger from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PLAID_ENV = (process.env.PLAID_ENV || 'sandbox') as 'sandbox' | 'production';

const plaidEnvMap = {
  sandbox: PlaidEnvironments.sandbox,
  production: PlaidEnvironments.production,
};

let plaidClient: PlaidApi | null = null;

function getPlaid(): PlaidApi | null {
  if (plaidClient) return plaidClient;
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    logger.warn('[Plaid] PLAID_CLIENT_ID o PLAID_SECRET no configurados');
    return null;
  }

  const config = new Configuration({
    basePath: plaidEnvMap[PLAID_ENV],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
    },
  });

  plaidClient = new PlaidApi(config);
  return plaidClient;
}

export function isPlaidConfigured(): boolean {
  return !!(PLAID_CLIENT_ID && PLAID_SECRET);
}

export function getPlaidEnv(): string {
  return PLAID_ENV;
}

// ═══════════════════════════════════════════════════════════════
// LINK TOKEN (para iniciar Plaid Link en el frontend)
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un link_token para iniciar Plaid Link en el frontend.
 * El usuario selecciona su banco y autoriza acceso.
 */
export async function createLinkToken(params: {
  userId: string;
  companyId: string;
  redirectUri?: string;
  products?: Products[];
}): Promise<{ linkToken: string; expiration: string } | null> {
  const plaid = getPlaid();
  if (!plaid) return null;

  try {
    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: `${params.companyId}_${params.userId}`,
      },
      client_name: 'INMOVA',
      products: params.products || [Products.Transactions],
      country_codes: [CountryCode.Es, CountryCode.Fr, CountryCode.De, CountryCode.Gb],
      language: 'es',
      redirect_uri: params.redirectUri || `${process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com'}/api/open-banking/plaid/callback`,
    };

    const response = await plaid.linkTokenCreate(request);

    logger.info(`[Plaid] Link token creado para company ${params.companyId}`);
    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  } catch (error: any) {
    logger.error('[Plaid] Error creando link token:', error?.response?.data || error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXCHANGE TOKEN (después de que el usuario conecta su banco)
// ═══════════════════════════════════════════════════════════════

/**
 * Intercambia el public_token temporal por un access_token permanente.
 * Se llama después de que Plaid Link devuelve el public_token.
 */
export async function exchangePublicToken(publicToken: string): Promise<{
  accessToken: string;
  itemId: string;
} | null> {
  const plaid = getPlaid();
  if (!plaid) return null;

  try {
    const request: ItemPublicTokenExchangeRequest = {
      public_token: publicToken,
    };

    const response = await plaid.itemPublicTokenExchange(request);

    logger.info(`[Plaid] Token exchanged: item_id=${response.data.item_id}`);
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error: any) {
    logger.error('[Plaid] Error exchanging token:', error?.response?.data || error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CUENTAS Y SALDOS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene las cuentas y saldos del usuario.
 */
export async function getAccounts(accessToken: string): Promise<{
  accounts: Array<{
    accountId: string;
    name: string;
    officialName: string | null;
    type: string;
    subtype: string | null;
    mask: string | null;
    balanceCurrent: number | null;
    balanceAvailable: number | null;
    currency: string | null;
  }>;
  institutionName?: string;
} | null> {
  const plaid = getPlaid();
  if (!plaid) return null;

  try {
    const request: AccountsGetRequest = { access_token: accessToken };
    const response = await plaid.accountsGet(request);

    const accounts = response.data.accounts.map(acc => ({
      accountId: acc.account_id,
      name: acc.name,
      officialName: acc.official_name,
      type: acc.type,
      subtype: acc.subtype,
      mask: acc.mask,
      balanceCurrent: acc.balances.current,
      balanceAvailable: acc.balances.available,
      currency: acc.balances.iso_currency_code,
    }));

    return { accounts };
  } catch (error: any) {
    logger.error('[Plaid] Error getting accounts:', error?.response?.data || error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSACCIONES (sync incremental)
// ═══════════════════════════════════════════════════════════════

/**
 * Sincroniza transacciones incrementalmente usando el cursor.
 * Devuelve transacciones nuevas, modificadas y eliminadas desde el último sync.
 */
export async function syncTransactions(accessToken: string, cursor?: string): Promise<{
  added: Array<{
    transactionId: string;
    accountId: string;
    date: string;
    name: string;
    amount: number;
    currency: string | null;
    category: string[];
    merchantName: string | null;
    pending: boolean;
  }>;
  modified: Array<{ transactionId: string; [key: string]: any }>;
  removed: Array<{ transactionId: string }>;
  nextCursor: string;
  hasMore: boolean;
} | null> {
  const plaid = getPlaid();
  if (!plaid) return null;

  try {
    const allAdded: any[] = [];
    const allModified: any[] = [];
    const allRemoved: any[] = [];
    let currentCursor = cursor || '';
    let hasMore = true;

    while (hasMore) {
      const request: TransactionsSyncRequest = {
        access_token: accessToken,
        cursor: currentCursor || undefined,
        count: 500,
      };

      const response = await plaid.transactionsSync(request);
      const data = response.data;

      allAdded.push(...data.added.map(tx => ({
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        date: tx.date,
        name: tx.name,
        amount: tx.amount,
        currency: tx.iso_currency_code,
        category: tx.category || [],
        merchantName: tx.merchant_name,
        pending: tx.pending,
      })));

      allModified.push(...data.modified.map(tx => ({
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        date: tx.date,
        name: tx.name,
        amount: tx.amount,
      })));

      allRemoved.push(...data.removed.map(tx => ({
        transactionId: tx.transaction_id,
      })));

      currentCursor = data.next_cursor;
      hasMore = data.has_more;
    }

    logger.info(`[Plaid] Sync: +${allAdded.length} ~${allModified.length} -${allRemoved.length}`);

    return {
      added: allAdded,
      modified: allModified,
      removed: allRemoved,
      nextCursor: currentCursor,
      hasMore: false,
    };
  } catch (error: any) {
    logger.error('[Plaid] Error syncing transactions:', error?.response?.data || error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// DESCONECTAR
// ═══════════════════════════════════════════════════════════════

/**
 * Elimina el acceso a las cuentas del usuario (revoca el token).
 */
export async function removeItem(accessToken: string): Promise<boolean> {
  const plaid = getPlaid();
  if (!plaid) return false;

  try {
    await plaid.itemRemove({ access_token: accessToken });
    logger.info('[Plaid] Item removed');
    return true;
  } catch (error: any) {
    logger.error('[Plaid] Error removing item:', error?.response?.data || error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// INSTITUCIONES (listar bancos disponibles)
// ═══════════════════════════════════════════════════════════════

/**
 * Busca instituciones bancarias por nombre o país.
 */
export async function searchInstitutions(query: string, countryCode: CountryCode = CountryCode.Es): Promise<Array<{
  institutionId: string;
  name: string;
  logo: string | null;
  primaryColor: string | null;
  url: string | null;
}> | null> {
  const plaid = getPlaid();
  if (!plaid) return null;

  try {
    const response = await plaid.institutionsSearch({
      query,
      country_codes: [countryCode],
      products: [Products.Transactions],
    });

    return response.data.institutions.map(inst => ({
      institutionId: inst.institution_id,
      name: inst.name,
      logo: inst.logo,
      primaryColor: inst.primary_color,
      url: inst.url,
    }));
  } catch (error: any) {
    logger.error('[Plaid] Error searching institutions:', error?.response?.data || error.message);
    return null;
  }
}

export default {
  isPlaidConfigured,
  getPlaidEnv,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  syncTransactions,
  removeItem,
  searchInstitutions,
};
