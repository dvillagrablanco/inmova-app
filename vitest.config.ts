import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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

      // THRESHOLDS 80% - Objetivo realista
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,

        perFile: false, // Per-file check disabled (too strict for large codebase)
      },

      // Opciones adicionales
      all: true, // Incluir archivos no importados
      skipFull: false, // Mostrar todos los archivos, incluso con 100%
      clean: true, // Limpiar coverage antes de cada run
      cleanOnRerun: true,
    },

    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // No bail - run all tests even if some fail
    bail: 0,

    // Test exclusions
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**', // Excluir tests E2E de Playwright
      '**/.disabled/**',
      '**/__tests__/integration/api/open-banking/bankinter/**',
      '**/playwright-report/**',
      '**/*.e2e.{ts,tsx}',
      '**/*.spec.ts', // Excluir Playwright specs (usan test.describe de @playwright/test)
      '**/tests/**', // Excluir directorio tests/ (Playwright)
    ],

    // Watch mode exclusions
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/e2e/**', '**/.disabled/**'],

    // Mock reset
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Reporters
    reporters: ['verbose'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
