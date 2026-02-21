import { describe, it, expect } from 'vitest';

describe('tenants-api', () => {
  it('API route module loads', async () => {
    const mod = await import('@/app/api/tenants/route');
    expect(mod).toBeTruthy();
    expect(typeof mod.GET === 'function' || typeof mod.POST === 'function').toBe(true);
  });
});
