import { describe, it, expect } from 'vitest';

describe('payments', () => {
  it('API route module loads', async () => {
    const mod = await import('@/app/api/payments/route');
    expect(mod).toBeTruthy();
    expect(typeof mod.GET === 'function' || typeof mod.POST === 'function').toBe(true);
  });
});
