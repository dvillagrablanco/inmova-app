import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo');

  try {
    const where: any = {};
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
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nombre, tipo, telefono, email, direccion, rating, notas } = body;

    if (!nombre || !tipo || !telefono) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const provider = await prisma.provider.create({
      data: {
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
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}