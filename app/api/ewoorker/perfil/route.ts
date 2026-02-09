import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
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
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId },
      include: {
        company: {
          select: {
            nombre: true,
            emailContacto: true,
          },
        },
      },
    });

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const { company, ...perfilBase } = perfil;
    const perfilFormateado = {
      ...perfilBase,
      nombreEmpresa: company?.nombre || 'Sin nombre',
      emailContacto: company?.emailContacto || null,
    };

    return NextResponse.json({ perfil: perfilFormateado });

  } catch (error: any) {
    logger.error('[eWoorker Perfil GET Error]:', error);
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
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const body = await request.json();
    const data = updatePerfilSchema.parse(body);

    const { emailContacto, ...perfilData } = data;
    const perfil = await prisma.ewoorkerPerfilEmpresa.update({
      where: { companyId: user.companyId },
      data: {
        ...perfilData,
        web: perfilData.web || null,
        ...(emailContacto !== undefined
          ? {
              company: {
                update: { emailContacto },
              },
            }
          : {}),
      },
      include: {
        company: {
          select: {
            nombre: true,
            emailContacto: true,
          },
        },
      },
    });

    const { company, ...perfilBase } = perfil;

    return NextResponse.json({
      success: true,
      perfil: {
        ...perfilBase,
        nombreEmpresa: company?.nombre || 'Sin nombre',
        emailContacto: company?.emailContacto || null,
      },
    });

  } catch (error: any) {
    logger.error('[eWoorker Perfil PUT Error]:', error);

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
