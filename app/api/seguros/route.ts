import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;

    // Resolver companyId con soporte multi-empresa
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const sessionCompanyId = cookieCompanyId || (session.user as any).companyId;
    const companyId =
      queryCompanyId && userRole === 'super_admin' ? queryCompanyId : sessionCompanyId;
    
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const seguros = await prisma.insurance.findMany({
      where: {
        companyId,
        ...(buildingId && { buildingId }),
        ...(tipo && { tipo: tipo as any }),
        ...(estado && { estado: estado as any }),
      },
      include: {
        building: { select: { nombre: true, direccion: true } },
        unit: { select: { numero: true } },
        _count: { select: { claims: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    return NextResponse.json(seguros);
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener seguros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const seguro = await prisma.insurance.create({
      data: { ...body, companyId: session.user.companyId },
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
      },
    });

    return NextResponse.json(seguro, { status: 201 });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear seguro' }, { status: 500 });
  }
}
