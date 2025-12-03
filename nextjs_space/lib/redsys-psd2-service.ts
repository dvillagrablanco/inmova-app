/**
 * Servicio de Integración Redsys PSD2
 * 
 * Este servicio proporciona funcionalidades completas para la integración
 * con la plataforma Redsys PSD2, permitiendo acceso a servicios bancarios
 * de Bankinter y otros bancos españoles a través de open banking.
 * 
 * Servicios disponibles:
 * - AIS (Account Information Services): Consulta de cuentas, saldos y transacciones
 * - PIS (Payment Initiation Services): Iniciación de pagos y transferencias
 * - FCS (Funds Confirmation Services): Confirmación de disponibilidad de fondos
 * 
 * @author INMOVA Development Team
 * @version 1.0.0
 * @date 2025-12
 */

import { createHash, randomBytes } from 'crypto';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface RedsysConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface OAuth AuthorizationParams {
  aspsp: string; // Bank identifier (e.g., 'bankinter', 'bbva', 'santander')
  scope: 'AIS' | 'PIS' | 'FCS' | 'AIS PIS' | 'AIS FCS' | 'PIS FCS' | 'AIS PIS FCS';
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface BankAccount {
  id: string;
  iban: string;
  currency: string;
  name?: string;
  product?: string;
  cashAccountType?: string;
  status?: string;
  balances?: BankBalance[];
}

export interface BankBalance {
  balanceType: string;
  balanceAmount: {
    amount: string;
    currency: string;
  };
  referenceDate?: string;
  lastChangeDateTime?: string;
}

export interface BankTransaction {
  transactionId: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  creditorAccount?: {
    iban: string;
  };
  debtorName?: string;
  debtorAccount?: {
    iban: string;
  };
  remittanceInformationUnstructured?: string;
  proprietaryBankTransactionCode?: string;
}

export interface PaymentInitiation {
  instructedAmount: {
    amount: string;
    currency: string;
  };
  debtorAccount: {
    iban: string;
  };
  creditorAccount: {
    iban: string;
  };
  creditorName: string;
  remittanceInformationUnstructured: string;
}

export interface PaymentStatus {
  transactionStatus: 'ACCP' | 'ACSC' | 'ACSP' | 'ACTC' | 'ACWC' | 'ACWP' | 'RCVD' | 'PDNG' | 'RJCT' | 'CANC';
  fundsAvailable?: boolean;
}

export interface ConsentRequest {
  access: {
    accounts?: string[];
    balances?: string[];
    transactions?: string[];
  };
  recurringIndicator: boolean;
  validUntil: string; // ISO date
  frequencyPerDay: number;
}

export interface ConsentResponse {
  consentId: string;
  consentStatus: 'received' | 'valid' | 'rejected' | 'expired' | 'revoked' | 'terminated';
  _links: {
    scaRedirect?: {
      href: string;
    };
    status: {
      href: string;
    };
  };
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/**
 * Obtiene la configuración de Redsys desde las variables de entorno
 */
export function getRedsysConfig(): RedsysConfig {
  const config: RedsysConfig = {
    clientId: process.env.REDSYS_CLIENT_ID || '',
    clientSecret: process.env.REDSYS_CLIENT_SECRET || '',
    redirectUri: process.env.REDSYS_REDIRECT_URI || '',
    baseUrl: process.env.REDSYS_BASE_URL || 'https://apis-i.redsys.es:28443/psd2/xs2a',
    environment: (process.env.REDSYS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  };

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('Redsys PSD2 configuration is incomplete. Check environment variables.');
  }

  return config;
}

// ============================================================================
// UTILIDADES PKCE
// ============================================================================

/**
 * Genera un code verifier aleatorio para PKCE
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Genera un code challenge a partir de un code verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Genera un state aleatorio para prevenir CSRF
 */
export function generateState(): string {
  return randomBytes(16).toString('hex');
}

// ============================================================================
// OAUTH 2.0
// ============================================================================

/**
 * Construye la URL de autorización para iniciar el flujo OAuth
 */
export function buildAuthorizationUrl(params: OAuthAuthorizationParams): string {
  const config = getRedsysConfig();
  const state = params.state || generateState();
  
  // Si se usa PKCE, generar el code challenge
  let codeChallenge = params.codeChallenge;
  let codeChallengeMethod = params.codeChallengeMethod || 'S256';
  
  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    scope: params.scope,
    state,
    redirect_uri: config.redirectUri,
  });
  
  if (codeChallenge) {
    queryParams.append('code_challenge', codeChallenge);
    queryParams.append('code_challenge_method', codeChallengeMethod);
  }
  
  return `${config.baseUrl}/${params.aspsp}/authorize?${queryParams.toString()}`;
}

/**
 * Intercambia el código de autorización por un access token
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier?: string
): Promise<OAuthTokenResponse> {
  const config = getRedsysConfig();
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  
  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }
  
  const response = await fetch(`${config.baseUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Refresca un access token usando un refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const config = getRedsysConfig();
  
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  
  const response = await fetch(`${config.baseUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${error}`);
  }
  
  return response.json();
}

// ============================================================================
// SERVICIOS AIS (ACCOUNT INFORMATION SERVICES)
// ============================================================================

/**
 * Crea un consentimiento para acceder a información de cuentas
 */
export async function createAISConsent(
  aspsp: string,
  accessToken: string,
  consent: ConsentRequest
): Promise<ConsentResponse> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/consents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
    body: JSON.stringify(consent),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create AIS consent: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Obtiene el estado de un consentimiento
 */
export async function getConsentStatus(
  aspsp: string,
  consentId: string,
  accessToken: string
): Promise<any> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/consents/${consentId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get consent status: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Lista todas las cuentas bancarias del usuario
 */
export async function getAccounts(
  aspsp: string,
  consentId: string,
  accessToken: string
): Promise<BankAccount[]> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/accounts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Consent-ID': consentId,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get accounts: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  return data.accounts || [];
}

/**
 * Obtiene el detalle de una cuenta específica
 */
export async function getAccountDetails(
  aspsp: string,
  accountId: string,
  consentId: string,
  accessToken: string
): Promise<BankAccount> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/accounts/${accountId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Consent-ID': consentId,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get account details: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  return data.account;
}

/**
 * Obtiene los saldos de una cuenta
 */
export async function getBalances(
  aspsp: string,
  accountId: string,
  consentId: string,
  accessToken: string
): Promise<BankBalance[]> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/accounts/${accountId}/balances`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Consent-ID': consentId,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get balances: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  return data.balances || [];
}

/**
 * Obtiene las transacciones de una cuenta
 */
export async function getTransactions(
  aspsp: string,
  accountId: string,
  consentId: string,
  accessToken: string,
  dateFrom?: string,
  dateTo?: string
): Promise<BankTransaction[]> {
  const config = getRedsysConfig();
  
  const queryParams = new URLSearchParams();
  if (dateFrom) queryParams.append('dateFrom', dateFrom);
  if (dateTo) queryParams.append('dateTo', dateTo);
  
  const queryString = queryParams.toString();
  const url = `${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Consent-ID': consentId,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get transactions: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  return data.transactions?.booked || [];
}

// ============================================================================
// SERVICIOS PIS (PAYMENT INITIATION SERVICES)
// ============================================================================

/**
 * Inicia un pago SEPA
 */
export async function initiatePayment(
  aspsp: string,
  paymentProduct: 'sepa-credit-transfers' | 'instant-sepa-credit-transfers',
  payment: PaymentInitiation,
  accessToken: string
): Promise<any> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/payments/${paymentProduct}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Request-ID': randomBytes(16).toString('hex'),
      'PSU-IP-Address': '127.0.0.1', // Should be real user IP
    },
    body: JSON.stringify(payment),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initiate payment: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Obtiene el estado de un pago
 */
export async function getPaymentStatus(
  aspsp: string,
  paymentProduct: string,
  paymentId: string,
  accessToken: string
): Promise<PaymentStatus> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/payments/${paymentProduct}/${paymentId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get payment status: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Obtiene los detalles de un pago
 */
export async function getPaymentDetails(
  aspsp: string,
  paymentProduct: string,
  paymentId: string,
  accessToken: string
): Promise<any> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/payments/${paymentProduct}/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get payment details: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Cancela un pago pendiente
 */
export async function cancelPayment(
  aspsp: string,
  paymentProduct: string,
  paymentId: string,
  accessToken: string
): Promise<any> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/payments/${paymentProduct}/${paymentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to cancel payment: ${response.status} ${error}`);
  }
  
  return response.json();
}

// ============================================================================
// SERVICIOS FCS (FUNDS CONFIRMATION SERVICES)
// ============================================================================

/**
 * Confirma la disponibilidad de fondos en una cuenta
 */
export async function confirmFunds(
  aspsp: string,
  accountId: string,
  amount: string,
  currency: string,
  accessToken: string
): Promise<{ fundsAvailable: boolean }> {
  const config = getRedsysConfig();
  
  const response = await fetch(`${config.baseUrl}/api-entrada-xs2a/services/${aspsp}/v1.1/funds-confirmations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Request-ID': randomBytes(16).toString('hex'),
    },
    body: JSON.stringify({
      account: {
        iban: accountId,
      },
      instructedAmount: {
        amount,
        currency,
      },
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to confirm funds: ${response.status} ${error}`);
  }
  
  return response.json();
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Identificadores de bancos soportados en España
 */
export const SPANISH_BANKS = {
  BANKINTER: 'bankinter',
  BBVA: 'bbva',
  SANTANDER: 'santander',
  CAIXABANK: 'caixabank',
  SABADELL: 'sabadell',
  BANKIA: 'bankia',
  UNICAJA: 'unicaja',
  LIBERBANK: 'liberbank',
  ABANCA: 'abanca',
  CAJAMAR: 'cajamar',
  KUTXABANK: 'kutxabank',
  IBERCAJA: 'ibercaja',
  ING: 'ing',
  N26: 'n26',
  REVOLUT: 'revolut',
  OPENBANK: 'openbank',
} as const;

/**
 * Mapeo de nombres de bancos para mostrar en UI
 */
export const BANK_NAMES: Record<string, string> = {
  [SPANISH_BANKS.BANKINTER]: 'Bankinter',
  [SPANISH_BANKS.BBVA]: 'BBVA',
  [SPANISH_BANKS.SANTANDER]: 'Banco Santander',
  [SPANISH_BANKS.CAIXABANK]: 'CaixaBank',
  [SPANISH_BANKS.SABADELL]: 'Banco Sabadell',
  [SPANISH_BANKS.BANKIA]: 'Bankia',
  [SPANISH_BANKS.UNICAJA]: 'Unicaja Banco',
  [SPANISH_BANKS.LIBERBANK]: 'Liberbank',
  [SPANISH_BANKS.ABANCA]: 'Abanca',
  [SPANISH_BANKS.CAJAMAR]: 'Cajamar',
  [SPANISH_BANKS.KUTXABANK]: 'Kutxabank',
  [SPANISH_BANKS.IBERCAJA]: 'Ibercaja',
  [SPANISH_BANKS.ING]: 'ING',
  [SPANISH_BANKS.N26]: 'N26',
  [SPANISH_BANKS.REVOLUT]: 'Revolut',
  [SPANISH_BANKS.OPENBANK]: 'Openbank',
};

/**
 * Valida un IBAN español
 */
export function validateSpanishIBAN(iban: string): boolean {
  // Eliminar espacios y convertir a mayúsculas
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Verificar formato español: ES + 2 dígitos de control + 20 dígitos
  const spanishIbanRegex = /^ES\d{22}$/;
  
  return spanishIbanRegex.test(cleanIban);
}

/**
 * Formatea un IBAN para mostrar en UI
 */
export function formatIBAN(iban: string): string {
  const cleanIban = iban.replace(/\s/g, '');
  return cleanIban.match(/.{1,4}/g)?.join(' ') || iban;
}

/**
 * Formatea una cantidad monetaria
 */
export function formatAmount(amount: string, currency: string): string {
  const numAmount = parseFloat(amount);
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(numAmount);
}

/**
 * Calcula la fecha de expiración de un consentimiento (máximo 90 días)
 */
export function getConsentExpirationDate(days: number = 90): string {
  const maxDays = Math.min(days, 90); // PSD2 requiere máximo 90 días
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + maxDays);
  return expirationDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

export default {
  // Config
  getRedsysConfig,
  
  // PKCE
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  
  // OAuth
  buildAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  
  // AIS
  createAISConsent,
  getConsentStatus,
  getAccounts,
  getAccountDetails,
  getBalances,
  getTransactions,
  
  // PIS
  initiatePayment,
  getPaymentStatus,
  getPaymentDetails,
  cancelPayment,
  
  // FCS
  confirmFunds,
  
  // Utils
  SPANISH_BANKS,
  BANK_NAMES,
  validateSpanishIBAN,
  formatIBAN,
  formatAmount,
  getConsentExpirationDate,
};
