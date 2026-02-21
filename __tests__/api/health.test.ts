import { describe, it, expect } from 'vitest';

describe('/api/health', () => {
  it('health route module loads', async () => {
    const mod = await import('@/app/api/health/route');
    expect(mod.GET).toBeDefined();
    expect(typeof mod.GET).toBe('function');
  });
});
