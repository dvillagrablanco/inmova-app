import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Patrones que indican empresas demo/test/fake
const DEMO_PATTERNS = [
  'demo',
  'test',
  'fake',
  'ejemplo',
  'prueba',
  'sample',
  'mock',
  'dummy',
  'placeholder',
];

// GET - Listar empresas que parecen demo/test
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        nombre: true,
        createdAt: true,
        activo: true,
        _count: {
          select: {
            users: true,
            buildings: true,
            tenants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Identificar empresas que parecen demo
    const demoCompanies = companies.filter((company) => {
      const nombreLower = company.nombre.toLowerCase();
      return DEMO_PATTERNS.some((pattern) => nombreLower.includes(pattern));
    });

    const realCompanies = companies.filter((company) => {
      const nombreLower = company.nombre.toLowerCase();
      return !DEMO_PATTERNS.some((pattern) => nombreLower.includes(pattern));
    });

    return NextResponse.json({
      total: companies.length,
      demoCompanies,
      realCompanies,
      demoCount: demoCompanies.length,
      realCount: realCompanies.length,
    });
  } catch (error) {
    console.error('Error listing companies:', error);
    return NextResponse.json(
      { error: 'Error listando empresas' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar empresas demo/test
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    const deleteAll = searchParams.get('all') === 'true';

    if (!deleteAll && companyIds.length === 0) {
      return NextResponse.json(
        { error: 'Especifica IDs de empresas o usa ?all=true' },
        { status: 400 }
      );
    }

    let companiesToDelete: string[] = [];

    if (deleteAll) {
      // Obtener todas las empresas demo
      const companies = await prisma.company.findMany({
        select: { id: true, nombre: true },
      });

      companiesToDelete = companies
        .filter((c) => {
          const nombreLower = c.nombre.toLowerCase();
          return DEMO_PATTERNS.some((pattern) => nombreLower.includes(pattern));
        })
        .map((c) => c.id);
    } else {
      companiesToDelete = companyIds;
    }

    if (companiesToDelete.length === 0) {
      return NextResponse.json({
        message: 'No hay empresas para eliminar',
        deleted: 0,
      });
    }

    // Eliminar en orden de dependencias
    const results: Record<string, number> = {};

    // 1. Eliminar pagos de contratos de estas empresas
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        contract: {
          unit: {
            building: {
              companyId: { in: companiesToDelete },
            },
          },
        },
      },
    });
    results.payments = deletedPayments.count;

    // 2. Eliminar solicitudes de mantenimiento
    const deletedMaintenance = await prisma.maintenanceRequest.deleteMany({
      where: {
        unit: {
          building: {
            companyId: { in: companiesToDelete },
          },
        },
      },
    });
    results.maintenanceRequests = deletedMaintenance.count;

    // 3. Eliminar contratos
    const deletedContracts = await prisma.contract.deleteMany({
      where: {
        unit: {
          building: {
            companyId: { in: companiesToDelete },
          },
        },
      },
    });
    results.contracts = deletedContracts.count;

    // 4. Eliminar inquilinos
    const deletedTenants = await prisma.tenant.deleteMany({
      where: {
        companyId: { in: companiesToDelete },
      },
    });
    results.tenants = deletedTenants.count;

    // 5. Eliminar unidades
    const deletedUnits = await prisma.unit.deleteMany({
      where: {
        building: {
          companyId: { in: companiesToDelete },
        },
      },
    });
    results.units = deletedUnits.count;

    // 6. Eliminar edificios
    const deletedBuildings = await prisma.building.deleteMany({
      where: {
        companyId: { in: companiesToDelete },
      },
    });
    results.buildings = deletedBuildings.count;

    // 7. Eliminar usuarios (excepto super_admin)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        companyId: { in: companiesToDelete },
        role: { not: 'super_admin' },
      },
    });
    results.users = deletedUsers.count;

    // 8. Eliminar módulos de empresa
    try {
      const deletedModules = await prisma.moduleCompany.deleteMany({
        where: {
          companyId: { in: companiesToDelete },
        },
      });
      results.modules = deletedModules.count;
    } catch {
      // Modelo puede no existir
    }

    // 9. Finalmente eliminar las empresas
    const deletedCompanies = await prisma.company.deleteMany({
      where: {
        id: { in: companiesToDelete },
      },
    });
    results.companies = deletedCompanies.count;

    return NextResponse.json({
      message: `${deletedCompanies.count} empresas eliminadas`,
      deleted: deletedCompanies.count,
      details: results,
    });
  } catch (error) {
    console.error('Error deleting companies:', error);
    return NextResponse.json(
      { error: 'Error eliminando empresas' },
      { status: 500 }
    );
  }
}
