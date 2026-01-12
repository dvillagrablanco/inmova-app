import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { userId: user.id },
    });

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ perfil });

  } catch (error: any) {
    console.error('[eWoorker Perfil GET Error]:', error);
    return NextResponse.json(
      { error: 'Error al cargar perfil' },
      { status: 500 }
    );
  }
}

const updatePerfilSchema = z.object({
  descripcion: z.string().optional(),
  telefono: z.string().optional(),
  emailContacto: z.string().email().optional(),
  web: z.string().url().optional().or(z.literal('')),
  numeroTrabajadores: z.number().min(0).optional(),
  experienciaAnios: z.number().min(0).optional(),
  radioOperacionKm: z.number().min(1).max(500).optional(),
  disponible: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const data = updatePerfilSchema.parse(body);

    const perfil = await prisma.ewoorkerPerfilEmpresa.update({
      where: { userId: user.id },
      data: {
        ...data,
        web: data.web || null,
      },
    });

    return NextResponse.json({
      success: true,
      perfil,
    });

  } catch (error: any) {
    console.error('[eWoorker Perfil PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
