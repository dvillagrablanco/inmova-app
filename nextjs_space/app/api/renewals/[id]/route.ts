import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  acceptRenewal,
  rejectRenewal,
} from '@/lib/services/renewal-service-simple';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/renewals/{id}:
 *   get:
 *     summary: Obtener detalles de una renovación
 *     tags: [Renovaciones]
 *   patch:
 *     summary: Actualizar estado de renovación (aceptar/rechazar)
 *     tags: [Renovaciones]
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const renewal = await prisma.contractRenewal.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: { building: true },
            },
          },
        },
      },
    });

    if (!renewal) {
      return NextResponse.json(
        { error: 'Renovación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(renewal);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener renovación' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === 'accept') {
      const newContract = await acceptRenewal(params.id);
      return NextResponse.json({
        message: 'Renovación aceptada',
        newContract,
      });
    }

    if (body.action === 'reject') {
      const renewal = await rejectRenewal(params.id, body.motivo || 'Sin motivo especificado');
      return NextResponse.json({
        message: 'Renovación rechazada',
        renewal,
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar renovación' },
      { status: 500 }
    );
  }
}
