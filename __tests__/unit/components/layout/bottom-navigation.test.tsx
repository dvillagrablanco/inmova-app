import { describe, it, expect } from 'vitest';
describe('bottom-navigation', () => {
  it('module loads', async () => {
    const mod = await import('@/components/layout/bottom-navigation');
    expect(mod).toBeTruthy();
  });
});
