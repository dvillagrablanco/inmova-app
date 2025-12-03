import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

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
    const { unitId, tenantId, fechaInicio, fechaFin, rentaMensual, deposito, estado, tipo } = body;

    if (!unitId || !tenantId || !fechaInicio || !fechaFin || !rentaMensual || !deposito) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const contract = await prisma.contract.create({
      data: {
        unitId,
        tenantId,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        rentaMensual: parseFloat(rentaMensual),
        deposito: parseFloat(deposito),
        estado: estado || 'activo',
        tipo: tipo || 'residencial',
      },
    });

    // Update unit status and tenant
    await prisma.unit.update({
      where: { id: unitId },
      data: {
        estado: 'ocupada',
        tenantId,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    logger.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 });
  }
}
