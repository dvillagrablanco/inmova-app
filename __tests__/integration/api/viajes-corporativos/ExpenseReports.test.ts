import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/viajes-corporativos/expense-reports', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let tenantId = '';
  let expenseId = '';
  let previousExpenseId = '';
  let handler: Handler;
  let exportHandler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: {
        nombre: `Empresa Viajes ${Date.now()}`,
        metadata: {
          presupuestoViajesMensual: 1000,
          presupuestoViajesDepartamentos: { Ventas: 800 },
          ahorroViajesMercado: 12,
        },
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `viajes-${Date.now()}@inmova.app`,
        name: 'User Viajes',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        companyId: company.id,
        nombreCompleto: 'Empleado Viajes',
        dni: `DNI-${Date.now()}`,
        email: `empleado-${Date.now()}@inmova.app`,
        telefono: '600000000',
        fechaNacimiento: new Date('1990-01-01'),
      },
    });

    const expense = await prisma.corporateTravelExpense.create({
      data: {
        companyId: company.id,
        tenantId: tenant.id,
        departamento: 'Ventas',
        categoria: 'alojamiento',
        concepto: 'Hotel central',
        monto: 500,
        fechaGasto: new Date('2026-01-10'),
      },
    });

    const previousExpense = await prisma.corporateTravelExpense.create({
      data: {
        companyId: company.id,
        tenantId: tenant.id,
        departamento: 'Ventas',
        categoria: 'vuelos',
        concepto: 'Vuelo regional',
        monto: 300,
        fechaGasto: new Date('2025-12-15'),
      },
    });

    companyId = company.id;
    userId = user.id;
    tenantId = tenant.id;
    expenseId = expense.id;
    previousExpenseId = previousExpense.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const routeModule = await import('@/app/api/viajes-corporativos/expense-reports/route');
    handler = routeModule.GET;
    const exportModule = await import(
      '@/app/api/viajes-corporativos/expense-reports/export/route'
    );
    exportHandler = exportModule.GET;
  });

  afterAll(async () => {
    await prisma.corporateTravelExpense.deleteMany({ where: { id: expenseId } });
    await prisma.corporateTravelExpense.deleteMany({ where: { id: previousExpenseId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('devuelve stats y agrupaciones para el periodo', async () => {
    const response = await handler(
      new NextRequest('http://localhost/api/viajes-corporativos/expense-reports?period=2026-01')
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      stats: { gastoMes: number; presupuestoMes: number };
      categories: Array<{ categoria: string; gasto: number }>;
      departments: Array<{ departamento: string; gasto: number; empleados: number }>;
      monthly: Array<{ periodo: string }>;
      reports: Array<{ periodo: string }>;
    };

    expect(data.stats.gastoMes).toBe(500);
    expect(data.stats.presupuestoMes).toBe(1000);
    expect(data.categories.some((cat) => cat.categoria === 'alojamiento')).toBe(true);
    expect(data.departments.some((dept) => dept.departamento === 'Ventas')).toBe(true);
    expect(data.monthly.some((mes) => mes.periodo === '2026-01')).toBe(true);
    expect(data.reports.some((rep) => rep.periodo === '2026-01')).toBe(true);
  });

  it('exporta CSV del periodo', async () => {
    const response = await exportHandler(
      new NextRequest(
        'http://localhost/api/viajes-corporativos/expense-reports/export?period=2026-01&format=csv'
      )
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('id,empleado,departamento,categoria,concepto,monto,estado,fechaGasto');
    expect(text).toContain(expenseId);
  });
});
