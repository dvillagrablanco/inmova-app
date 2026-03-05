/**
 * Cloudflare Turnstile CAPTCHA verification
 * 
 * Turnstile is free, privacy-focused, and doesn't require user interaction.
 * Graceful degradation: if TURNSTILE_SECRET_KEY is not set, verification is skipped.
 * 
 * Setup: https://developers.cloudflare.com/turnstile/get-started/
 * Env: TURNSTILE_SECRET_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY
 */

import logger from '@/lib/logger';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verify a Turnstile token server-side
 * Returns true if verification passes or if Turnstile is not configured (graceful degradation)
 */
export async function verifyTurnstileToken(token: string | null | undefined, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Graceful degradation: if not configured, skip verification
  if (!secretKey) {
    logger.debug('[Turnstile] Not configured, skipping verification');
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'CAPTCHA token missing' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const result: TurnstileVerifyResult = await response.json();

    if (!result.success) {
      logger.warn('[Turnstile] Verification failed:', result['error-codes']);
      return { success: false, error: `CAPTCHA verification failed: ${(result['error-codes'] || []).join(', ')}` };
    }

    return { success: true };
  } catch (error: any) {
    logger.error('[Turnstile] Verification error:', error.message);
    // On network error, allow through (don't block legitimate users)
    return { success: true };
  }
}

/**
 * Check if Turnstile is configured
 */
export function isTurnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}
