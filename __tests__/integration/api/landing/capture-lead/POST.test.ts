import { describe, it, expect } from 'vitest';

describe('API: landing > capture-lead', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/landing/capture-lead/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
