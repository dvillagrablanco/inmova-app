import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/seguros/analisis', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let companyId = '';
  let userId = '';
  let insuranceId = '';
  let claimId = '';
  let handler: Handler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Seguros ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `seguros-${Date.now()}@inmova.app`,
        name: 'User Seguros',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    companyId = company.id;
    userId = user.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const insurance = await prisma.insurance.create({
      data: {
        companyId,
        numeroPoliza: `POL-${Date.now()}`,
        tipo: 'incendio',
        aseguradora: 'Aseguradora Demo',
        nombreAsegurado: 'Empresa Demo',
        fechaInicio: new Date('2026-01-01'),
        fechaVencimiento: new Date('2026-12-31'),
        estado: 'activa',
        primaAnual: 1200,
      },
    });

    insuranceId = insurance.id;

    const claim = await prisma.insuranceClaim.create({
      data: {
        insuranceId,
        fechaSiniestro: new Date('2026-02-01'),
        descripcion: 'Siniestro demo',
        montoReclamado: 5000,
        montoAprobado: 4000,
        estado: 'abierto',
      },
    });

    claimId = claim.id;

    const routeModule = await import('@/app/api/seguros/analisis/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    if (claimId) await prisma.insuranceClaim.delete({ where: { id: claimId } });
    if (insuranceId) await prisma.insurance.delete({ where: { id: insuranceId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('retorna analisis de seguros', async () => {
    const response = await handler(new NextRequest('http://localhost/api/seguros/analisis'));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      stats: { totalPolicies: number; activePolicies: number; totalClaims: number; totalPaid: number };
    };
    expect(data.stats.totalPolicies).toBe(1);
    expect(data.stats.activePolicies).toBe(1);
    expect(data.stats.totalClaims).toBe(1);
    expect(data.stats.totalPaid).toBe(4000);
  });
});
