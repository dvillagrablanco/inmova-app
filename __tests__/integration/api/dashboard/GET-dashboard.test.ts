import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/dashboard', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let companyId = '';
  let userId = '';
  let buildingId = '';
  let unitId = '';
  let tenantId = '';
  let contractId = '';
  let paymentPaidId = '';
  let paymentPendingId = '';
  let expenseId = '';
  let maintenanceId = '';
  let handler: Handler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Dashboard ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `dashboard-${Date.now()}@inmova.app`,
        name: 'User Dashboard',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const building = await prisma.building.create({
      data: {
        companyId: company.id,
        nombre: 'Edificio Dashboard',
        direccion: 'Calle Dashboard 123',
        tipo: 'residencial',
        anoConstructor: 2020,
        numeroUnidades: 1,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        buildingId: building.id,
        numero: '1A',
        tipo: 'vivienda',
        estado: 'disponible',
        superficie: 80,
        rentaMensual: 1000,
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        companyId: company.id,
        nombreCompleto: 'Inquilino Demo',
        dni: `DNI-${Date.now()}`,
        email: `tenant-${Date.now()}@inmova.app`,
        telefono: '600000000',
        fechaNacimiento: new Date('1990-01-01'),
      },
    });

    const contract = await prisma.contract.create({
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2027-01-01'),
        rentaMensual: 1000,
        deposito: 1000,
        estado: 'activo',
      },
    });

    const now = new Date();
    const paidPayment = await prisma.payment.create({
      data: {
        contractId: contract.id,
        periodo: '2026-01',
        monto: 1000,
        fechaVencimiento: now,
        estado: 'pagado',
      },
    });

    const pendingPayment = await prisma.payment.create({
      data: {
        contractId: contract.id,
        periodo: '2026-02',
        monto: 1000,
        fechaVencimiento: now,
        estado: 'pendiente',
      },
    });

    const expense = await prisma.expense.create({
      data: {
        buildingId: building.id,
        concepto: 'Reparacion',
        categoria: 'mantenimiento',
        monto: 200,
        fecha: now,
      },
    });

    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        unitId: unit.id,
        titulo: 'Arreglo demo',
        descripcion: 'Descripcion demo',
        prioridad: 'media',
        estado: 'pendiente',
      },
    });

    companyId = company.id;
    userId = user.id;
    buildingId = building.id;
    unitId = unit.id;
    tenantId = tenant.id;
    contractId = contract.id;
    paymentPaidId = paidPayment.id;
    paymentPendingId = pendingPayment.id;
    expenseId = expense.id;
    maintenanceId = maintenance.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const routeModule = await import('@/app/api/dashboard/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    await prisma.maintenanceRequest.deleteMany({ where: { id: maintenanceId } });
    await prisma.expense.deleteMany({ where: { id: expenseId } });
    await prisma.payment.deleteMany({ where: { id: paymentPendingId } });
    await prisma.payment.deleteMany({ where: { id: paymentPaidId } });
    await prisma.contract.deleteMany({ where: { id: contractId } });
    await prisma.unit.deleteMany({ where: { id: unitId } });
    await prisma.building.deleteMany({ where: { id: buildingId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('retorna stats agregadas del dashboard', async () => {
    const response = await handler(new NextRequest('http://localhost/api/dashboard'));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      stats: {
        totalBuildings: number;
        totalUnits: number;
        totalTenants: number;
        activeContracts: number;
        monthlyRevenue: number;
        occupancyRate: number;
        pendingPayments: number;
        maintenanceIssues: number;
      };
    };

    expect(data.stats.totalBuildings).toBe(1);
    expect(data.stats.totalUnits).toBe(1);
    expect(data.stats.totalTenants).toBe(1);
    expect(data.stats.activeContracts).toBe(1);
    expect(data.stats.monthlyRevenue).toBeGreaterThan(0);
    expect(data.stats.pendingPayments).toBe(1);
    expect(data.stats.maintenanceIssues).toBe(1);
  });
});
