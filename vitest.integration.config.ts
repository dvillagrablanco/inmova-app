import { defineConfig } from 'vitest/config';

process.env.INTEGRATION_TESTS = 'true';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.integration.setup.ts'],
    include: ['__tests__/integration/**/*.integration.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    threads: false,
    reporters: ['default'],
  },
});
