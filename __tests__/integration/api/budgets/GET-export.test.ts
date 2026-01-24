import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest, ctx: { params: { id: string } }) => Promise<Response>;

describe('API: /api/budgets/[id]', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let budgetId = '';
  let itemId = '';
  let getHandler: Handler;
  let exportHandler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { nombre: `Empresa Presupuesto ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `budget-${Date.now()}@inmova.app`,
        name: 'User Budget',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const budget = await prisma.budget.create({
      data: {
        companyId: company.id,
        numero: `BUD-${Date.now()}`,
        titulo: 'Presupuesto test',
        tipo: 'mantenimiento',
        estado: 'borrador',
        fechaCreacion: new Date(),
        fechaValidez: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subtotal: 100,
        iva: 21,
        total: 121,
        items: {
          create: [
            {
              concepto: 'Servicio',
              cantidad: 1,
              unidad: 'ud',
              precioUnitario: 100,
              total: 100,
            },
          ],
        },
      },
      include: { items: true },
    });

    companyId = company.id;
    userId = user.id;
    budgetId = budget.id;
    itemId = budget.items[0].id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { companyId: company.id },
      }
    );

    const routeModule = await import('@/app/api/budgets/[id]/route');
    getHandler = routeModule.GET;
    const exportModule = await import('@/app/api/budgets/[id]/export/route');
    exportHandler = exportModule.GET;
  });

  afterAll(async () => {
    await prisma.budgetItem.deleteMany({ where: { id: itemId } });
    await prisma.budget.deleteMany({ where: { id: budgetId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('obtiene detalle del presupuesto', async () => {
    const response = await getHandler(
      new NextRequest('http://localhost/api/budgets/' + budgetId),
      { params: { id: budgetId } }
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as { id: string; items: Array<{ id: string }> };
    expect(data.id).toBe(budgetId);
    expect(data.items.length).toBe(1);
  });

  it('exporta CSV del presupuesto', async () => {
    const response = await exportHandler(
      new NextRequest('http://localhost/api/budgets/' + budgetId + '/export'),
      { params: { id: budgetId } }
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('concepto,cantidad,unidad,precio_unitario,total');
  });
});
