import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const hasTestBaseUrl = Boolean(process.env.TEST_BASE_URL);
const integrationExcludes = hasTestBaseUrl
  ? []
  : ['**/__tests__/integration/**', 'tests/integration/**'];

/**
 * Configuración de Vitest para COBERTURA 100%
 * Todos los thresholds en 100% - production-ready
 */
export default defineConfig({
  plugins: [react()],

  test: {
    // Environment
    environment: 'jsdom',
    globals: true,

    // Setup files
    setupFiles: ['./vitest.setup.tsx'],

    // Coverage configuration - COBERTURA 100%
    coverage: {
      provider: 'v8',

      // Reporters
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      reportsDirectory: './coverage',

      // Archivos a incluir en cobertura
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'pages/**/*.{ts,tsx}',
      ],

      // Archivos a excluir
      exclude: [
        // Tests
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        '**/tests/**',

        // Type definitions
        '**/*.d.ts',
        '**/types/**',

        // Config files
        '**/*.config.{ts,js}',
        '**/vitest.setup.tsx',

        // Build output
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/out/**',

        // Dependencies
        '**/node_modules/**',

        // Storybook
        '**/*.stories.{ts,tsx}',
        '**/.storybook/**',

        // Scripts
        '**/scripts/**',

        // Generated files
        '**/prisma/migrations/**',
        '**/.draft_files/**',
        '**/.archived_docs/**',

        // Layout files (Next.js)
        '**/layout.tsx',
        '**/error.tsx',
        '**/loading.tsx',
        '**/not-found.tsx',

        // Config and setup files
        '**/middleware.ts',
        '**/instrumentation.ts',
      ],

      // THRESHOLDS 100% - CRÍTICO
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,

        // Thresholds por archivo también
        perFile: true,
      },

      // Opciones adicionales
      all: true, // Incluir archivos no importados
      skipFull: false, // Mostrar todos los archivos, incluso con 100%
      clean: true, // Limpiar coverage antes de cada run
      cleanOnRerun: true,
    },

    // Parallelization
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Bail early on errors (para CI/CD)
    bail: 1,

    // Test inclusions
    include: ['**/__tests__/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],

    // Test exclusions
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**', // Excluir tests E2E de Playwright
      '**/tests/**/*.spec.{ts,tsx}', // Excluir specs Playwright en /tests
      '**/playwright-report/**',
      '**/*.e2e.{ts,tsx}',
      ...integrationExcludes,
    ],

    // Watch mode exclusions
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/e2e/**'],

    // Mock reset
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Reporters
    reporters: ['verbose', 'html'],

    // Output
    outputFile: {
      html: './test-results/index.html',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
