import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: Admin Marketplace', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let providerId = '';
  let serviceId = '';
  let tenantId = '';
  let bookingId = '';
  let reviewId = '';
  let providersHandler: Handler;
  let reservationsHandler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { nombre: `Empresa Admin Marketplace ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `admin-marketplace-${Date.now()}@inmova.app`,
        name: 'Admin Marketplace',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const provider = await prisma.provider.create({
      data: {
        companyId: company.id,
        nombre: 'Proveedor Admin',
        tipo: 'mantenimiento',
        telefono: '600000003',
        email: 'proveedor-admin@test.com',
        estado: 'active',
        activo: true,
      },
    });

    const service = await prisma.marketplaceService.create({
      data: {
        companyId: company.id,
        providerId: provider.id,
        nombre: 'Servicio Admin',
        descripcion: 'Descripcion',
        categoria: 'mantenimiento',
        tipoPrecio: 'hora',
        precio: 60,
        unidad: 'hora',
        comisionPorcentaje: 12,
        disponible: true,
        activo: true,
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        companyId: company.id,
        nombreCompleto: 'Cliente Admin',
        dni: `DNI-ADMIN-${Date.now()}`,
        email: `cliente-admin-${Date.now()}@inmova.app`,
        telefono: '600000004',
        fechaNacimiento: new Date('1992-01-01'),
      },
    });

    const booking = await prisma.marketplaceBooking.create({
      data: {
        companyId: company.id,
        serviceId: service.id,
        tenantId: tenant.id,
        fechaServicio: new Date(),
        precioBase: 80,
        comision: 12,
        precioTotal: 92,
        estado: 'completada',
      },
    });

    const review = await prisma.providerReview.create({
      data: {
        companyId: company.id,
        providerId: provider.id,
        puntuacion: 4,
        aspectosPositivos: [],
        aspectosMejorar: [],
        evaluadoPor: user.id,
      },
    });

    companyId = company.id;
    userId = user.id;
    providerId = provider.id;
    serviceId = service.id;
    tenantId = tenant.id;
    bookingId = booking.id;
    reviewId = review.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { companyId: company.id, role: 'super_admin' },
      }
    );

    const providersModule = await import('@/app/api/admin/marketplace/providers/route');
    providersHandler = providersModule.GET;
    const reservationsModule = await import('@/app/api/admin/marketplace/reservations/route');
    reservationsHandler = reservationsModule.GET;
  });

  afterAll(async () => {
    await prisma.providerReview.deleteMany({ where: { id: reviewId } });
    await prisma.marketplaceBooking.deleteMany({ where: { id: bookingId } });
    await prisma.marketplaceService.deleteMany({ where: { id: serviceId } });
    await prisma.provider.deleteMany({ where: { id: providerId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('lista proveedores con métricas', async () => {
    const response = await providersHandler(
      new NextRequest('http://localhost/api/admin/marketplace/providers')
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      providers: Array<{
        id: string;
        serviciosActivos: number;
        reservasCompletadas: number;
        ingresosTotales: number;
        rating: number;
        totalReviews: number;
        estado: string;
      }>;
    };

    expect(data.providers.length).toBe(1);
    expect(data.providers[0].serviciosActivos).toBe(1);
    expect(data.providers[0].reservasCompletadas).toBe(1);
    expect(data.providers[0].ingresosTotales).toBe(92);
    expect(data.providers[0].rating).toBe(4);
    expect(data.providers[0].totalReviews).toBe(1);
    expect(data.providers[0].estado).toBe('active');
  });

  it('lista reservas con stats', async () => {
    const response = await reservationsHandler(
      new NextRequest('http://localhost/api/admin/marketplace/reservations')
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      stats: { total: number; completadas: number };
      reservations: Array<{ id: string; estado: string; precio: number }>;
    };

    expect(data.stats.total).toBe(1);
    expect(data.stats.completadas).toBe(1);
    expect(data.reservations[0].id).toBe(bookingId);
    expect(data.reservations[0].estado).toBe('completed');
  });
});
