import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

async function assertMaintenanceAccess(prisma: any, session: any, id: string) {
  const companyId = session?.user?.companyId;
  if (!companyId) {
    return { ok: false as const, status: 403 as const, error: 'Empresa no definida' };
  }
  const item = await prisma.maintenanceRequest.findUnique({
    where: { id },
    select: {
      id: true,
      unit: { select: { building: { select: { companyId: true } } } },
    },
  });
  if (!item) return { ok: false as const, status: 404 as const, error: 'Solicitud no encontrada' };
  const role = session?.user?.role;
  const isSuper = role === 'SUPERADMIN' || role === 'ADMIN_SISTEMA';
  const ownerCompanyId = item.unit?.building?.companyId;
  if (!isSuper && ownerCompanyId && ownerCompanyId !== companyId) {
    return { ok: false as const, status: 403 as const, error: 'Acceso denegado' };
  }
  return { ok: true as const };
}

const patchSchema = z.object({
  estado: z.string().min(1),
});

const putSchema = z.object({
  titulo: z.string().optional(),
  descripcion: z.string().optional(),
  prioridad: z.string().optional(),
  estado: z.string().optional(),
  fechaProgramada: z.string().nullable().optional(),
  fechaCompletada: z.string().nullable().optional(),
  providerId: z.string().nullable().optional(),
  costoEstimado: z.union([z.number(), z.string(), z.null()]).optional(),
  costoReal: z.union([z.number(), z.string(), z.null()]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const access = await assertMaintenanceAccess(prisma, session, params.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: true,
            tenant: true,
          },
        },
      },
    });

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    logger.error('Error fetching maintenance request:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al obtener solicitud de mantenimiento' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const access = await assertMaintenanceAccess(prisma, session, params.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.errors }, { status: 400 });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data: { estado: parsed.data.estado },
    });

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    logger.error('Error updating maintenance request:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Error al actualizar solicitud de mantenimiento' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const access = await assertMaintenanceAccess(prisma, session, params.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.errors }, { status: 400 });
    }
    const { titulo, descripcion, prioridad, estado, fechaProgramada, fechaCompletada, providerId, costoEstimado, costoReal } = parsed.data;

    const maintenanceRequest = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data: {
        titulo,
        descripcion,
        prioridad,
        estado,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        fechaCompletada: fechaCompletada ? new Date(fechaCompletada) : null,
        providerId,
        costoEstimado: costoEstimado !== undefined && costoEstimado !== null
          ? (typeof costoEstimado === 'string' ? parseFloat(costoEstimado) : costoEstimado)
          : null,
        costoReal: costoReal !== undefined && costoReal !== null
          ? (typeof costoReal === 'string' ? parseFloat(costoReal) : costoReal)
          : null,
      },
    });

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    logger.error('Error updating maintenance request:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al actualizar solicitud de mantenimiento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const access = await assertMaintenanceAccess(prisma, session, params.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    await prisma.maintenanceRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Solicitud de mantenimiento eliminada' });
  } catch (error) {
    logger.error('Error deleting maintenance request:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al eliminar solicitud de mantenimiento' }, { status: 500 });
  }
}
