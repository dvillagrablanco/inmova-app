/**
 * Sistema de versionado automático para INMOVA
 *
 * Este módulo proporciona información de versión dinámica basada en:
 * - Variables de entorno de Vercel
 * - Git commit SHA
 * - Timestamp de build
 */

export interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  deploymentId: string;
  environment: string;
  isProduction: boolean;
}

/**
 * Obtiene información completa de la versión actual del deployment
 */
export function getVersionInfo(): VersionInfo {
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  const gitCommit = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || 'local';
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';

  // Formato de versión: YYYY.MM.DD-{short-commit}
  const date = new Date(buildTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const shortCommit = gitCommit.substring(0, 7);

  const version = `${year}.${month}.${day}-${shortCommit}`;

  return {
    version,
    buildTime,
    gitCommit,
    deploymentId,
    environment,
    isProduction,
  };
}

/**
 * Obtiene solo el string de versión
 */
export function getVersionString(): string {
  return getVersionInfo().version;
}

/**
 * Genera un hash único para cache-busting
 */
export function getCacheBustingHash(): string {
  const { gitCommit, buildTime } = getVersionInfo();
  return `${gitCommit.substring(0, 7)}-${new Date(buildTime).getTime()}`;
}

/**
 * Headers de versión para responses HTTP
 */
export function getVersionHeaders(): Record<string, string> {
  const info = getVersionInfo();

  return {
    'X-App-Version': info.version,
    'X-Build-Time': info.buildTime,
    'X-Git-Commit': info.gitCommit,
    'X-Deployment-Id': info.deploymentId,
    'X-Environment': info.environment,
  };
}

/**
 * Información de versión para debugging y soporte
 */
export function getVersionDebugInfo(): string {
  const info = getVersionInfo();

  return `
=== INMOVA Version Info ===
Version: ${info.version}
Build Time: ${info.buildTime}
Git Commit: ${info.gitCommit}
Deployment ID: ${info.deploymentId}
Environment: ${info.environment}
Is Production: ${info.isProduction}
==========================
  `.trim();
}

// Export default
export default {
  getVersionInfo,
  getVersionString,
  getCacheBustingHash,
  getVersionHeaders,
  getVersionDebugInfo,
};
