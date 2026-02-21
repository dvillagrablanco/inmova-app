import { describe, it, expect } from 'vitest';
describe('header', () => {
  it('module loads', async () => {
    const mod = await import('@/components/layout/header');
    expect(mod).toBeTruthy();
  });
});
