import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getContaSimpleService } from '@/lib/contasimple-integration-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/accounting/contasimple/invoices
 * Crea una factura en ContaSimple desde un contrato de INMOVA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'Se requiere contractId' }, { status: 400 });
    }

    // Obtener datos del contrato
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
      },
      include: {
        tenant: true,
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!contract || contract.unit?.building?.companyId !== session?.user?.companyId) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar que el inquilino tenga ID de ContaSimple
    if (!contract.tenant?.contasimpleCustomerId) {
      return NextResponse.json(
        { error: 'El inquilino debe sincronizarse primero con ContaSimple' },
        { status: 400 }
      );
    }

    // Crear factura en ContaSimple
    const contaSimpleService = getContaSimpleService();
    const invoice = await contaSimpleService.createInvoiceFromContract(
      contract,
      contract.tenant.contasimpleCustomerId
    );

    // Guardar referencia de la factura en el contrato
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        contasimpleInvoiceId: invoice.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Factura creada exitosamente: ${invoice.number}`,
      data: invoice,
    });
  } catch (error) {
    logger.error('Error al crear factura en ContaSimple:', error);
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
  }
}
