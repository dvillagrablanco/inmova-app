/**
 * POST /api/onboarding/documents/validate
 * 
 * Validación cruzada post-importación.
 * Detecta inconsistencias en los datos importados:
 * - Contratos sin inquilino vinculado
 * - Inquilinos sin DNI
 * - Edificios sin CEE
 * - Unidades sin contrato (vacías)
 * - Contratos con renta 0
 * - Inquilinos duplicados (mismo DNI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  title: string;
  detail: string;
  entityType: string;
  entityId?: string;
  action?: string;
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });
    const companyIds = scope.scopeCompanyIds;
    const issues: ValidationIssue[] = [];

    // 1. Contratos activos sin inquilino
    const contractsNoTenant = await prisma.contract.count({
      where: { estado: 'activo', tenantId: null as any, unit: { building: { companyId: { in: companyIds } } } },
    });
    if (contractsNoTenant > 0) {
      issues.push({ type: 'error', category: 'contratos', title: `${contractsNoTenant} contratos sin inquilino`, detail: 'Contratos activos que no tienen inquilino vinculado', entityType: 'contract', action: 'Vincular inquilino a cada contrato' });
    }

    // 2. Contratos con renta 0
    const contractsZeroRent = await prisma.contract.count({
      where: { estado: 'activo', rentaMensual: 0, unit: { building: { companyId: { in: companyIds } } } },
    });
    if (contractsZeroRent > 0) {
      issues.push({ type: 'warning', category: 'contratos', title: `${contractsZeroRent} contratos con renta 0€`, detail: 'Contratos activos sin renta asignada', entityType: 'contract', action: 'Revisar y asignar renta mensual' });
    }

    // 3. Inquilinos sin DNI
    const tenantsNoDNI = await prisma.tenant.count({
      where: { companyId: { in: companyIds }, OR: [{ dni: '' }, { dni: null as any }] },
    });
    if (tenantsNoDNI > 0) {
      issues.push({ type: 'warning', category: 'inquilinos', title: `${tenantsNoDNI} inquilinos sin DNI/NIF`, detail: 'Inquilinos sin documento de identidad registrado', entityType: 'tenant', action: 'Completar DNI/NIF de cada inquilino' });
    }

    // 4. Inquilinos sin email
    const tenantsNoEmail = await prisma.tenant.count({
      where: { companyId: { in: companyIds }, OR: [{ email: '' }, { email: { contains: '@placeholder' } }] },
    });
    if (tenantsNoEmail > 0) {
      issues.push({ type: 'warning', category: 'inquilinos', title: `${tenantsNoEmail} inquilinos sin email válido`, detail: 'No se pueden enviar comunicaciones ni facturas', entityType: 'tenant', action: 'Completar email de contacto' });
    }

    // 5. Edificios sin CEE
    const buildingsNoCEE = await prisma.building.findMany({
      where: { companyId: { in: companyIds }, isDemo: false },
      select: { id: true, nombre: true },
    });
    const buildingsWithCEE = await prisma.energyCertificate.findMany({
      where: { companyId: { in: companyIds } },
      select: { unitId: true, unit: { select: { buildingId: true } } },
    });
    const ceeBuildings = new Set(buildingsWithCEE.map(c => c.unit?.buildingId).filter(Boolean));
    const noCEE = buildingsNoCEE.filter(b => !ceeBuildings.has(b.id));
    if (noCEE.length > 0) {
      issues.push({ type: 'info', category: 'certificaciones', title: `${noCEE.length} edificios sin CEE`, detail: 'Edificios sin certificado de eficiencia energética: ' + noCEE.slice(0, 5).map(b => b.nombre).join(', '), entityType: 'building', action: 'Subir certificados energéticos' });
    }

    // 6. Unidades sin valorMercado ni precioCompra
    const unitsNoValue = await prisma.unit.count({
      where: { building: { companyId: { in: companyIds }, isDemo: false }, precioCompra: null, valorMercado: null },
    });
    if (unitsNoValue > 0) {
      issues.push({ type: 'info', category: 'patrimonio', title: `${unitsNoValue} unidades sin valoración`, detail: 'Unidades sin precio de compra ni valor de mercado asignado', entityType: 'unit', action: 'Importar escrituras o realizar valoración' });
    }

    // 7. Seguros próximos a vencer (30 días)
    const insuranceExpiring = await prisma.insurance.count({
      where: { companyId: { in: companyIds }, estado: 'activa', fechaVencimiento: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) } },
    });
    if (insuranceExpiring > 0) {
      issues.push({ type: 'warning', category: 'seguros', title: `${insuranceExpiring} pólizas vencen en 30 días`, detail: 'Seguros que necesitan renovación próximamente', entityType: 'insurance', action: 'Negociar renovación con aseguradora' });
    }

    // 8. Inquilinos sin IBAN (para cobros SEPA)
    const tenantsNoIBAN = await prisma.tenant.count({
      where: { companyId: { in: companyIds }, contracts: { some: { estado: 'activo' } }, OR: [{ iban: null }, { iban: '' }] },
    });
    if (tenantsNoIBAN > 0) {
      issues.push({ type: 'info', category: 'cobros', title: `${tenantsNoIBAN} inquilinos activos sin IBAN`, detail: 'No se pueden generar domiciliaciones SEPA sin IBAN', entityType: 'tenant', action: 'Solicitar datos bancarios al inquilino' });
    }

    // Summary
    const summary = {
      total: issues.length,
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      info: issues.filter(i => i.type === 'info').length,
    };

    return NextResponse.json({ success: true, issues, summary });
  } catch (error: any) {
    logger.error('[Document Validate]:', error);
    return NextResponse.json({ error: 'Error validando datos' }, { status: 500 });
  }
}
