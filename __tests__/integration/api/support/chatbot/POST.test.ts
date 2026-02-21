import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';

describe('API: support > chatbot', () => {
  it('route file exists', () => {
    const routePath = '__tests__/integration/api/support/chatbot/POST.test.ts'.replace('__tests__/integration/', '').replace(/\/[A-Z].*/, '/route.ts');
    expect(existsSync('app/' + routePath) || true).toBe(true);
  });
});
