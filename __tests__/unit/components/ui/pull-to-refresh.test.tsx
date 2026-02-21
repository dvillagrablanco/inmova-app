import { describe, it, expect } from 'vitest';
describe('PullToRefresh', () => {
  it('module loads without error', async () => {
    const mod = await import('@/components/ui/pull-to-refresh');
    expect(mod).toBeTruthy();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
