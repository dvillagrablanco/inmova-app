/**
 * API: Dashboard Export
 * GET /api/dashboard/export - Export dashboard data as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

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
        where: { building: { companyId } },
        include: { building: { select: { nombre: true } } },
        take: 100,
      }),
      prisma.tenant.findMany({
        where: { companyId },
        take: 100,
      }),
      prisma.contract.findMany({
        where: { unit: { building: { companyId } } },
        take: 100,
      }),
      prisma.payment.findMany({
        where: { contract: { unit: { building: { companyId } } } },
        take: 100,
      }),
    ]);

    // Create CSV content
    let csvContent = 'INFORME DE DATOS - INMOVA APP\n';
    csvContent += `Fecha de generación: ${new Date().toISOString()}\n`;
    csvContent += `Empresa ID: ${companyId}\n\n`;

    // Properties section
    csvContent += '=== UNIDADES ===\n';
    csvContent += 'ID,Unidad,Edificio,Estado,Renta\n';
    properties.forEach((p) => {
      csvContent += `${p.id},"${p.numero}","${p.building?.nombre || ''}",${p.estado},${p.rentaMensual || 0}\n`;
    });
    csvContent += '\n';

    // Tenants section
    csvContent += '=== INQUILINOS ===\n';
    csvContent += 'ID,Nombre,Email,NivelRiesgo\n';
    tenants.forEach((t) => {
      csvContent += `${t.id},"${t.nombreCompleto}",${t.email},${t.nivelRiesgo}\n`;
    });
    csvContent += '\n';

    // Contracts section  
    csvContent += '=== CONTRATOS ===\n';
    csvContent += 'ID,Estado,Inicio,Fin,Renta\n';
    contracts.forEach((c) => {
      csvContent += `${c.id},${c.estado},${c.fechaInicio?.toISOString().split('T')[0] || ''},${c.fechaFin?.toISOString().split('T')[0] || ''},${c.rentaMensual || 0}\n`;
    });
    csvContent += '\n';

    // Payments section
    csvContent += '=== PAGOS ===\n';
    csvContent += 'ID,Periodo,Monto,Estado,FechaPago\n';
    payments.forEach((p) => {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Dashboard Export Error]:', error);
    return NextResponse.json(
      { error: 'Error generando exportación', message },
      { status: 500 }
    );
  }
}
