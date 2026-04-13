import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const space = await prisma.commercialSpace.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { nombre: true, direccion: true } },
        commercialLeases: {
          where: { estado: 'activo' },
          select: {
            id: true,
            arrendatarioNombre: true,
            arrendatarioEmail: true,
            arrendatarioTelefono: true,
          },
          take: 1,
        },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(space);
  } catch (error: any) {
    logger.error('Error fetching commercial space:', error);
    return NextResponse.json({ error: 'Error al obtener espacio' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existing = await prisma.commercialSpace.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      nombre,
      tipo,
      direccion,
      ciudad,
      codigoPostal,
      provincia,
      planta,
      superficieConstruida,
      superficieUtil,
      rentaMensualBase,
      precioAlquiler,
      buildingId,
      descripcion,
    } = body;

    const precio =
      precioAlquiler != null && precioAlquiler !== '' ? precioAlquiler : rentaMensualBase;
    const renta = precio != null && precio !== '' ? Number(precio) : undefined;

    const util =
      superficieUtil != null && superficieUtil !== '' ? Number(superficieUtil) : undefined;
    const constr =
      superficieConstruida != null && superficieConstruida !== ''
        ? Number(superficieConstruida)
        : undefined;

    const data: Record<string, unknown> = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (tipo !== undefined) data.tipo = tipo;
    if (direccion !== undefined) data.direccion = direccion;
    if (ciudad !== undefined) data.ciudad = ciudad;
    if (codigoPostal !== undefined) data.codigoPostal = codigoPostal;
    if (provincia !== undefined) data.provincia = provincia;
    if (planta !== undefined && planta !== '') data.planta = Number(planta);
    if (constr !== undefined) data.superficieConstruida = constr;
    if (util !== undefined) data.superficieUtil = util;
    if (buildingId !== undefined) data.buildingId = buildingId || null;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (renta !== undefined) {
      data.rentaMensualBase = renta;
      const u = util ?? existing.superficieUtil;
      data.precioM2Mensual = u ? renta / u : null;
    }

    const updated = await prisma.commercialSpace.update({
      where: { id: params.id },
      data: data as any,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    logger.error('Error updating commercial space:', error);
    return NextResponse.json({ error: 'Error al actualizar espacio' }, { status: 500 });
  }
}
