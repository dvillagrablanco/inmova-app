import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['document-assistant-dni.spec.ts', 'api-document-analysis.spec.ts'],
  timeout: 120000,
  use: {
    baseURL: 'https://inmovaapp.com',
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', headless: true },
    },
  ],
  // NO webServer - usar producción directamente
});
