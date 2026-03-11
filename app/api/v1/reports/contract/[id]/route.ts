/**
 * API Route: Generar PDF de Contrato
 *
 * GET /api/v1/reports/contract/[id]
 *
 * Genera un PDF profesional del contrato de arrendamiento.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateContractPDF } from '@/lib/pdf-generator-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const contractId = params.id;

    // 2. Obtener contrato con relaciones
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        tenant: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // 3. Verificar ownership
    const contractCompanyId = contract.unit?.building?.companyId;
    if (contractCompanyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // 4. Obtener info del propietario (de la company)
    const company = await prisma.company.findUnique({
      where: { id: contractCompanyId },
      select: {
        nombre: true,
        email: true,
        telefono: true,
      },
    });

    // 5. Preparar datos para PDF
    const contractData = {
      contractId: contract.id,
      property: {
        address: contract.unit?.building?.direccion || '',
        city: '',
        postalCode: '',
        rooms: contract.unit?.habitaciones || 0,
        bathrooms: contract.unit?.banos || 0,
        squareMeters: contract.unit?.superficie || 0,
      },
      landlord: {
        name: company?.nombre || 'Propietario',
        dni: 'N/A',
        email: company?.email || '',
        phone: company?.telefono || '',
      },
      tenant: {
        name: contract.tenant.nombreCompleto,
        dni: contract.tenant.dni || 'N/A',
        email: contract.tenant.email,
        phone: contract.tenant.telefono || 'N/A',
      },
      terms: {
        rentAmount: contract.rentaMensual,
        deposit: contract.deposito,
        startDate: contract.fechaInicio,
        endDate: contract.fechaFin,
        paymentDay: contract.diaPago || 1,
        includedServices: contract.gastosIncluidos || ['Agua', 'Comunidad'],
      },
    };

    // 6. Generar PDF
    const pdfBuffer = await generateContractPDF(contractData);

    logger.info('✅ PDF de contrato generado', {
      contractId,
      userId: session.user.id,
      size: pdfBuffer.length,
    });

    // 7. Retornar PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${contractId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    logger.error('❌ Error generando PDF de contrato:', error);
    return NextResponse.json(
      { error: 'Error generando PDF', message: error.message },
      { status: 500 }
    );
  }
}
