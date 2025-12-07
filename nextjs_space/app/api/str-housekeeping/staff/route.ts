import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obtener personal de limpieza
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const disponible = searchParams.get('disponible');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (tipo) where.tipo = tipo;
    if (disponible !== null) where.disponible = disponible === 'true';

    const staff = await prisma.sTRHousekeepingStaff.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error al obtener personal:', error);
    return NextResponse.json(
      { error: 'Error al obtener personal' },
      { status: 500 }
    );
  }
}

// POST - Crear personal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      nombre,
      email,
      telefono,
      tipo,
      especialidades,
      zonas,
      disponible,
      capacidadDiaria,
      tarifaHora,
    } = body;

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      );
    }

    const staff = await prisma.sTRHousekeepingStaff.create({
      data: {
        companyId: session.user.companyId,
        nombre,
        email: email || null,
        telefono,
        tipo: tipo || 'limpiador',
        especialidades: especialidades || [],
        zonas: zonas || [],
        disponible: disponible !== false,
        capacidadDiaria: capacidadDiaria || 1,
        tarifaHora: tarifaHora || null,
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error('Error al crear personal:', error);
    return NextResponse.json(
      { error: 'Error al crear personal' },
      { status: 500 }
    );
  }
}
