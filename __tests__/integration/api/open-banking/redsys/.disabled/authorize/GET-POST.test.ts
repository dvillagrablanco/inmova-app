import { describe, it, expect } from 'vitest';

describe('API: open-banking > redsys > .disabled > authorize', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/open-banking/redsys/.disabled/authorize/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
