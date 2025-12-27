import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const shouldUseLocalWebServer =
  !process.env.PLAYWRIGHT_BASE_URL || /localhost|127\.0\.0\.1/.test(baseURL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: shouldUseLocalWebServer
    ? {
        command: 'yarn dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      }
    : undefined,
});
