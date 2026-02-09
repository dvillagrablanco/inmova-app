import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import {
  invalidateBuildingsCache,
  invalidateDashboardCache,
  invalidateUnitsCache,
} from '@/lib/api-cache-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const unitUpdateSchema = z.object({
  buildingId: z.string().uuid().optional(),
  numero: z.string().min(1).max(50).optional(),
  tipo: z.enum(['vivienda', 'local', 'garaje', 'trastero']).optional(),
  estado: z.enum(['disponible', 'ocupada', 'en_mantenimiento']).optional(),
  superficie: z.number().positive().optional(),
  superficieUtil: z.number().positive().nullable().optional(),
  habitaciones: z.number().int().nonnegative().nullable().optional(),
  banos: z.number().int().nonnegative().nullable().optional(),
  planta: z.number().int().nullable().optional(),
  orientacion: z.string().nullable().optional(),
  rentaMensual: z.number().nonnegative().optional(),
  aireAcondicionado: z.boolean().optional(),
  calefaccion: z.boolean().optional(),
  terraza: z.boolean().optional(),
  balcon: z.boolean().optional(),
  amueblado: z.boolean().optional(),
  tourVirtual: z.string().nullable().optional(),
});

function getCompanyScope(session: any, request: NextRequest) {
  const userRole = session?.user?.role;
  const companyId = session?.user?.companyId;
  const { searchParams } = new URL(request.url);
  const filterCompanyId = searchParams.get('companyId');

  if (userRole === 'super_admin' || userRole === 'soporte') {
    return filterCompanyId || companyId;
  }

  return companyId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = getCompanyScope(session, request);
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        building: { companyId },
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            telefono: true,
            dni: true,
          },
        },
        contracts: {
          select: {
            id: true,
            fechaInicio: true,
            fechaFin: true,
            rentaMensual: true,
            estado: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    logger.error('Error fetching unit:', error);
    return NextResponse.json({ error: 'Error al obtener la unidad' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = getCompanyScope(session, request);
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = unitUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const existing = await prisma.unit.findFirst({
      where: {
        id: params.id,
        building: { companyId },
      },
      select: {
        id: true,
        buildingId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    if (parsed.data.buildingId && parsed.data.buildingId !== existing.buildingId) {
      const targetBuilding = await prisma.building.findFirst({
        where: {
          id: parsed.data.buildingId,
          companyId,
        },
        select: { id: true },
      });

      if (!targetBuilding) {
        return NextResponse.json(
          { error: 'Edificio no encontrado o sin acceso' },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, any> = { ...parsed.data };
    if (updateData.buildingId === undefined) delete updateData.buildingId;

    const updatedUnit = await prisma.unit.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true,
          },
        },
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            telefono: true,
            dni: true,
          },
        },
        contracts: {
          select: {
            id: true,
            fechaInicio: true,
            fechaFin: true,
            rentaMensual: true,
            estado: true,
          },
        },
      },
    });

    await invalidateUnitsCache(companyId);
    await invalidateBuildingsCache(companyId);
    await invalidateDashboardCache(companyId);

    return NextResponse.json(updatedUnit);
  } catch (error) {
    logger.error('Error updating unit:', error);
    return NextResponse.json({ error: 'Error al actualizar la unidad' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = getCompanyScope(session, request);
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const existing = await prisma.unit.findFirst({
      where: {
        id: params.id,
        building: { companyId },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    await prisma.unit.delete({
      where: { id: existing.id },
    });

    await invalidateUnitsCache(companyId);
    await invalidateBuildingsCache(companyId);
    await invalidateDashboardCache(companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting unit:', error);
    return NextResponse.json({ error: 'Error al eliminar la unidad' }, { status: 500 });
  }
}
