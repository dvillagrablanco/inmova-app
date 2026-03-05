import { describe, it, expect, beforeEach } from 'vitest';
import { isAccountLocked, recordFailedAttempt, clearLockout, getLockoutStats } from '@/lib/account-lockout';

describe('account-lockout', () => {
  beforeEach(() => {
    // Clear lockout for test email
    clearLockout('test@example.com');
    clearLockout('locked@example.com');
  });

  it('initially no account is locked', () => {
    const status = isAccountLocked('test@example.com');
    expect(status.locked).toBe(false);
    expect(status.attempts).toBe(0);
  });

  it('records failed attempts', () => {
    const r1 = recordFailedAttempt('test@example.com');
    expect(r1.locked).toBe(false);
    expect(r1.attemptsLeft).toBe(4);

    const r2 = recordFailedAttempt('test@example.com');
    expect(r2.attemptsLeft).toBe(3);
  });

  it('locks after 5 failed attempts', () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt('locked@example.com');
    }
    const result = recordFailedAttempt('locked@example.com');
    expect(result.locked).toBe(true);
    expect(result.attemptsLeft).toBe(0);
    expect(result.remainingSeconds).toBeGreaterThan(0);
  });

  it('isAccountLocked returns true after lockout', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt('locked@example.com');
    }
    const status = isAccountLocked('locked@example.com');
    expect(status.locked).toBe(true);
    expect(status.remainingSeconds).toBeGreaterThan(800); // ~15 min
  });

  it('clearLockout resets the account', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt('locked@example.com');
    }
    clearLockout('locked@example.com');
    const status = isAccountLocked('locked@example.com');
    expect(status.locked).toBe(false);
  });

  it('getLockoutStats returns counts', () => {
    const stats = getLockoutStats();
    expect(stats).toHaveProperty('totalTracked');
    expect(stats).toHaveProperty('currentlyLocked');
  });
});
