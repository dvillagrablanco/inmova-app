import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantEmail = user.email;

    // Buscar inquilino por email
    const tenant = await prisma.tenant.findFirst({
      where: { email: tenantEmail },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(tenant);
  } catch (error) {
    logger.error('Error fetching tenant profile:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantEmail = user.email;

    // Buscar inquilino por email
    const tenant = await prisma.tenant.findFirst({
      where: { email: tenantEmail },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      nombreCompleto,
      email,
      telefono,
      direccionActual,
      empresa,
      puesto,
      antiguedad,
      ingresosMensuales,
    } = body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        nombreCompleto,
        email,
        telefono,
        direccionActual,
        empresa,
        puesto,
        antiguedad,
        ingresosMensuales,
      },
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    logger.error('Error updating tenant profile:', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
