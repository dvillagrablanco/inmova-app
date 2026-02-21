import { describe, it, expect } from 'vitest';

describe('API: coliving > feed > [id] > comment', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/coliving/feed/[id]/comment/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
