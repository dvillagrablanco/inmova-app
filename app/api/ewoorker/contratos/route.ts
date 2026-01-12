import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const perfilEmpresa = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { userId: user.id },
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
            ubicacion: true,
          },
        },
        constructor: {
          select: {
            id: true,
            nombreEmpresa: true,
          },
        },
        subcontratista: {
          select: {
            id: true,
            nombreEmpresa: true,
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
        ubicacion: c.obra.ubicacion || 'Sin ubicación',
      },
      constructor: {
        nombreEmpresa: c.constructor.nombreEmpresa,
      },
      subcontratista: {
        nombreEmpresa: c.subcontratista.nombreEmpresa,
      },
      estado: c.estado,
      presupuestoTotal: c.presupuestoTotal,
      fechaInicio: c.fechaInicio?.toISOString() || '',
      fechaFinEstimada: c.fechaFinEstimada?.toISOString() || '',
      progreso: c.progreso || 0,
    }));

    return NextResponse.json({ contratos: contratosFormateados });

  } catch (error: any) {
    console.error('[eWoorker Contratos Error]:', error);
    return NextResponse.json(
      { error: 'Error al cargar contratos' },
      { status: 500 }
    );
  }
}
