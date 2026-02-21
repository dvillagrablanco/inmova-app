import { describe, it, expect } from 'vitest';

describe('buildings-api', () => {
  it('API route module loads', async () => {
    const mod = await import('@/app/api/buildings/route');
    expect(mod).toBeTruthy();
    expect(typeof mod.GET === 'function' || typeof mod.POST === 'function').toBe(true);
  });
});
