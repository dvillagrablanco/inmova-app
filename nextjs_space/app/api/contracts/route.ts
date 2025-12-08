import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { contractCreateSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contracts = await prisma.contract.findMany({
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        tenant: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add days until expiration
    const contractsWithExpiration = contracts.map((contract) => {
      const today = new Date();
      const fechaFin = new Date(contract.fechaFin);
      const diasHastaVencimiento = Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...contract,
        diasHastaVencimiento,
      };
    });

    return NextResponse.json(contractsWithExpiration);
  } catch (error) {
    logger.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validación con Zod
    const validationResult = contractCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      logger.warn('Validation error creating contract:', { errors });
      return NextResponse.json(
        { error: 'Datos inv\u00e1lidos', details: errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const contract = await prisma.contract.create({
      data: {
        unitId: validatedData.unitId,
        tenantId: validatedData.tenantId,
        fechaInicio: new Date(validatedData.fechaInicio),
        fechaFin: new Date(validatedData.fechaFin),
        rentaMensual: validatedData.rentaMensual,
        deposito: validatedData.deposito || 0,
        estado: validatedData.estado || 'activo',
        diaPago: validatedData.diaCobranza || 1,
        clausulasAdicionales: validatedData.clausulasEspeciales || '',
        renovacionAutomatica: validatedData.renovacionAutomatica || false,
      },
    });

    // Update unit status and tenant
    await prisma.unit.update({
      where: { id: validatedData.unitId },
      data: {
        estado: 'ocupada',
        tenantId: validatedData.tenantId,
      },
    });

    logger.info('Contract created successfully', { contractId: contract.id });
    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating contract' });
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 });
  }
}
