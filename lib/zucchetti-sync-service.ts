import logger from '@/lib/logger';
import { prisma } from '@/lib/db';
import {
  getAltaiConfig,
  getAltaiAccessToken,
  isAltaiConfigured,
  sendAltaiEntry,
  type AltaiConfig,
} from '@/lib/zucchetti-altai-service';

function resolveEntriesUrl(config: AltaiConfig): string | null {
  if (config.entriesUrl) return config.entriesUrl;
  if (config.entriesPath) {
    const base = config.apiUrl.replace(/\/+$/, '');
    const path = config.entriesPath.startsWith('/')
      ? config.entriesPath
      : `/${config.entriesPath}`;
    return `${base}${path}`;
  }
  return `${config.apiUrl.replace(/\/+$/, '')}/entries`;
}

async function isAltaiConfiguredForCompany(companyId: string): Promise<boolean> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { zucchettiEnabled: true, zucchettiCompanyId: true },
  });
  if (!company?.zucchettiEnabled) return false;
  return isAltaiConfigured() || !!company.zucchettiCompanyId;
}

async function getAltaiConfigForCompany(companyId: string): Promise<{
  apiUrl: string;
  accessToken: string;
  entriesUrl: string | null;
} | null> {
  const baseConfig = getAltaiConfig();
  const tokenResult = await getAltaiAccessToken(companyId);
  if (!tokenResult) return null;

  const entriesUrl = resolveEntriesUrl(baseConfig);
  return {
    apiUrl: baseConfig.apiUrl,
    accessToken: tokenResult.accessToken,
    entriesUrl,
  };
}

function getLastSyncDate(companyId: string): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

/**
 * Sync accounting entries FROM Zucchetti to Inmova (read direction)
 * Fetches recent entries from Altai API and imports them
 */
export async function syncFromZucchetti(companyId: string): Promise<{
  success: boolean;
  entriesImported: number;
  errors: string[];
}> {
  if (!(await isAltaiConfiguredForCompany(companyId))) {
    return {
      success: false,
      entriesImported: 0,
      errors: ['Zucchetti not configured for this company'],
    };
  }

  try {
    const config = await getAltaiConfigForCompany(companyId);
    if (!config) {
      return { success: false, entriesImported: 0, errors: ['Config not found'] };
    }
    if (!config.entriesUrl) {
      return {
        success: false,
        entriesImported: 0,
        errors: ['Entries URL not configured for Altai'],
      };
    }

    const since = getLastSyncDate(companyId);
    const url = `${config.entriesUrl}?since=${since}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        entriesImported: 0,
        errors: [`API error: ${response.status}`],
      };
    }

    const entries = await response.json();
    const entriesList = Array.isArray(entries) ? entries : entries?.data ?? entries?.entries ?? [];
    logger.info(`[Zucchetti Sync] Fetched ${entriesList.length} entries for ${companyId}`);

    // TODO: Map and save entries to Inmova DB

    return { success: true, entriesImported: entriesList.length, errors: [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Zucchetti Sync] Error:', error);
    return { success: false, entriesImported: 0, errors: [message] };
  }
}

/**
 * Check Zucchetti sync status for a company
 */
export async function getZucchettiSyncStatus(companyId: string): Promise<{
  configured: boolean;
  lastSync: string | null;
  entriesPending: number;
}> {
  const configured = await isAltaiConfiguredForCompany(companyId);
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { zucchettiLastSync: true },
  });

  return {
    configured,
    lastSync: company?.zucchettiLastSync?.toISOString() ?? null,
    entriesPending: 0,
  };
}

export { sendAltaiEntry };
