import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/espacios-comunes - Listar espacios comunes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const tipo = searchParams.get('tipo') as any | null;
    const activo = searchParams.get('activo');

    const espacios = await prisma.commonSpace.findMany({
      where: {
        companyId: session.user.companyId,
        ...(buildingId && { buildingId }),
        ...(tipo && { tipo }),
        ...(activo !== null && { activo: activo === 'true' }),
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(espacios);
  } catch (error) {
    logger.error('Error fetching espacios comunes:', error);
    return NextResponse.json(
      { error: 'Error al obtener espacios comunes' },
      { status: 500 }
    );
  }
}

// POST /api/espacios-comunes - Crear espacio común
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Validar rol
    if (session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      buildingId,
      nombre,
      descripcion,
      tipo,
      capacidadMaxima,
      requierePago,
      costoPorHora,
      horaApertura,
      horaCierre,
      duracionMaximaHoras,
      anticipacionDias,
      reglas,
      activo,
    } = body;

    // Validaciones
    if (!buildingId || !nombre || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const espacio = await prisma.commonSpace.create({
      data: {
        companyId: session.user.companyId,
        buildingId,
        nombre,
        descripcion,
        tipo,
        capacidadMaxima: capacidadMaxima || null,
        requierePago: requierePago || false,
        costoPorHora: costoPorHora || null,
        horaApertura: horaApertura || null,
        horaCierre: horaCierre || null,
        duracionMaximaHoras: duracionMaximaHoras || 4,
        anticipacionDias: anticipacionDias || 30,
        reglas,
        activo: activo !== undefined ? activo : true,
      },
      include: {
        building: {
          select: {
            nombre: true,
            direccion: true,
          },
        },
      },
    });

    return NextResponse.json(espacio, { status: 201 });
  } catch (error) {
    logger.error('Error creating espacio común:', error);
    return NextResponse.json(
      { error: 'Error al crear espacio común' },
      { status: 500 }
    );
  }
}
