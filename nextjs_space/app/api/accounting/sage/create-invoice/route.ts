import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSageService } from '@/lib/sage-integration-service';
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

    // Obtener contratos activos
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
      take: 5, // Limitar para demo
    });

    const sageService = getSageService();
    const results = [];

    for (const contract of contracts) {
      try {
        const invoice = await sageService.createInvoiceDemo(contract);
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
      message: `${results.filter(r => r.success).length}/${results.length} facturas creadas en Sage`,
      results,
    });
  } catch (error) {
    console.error('Error creating invoices in Sage:', error);
    return NextResponse.json(
      { error: 'Error al crear facturas en Sage' },
      { status: 500 }
    );
  }
}
