/**
 * PERMISSIONS & AUTH - COMPREHENSIVE UNIT TESTS
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    }),
  },
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';

describe('🔐 Permissions - requireAuth()', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'administrador',
    email: 'user@example.com',
    activo: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
  });

  test('✅ Debe retornar usuario autenticado', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const user = await requireAuth();

    expect(user).toEqual(mockUser);
  });

  test('❌ Debe lanzar error si no hay sesión', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);

    await expect(requireAuth()).rejects.toThrow('No autenticado');
  });

  test('❌ Debe lanzar error si sesión sin usuario', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({});
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);

    await expect(requireAuth()).rejects.toThrow('No autenticado');
  });

  test('⚠️ Debe manejar sesión con usuario parcial', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com' }, // Sin companyId
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      activo: true,
    } as any);

    const user = await requireAuth();

    expect(user.id).toBe('user-123');
  });
});

describe('🔐 Permissions - requirePermission()', () => {
  const mockAdmin = {
    id: 'admin-123',
    companyId: 'company-123',
    role: 'administrador',
    email: 'admin@example.com',
    activo: true,
  };

  const mockUser = {
    id: 'user-456',
    companyId: 'company-123',
    role: 'tenant',
    email: 'user@example.com',
    activo: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdmin as any);
  });

  test('✅ Admin puede crear recursos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockAdmin,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdmin as any);

    const user = await requirePermission('create');

    expect(user).toEqual(mockAdmin);
  });

  test('✅ Admin puede actualizar recursos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockAdmin,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdmin as any);

    const user = await requirePermission('update');

    expect(user).toEqual(mockAdmin);
  });

  test('✅ Admin puede eliminar recursos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockAdmin,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdmin as any);

    const user = await requirePermission('delete');

    expect(user).toEqual(mockAdmin);
  });

  test('❌ Usuario normal no puede crear', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await expect(requirePermission('create')).rejects.toThrow();
  });

  test('❌ Sin sesión no tiene permisos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);

    await expect(requirePermission('create')).rejects.toThrow('No autenticado');
  });

  test('⚠️ SuperAdmin tiene todos los permisos', async () => {
    const superAdmin = { ...mockAdmin, role: 'super_admin' };
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: superAdmin,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(superAdmin as any);

    const user = await requirePermission('create');

    expect(user.role).toBe('super_admin');
  });
});

describe('🔐 Permissions - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('⚠️ Debe manejar roles desconocidos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', role: 'UNKNOWN', companyId: 'company-1', email: 'user@example.com' },
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'UNKNOWN',
      companyId: 'company-1',
      email: 'user@example.com',
      activo: true,
    } as any);

    await expect(requirePermission('create')).rejects.toThrow();
  });

  test('⚠️ Debe manejar permisos inválidos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'administrador',
        companyId: 'company-1',
        email: 'admin@example.com',
      },
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'admin-1',
      role: 'administrador',
      companyId: 'company-1',
      email: 'admin@example.com',
      activo: true,
    } as any);

    await expect(requirePermission('invalid' as any)).rejects.toThrow(
      'No tienes permiso para: invalid'
    );
  });

  test('⚠️ Debe manejar usuario sin companyId', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', role: 'administrador', email: 'user@example.com' }, // Sin companyId
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'administrador',
      email: 'user@example.com',
      activo: true,
    } as any);

    const user = await requireAuth();

    expect(user.id).toBe('user-1');
  });

  test('⚠️ Debe manejar múltiples llamadas concurrentes', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: 'user-1',
        role: 'administrador',
        companyId: 'company-1',
        email: 'user@example.com',
      },
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'administrador',
      companyId: 'company-1',
      email: 'user@example.com',
      activo: true,
    } as any);

    const promises = Array.from({ length: 10 }, () => requireAuth());
    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    expect(results.every((r) => r.id === 'user-1')).toBe(true);
  });
});
