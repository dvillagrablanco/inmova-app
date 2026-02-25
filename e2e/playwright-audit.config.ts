import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e',
  testMatch: ['gestor-workflow-audit.spec.ts'],
  timeout: 90000,
  expect: { timeout: 15000 },
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/audit/results.json' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://inmovaapp.com',
    trace: 'off',
    headless: true,
    screenshot: 'off',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 25000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
