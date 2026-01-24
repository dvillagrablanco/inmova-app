import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest) => Promise<Response>;

describe('API: /api/budgets', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let budgetId = '';
  let handler: RouteHandler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Budgets ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `budgets-${Date.now()}@inmova.app`,
        name: 'Budgets Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    userId = user.id;
    companyId = company.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const routeModule = await import('@/app/api/budgets/route');
    handler = routeModule.POST;
  });

  afterAll(async () => {
    if (budgetId) {
      await prisma.budgetItem.deleteMany({ where: { budgetId } });
      await prisma.budget.deleteMany({ where: { id: budgetId } });
    }
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea un presupuesto en DB', async () => {
    const payload = {
      titulo: 'Presupuesto de mantenimiento',
      descripcion: 'Revision de instalaciones',
      tipo: 'mantenimiento',
      clienteNombre: 'Cliente Test',
      proveedorNombre: 'Proveedor Test',
      validezDias: '15',
      items: [
        { concepto: 'Mano de obra', cantidad: 2, unidad: 'h', precioUnitario: 40 },
        { concepto: 'Materiales', cantidad: 1, unidad: 'ud', precioUnitario: 50 },
      ],
      notas: 'Condiciones de pago 30 dias',
      ivaRate: '21',
    };

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handler(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as { id: string };
    expect(data.id).toBeTruthy();
    budgetId = data.id;

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { items: true },
    });

    expect(budget).not.toBeNull();
    expect(budget?.titulo).toBe(payload.titulo);
    expect(budget?.items.length).toBe(2);
    expect(budget?.total).toBeCloseTo( (2 * 40 + 50) * 1.21, 2);
  });
});
