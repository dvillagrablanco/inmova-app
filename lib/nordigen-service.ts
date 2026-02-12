/**
 * Nordigen / GoCardless Bank Account Data Service
 * 
 * Open Banking GRATUITO (250 conexiones/día) sin necesidad de licencia TPP.
 * Soporta bancos españoles: Bankinter, BBVA, CaixaBank, Santander, Sabadell, etc.
 * 
 * Flujo:
 * 1. Listar bancos disponibles por país
 * 2. Crear requisition (sesión de conexión)
 * 3. Redirigir usuario al banco para autorizar
 * 4. Callback: obtener cuentas y transacciones
 * 
 * Dashboard: https://bankaccountdata.gocardless.com/
 * Docs: https://nordigen.com/en/account_information_documenation/api-documention/
 * 
 * @module lib/nordigen-service
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NordigenClient = require('nordigen-node');
import logger from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const NORDIGEN_SECRET_ID = process.env.NORDIGEN_SECRET_ID || '';
const NORDIGEN_SECRET_KEY = process.env.NORDIGEN_SECRET_KEY || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';

let client: any = null;
let tokenExpiry: Date | null = null;

async function getClient(): Promise<any | null> {
  if (!NORDIGEN_SECRET_ID || !NORDIGEN_SECRET_KEY) {
    logger.warn('[Nordigen] NORDIGEN_SECRET_ID o NORDIGEN_SECRET_KEY no configurados');
    return null;
  }

  if (!client) {
    client = new NordigenClient({
      secretId: NORDIGEN_SECRET_ID,
      secretKey: NORDIGEN_SECRET_KEY,
    });
  }

  // Refresh token if expired or not set
  if (!tokenExpiry || new Date() >= tokenExpiry) {
    try {
      const tokenData = await client.generateToken();
      // Token dura 24h
      tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      logger.info('[Nordigen] Token generado/renovado');
    } catch (error: any) {
      logger.error('[Nordigen] Error generando token:', error.message);
      return null;
    }
  }

  return client;
}

export function isNordigenConfigured(): boolean {
  return !!(NORDIGEN_SECRET_ID && NORDIGEN_SECRET_KEY);
}

// ═══════════════════════════════════════════════════════════════
// INSTITUCIONES (listar bancos)
// ═══════════════════════════════════════════════════════════════

export interface NordigenInstitution {
  id: string;
  name: string;
  bic: string;
  logo: string;
  countries: string[];
  transaction_total_days: string;
}

/**
 * Lista bancos disponibles por país (ES, FR, DE, GB, PT, etc.)
 */
export async function getInstitutions(country: string = 'ES'): Promise<NordigenInstitution[]> {
  const nordigen = await getClient();
  if (!nordigen) return [];

  try {
    const institutions = await nordigen.institution.getInstitutions({ country });
    logger.info(`[Nordigen] ${institutions.length} bancos encontrados para ${country}`);
    return institutions;
  } catch (error: any) {
    logger.error('[Nordigen] Error listando instituciones:', error.message);
    return [];
  }
}

/**
 * Obtiene detalles de un banco por su ID
 */
export async function getInstitutionById(institutionId: string): Promise<NordigenInstitution | null> {
  const nordigen = await getClient();
  if (!nordigen) return null;

  try {
    return await nordigen.institution.getInstitutionById(institutionId);
  } catch (error: any) {
    logger.error('[Nordigen] Error obteniendo institución:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// REQUISITIONS (conexiones de banco)
// ═══════════════════════════════════════════════════════════════

export interface RequisitionResult {
  requisitionId: string;
  link: string;
  status: string;
}

/**
 * Crea una requisition (sesión) para conectar un banco.
 * Devuelve un link al que redirigir al usuario para autorizar acceso.
 */
export async function createRequisition(params: {
  institutionId: string;
  companyId: string;
  userId: string;
  redirectUrl?: string;
  maxHistoricalDays?: number;
}): Promise<RequisitionResult | null> {
  const nordigen = await getClient();
  if (!nordigen) return null;

  try {
    // Crear agreement (90 días acceso, max historial)
    const agreement = await nordigen.agreement.createAgreement({
      institution_id: params.institutionId,
      max_historical_days: params.maxHistoricalDays || 730, // 2 años
      access_valid_for_days: 90,
      access_scope: ['balances', 'details', 'transactions'],
    });

    // Crear requisition con el agreement
    const redirectUrl = params.redirectUrl ||
      `${APP_URL}/api/open-banking/nordigen/callback?companyId=${params.companyId}&userId=${params.userId}`;

    const requisition = await nordigen.requisition.createRequisition({
      redirect: redirectUrl,
      institution_id: params.institutionId,
      reference: `inmova_${params.companyId}_${Date.now()}`,
      agreement: agreement.id,
      user_language: 'ES',
    });

    logger.info(`[Nordigen] Requisition creada: ${requisition.id} para ${params.institutionId}`);

    return {
      requisitionId: requisition.id,
      link: requisition.link,
      status: requisition.status,
    };
  } catch (error: any) {
    logger.error('[Nordigen] Error creando requisition:', error.message);
    return null;
  }
}

/**
 * Obtiene el estado de una requisition (para verificar si el usuario ya autorizó)
 */
export async function getRequisition(requisitionId: string): Promise<{
  id: string;
  status: string;
  accounts: string[];
  institutionId: string;
  link: string;
} | null> {
  const nordigen = await getClient();
  if (!nordigen) return null;

  try {
    const req = await nordigen.requisition.getRequisitionById(requisitionId);
    return {
      id: req.id,
      status: req.status,
      accounts: req.accounts || [],
      institutionId: req.institution_id,
      link: req.link,
    };
  } catch (error: any) {
    logger.error('[Nordigen] Error obteniendo requisition:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CUENTAS Y SALDOS
// ═══════════════════════════════════════════════════════════════

export interface NordigenAccount {
  id: string;
  iban: string;
  ownerName: string;
  currency: string;
  status: string;
  institutionId: string;
}

export interface NordigenBalance {
  balanceAmount: { amount: string; currency: string };
  balanceType: string;
  referenceDate: string;
}

/**
 * Obtiene detalles de una cuenta
 */
export async function getAccountDetails(accountId: string): Promise<NordigenAccount | null> {
  const nordigen = await getClient();
  if (!nordigen) return null;

  try {
    const account = nordigen.account(accountId);
    const details = await account.getDetails();
    const data = details.account || details;

    return {
      id: accountId,
      iban: data.iban || '',
      ownerName: data.ownerName || '',
      currency: data.currency || 'EUR',
      status: data.status || 'enabled',
      institutionId: '',
    };
  } catch (error: any) {
    logger.error('[Nordigen] Error obteniendo detalles cuenta:', error.message);
    return null;
  }
}

/**
 * Obtiene saldos de una cuenta
 */
export async function getAccountBalances(accountId: string): Promise<NordigenBalance[]> {
  const nordigen = await getClient();
  if (!nordigen) return [];

  try {
    const account = nordigen.account(accountId);
    const balances = await account.getBalances();
    return balances.balances || [];
  } catch (error: any) {
    logger.error('[Nordigen] Error obteniendo saldos:', error.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSACCIONES
// ═══════════════════════════════════════════════════════════════

export interface NordigenTransaction {
  transactionId: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: { amount: string; currency: string };
  remittanceInformationUnstructured?: string;
  remittanceInformationStructured?: string;
  creditorName?: string;
  debtorName?: string;
  creditorAccount?: { iban?: string };
  debtorAccount?: { iban?: string };
  bankTransactionCode?: string;
}

/**
 * Obtiene transacciones de una cuenta.
 * dateFrom/dateTo en formato YYYY-MM-DD.
 */
export async function getTransactions(
  accountId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  booked: NordigenTransaction[];
  pending: NordigenTransaction[];
} | null> {
  const nordigen = await getClient();
  if (!nordigen) return null;

  try {
    const account = nordigen.account(accountId);
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const result = await account.getTransactions(params);
    const transactions = result.transactions || result;

    return {
      booked: transactions.booked || [],
      pending: transactions.pending || [],
    };
  } catch (error: any) {
    logger.error('[Nordigen] Error obteniendo transacciones:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// ELIMINAR CONEXIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Elimina una requisition (desconecta banco)
 */
export async function deleteRequisition(requisitionId: string): Promise<boolean> {
  const nordigen = await getClient();
  if (!nordigen) return false;

  try {
    await nordigen.requisition.deleteRequisition(requisitionId);
    logger.info(`[Nordigen] Requisition ${requisitionId} eliminada`);
    return true;
  } catch (error: any) {
    logger.error('[Nordigen] Error eliminando requisition:', error.message);
    return false;
  }
}

export default {
  isNordigenConfigured,
  getInstitutions,
  getInstitutionById,
  createRequisition,
  getRequisition,
  getAccountDetails,
  getAccountBalances,
  getTransactions,
  deleteRequisition,
};
