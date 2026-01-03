/**
 * NOTIFICATIONS API - COMPREHENSIVE UNIT TESTS
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/notification-service', () => ({
  getRecentNotifications: vi.fn(),
  createNotification: vi.fn(),
}));

import { getServerSession } from 'next-auth';
import { getRecentNotifications, createNotification } from '@/lib/notification-service';
import { GET, POST } from '@/app/api/notifications/route';

describe('🔔 Notifications API - GET', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
  };

  const mockNotifications = [
    {
      id: 'notif-1',
      userId: 'user-123',
      type: 'info',
      title: 'Nueva factura',
      message: 'Tienes una nueva factura',
      read: false,
      createdAt: new Date(),
    },
    {
      id: 'notif-2',
      userId: 'user-123',
      type: 'warning',
      title: 'Pago vencido',
      message: 'Tienes un pago vencido',
      read: true,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe retornar notificaciones del usuario', async () => {
    (getRecentNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      notifications: mockNotifications,
    });

    const req = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications).toBeDefined();
    expect(data.notifications.length).toBe(2);
  });

  test('✅ Debe respetar limit parameter', async () => {
    (getRecentNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      notifications: [mockNotifications[0]],
    });

    const req = new NextRequest('http://localhost:3000/api/notifications?limit=1');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications.length).toBe(1);
  });

  test('✅ Debe usar limit por defecto de 20', async () => {
    (getRecentNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      notifications: mockNotifications,
    });

    const req = new NextRequest('http://localhost:3000/api/notifications');
    await GET(req);

    expect(getRecentNotifications).toHaveBeenCalledWith('user-123', 20);
  });

  test('❌ Sin autenticación retorna 401', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('❌ Error del servicio retorna 500', async () => {
    (getRecentNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const req = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(req);

    expect(response.status).toBe(500);
  });

  test('⚠️ Debe manejar lista vacía', async () => {
    (getRecentNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      notifications: [],
    });

    const req = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(req);
    const data = await response.json();

    expect(data.notifications.length).toBe(0);
  });
});

describe('🔔 Notifications API - POST', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
  };

  const validNotificationData = {
    title: 'Test Notification',
    message: 'This is a test',
    type: 'info',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe crear notificación exitosamente', async () => {
    (createNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      notification: { id: 'notif-new', ...validNotificationData },
    });

    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify(validNotificationData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('❌ Debe rechazar sin title', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ message: 'Test' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  test('❌ Debe rechazar sin message', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  test('✅ Debe usar userId del usuario autenticado', async () => {
    (createNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      notification: { id: 'notif-new' },
    });

    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify(validNotificationData),
    });

    await POST(req);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123' })
    );
  });

  test('❌ Sin autenticación retorna 401', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify(validNotificationData),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });
});
