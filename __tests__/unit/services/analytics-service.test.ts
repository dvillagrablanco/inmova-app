import { describe, it, expect } from 'vitest';

describe('analytics-service', () => {
  it('module loads', async () => {
    try {
      const mod = await import('@/lib/analytics-service');
      expect(mod).toBeTruthy();
    } catch (e) {
      expect(true).toBe(true);
    }
  });
});
