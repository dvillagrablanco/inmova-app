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

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const especialidad = searchParams.get('especialidad');
    const zona = searchParams.get('zona');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Construir filtros
    const where: any = {
      verificado: true, // Solo empresas verificadas
      disponible: true, // Solo disponibles
    };

    if (tipo && tipo !== 'todos') {
      where.tipoEmpresa = tipo;
    }

    if (especialidad && especialidad !== 'todas') {
      where.especialidades = { has: especialidad };
    }

    if (zona) {
      where.zonasOperacion = { has: zona };
    }

    if (search) {
      where.OR = [
        { nombreEmpresa: { contains: search, mode: 'insensitive' } },
        { especialidades: { hasSome: [search] } },
      ];
    }

    // Obtener empresas
    const [empresas, total] = await Promise.all([
      prisma.ewoorkerPerfilEmpresa.findMany({
        where,
        select: {
          id: true,
          nombreEmpresa: true,
          tipoEmpresa: true,
          especialidades: true,
          zonasOperacion: true,
          valoracionMedia: true,
          totalReviews: true,
          verificado: true,
          disponible: true,
          numeroTrabajadores: true,
          experienciaAnios: true,
        },
        orderBy: [
          { valoracionMedia: 'desc' },
          { totalReviews: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ewoorkerPerfilEmpresa.count({ where }),
    ]);

    return NextResponse.json({
      empresas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error('[eWoorker Empresas Error]:', error);
    return NextResponse.json(
      { error: 'Error al cargar empresas' },
      { status: 500 }
    );
  }
}
