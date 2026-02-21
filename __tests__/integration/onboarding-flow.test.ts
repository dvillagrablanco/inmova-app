import { describe, it, expect } from 'vitest';

describe('Onboarding Flow Integration', () => {
  it('onboarding modules load', async () => {
    const mod = await import('@/lib/onboarding-service');
    expect(mod).toBeTruthy();
  });
});
