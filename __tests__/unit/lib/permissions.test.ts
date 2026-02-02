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

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    }),
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';

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
  });

  test('✅ Debe retornar usuario autenticado', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    const user = await requireAuth();

    expect(user).toEqual(mockUser);
  });

  test('❌ Debe lanzar error si no hay sesión', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow('No autenticado');
  });

  test('❌ Debe lanzar error si sesión sin usuario', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(requireAuth()).rejects.toThrow('No autenticado');
  });

  test('⚠️ Debe manejar sesión con usuario parcial', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: 'partial@example.com' },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-123',
      role: 'administrador',
      email: 'partial@example.com',
      activo: true,
    });

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
  });

  test('✅ Admin puede crear recursos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockAdmin.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdmin);

    const user = await requirePermission('create');

    expect(user).toEqual(mockAdmin);
  });

  test('✅ Admin puede actualizar recursos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockAdmin.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdmin);

    const user = await requirePermission('update');

    expect(user).toEqual(mockAdmin);
  });

  test('✅ Admin puede eliminar recursos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockAdmin.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdmin);

    const user = await requirePermission('delete');

    expect(user).toEqual(mockAdmin);
  });

  test('❌ Usuario normal no puede crear', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    await expect(requirePermission('create')).rejects.toThrow();
  });

  test('❌ Sin sesión no tiene permisos', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(requirePermission('create')).rejects.toThrow('No autenticado');
  });

  test('⚠️ SuperAdmin tiene todos los permisos', async () => {
    const superAdmin = { ...mockAdmin, role: 'super_admin' };
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: superAdmin.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(superAdmin);

    const user = await requirePermission('create');

    expect(user.role).toBe('super_admin');
  });
});

describe('🔐 Permissions - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('⚠️ Debe manejar roles desconocidos', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      role: 'UNKNOWN',
      companyId: 'company-1',
      email: 'unknown@example.com',
      activo: true,
    });
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: 'unknown@example.com' },
    });

    await expect(requirePermission('create')).rejects.toThrow();
  });

  test('⚠️ Debe manejar permisos inválidos', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'admin-1',
      role: 'administrador',
      companyId: 'company-1',
      email: 'admin-1@example.com',
      activo: true,
    });
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: 'admin-1@example.com' },
    });

    await expect(requirePermission('invalid' as any)).rejects.toThrow();
  });

  test('⚠️ Debe manejar usuario sin companyId', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      role: 'administrador',
      email: 'no-company@example.com',
      activo: true,
    });
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: 'no-company@example.com' },
    });

    const user = await requireAuth();

    expect(user.id).toBe('user-1');
  });

  test('⚠️ Debe manejar múltiples llamadas concurrentes', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      role: 'administrador',
      companyId: 'company-1',
      email: 'concurrent@example.com',
      activo: true,
    });
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: 'concurrent@example.com' },
    });

    const promises = Array.from({ length: 10 }, () => requireAuth());
    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    expect(results.every((r) => r.id === 'user-1')).toBe(true);
  });
});
