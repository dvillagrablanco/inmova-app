import { describe, it, expect } from 'vitest';
describe('authenticated-layout', () => {
  it('module loads', async () => {
    const mod = await import('@/components/layout/authenticated-layout');
    expect(mod).toBeTruthy();
  });
});
