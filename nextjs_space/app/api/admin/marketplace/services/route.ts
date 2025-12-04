import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  let session: any;
  try {
    session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const services = await prisma.marketplaceService.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        provider: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(services);
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error fetching marketplace services'), {
      context: 'GET /api/admin/marketplace/services',
      companyId: session?.user?.companyId,
    });
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let session: any;
  let body: any;
  try {
    session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    body = await req.json();

    const {
      nombre,
      descripcion,
      categoria,
      subcategoria,
      tipoPrecio,
      precio,
      unidad,
      comisionPorcentaje,
      disponible,
      duracionEstimada,
      destacado,
      activo
    } = body;

    if (!nombre || !descripcion || !categoria || !tipoPrecio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const service = await prisma.marketplaceService.create({
      data: {
        companyId: session.user.companyId,
        nombre,
        descripcion,
        categoria,
        subcategoria: subcategoria || null,
        tipoPrecio,
        precio: precio !== null && precio !== undefined ? parseFloat(precio) : null,
        unidad: unidad || null,
        comisionPorcentaje: parseFloat(comisionPorcentaje) || 10,
        disponible: disponible !== false,
        duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : null,
        destacado: destacado === true,
        activo: activo !== false
      },
      include: {
        provider: {
          select: {
            nombre: true
          }
        }
      }
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error creating marketplace service'), {
      context: 'POST /api/admin/marketplace/services',
      nombre: body?.nombre,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json(
      { error: 'Error al crear servicio' },
      { status: 500 }
    );
  }
}