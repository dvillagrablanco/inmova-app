/**
 * API: Dashboard Export
 * GET /api/dashboard/export - Export dashboard data as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Fetch data from various tables
    const [properties, tenants, contracts, payments] = await Promise.all([
      prisma.unit.findMany({
        where: { companyId },
        include: { building: true },
        take: 100
      }),
      prisma.tenant.findMany({
        where: { companyId },
        take: 100
      }),
      prisma.contract.findMany({
        where: { companyId },
        take: 100
      }),
      prisma.payment.findMany({
        where: { companyId },
        take: 100
      })
    ]);

    // Create CSV content
    let csvContent = 'INFORME DE DATOS - INMOVA APP\n';
    csvContent += `Fecha de generación: ${new Date().toISOString()}\n`;
    csvContent += `Empresa ID: ${companyId}\n\n`;

    // Properties section
    csvContent += '=== PROPIEDADES ===\n';
    csvContent += 'ID,Nombre,Edificio,Estado,Renta\n';
    properties.forEach(p => {
      csvContent += `${p.id},"${p.name}","${p.building?.name || ''}",${p.status},${p.rentAmount || 0}\n`;
    });
    csvContent += '\n';

    // Tenants section
    csvContent += '=== INQUILINOS ===\n';
    csvContent += 'ID,Nombre,Email,Estado\n';
    tenants.forEach(t => {
      csvContent += `${t.id},"${t.firstName} ${t.lastName}",${t.email},${t.status}\n`;
    });
    csvContent += '\n';

    // Contracts section  
    csvContent += '=== CONTRATOS ===\n';
    csvContent += 'ID,Estado,Inicio,Fin,Renta\n';
    contracts.forEach(c => {
      csvContent += `${c.id},${c.status},${c.startDate?.toISOString().split('T')[0] || ''},${c.endDate?.toISOString().split('T')[0] || ''},${c.rent || 0}\n`;
    });
    csvContent += '\n';

    // Payments section
    csvContent += '=== PAGOS ===\n';
    csvContent += 'ID,Concepto,Monto,Estado,Fecha\n';
    payments.forEach(p => {
      csvContent += `${p.id},"${p.concept || ''}",${p.amount},${p.status},${p.paidDate?.toISOString().split('T')[0] || ''}\n`;
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
