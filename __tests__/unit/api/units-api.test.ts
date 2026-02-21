import { describe, it, expect } from 'vitest';

describe('units-api', () => {
  it('API route module loads', async () => {
    const mod = await import('@/app/api/units/route');
    expect(mod).toBeTruthy();
    expect(typeof mod.GET === 'function' || typeof mod.POST === 'function').toBe(true);
  });
});
