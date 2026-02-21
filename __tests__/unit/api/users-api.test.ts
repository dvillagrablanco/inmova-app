import { describe, it, expect } from 'vitest';

describe('users-api', () => {
  it('API route module loads', async () => {
    const mod = await import('@/app/api/users/route');
    expect(mod).toBeTruthy();
    expect(typeof mod.GET === 'function' || typeof mod.POST === 'function').toBe(true);
  });
});
