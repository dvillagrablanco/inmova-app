import { describe, it, expect } from 'vitest';
describe('Wizard', () => {
  it('module loads without error', async () => {
    const mod = await import('@/components/ui/wizard');
    expect(mod).toBeTruthy();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
