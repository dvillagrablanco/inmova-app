import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/marketplace/stats', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let providerId = '';
  let serviceId = '';
  let tenantId = '';
  let bookingId = '';
  let previousBookingId = '';
  let handler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { nombre: `Empresa Marketplace ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `marketplace-${Date.now()}@inmova.app`,
        name: 'User Marketplace',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const provider = await prisma.provider.create({
      data: {
        companyId: company.id,
        nombre: 'Proveedor Test',
        tipo: 'limpieza',
        telefono: '600000001',
        email: 'proveedor@test.com',
        estado: 'active',
        activo: true,
      },
    });

    const service = await prisma.marketplaceService.create({
      data: {
        companyId: company.id,
        providerId: provider.id,
        nombre: 'Servicio Limpieza',
        descripcion: 'Descripcion',
        categoria: 'limpieza',
        tipoPrecio: 'fijo',
        precio: 100,
        unidad: 'servicio',
        comisionPorcentaje: 10,
        disponible: true,
        activo: true,
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        companyId: company.id,
        nombreCompleto: 'Cliente Marketplace',
        dni: `DNI-${Date.now()}`,
        email: `cliente-${Date.now()}@inmova.app`,
        telefono: '600000002',
        fechaNacimiento: new Date('1990-01-01'),
      },
    });

    const now = new Date();
    const booking = await prisma.marketplaceBooking.create({
      data: {
        companyId: company.id,
        serviceId: service.id,
        tenantId: tenant.id,
        fechaServicio: now,
        precioBase: 100,
        comision: 10,
        precioTotal: 110,
        estado: 'completada',
      },
    });

    const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 10));
    const previousBooking = await prisma.marketplaceBooking.create({
      data: {
        companyId: company.id,
        serviceId: service.id,
        tenantId: tenant.id,
        fechaServicio: previousMonth,
        precioBase: 80,
        comision: 8,
        precioTotal: 88,
        estado: 'completada',
        fechaSolicitud: previousMonth,
      },
    });

    companyId = company.id;
    userId = user.id;
    providerId = provider.id;
    serviceId = service.id;
    tenantId = tenant.id;
    bookingId = booking.id;
    previousBookingId = previousBooking.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { companyId: company.id },
      }
    );

    const routeModule = await import('@/app/api/marketplace/stats/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    await prisma.marketplaceBooking.deleteMany({ where: { id: bookingId } });
    await prisma.marketplaceBooking.deleteMany({ where: { id: previousBookingId } });
    await prisma.marketplaceService.deleteMany({ where: { id: serviceId } });
    await prisma.provider.deleteMany({ where: { id: providerId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('calcula stats del marketplace', async () => {
    const response = await handler(new NextRequest('http://localhost/api/marketplace/stats'));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      totalProveedores: number;
      proveedoresActivos: number;
      totalServicios: number;
      serviciosActivos: number;
      reservasEsteMes: number;
      ingresosTotales: number;
      comisionesGeneradas: number;
    };

    expect(data.totalProveedores).toBe(1);
    expect(data.proveedoresActivos).toBe(1);
    expect(data.totalServicios).toBe(1);
    expect(data.serviciosActivos).toBe(1);
    expect(data.reservasEsteMes).toBe(1);
    expect(data.ingresosTotales).toBe(110);
    expect(data.comisionesGeneradas).toBe(10);
  });
});
