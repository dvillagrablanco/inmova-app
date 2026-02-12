import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para actualizar edificio
const buildingUpdateSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).optional(),
  direccion: z.string().optional(),
  tipo: z.enum(['residencial', 'comercial', 'mixto']).optional(),
  anoConstructor: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val === undefined || (val >= 1800 && val <= new Date().getFullYear() + 5), {
      message: 'Año de construcción inválido',
    }),
  numeroUnidades: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val === undefined || val >= 0, {
      message: 'El número de unidades debe ser positivo',
    }),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const building = await prisma.building.findUnique({
      where: { id: params.id },
      include: {
        units: {
          include: {
            tenant: true,
            contracts: true,
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    // Verificar que el edificio pertenece a la empresa del usuario
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const userCompanyId = cookieCompanyId || session.user.companyId;
    const userRole = (session.user as any).role;
    if (building.companyId && userCompanyId && building.companyId !== userCompanyId && userRole !== 'super_admin' && userRole !== 'soporte') {
      return NextResponse.json({ error: 'No tienes acceso a este edificio' }, { status: 403 });
    }

    return NextResponse.json(building);
  } catch (error) {
    logger.error('Error fetching building:', error);
    return NextResponse.json({ error: 'Error al obtener edificio' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user?.companyId;
    const body = await req.json();

    // Validación con Zod
    const validationResult = buildingUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error updating building:', { errors, buildingId: params.id });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const { nombre, direccion, tipo, anoConstructor, numeroUnidades } = validationResult.data;

    const building = await prisma.building.update({
      where: { id: params.id },
      data: {
        nombre,
        direccion,
        tipo,
        anoConstructor,
        numeroUnidades,
      },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateBuildingsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json(building);
  } catch (error) {
    logger.error('Error updating building:', error);
    return NextResponse.json({ error: 'Error al actualizar edificio' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user?.companyId;

    // Verificar ownership antes de eliminar
    const existing = await prisma.building.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }
    const userRole = (session.user as any).role;
    if (existing.companyId !== companyId && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes acceso a este edificio' }, { status: 403 });
    }

    await prisma.building.delete({
      where: { id: params.id },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateBuildingsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json({ message: 'Edificio eliminado' });
  } catch (error) {
    logger.error('Error deleting building:', error);
    return NextResponse.json({ error: 'Error al eliminar edificio' }, { status: 500 });
  }
}
