import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Smoke Tests - Critical Pages Exist', () => {
  const criticalPages = [
    'app/login/page.tsx',
    'app/landing/page.tsx',
    'app/dashboard/page.tsx',
    'app/legal/terms/page.tsx',
    'app/legal/privacy/page.tsx',
    'app/landing/precios/page.tsx',
  ];

  criticalPages.forEach((pagePath) => {
    it(`${pagePath} exists`, () => {
      expect(existsSync(join(process.cwd(), pagePath))).toBe(true);
    });
  });

  const criticalAPIs = [
    'app/api/health/route.ts',
    'app/api/auth/[...nextauth]/route.ts',
    'app/api/public/subscription-plans/route.ts',
    'app/api/buildings/route.ts',
    'app/api/payments/route.ts',
    'app/api/dashboard/route.ts',
  ];

  criticalAPIs.forEach((apiPath) => {
    it(`${apiPath} exists`, () => {
      expect(existsSync(join(process.cwd(), apiPath))).toBe(true);
    });
  });
});
