import { describe, it, expect } from 'vitest';

describe('API: portal-proveedor > work-orders > [id] > accept', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/portal-proveedor/work-orders/[id]/accept/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
