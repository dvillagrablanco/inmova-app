import { describe, it, expect } from 'vitest';

describe('API: buildings', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/buildings/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
