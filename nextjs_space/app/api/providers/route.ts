import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');

    const where: any = { companyId: user.companyId };
    if (tipo) where.tipo = tipo;

    const providers = await prisma.provider.findMany({
      where,
      include: {
        _count: {
          select: {
            maintenanceRequests: true,
            expenses: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(providers);
  } catch (error: any) {
    logger.error('Error fetching providers:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const body = await req.json();
    const { nombre, tipo, telefono, email, direccion, rating, notas } = body;

    if (!nombre || !tipo || !telefono) {
      return badRequestResponse('Campos requeridos faltantes');
    }

    const provider = await prisma.provider.create({
      data: {
        companyId: user.companyId,
        nombre,
        tipo,
        telefono,
        email: email || null,
        direccion: direccion || null,
        rating: rating || null,
        notas: notas || null,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating provider:', error);
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}
