import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const templates = await prisma.legalTemplate.findMany({
      where: {
        companyId: session.user.companyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      nombre,
      categoria,
      descripcion,
      contenido,
      variables,
      jurisdiccion,
      aplicableA,
      activo
    } = body;

    if (!nombre || !categoria || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const template = await prisma.legalTemplate.create({
      data: {
        companyId: session.user.companyId,
        nombre,
        categoria,
        descripcion: descripcion || null,
        contenido,
        variables: Array.isArray(variables) ? variables : [],
        jurisdiccion: jurisdiccion || null,
        aplicableA: Array.isArray(aplicableA) ? aplicableA : [],
        activo: activo !== false,
        ultimaRevision: new Date()
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error al crear plantilla:', error);
    return NextResponse.json(
      { error: 'Error al crear plantilla' },
      { status: 500 }
    );
  }
}