import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { POST } from '@/app/api/contracts/route';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'crypto';

describe('Integración: creación de contrato', () => {
  const ids = {
    companyId: randomUUID(),
    buildingId: randomUUID(),
    unitId: randomUUID(),
    tenantId: randomUUID(),
    userId: randomUUID(),
  };
  let contractId: string | null = null;

  beforeAll(async () => {
    await prisma.$connect();

    await prisma.company.create({
      data: {
        id: ids.companyId,
        nombre: 'Empresa Test Integración',
        esEmpresaPrueba: true,
      },
    });

    await prisma.building.create({
      data: {
        id: ids.buildingId,
        companyId: ids.companyId,
        nombre: 'Edificio Test',
        direccion: 'Calle Test 123',
        tipo: 'residencial',
        anoConstructor: 2020,
        numeroUnidades: 1,
        isDemo: true,
      },
    });

    await prisma.unit.create({
      data: {
        id: ids.unitId,
        buildingId: ids.buildingId,
        numero: '1A',
        tipo: 'vivienda',
        superficie: 55,
        rentaMensual: 1200,
        estado: 'disponible',
        isDemo: true,
      },
    });

    await prisma.tenant.create({
      data: {
        id: ids.tenantId,
        companyId: ids.companyId,
        nombreCompleto: 'Inquilino Test',
        dni: `TST-${ids.tenantId.slice(0, 8)}`,
        email: `tenant-${ids.tenantId}@test.local`,
        telefono: '600000000',
        fechaNacimiento: new Date('1990-01-01'),
        isDemo: true,
      },
    });
  });

  afterAll(async () => {
    if (contractId) {
      await prisma.contract.deleteMany({ where: { id: contractId } });
    }
    await prisma.unit.deleteMany({ where: { id: ids.unitId } });
    await prisma.tenant.deleteMany({ where: { id: ids.tenantId } });
    await prisma.building.deleteMany({ where: { id: ids.buildingId } });
    await prisma.company.deleteMany({ where: { id: ids.companyId } });

    await prisma.$disconnect();
  });

  it('crea contrato via endpoint y persiste en DB', async () => {
    const token = await encode({
      secret: process.env.NEXTAUTH_SECRET!,
      token: {
        id: ids.userId,
        email: 'admin@test.local',
        role: 'administrador',
        companyId: ids.companyId,
        companyName: 'Empresa Test Integración',
        userType: 'user',
      },
    });

    const payload = {
      unitId: ids.unitId,
      tenantId: ids.tenantId,
      fechaInicio: new Date('2025-01-01').toISOString(),
      fechaFin: new Date('2026-01-01').toISOString(),
      rentaMensual: 1200,
      deposito: 1200,
      diaCobranza: 5,
      clausulasEspeciales: 'Contrato de prueba',
      renovacionAutomatica: false,
    };

    const request = new NextRequest('http://localhost/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `next-auth.session-token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const created = await response.json();
    contractId = created.id;

    const contract = await prisma.contract.findUnique({
      where: { id: created.id },
    });

    expect(contract).not.toBeNull();
    expect(contract?.unitId).toBe(ids.unitId);
    expect(contract?.tenantId).toBe(ids.tenantId);
  });
});
