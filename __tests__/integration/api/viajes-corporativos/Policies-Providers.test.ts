import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: viajes corporativos policies/providers', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let companyId = '';
  let userId = '';
  let policiesHandler: { GET: Handler; POST: Handler; PATCH: Handler };
  let providersHandler: { GET: Handler; POST: Handler };

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Viajes ${Date.now()}` },
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

    companyId = company.id;
    userId = user.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email, companyId: company.id },
      }
    );

    policiesHandler = await import('@/app/api/viajes-corporativos/policies/route');
    providersHandler = await import('@/app/api/viajes-corporativos/providers/route');
  });

  afterAll(async () => {
    await prisma.company.update({
      where: { id: companyId },
      data: { metadata: {} },
    });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea politicas y proveedores', async () => {
    const policyCreateRequest = new NextRequest('http://localhost/api/viajes-corporativos/policies', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Politica Test',
        descripcion: 'Politica demo',
        nivelEmpleado: 'standard',
        limites: { hotelNoche: 100, vueloDomestico: 200 },
      }),
    });

    const policyCreateResponse = await policiesHandler.POST(policyCreateRequest);
    expect(policyCreateResponse.status).toBe(201);
    const policyData = (await policyCreateResponse.json()) as { data: { id: string; activa: boolean } };
    expect(policyData.data.id).toBeTruthy();
    expect(policyData.data.activa).toBe(true);

    const policyPatchRequest = new NextRequest('http://localhost/api/viajes-corporativos/policies', {
      method: 'PATCH',
      body: JSON.stringify({
        id: policyData.data.id,
        updates: { activa: false },
      }),
    });

    const policyPatchResponse = await policiesHandler.PATCH(policyPatchRequest);
    expect(policyPatchResponse.status).toBe(200);
    const patched = (await policyPatchResponse.json()) as { data: { activa: boolean } };
    expect(patched.data.activa).toBe(false);

    const providerCreateRequest = new NextRequest('http://localhost/api/viajes-corporativos/providers', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Proveedor Demo',
        tipo: 'hotel',
        descuento: '10%',
        contrato: 'Activo',
        vencimiento: '2026-12-31',
      }),
    });

    const providerCreateResponse = await providersHandler.POST(providerCreateRequest);
    expect(providerCreateResponse.status).toBe(201);
    const providerData = (await providerCreateResponse.json()) as { data: { id: string } };
    expect(providerData.data.id).toBeTruthy();

    const providersList = await providersHandler.GET(
      new NextRequest('http://localhost/api/viajes-corporativos/providers')
    );
    expect(providersList.status).toBe(200);
  });
});
