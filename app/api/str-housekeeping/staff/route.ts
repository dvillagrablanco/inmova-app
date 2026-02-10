import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener personal de limpieza
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const activo = searchParams.get('activo');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (tipo) where.tipo = tipo;
    if (activo !== null) where.activo = activo === 'true';

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
    logger.error('Error al obtener personal:', error);
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
      zonasTrabajo,
      activo,
      capacidadDiaria,
      tarifaPorHora,
      tarifaPorTurnover,
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
        tipo: tipo || 'interno',
        zonasTrabajo: zonasTrabajo || [],
        activo: activo !== false,
        capacidadDiaria: capacidadDiaria || 4,
        tarifaPorHora: tarifaPorHora || null,
        tarifaPorTurnover: tarifaPorTurnover || null,
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    logger.error('Error al crear personal:', error);
    return NextResponse.json(
      { error: 'Error al crear personal' },
      { status: 500 }
    );
  }
}
