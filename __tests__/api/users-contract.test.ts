import { describe, it, expect } from 'vitest';

describe('Users API Contract Tests', () => {
  it('admin users route loads', async () => {
    const mod = await import('@/app/api/admin/users/route');
    expect(mod.GET).toBeDefined();
  });
});
