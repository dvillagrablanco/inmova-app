import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const activo = searchParams.get('activo');

    const where: any = {
      companyId: user.companyId,
    };

    if (categoria) where.categoria = categoria;
    if (activo !== null) where.activo = activo === 'true';

    const templates = await prisma.legalTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching legal templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas legales' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();

    const template = await prisma.legalTemplate.create({
      data: {
        companyId: user.companyId,
        nombre: body.nombre,
        categoria: body.categoria,
        descripcion: body.descripcion,
        contenido: body.contenido,
        variables: body.variables || [],
        jurisdiccion: body.jurisdiccion,
        aplicableA: body.aplicableA || [],
        activo: body.activo !== false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating legal template:', error);
    return NextResponse.json(
      { error: 'Error al crear plantilla legal' },
      { status: 500 }
    );
  }
}
