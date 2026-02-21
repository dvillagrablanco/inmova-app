import { describe, it, expect } from 'vitest';

describe('API: auth > mfa > regenerate-backup-codes', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/auth/mfa/regenerate-backup-codes/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
