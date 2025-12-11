import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateContractByType } from '@/lib/contract-templates';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, unitId, type, startDate, endDate, monthlyRent, deposit, paymentDay, additionalClauses } = body;

    // Validar datos requeridos
    if (!tenantId || !unitId || !type) {
      return NextResponse.json({ error: 'Datos insuficientes' }, { status: 400 });
    }

    // Obtener datos del inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener datos de la unidad y edificio
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        building: true
      }
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    // Obtener datos de la compañía (arrendador)
    const company = await prisma.company.findUnique({
      where: { id: session?.user?.companyId }
    });

    if (!company) {
      return NextResponse.json({ error: 'Compañía no encontrada' }, { status: 404 });
    }

    // Preparar datos para el contrato
    const contractData = {
      landlord: {
        name: company.nombre,
        dni: company.cif || 'N/A',
        address: company.direccion || 'N/A',
        email: company.email || session?.user?.email,
        phone: company.telefono || 'N/A'
      },
      tenant: {
        name: tenant.nombreCompleto,
        dni: tenant.dni,
        address: tenant.direccionActual || 'N/A',
        email: tenant.email,
        phone: tenant.telefono
      },
      property: {
        address: unit.building.direccion,
        type: unit.tipo,
        area: unit.superficie,
        floor: unit.planta?.toString(),
        number: unit.numero
      },
      terms: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent: monthlyRent || unit.rentaMensual,
        deposit: deposit || (unit.rentaMensual * 2),
        paymentDay: paymentDay || 5,
        includesUtilities: false,
        utilities: []
      },
      additionalClauses: additionalClauses || []
    };

    // Generar el contrato
    const contractText = generateContractByType(type, contractData);

    // Retornar el texto del contrato
    return NextResponse.json({
      success: true,
      contract: contractText,
      metadata: {
        tenant: contractData.tenant.name,
        property: `${contractData.property.address}, ${contractData.property.number}`,
        monthlyRent: contractData.terms.monthlyRent,
        duration: `${Math.round((contractData.terms.endDate.getTime() - contractData.terms.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))} meses`
      }
    });
  } catch (error) {
    logger.error('Error generating contract:', error);
    return NextResponse.json({ 
      error: 'Error al generar contrato',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
