import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener checklists
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
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const activa = searchParams.get('activa');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (tipo) where.tipo = tipo;
    if (activa !== null) where.activa = activa === 'true';

    const checklists = await prisma.sTRHousekeepingChecklist.findMany({
      where,
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    logger.error('Error al obtener checklists:', error);
    return NextResponse.json(
      { error: 'Error al obtener checklists' },
      { status: 500 }
    );
  }
}

// POST - Crear checklist
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, descripcion, tipo, items, tiempoEstimado } = body;

    if (!nombre || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nombre e items son requeridos' },
        { status: 400 }
      );
    }

    const checklist = await prisma.sTRHousekeepingChecklist.create({
      data: {
        companyId: session.user.companyId,
        nombre,
        descripcion: descripcion || null,
        tipo: tipo || 'check_out',
        items,
        tiempoEstimadoMin: tiempoEstimado || null,
        activo: true,
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    logger.error('Error al crear checklist:', error);
    return NextResponse.json(
      { error: 'Error al crear checklist' },
      { status: 500 }
    );
  }
}
