import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const templates = await prisma.documentTemplate.findMany({
      where: {
        companyId,
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    logger.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar plantillas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only admin/gestor can create templates
    if (session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { nombre, descripcion, tipo, contenido, variables } = await request.json();

    if (!nombre || !tipo || !contenido) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;

    const template = await prisma.documentTemplate.create({
      data: {
        companyId,
        nombre,
        descripcion,
        tipo,
        contenido,
        variables: variables || [],
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear plantilla' },
      { status: 500 }
    );
  }
}
