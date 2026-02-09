import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el perfil de empresa del usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ contratos: [] });
    }

    const perfilEmpresa = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId },
    });

    if (!perfilEmpresa) {
      return NextResponse.json({ contratos: [] });
    }

    // Obtener contratos donde la empresa es constructor o subcontratista
    const contratos = await prisma.ewoorkerContrato.findMany({
      where: {
        OR: [
          { constructorId: perfilEmpresa.id },
          { subcontratistaId: perfilEmpresa.id },
        ],
      },
      include: {
        obra: {
          select: {
            id: true,
            titulo: true,
            direccion: true,
            municipio: true,
            provincia: true,
          },
        },
        constructor: {
          select: {
            id: true,
            company: {
              select: {
                nombre: true,
              },
            },
          },
        },
        subcontratista: {
          select: {
            id: true,
            company: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Formatear respuesta
    const contratosFormateados = contratos.map(c => ({
      id: c.id,
      obraId: c.obraId,
      obra: {
        titulo: c.obra.titulo,
        ubicacion:
          [c.obra.direccion, c.obra.municipio, c.obra.provincia].filter(Boolean).join(', ') ||
          'Sin ubicación',
      },
      constructor: {
        nombreEmpresa: c.constructor.company?.nombre || 'Empresa',
      },
      subcontratista: {
        nombreEmpresa: c.subcontratista.company?.nombre || 'Empresa',
      },
      estado: c.estado,
      presupuestoTotal: c.presupuestoTotal,
      fechaInicio: c.fechaInicio?.toISOString() || '',
      fechaFinEstimada: c.fechaFinEstimada?.toISOString() || '',
      progreso: c.progreso || 0,
    }));

    return NextResponse.json({ contratos: contratosFormateados });

  } catch (error: any) {
    logger.error('[eWoorker Contratos Error]:', error);
    return NextResponse.json(
      { error: 'Error al cargar contratos' },
      { status: 500 }
    );
  }
}
