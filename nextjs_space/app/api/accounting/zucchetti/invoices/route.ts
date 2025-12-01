import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getZucchettiService } from '@/lib/zucchetti-integration-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/accounting/zucchetti/invoices
 * Crea una factura en Zucchetti desde un contrato de INMOVA
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
      return NextResponse.json(
        { error: 'Se requiere contractId' },
        { status: 400 }
      );
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

    if (!contract || contract.unit?.building?.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Crear factura en Zucchetti (modo demo)
    const zucchettiService = getZucchettiService();
    const result = await zucchettiService.createInvoiceDemo(contract);

    return NextResponse.json({
      success: true,
      message: `Factura creada para contrato ${contract.id}`,
      data: result,
    });
  } catch (error) {
    console.error('Error al crear factura en Zucchetti:', error);
    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    );
  }
}
