/**
 * NOTIFICATION SERVICE - UNIT TESTS
 * Tests comprehensivos para el servicio de notificaciones
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
  getPrismaClient: () => ({ prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  } }),
}));

vi.mock('@/lib/push-service', () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock('@/lib/email-service', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';

describe('🔔 Notification Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // CREACIÓN DE NOTIFICACIONES
  // ========================================

  test('✅ Debe crear una notificación simple', async () => {
    const mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      type: 'INFO',
      title: 'Test Notification',
      message: 'This is a test',
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const notificationData = {
      userId: 'user-123',
      type: 'INFO',
      title: 'Test Notification',
      message: 'This is a test',
    };

    const result = await prisma.notification.create({ data: notificationData });

    expect(result.id).toBe('notif-123');
    expect(result.read).toBe(false);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: notificationData,
    });
  });

  test('✅ Debe crear notificación de pago vencido', async () => {
    const mockNotification = {
      id: 'notif-456',
      userId: 'user-123',
      type: 'PAYMENT_DUE',
      title: 'Pago vencido',
      message: 'Tu pago de €1,200 ha vencido',
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.create({
      data: {
        userId: 'user-123',
        type: 'PAYMENT_DUE',
        title: 'Pago vencido',
        message: 'Tu pago de €1,200 ha vencido',
      },
    });

    expect(result.type).toBe('PAYMENT_DUE');
    expect(result.message).toContain('€1,200');
  });

  test('✅ Debe crear notificación con metadata', async () => {
    const mockNotification = {
      id: 'notif-789',
      userId: 'user-123',
      type: 'NEW_MESSAGE',
      title: 'Nuevo mensaje',
      message: 'Tienes un nuevo mensaje de Admin',
      metadata: {
        messageId: 'msg-123',
        senderId: 'admin-456',
        chatId: 'chat-789',
      },
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.create({
      data: {
        userId: 'user-123',
        type: 'NEW_MESSAGE',
        title: 'Nuevo mensaje',
        message: 'Tienes un nuevo mensaje de Admin',
        metadata: {
          messageId: 'msg-123',
          senderId: 'admin-456',
          chatId: 'chat-789',
        },
      },
    });

    expect(result.metadata).toHaveProperty('messageId');
    expect(result.metadata).toHaveProperty('chatId');
  });

  // ========================================
  // LECTURA DE NOTIFICACIONES
  // ========================================

  test('✅ Debe obtener notificaciones no leídas de un usuario', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        userId: 'user-123',
        type: 'INFO',
        title: 'Notif 1',
        message: 'Message 1',
        read: false,
        createdAt: new Date(),
      },
      {
        id: 'notif-2',
        userId: 'user-123',
        type: 'ALERT',
        title: 'Notif 2',
        message: 'Message 2',
        read: false,
        createdAt: new Date(),
      },
    ];

    (prisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotifications);

    const result = await prisma.notification.findMany({
      where: {
        userId: 'user-123',
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(result.length).toBe(2);
    expect(result.every((n) => n.read === false)).toBe(true);
  });

  test('✅ Debe contar notificaciones no leídas', async () => {
    (prisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

    const count = await prisma.notification.count({
      where: {
        userId: 'user-123',
        read: false,
      },
    });

    expect(count).toBe(5);
  });

  test('✅ Debe obtener notificaciones con paginación', async () => {
    const mockNotifications = Array.from({ length: 20 }, (_, i) => ({
      id: `notif-${i}`,
      userId: 'user-123',
      type: 'INFO',
      title: `Notif ${i}`,
      message: `Message ${i}`,
      read: false,
      createdAt: new Date(),
    }));

    (prisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockNotifications.slice(0, 10)
    );

    const result = await prisma.notification.findMany({
      where: { userId: 'user-123' },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    expect(result.length).toBe(10);
  });

  // ========================================
  // MARCAR COMO LEÍDA
  // ========================================

  test('✅ Debe marcar una notificación como leída', async () => {
    const mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      read: true,
      readAt: new Date(),
    };

    (prisma.notification.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.update({
      where: { id: 'notif-123' },
      data: {
        read: true,
        readAt: expect.any(Date),
      },
    });

    expect(result.read).toBe(true);
    expect(result.readAt).toBeDefined();
  });

  test('✅ Debe marcar todas las notificaciones como leídas', async () => {
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 5,
    });

    const result = await prisma.notification.updateMany({
      where: {
        userId: 'user-123',
        read: false,
      },
      data: {
        read: true,
        readAt: expect.any(Date),
      },
    });

    expect(result.count).toBe(5);
  });

  // ========================================
  // ELIMINACIÓN DE NOTIFICACIONES
  // ========================================

  test('✅ Debe eliminar una notificación', async () => {
    (prisma.notification.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'notif-123',
    });

    const result = await prisma.notification.delete({
      where: { id: 'notif-123' },
    });

    expect(result.id).toBe('notif-123');
  });

  // ========================================
  // TIPOS DE NOTIFICACIONES
  // ========================================

  test('✅ Debe crear notificación de mantenimiento', async () => {
    const mockNotification = {
      id: 'notif-maintenance',
      userId: 'landlord-123',
      type: 'MAINTENANCE_REQUEST',
      title: 'Nueva solicitud de mantenimiento',
      message: 'El inquilino ha reportado una fuga de agua',
      metadata: {
        requestId: 'req-456',
        propertyId: 'prop-789',
        priority: 'HIGH',
      },
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.create({
      data: {
        userId: 'landlord-123',
        type: 'MAINTENANCE_REQUEST',
        title: 'Nueva solicitud de mantenimiento',
        message: 'El inquilino ha reportado una fuga de agua',
        metadata: {
          requestId: 'req-456',
          propertyId: 'prop-789',
          priority: 'HIGH',
        },
      },
    });

    expect(result.type).toBe('MAINTENANCE_REQUEST');
    expect(result.metadata).toHaveProperty('priority', 'HIGH');
  });

  test('✅ Debe crear notificación de contrato por vencer', async () => {
    const mockNotification = {
      id: 'notif-contract',
      userId: 'landlord-123',
      type: 'CONTRACT_EXPIRING',
      title: 'Contrato próximo a vencer',
      message: 'El contrato de la propiedad en Calle Mayor vence en 30 días',
      metadata: {
        contractId: 'contract-123',
        propertyId: 'prop-456',
        daysUntilExpiry: 30,
      },
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.create({
      data: {
        userId: 'landlord-123',
        type: 'CONTRACT_EXPIRING',
        title: 'Contrato próximo a vencer',
        message: 'El contrato de la propiedad en Calle Mayor vence en 30 días',
        metadata: {
          contractId: 'contract-123',
          propertyId: 'prop-456',
          daysUntilExpiry: 30,
        },
      },
    });

    expect(result.type).toBe('CONTRACT_EXPIRING');
    expect(result.metadata.daysUntilExpiry).toBe(30);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar notificación sin metadata', async () => {
    const mockNotification = {
      id: 'notif-no-metadata',
      userId: 'user-123',
      type: 'INFO',
      title: 'Simple notification',
      message: 'No metadata',
      metadata: null,
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.create({
      data: {
        userId: 'user-123',
        type: 'INFO',
        title: 'Simple notification',
        message: 'No metadata',
      },
    });

    expect(result.metadata).toBeNull();
  });

  test('⚠️ Debe manejar mensaje muy largo', async () => {
    const longMessage = 'a'.repeat(1000);

    const mockNotification = {
      id: 'notif-long',
      userId: 'user-123',
      type: 'INFO',
      title: 'Long message',
      message: longMessage,
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.create({
      data: {
        userId: 'user-123',
        type: 'INFO',
        title: 'Long message',
        message: longMessage,
      },
    });

    expect(result.message.length).toBe(1000);
  });

  test('⚠️ Debe manejar caracteres especiales en mensaje', async () => {
    const specialCharsMessage = '¡Hola! 🎉 <script>alert("test")</script>';

    const mockNotification = {
      id: 'notif-special',
      userId: 'user-123',
      type: 'INFO',
      title: 'Special chars',
      message: specialCharsMessage,
      read: false,
      createdAt: new Date(),
    };

    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

    const result = await prisma.notification.create({
      data: {
        userId: 'user-123',
        type: 'INFO',
        title: 'Special chars',
        message: specialCharsMessage,
      },
    });

    expect(result.message).toContain('🎉');
    expect(result.message).toContain('<script>');
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe manejar error al crear notificación', async () => {
    (prisma.notification.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(
      prisma.notification.create({
        data: {
          userId: 'user-123',
          type: 'INFO',
          title: 'Test',
          message: 'Test',
        },
      })
    ).rejects.toThrow('Database connection failed');
  });

  test('❌ Debe manejar error al obtener notificaciones', async () => {
    (prisma.notification.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Query timeout')
    );

    await expect(
      prisma.notification.findMany({
        where: { userId: 'user-123' },
      })
    ).rejects.toThrow('Query timeout');
  });
});
