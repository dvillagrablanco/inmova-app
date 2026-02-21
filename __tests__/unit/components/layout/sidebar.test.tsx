import { describe, it, expect } from 'vitest';
describe('sidebar', () => {
  it('module loads', async () => {
    const mod = await import('@/components/layout/sidebar');
    expect(mod).toBeTruthy();
  });
});
