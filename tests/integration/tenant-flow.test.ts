/* @vitest-environment node */

import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

type ActionsModule = typeof import('@/app/actions/tenant-flow-actions');

let prisma: PrismaClient;
let actions: ActionsModule;

const hasDatabase = Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
const describeIf = hasDatabase ? describe : describe.skip;

describeIf('Modulo Critico 1: Flujo de Inquilinos y Propiedades', () => {
  const companyId = crypto.randomUUID();
  const buildingId = crypto.randomUUID();
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `tenant.${suffix}@example.com`;
  const dni = `${Math.floor(10000000 + Math.random() * 89999999)}A`;

  let unitId: string | null = null;
  let tenantId: string | null = null;

  beforeAll(async () => {
    const loadEnvFile = (envPath: string) => {
      if (!fs.existsSync(envPath)) return;
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        if (!line || line.startsWith('#') || !line.includes('=')) continue;
        const [key, ...rest] = line.split('=');
        if (!key) continue;
        const value = rest.join('=').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    };

    if (process.env.TEST_DATABASE_URL) {
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    }

    if (!process.env.DATABASE_URL) {
      const root = process.cwd();
      loadEnvFile(path.join(root, '.env.coolify'));
      loadEnvFile(path.join(root, '.env.build'));
      loadEnvFile(path.join(root, '.env'));
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no configurado para tests de integracion');
    }

    prisma = new PrismaClient();
    (globalThis as { prisma?: PrismaClient }).prisma = prisma;
    actions = await import('@/app/actions/tenant-flow-actions');

    await prisma.$connect();

    await prisma.company.create({
      data: {
        id: companyId,
        nombre: `Empresa Test ${suffix}`,
      },
    });

    await prisma.building.create({
      data: {
        id: buildingId,
        companyId,
        nombre: `Edificio Test ${suffix}`,
        direccion: 'Calle Falsa 123',
        tipo: 'residencial',
        anoConstructor: 2000,
        numeroUnidades: 1,
      },
    });
  });

  afterAll(async () => {
    if (unitId) {
      await prisma.unit.delete({ where: { id: unitId } }).catch(() => null);
    }
    if (tenantId) {
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => null);
    }
    await prisma.building.delete({ where: { id: buildingId } }).catch(() => null);
    await prisma.company.delete({ where: { id: companyId } }).catch(() => null);
    await prisma.$disconnect();
    (globalThis as { prisma?: PrismaClient }).prisma = undefined;
  });

  test('Crear propiedad, crear inquilino, asignar y guardar', async () => {
    const propertyForm = new FormData();
    propertyForm.set('buildingId', buildingId);
    propertyForm.set('numero', `A-${suffix}`);
    propertyForm.set('tipo', 'vivienda');
    propertyForm.set('estado', 'disponible');
    propertyForm.set('superficie', '85');
    propertyForm.set('rentaMensual', '1200');

    // Simula clic en "Guardar" (server action de propiedad)
    const propertyResult = await actions.createPropertyAction(propertyForm);
    expect(propertyResult.success).toBe(true);
    if (!propertyResult.success) {
      throw new Error(propertyResult.error);
    }

    unitId = propertyResult.data.id;

    const tenantForm = new FormData();
    tenantForm.set('companyId', companyId);
    tenantForm.set('nombre', 'Juan');
    tenantForm.set('apellidos', 'Perez');
    tenantForm.set('email', email);
    tenantForm.set('telefono', '+34600000000');
    tenantForm.set('dni', dni);
    tenantForm.set('fechaNacimiento', new Date('1990-01-01').toISOString());
    tenantForm.set('nacionalidad', 'Espanola');
    tenantForm.set('ingresosMensuales', '2500');

    const tenantResult = await actions.createTenantAction(tenantForm);
    expect(tenantResult.success).toBe(true);
    if (!tenantResult.success) {
      throw new Error(tenantResult.error);
    }

    tenantId = tenantResult.data.id;

    const assignForm = new FormData();
    assignForm.set('unitId', unitId);
    assignForm.set('tenantId', tenantId);

    const assignResult = await actions.assignTenantToPropertyAction(assignForm);
    expect(assignResult.success).toBe(true);
    if (!assignResult.success) {
      throw new Error(assignResult.error);
    }

    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    expect(unit).toBeTruthy();
    expect(unit?.tenantId).toBe(tenantId);
    expect(unit?.estado).toBe('ocupada');
  });
});
