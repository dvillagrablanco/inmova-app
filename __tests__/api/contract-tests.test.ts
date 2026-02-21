import { describe, it, expect } from 'vitest';

describe('API Contract Tests', () => {
  it('public subscription-plans route loads', async () => {
    const mod = await import('@/app/api/public/subscription-plans/route');
    expect(mod.GET).toBeDefined();
  });

  it('admin companies route loads', async () => {
    const mod = await import('@/app/api/admin/companies/route');
    expect(mod.GET).toBeDefined();
  });

  it('admin subscription-plans route loads', async () => {
    const mod = await import('@/app/api/admin/planes/route');
    expect(mod.GET).toBeDefined();
  });
});
