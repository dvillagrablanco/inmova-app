import { describe, it, expect } from 'vitest';

describe('API: notifications > mark-all-read', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/notifications/mark-all-read/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
