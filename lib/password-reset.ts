import crypto from 'crypto';

const DEFAULT_APP_URL = 'http://localhost:3000';

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    DEFAULT_APP_URL
  );
}

export function buildResetLink(path: string, token: string): string {
  const baseUrl = getAppBaseUrl();
  const url = new URL(path, baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}
