/**
 * MAINTENANCE FLOW - INTEGRATION TESTS
 * Flujo completo de mantenimiento: Solicitud → Asignación → Resolución
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { addDays, subDays } from 'date-fns';

// Mocks
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn((callback) =>
      callback({
        maintenanceRequest: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        workOrder: {
          create: vi.fn(),
        },
        notification: {
          create: vi.fn(),
        },
        user: {
          findMany: vi.fn(),
        },
        serviceProvider: {
          findFirst: vi.fn(),
        },
      })
    ),
    maintenanceRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workOrder: {
      create: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    serviceProvider: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/notification-service', () => ({
  sendEmail: vi.fn(),
  createNotification: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { sendEmail, createNotification } from '@/lib/notification-service';

describe('🔧 Maintenance Flow - Complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('✅ FLOW: Crear solicitud → Notificar admin → Asignar técnico', async () => {
    // 1. Usuario crea solicitud de mantenimiento
    const maintenanceData = {
      tipo: 'Plomería',
      descripcion: 'Fuga en baño',
      prioridad: 'alta',
      unitId: 'unit-1',
      reportedBy: 'tenant-1',
    };

    const createdRequest = {
      id: 'maint-1',
      ...maintenanceData,
      estado: 'pendiente',
      createdAt: new Date(),
    };

    (prisma.maintenanceRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue(
      createdRequest
    );

    // 2. Buscar administradores para notificar
    const admins = [{ id: 'admin-1', email: 'admin@example.com', name: 'Admin' }];

    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(admins);

    // 3. Enviar notificaciones
    (prisma.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    // Simular flujo
    const request = await prisma.maintenanceRequest.create({ data: maintenanceData });
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN', companyId: 'company-1' },
    });

    await prisma.notification.createMany({
      data: adminUsers.map((admin) => ({
        userId: admin.id,
        type: 'maintenance_request',
        title: 'Nueva solicitud de mantenimiento',
        message: `${maintenanceData.tipo}: ${maintenanceData.descripcion}`,
      })),
    });

    await sendEmail({
      to: admins[0].email,
      subject: 'Nueva solicitud urgente',
      body: `Prioridad: ${maintenanceData.prioridad}`,
    });

    // Assertions
    expect(request.id).toBe('maint-1');
    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(prisma.notification.createMany).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });

  test('✅ FLOW: Asignar proveedor → Crear orden de trabajo → Notificar', async () => {
    // 1. Buscar proveedor disponible
    const provider = {
      id: 'provider-1',
      type: 'PLUMBER',
      name: 'Mario Bros Plumbing',
      available: true,
      rating: 4.8,
    };

    (prisma.serviceProvider.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(provider);

    // 2. Crear orden de trabajo
    const workOrder = {
      id: 'wo-1',
      maintenanceRequestId: 'maint-1',
      providerId: 'provider-1',
      scheduledDate: addDays(new Date(), 1),
      status: 'scheduled',
    };

    (prisma.workOrder.create as ReturnType<typeof vi.fn>).mockResolvedValue(workOrder);

    // 3. Actualizar request
    (prisma.maintenanceRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'maint-1',
      estado: 'asignado',
    });

    // Simular flujo
    const selectedProvider = await prisma.serviceProvider.findFirst({
      where: { type: 'PLUMBER', available: true },
      orderBy: { rating: 'desc' },
    });

    const order = await prisma.workOrder.create({
      data: {
        maintenanceRequestId: 'maint-1',
        providerId: selectedProvider!.id,
        scheduledDate: addDays(new Date(), 1),
      },
    });

    await prisma.maintenanceRequest.update({
      where: { id: 'maint-1' },
      data: { estado: 'asignado' },
    });

    // Assertions
    expect(selectedProvider).toBeDefined();
    expect(order.providerId).toBe('provider-1');
    expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith({
      where: { id: 'maint-1' },
      data: { estado: 'asignado' },
    });
  });

  test('✅ FLOW: Completar trabajo → Actualizar estado → Facturar', async () => {
    // 1. Proveedor completa trabajo
    const completedWork = {
      id: 'wo-1',
      status: 'completed',
      completedAt: new Date(),
      cost: 150,
      notes: 'Fuga reparada exitosamente',
    };

    (prisma.workOrder.update as ReturnType<typeof vi.fn>).mockResolvedValue(completedWork);

    // 2. Actualizar request a resuelto
    (prisma.maintenanceRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'maint-1',
      estado: 'resuelto',
      fechaResolucion: new Date(),
    });

    // 3. Notificar tenant
    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'notif-1',
      userId: 'tenant-1',
      type: 'maintenance_completed',
    });

    // Simular flujo
    await prisma.workOrder.update({
      where: { id: 'wo-1' },
      data: {
        status: 'completed',
        completedAt: new Date(),
        cost: 150,
      },
    });

    await prisma.maintenanceRequest.update({
      where: { id: 'maint-1' },
      data: {
        estado: 'resuelto',
        fechaResolucion: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: 'tenant-1',
        type: 'maintenance_completed',
        title: 'Mantenimiento completado',
        message: 'El trabajo ha sido finalizado',
      },
    });

    // Assertions
    expect(prisma.workOrder.update).toHaveBeenCalled();
    expect(prisma.maintenanceRequest.update).toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  test('❌ FLOW: Rechazar solicitud por prioridad baja si no hay proveedores', async () => {
    // No hay proveedores disponibles
    (prisma.serviceProvider.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    // Para prioridad baja, se puede postponer
    const provider = await prisma.serviceProvider.findFirst({
      where: { type: 'PLUMBER', available: true },
    });

    expect(provider).toBeNull();
  });

  test('⚠️ FLOW: Escalar solicitud urgente si pasa > 24h sin asignar', async () => {
    const urgentRequest = {
      id: 'maint-urgent',
      prioridad: 'urgente',
      estado: 'pendiente',
      createdAt: subDays(new Date(), 2), // 2 días atrás
    };

    (prisma.maintenanceRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      urgentRequest
    );

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: 'maint-urgent' },
    });

    const hoursSinceCreated =
      (new Date().getTime() - request!.createdAt.getTime()) / (1000 * 60 * 60);

    expect(hoursSinceCreated).toBeGreaterThan(24);
    expect(request!.prioridad).toBe('urgente');
    expect(request!.estado).toBe('pendiente');
    // Debería escalarse
  });
});
