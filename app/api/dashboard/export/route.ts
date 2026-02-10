/**
 * API: Dashboard Export
 * GET /api/dashboard/export - Export dashboard data as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { resolveAccountingScope } from '@/lib/accounting-scope';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    const companyIds = scope?.companyIds || [session.user.companyId];

    // Fetch data from various tables
    const [properties, tenants, contracts, payments] = await Promise.all([
      prisma.unit.findMany({
        where: { building: { companyId: { in: companyIds } } },
        include: { building: true },
        take: 100
      }),
      prisma.tenant.findMany({
        where: { companyId: { in: companyIds } },
        take: 100
      }),
      prisma.contract.findMany({
        where: { unit: { building: { companyId: { in: companyIds } } } },
        take: 100
      }),
      prisma.payment.findMany({
        where: { contract: { unit: { building: { companyId: { in: companyIds } } } } },
        take: 100
      })
    ]);

    // Create CSV content
    let csvContent = 'INFORME DE DATOS - INMOVA APP\n';
    csvContent += `Fecha de generación: ${new Date().toISOString()}\n`;
    csvContent += `Empresa: ${scope?.activeCompanyId || 'N/A'}\n\n`;

    // Properties section
    csvContent += '=== PROPIEDADES ===\n';
    csvContent += 'ID,Numero,Edificio,Estado,Renta\n';
    properties.forEach(p => {
      csvContent += `${p.id},"${p.numero}","${p.building?.nombre || ''}",${p.estado},${p.rentaMensual || 0}\n`;
    });
    csvContent += '\n';

    // Tenants section
    csvContent += '=== INQUILINOS ===\n';
    csvContent += 'ID,Nombre,Email,Riesgo\n';
    tenants.forEach(t => {
      csvContent += `${t.id},"${t.nombreCompleto}",${t.email},${t.nivelRiesgo}\n`;
    });
    csvContent += '\n';

    // Contracts section  
    csvContent += '=== CONTRATOS ===\n';
    csvContent += 'ID,Estado,Inicio,Fin,Renta\n';
    contracts.forEach(c => {
      csvContent += `${c.id},${c.estado},${c.fechaInicio?.toISOString().split('T')[0] || ''},${c.fechaFin?.toISOString().split('T')[0] || ''},${c.rentaMensual || 0}\n`;
    });
    csvContent += '\n';

    // Payments section
    csvContent += '=== PAGOS ===\n';
    csvContent += 'ID,Periodo,Monto,Estado,Fecha\n';
    payments.forEach(p => {
      csvContent += `${p.id},"${p.periodo}",${p.monto},${p.estado},${p.fechaPago?.toISOString().split('T')[0] || ''}\n`;
    });

    // Summary
    csvContent += '\n=== RESUMEN ===\n';
    csvContent += `Total Propiedades: ${properties.length}\n`;
    csvContent += `Total Inquilinos: ${tenants.length}\n`;
    csvContent += `Total Contratos: ${contracts.length}\n`;
    csvContent += `Total Pagos: ${payments.length}\n`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inmova-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[Dashboard Export Error]:', error);
    return NextResponse.json(
      { error: 'Error generando exportación', message: error.message },
      { status: 500 }
    );
  }
}
