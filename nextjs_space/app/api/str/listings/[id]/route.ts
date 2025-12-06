import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/str/listings/[id]
 * Obtiene un listing por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const companyId = session.user.companyId;

    const listing = await prisma.sTRListing.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        channels: {
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          take: 5,
          orderBy: { fecha: 'desc' },
        },
        seasonPricing: {
          where: { activo: true },
          orderBy: { fechaInicio: 'asc' },
        },
      },
    });

    if (!listing || listing.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Listing no encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json(listing);
  } catch (error) {
    logError(error as Error, { context: 'GET /api/str/listings/[id]' });
    return NextResponse.json(
      {
        error: 'Error al obtener listing',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/str/listings/[id]
 * Actualiza un listing
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const companyId = session.user.companyId;
    const body = await request.json();

    // Verificar que el listing existe y pertenece a la compañía
    const existing = await prisma.sTRListing.findUnique({
      where: { id },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Listing no encontrado' },
        { status: 404 },
      );
    }

    // Actualizar listing
    const updated = await prisma.sTRListing.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logError(error as Error, { context: 'PUT /api/str/listings/[id]' });
    return NextResponse.json(
      {
        error: 'Error al actualizar listing',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/str/listings/[id]
 * Elimina un listing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const companyId = session.user.companyId;

    // Verificar que el listing existe y pertenece a la compañía
    const existing = await prisma.sTRListing.findUnique({
      where: { id },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Listing no encontrado' },
        { status: 404 },
      );
    }

    // Eliminar listing (cascade eliminará relacionados)
    await prisma.sTRListing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, { context: 'DELETE /api/str/listings/[id]' });
    return NextResponse.json(
      {
        error: 'Error al eliminar listing',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
