import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const certificado = await prisma.energyCertificate.findFirst({
      where: {
        id: params.id,
        unit: {
          building: {
            companyId: session.user.companyId,
          },
        },
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!certificado) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(certificado);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener certificado' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Verificar que el certificado pertenece a la empresa
    const existingCert = await prisma.energyCertificate.findFirst({
      where: {
        id: params.id,
        unit: {
          building: {
            companyId: session.user.companyId,
          },
        },
      },
    });

    if (!existingCert) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const certificado = await prisma.energyCertificate.update({
      where: { id: params.id },
      data: {
        numeroCertificado: body.numeroCertificado,
        calificacion: body.calificacion,
        consumoEnergetico: body.consumoEnergetico,
        emisionesCO2: body.emisionesCO2,
        nombreTecnico: body.nombreTecnico,
        numeroColegiadoTecnico: body.numeroColegiadoTecnico,
        empresaCertificadora: body.empresaCertificadora,
        fechaEmision: body.fechaEmision ? new Date(body.fechaEmision) : undefined,
        fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : undefined,
        recomendaciones: body.recomendaciones,
        ahorroEstimado: body.ahorroEstimado,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    return NextResponse.json(certificado);
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar certificado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el certificado pertenece a la empresa
    const existingCert = await prisma.energyCertificate.findFirst({
      where: {
        id: params.id,
        unit: {
          building: {
            companyId: session.user.companyId,
          },
        },
      },
    });

    if (!existingCert) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.energyCertificate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Certificado eliminado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar certificado' },
      { status: 500 }
    );
  }
}
