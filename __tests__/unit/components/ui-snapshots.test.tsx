import { describe, it, expect } from 'vitest';
describe('ui-snapshots', () => {
  it('module loads', async () => {
    const mod = await import('@/components/ui/button');
    expect(mod).toBeTruthy();
  });
});
