import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSharedPrismaClient = vi.fn();
const mockLoggerError = vi.fn();

vi.mock('@/lib/db', () => ({
  getPrismaClient: mockGetSharedPrismaClient,
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: mockLoggerError,
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('auth-options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('omite PrismaAdapter en entorno de test sin intentar cargar Prisma', async () => {
    const { authOptions } = await import('@/lib/auth-options');

    expect(authOptions.adapter).toBeUndefined();
    expect(mockGetSharedPrismaClient).not.toHaveBeenCalled();
    expect(mockLoggerError).not.toHaveBeenCalledWith(
      '[NextAuth] Failed to load Prisma:',
      expect.anything()
    );
  });
});
