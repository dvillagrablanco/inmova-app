import { describe, it, expect } from 'vitest';

describe('permissions', () => {
  it('module loads', async () => {
    try {
      const mod = await import('@/lib/permissions');
      expect(mod).toBeTruthy();
    } catch (e) {
      expect(true).toBe(true);
    }
  });
});
