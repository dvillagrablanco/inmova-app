import { describe, it, expect } from 'vitest';
describe('AnimatedStat', () => {
  it('module loads without error', async () => {
    const mod = await import('@/components/ui/animated-stat');
    expect(mod).toBeTruthy();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
