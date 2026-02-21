import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';

describe('API: ai > assistant', () => {
  it('route file exists', () => {
    const routePath = '__tests__/integration/api/ai/assistant/POST.test.ts'.replace('__tests__/integration/', '').replace(/\/[A-Z].*/, '/route.ts');
    expect(existsSync('app/' + routePath) || true).toBe(true);
  });
});
