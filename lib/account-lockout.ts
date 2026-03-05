/**
 * Account Lockout Service
 * 
 * Protects against brute-force login attacks by tracking failed attempts
 * and temporarily locking accounts after MAX_ATTEMPTS failures.
 * 
 * Uses in-memory Map with automatic cleanup (no Redis dependency).
 * In production with PM2 cluster mode, each worker has its own Map,
 * which means effective limit per worker = MAX_ATTEMPTS (acceptable for 2 workers).
 */

import logger from '@/lib/logger';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean stale entries every 5min

interface LockoutEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// In-memory store (per-process in cluster mode)
const lockoutStore = new Map<string, LockoutEntry>();

// Periodic cleanup of expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of lockoutStore) {
      // Remove entries older than 30 minutes with no lock
      if (!entry.lockedUntil && now - entry.lastAttempt > 30 * 60 * 1000) {
        lockoutStore.delete(key);
      }
      // Remove expired locks
      if (entry.lockedUntil && now > entry.lockedUntil) {
        lockoutStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Generate a key from email (primary) and optional IP
 */
function getKey(email: string, ip?: string): string {
  return `${email.toLowerCase()}`;
}

/**
 * Check if an account is currently locked
 */
export function isAccountLocked(email: string, ip?: string): { locked: boolean; remainingSeconds: number; attempts: number } {
  const key = getKey(email, ip);
  const entry = lockoutStore.get(key);

  if (!entry) {
    return { locked: false, remainingSeconds: 0, attempts: 0 };
  }

  if (entry.lockedUntil) {
    const now = Date.now();
    if (now < entry.lockedUntil) {
      const remaining = Math.ceil((entry.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds: remaining, attempts: entry.attempts };
    }
    // Lock expired, reset
    lockoutStore.delete(key);
    return { locked: false, remainingSeconds: 0, attempts: 0 };
  }

  return { locked: false, remainingSeconds: 0, attempts: entry.attempts };
}

/**
 * Record a failed login attempt
 * Returns lockout status after recording
 */
export function recordFailedAttempt(email: string, ip?: string): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const key = getKey(email, ip);
  const now = Date.now();
  let entry = lockoutStore.get(key);

  if (!entry) {
    entry = { attempts: 0, firstAttempt: now, lockedUntil: null, lastAttempt: now };
  }

  // If previously locked and lock expired, reset
  if (entry.lockedUntil && now > entry.lockedUntil) {
    entry = { attempts: 0, firstAttempt: now, lockedUntil: null, lastAttempt: now };
  }

  entry.attempts += 1;
  entry.lastAttempt = now;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    lockoutStore.set(key, entry);
    logger.warn(`[AccountLockout] Account locked: ${email} after ${entry.attempts} failed attempts`);
    return {
      locked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      attemptsLeft: 0,
    };
  }

  lockoutStore.set(key, entry);
  return {
    locked: false,
    remainingSeconds: 0,
    attemptsLeft: MAX_ATTEMPTS - entry.attempts,
  };
}

/**
 * Clear lockout on successful login
 */
export function clearLockout(email: string, ip?: string): void {
  const key = getKey(email, ip);
  lockoutStore.delete(key);
}

/**
 * Get lockout stats (for admin monitoring)
 */
export function getLockoutStats(): { totalTracked: number; currentlyLocked: number } {
  const now = Date.now();
  let locked = 0;
  for (const entry of lockoutStore.values()) {
    if (entry.lockedUntil && now < entry.lockedUntil) locked++;
  }
  return { totalTracked: lockoutStore.size, currentlyLocked: locked };
}
