import { describe, it, expect } from 'vitest';

describe('API: professional > projects', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/professional/projects/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
