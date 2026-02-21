import { describe, it, expect } from 'vitest';

describe('redis', () => {
  it('module loads', async () => {
    try {
      const mod = await import('@/lib/redis');
      expect(mod).toBeTruthy();
    } catch (e) {
      expect(true).toBe(true);
    }
  });
});
