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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const contractId = params.id;

    // 2. Obtener contrato con relaciones
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          include: {
            building: true,
          },
        },
        tenant: true,
        company: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // 3. Verificar ownership
    if (contract.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // 4. Obtener info del propietario (de la company)
    const company = await prisma.company.findUnique({
      where: { id: contract.companyId },
      select: {
        legalName: true,
        contactEmail: true,
        contactPhone: true,
      },
    });

    // 5. Preparar datos para PDF
    const contractData = {
      contractId: contract.id,
      property: {
        address: contract.property.direccion || contract.property.address || '',
        city: contract.property.ciudad || contract.property.city || '',
        postalCode: contract.property.codigoPostal || contract.property.postalCode || '',
        rooms: contract.property.habitaciones || contract.property.rooms || 0,
        bathrooms: contract.property.banos || contract.property.bathrooms || 0,
        squareMeters: contract.property.superficie || contract.property.squareMeters || 0,
      },
      landlord: {
        name: company?.legalName || 'Propietario',
        dni: 'N/A',
        email: company?.contactEmail || '',
        phone: company?.contactPhone || '',
      },
      tenant: {
        name: contract.tenant.name,
        dni: contract.tenant.dni || 'N/A',
        email: contract.tenant.email,
        phone: contract.tenant.phone || 'N/A',
      },
      terms: {
        rentAmount: contract.rentAmount,
        deposit: contract.deposit,
        startDate: contract.startDate,
        endDate: contract.endDate,
        paymentDay: contract.paymentDay || 1,
        includedServices: contract.includedServices || ['Agua', 'Comunidad'],
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
