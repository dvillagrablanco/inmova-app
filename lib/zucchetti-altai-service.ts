import logger from '@/lib/logger';
import { prisma } from '@/lib/db';
import { decryptZucchettiToken, encryptZucchettiToken } from '@/lib/zucchetti-token-crypto';

const DEFAULT_ALTAI_API_URL = 'https://wsaltaifacturas.altai.es/api';
const DEFAULT_ALTAI_AUTH_PATH = '/login/authenticate';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_TOKEN_TTL_SECONDS = 55 * 60;

export type ZucchettiAuthMode = 'oauth' | 'altai';

export interface AltaiConfig {
  apiUrl: string;
  authPath: string;
  authUrl?: string;
  entriesPath?: string;
  entriesUrl?: string;
  testPath?: string;
  testUrl?: string;
  login: string;
  password: string;
  companyCode: string;
  timeoutMs: number;
  includeCompanyCode: boolean;
  entryWrapperKey?: string;
  loginField: string;
  passwordField: string;
  companyField: string;
}

export interface AltaiTokenResult {
  accessToken: string;
  tokenType: string;
  expiresAt?: Date;
  raw?: unknown;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveUrl(baseUrl: string, pathOrUrl?: string): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const base = normalizeBaseUrl(baseUrl);
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function parseJsonSafely(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractTokenFromResponse(data: any): AltaiTokenResult | null {
  if (!data) return null;

  const unwrap = data?.data || data?.result || data?.payload || data?.response || data;

  if (typeof unwrap === 'string') {
    return {
      accessToken: unwrap,
      tokenType: 'Bearer',
    };
  }

  const accessToken =
    unwrap?.accessToken ||
    unwrap?.access_token ||
    unwrap?.token ||
    unwrap?.jwt ||
    unwrap?.bearer ||
    unwrap?.authorization;

  if (!accessToken || typeof accessToken !== 'string') {
    return null;
  }

  const tokenType = unwrap?.tokenType || unwrap?.token_type || unwrap?.type || 'Bearer';

  const expiresIn =
    unwrap?.expiresIn || unwrap?.expires_in || unwrap?.expires || unwrap?.ttl || null;

  const expiresAtRaw =
    unwrap?.expiresAt || unwrap?.expires_at || unwrap?.expiration || unwrap?.exp || null;

  let expiresAt: Date | undefined;

  if (typeof expiresIn === 'number' && expiresIn > 0) {
    expiresAt = new Date(Date.now() + expiresIn * 1000);
  } else if (typeof expiresAtRaw === 'string' || typeof expiresAtRaw === 'number') {
    const parsed = new Date(
      typeof expiresAtRaw === 'number' && expiresAtRaw < 10 ** 12
        ? expiresAtRaw * 1000
        : expiresAtRaw
    );
    if (!Number.isNaN(parsed.valueOf())) {
      expiresAt = parsed;
    }
  }

  return {
    accessToken,
    tokenType,
    expiresAt,
    raw: unwrap,
  };
}

export function getZucchettiAuthMode(): ZucchettiAuthMode {
  const mode = (process.env.ZUCCHETTI_AUTH_MODE || '').toLowerCase();
  if (mode === 'altai') return 'altai';
  if (mode === 'oauth') return 'oauth';
  return isAltaiConfigured() ? 'altai' : 'oauth';
}

export function getAltaiConfig(): AltaiConfig {
  const apiUrl = normalizeBaseUrl(process.env.ZUCCHETTI_ALTAI_API_URL || DEFAULT_ALTAI_API_URL);

  return {
    apiUrl,
    authPath: process.env.ZUCCHETTI_ALTAI_AUTH_PATH || DEFAULT_ALTAI_AUTH_PATH,
    authUrl: process.env.ZUCCHETTI_ALTAI_AUTH_URL,
    entriesPath: process.env.ZUCCHETTI_ALTAI_ENTRIES_PATH,
    entriesUrl: process.env.ZUCCHETTI_ALTAI_ENTRIES_URL,
    testPath: process.env.ZUCCHETTI_ALTAI_TEST_PATH,
    testUrl: process.env.ZUCCHETTI_ALTAI_TEST_URL,
    login: process.env.ZUCCHETTI_ALTAI_LOGIN || '',
    password: process.env.ZUCCHETTI_ALTAI_PASSWORD || '',
    companyCode: process.env.ZUCCHETTI_ALTAI_COMPANY_CODE || '',
    timeoutMs: Number(process.env.ZUCCHETTI_ALTAI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    includeCompanyCode: process.env.ZUCCHETTI_ALTAI_INCLUDE_COMPANY_CODE !== 'false',
    entryWrapperKey: process.env.ZUCCHETTI_ALTAI_ENTRY_WRAPPER || undefined,
    // Altai (wsaltaifacturas) espera por defecto: { "Username": "...", "Password": "..." }
    // Mantener overrides vía env para entornos que difieran.
    loginField: process.env.ZUCCHETTI_ALTAI_LOGIN_FIELD || 'Username',
    passwordField: process.env.ZUCCHETTI_ALTAI_PASSWORD_FIELD || 'Password',
    companyField: process.env.ZUCCHETTI_ALTAI_COMPANY_FIELD || 'companyCode',
  };
}

export function isAltaiConfigured(): boolean {
  const config = getAltaiConfig();
  return !!(config.login && config.password && config.companyCode);
}

export async function authenticateAltai(): Promise<AltaiTokenResult> {
  const config = getAltaiConfig();

  if (!config.login || !config.password || !config.companyCode) {
    throw new Error('Credenciales Altai incompletas');
  }

  const authUrl = config.authUrl || resolveUrl(config.apiUrl, config.authPath);
  if (!authUrl) {
    throw new Error('URL de autenticacion Altai no configurada');
  }

  const payload = {
    [config.loginField]: config.login,
    [config.passwordField]: config.password,
    [config.companyField]: config.companyCode,
  };

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  const rawText = await response.text();
  const parsed = parseJsonSafely(rawText) ?? rawText;

  if (!response.ok) {
    logger.error('[Altai] Error autenticando:', {
      status: response.status,
      body: rawText,
    });
    throw new Error(`Altai auth error ${response.status}`);
  }

  const tokenResult = extractTokenFromResponse(parsed);
  if (!tokenResult) {
    throw new Error('Token Altai no encontrado en respuesta');
  }

  return tokenResult;
}

export async function getAltaiAccessToken(
  companyId: string,
  options?: { forceRefresh?: boolean }
): Promise<AltaiTokenResult | null> {
  try {
    const forceRefresh = options?.forceRefresh === true;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        zucchettiEnabled: true,
        zucchettiAccessToken: true,
        zucchettiTokenExpiry: true,
        zucchettiCompanyId: true,
      },
    });

    if (!forceRefresh && company?.zucchettiAccessToken) {
      const expiry = company.zucchettiTokenExpiry;
      if (!expiry || expiry > new Date(Date.now() + 2 * 60 * 1000)) {
        return {
          accessToken: decryptZucchettiToken(company.zucchettiAccessToken),
          tokenType: 'Bearer',
          expiresAt: expiry || undefined,
        };
      }
    }

    const tokenResult = await authenticateAltai();
    const ttlSeconds = Number(
      process.env.ZUCCHETTI_ALTAI_TOKEN_TTL_SECONDS || DEFAULT_TOKEN_TTL_SECONDS
    );
    const expiresAt = tokenResult.expiresAt || new Date(Date.now() + ttlSeconds * 1000);

    const config = getAltaiConfig();

    await prisma.company.update({
      where: { id: companyId },
      data: {
        zucchettiEnabled: true,
        zucchettiAccessToken: encryptZucchettiToken(tokenResult.accessToken),
        zucchettiRefreshToken: null,
        zucchettiTokenExpiry: expiresAt,
        zucchettiCompanyId: company?.zucchettiCompanyId || config.companyCode,
        zucchettiLastSync: new Date(),
      },
    });

    return {
      ...tokenResult,
      expiresAt,
      tokenType: tokenResult.tokenType || 'Bearer',
    };
  } catch (error) {
    logger.error('[Altai] Error obteniendo token:', error);
    return null;
  }
}

export async function testAltaiConnection(companyId: string): Promise<{
  authenticated: boolean;
  apiReachable: boolean;
  canReadData: boolean;
  errorDetails?: string;
}> {
  const tokenResult = await getAltaiAccessToken(companyId);
  if (!tokenResult) {
    return {
      authenticated: false,
      apiReachable: false,
      canReadData: false,
      errorDetails: 'No se pudo autenticar con Altai',
    };
  }

  const config = getAltaiConfig();
  const testUrl = config.testUrl || resolveUrl(config.apiUrl, config.testPath);

  if (!testUrl) {
    return {
      authenticated: true,
      apiReachable: true,
      canReadData: true,
    };
  }

  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Authorization: `${tokenResult.tokenType || 'Bearer'} ${tokenResult.accessToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    return {
      authenticated: true,
      apiReachable: response.ok || response.status === 401,
      canReadData: response.ok,
      errorDetails: response.ok ? undefined : `Altai test status ${response.status}`,
    };
  } catch (error: any) {
    return {
      authenticated: true,
      apiReachable: false,
      canReadData: false,
      errorDetails: error?.message || 'Error verificando Altai',
    };
  }
}

export interface AltaiEntry {
  entry_date: string;
  description: string;
  reference?: string;
  lines: Array<{
    account_code: string;
    account_name?: string;
    debit: number;
    credit: number;
    cost_center?: string;
  }>;
}

function buildAltaiEntryPayload(entry: AltaiEntry, config: AltaiConfig): Record<string, unknown> {
  const basePayload = config.includeCompanyCode
    ? { companyCode: config.companyCode, ...entry }
    : { ...entry };

  if (config.entryWrapperKey) {
    return { [config.entryWrapperKey]: basePayload };
  }

  return basePayload;
}

function resolveEntriesUrl(config: AltaiConfig): string | null {
  return config.entriesUrl || resolveUrl(config.apiUrl, config.entriesPath);
}

export async function sendAltaiEntry(
  companyId: string,
  entry: AltaiEntry
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  const config = getAltaiConfig();
  const entriesUrl = resolveEntriesUrl(config);

  if (!entriesUrl) {
    return {
      ok: false,
      status: 500,
      error: 'URL de asientos Altai no configurada',
    };
  }

  const tokenResult = await getAltaiAccessToken(companyId);
  if (!tokenResult) {
    return {
      ok: false,
      status: 401,
      error: 'No se pudo obtener token Altai',
    };
  }

  const payload = buildAltaiEntryPayload(entry, config);

  const response = await fetch(entriesUrl, {
    method: 'POST',
    headers: {
      Authorization: `${tokenResult.tokenType || 'Bearer'} ${tokenResult.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  const rawText = await response.text();
  const parsed = parseJsonSafely(rawText) ?? rawText;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
    };
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
  };
}
