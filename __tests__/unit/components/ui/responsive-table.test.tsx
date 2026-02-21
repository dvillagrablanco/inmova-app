import { describe, it, expect } from 'vitest';
describe('ResponsiveTable', () => {
  it('module loads without error', async () => {
    const mod = await import('@/components/ui/responsive-table');
    expect(mod).toBeTruthy();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
