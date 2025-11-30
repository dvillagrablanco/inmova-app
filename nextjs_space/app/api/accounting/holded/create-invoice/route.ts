import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getHoldedService } from '@/lib/holded-integration-service';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = session.user;
    if (role !== 'administrador' && role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const contracts = await prisma.contract.findMany({
      where: {
        tenant: { companyId },
        estado: 'activo',
      },
      include: {
        tenant: true,
        unit: {
          include: {
            building: true,
          },
        },
      },
      take: 5,
    });

    const holdedService = getHoldedService();
    const results = [];

    for (const contract of contracts) {
      try {
        const invoice = await holdedService.createInvoiceDemo(contract);
        results.push({
          contractId: contract.id,
          tenantName: contract.tenant.nombreCompleto,
          success: true,
          invoiceNumber: invoice.number,
          amount: invoice.total,
        });
      } catch (error) {
        results.push({
          contractId: contract.id,
          tenantName: contract.tenant.nombreCompleto,
          success: false,
          error: 'Error al crear factura',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.filter(r => r.success).length}/${results.length} facturas creadas en Holded`,
      results,
    });
  } catch (error) {
    console.error('Error creating invoices in Holded:', error);
    return NextResponse.json(
      { error: 'Error al crear facturas en Holded' },
      { status: 500 }
    );
  }
}
