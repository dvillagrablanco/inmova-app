import { describe, it, expect } from 'vitest';

describe('API: support > categorize-ticket', () => {
  it('route module loads and exports handlers', async () => {
    const mod = await import('@/app/api/support/categorize-ticket/route');
    expect(mod).toBeTruthy();
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(fns.length).toBeGreaterThan(0);
  });
});
