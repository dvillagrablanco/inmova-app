import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener información de la empresa del usuario
// Para super_admin: acepta ?companyId= para obtener empresa seleccionada
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    
    // Para super_admin: permitir seleccionar empresa vía query param
    let companyId = user.companyId;
    if (user.role === 'super_admin') {
      const { searchParams } = new URL(req.url);
      const selectedCompanyId = searchParams.get('companyId');
      if (selectedCompanyId) {
        companyId = selectedCompanyId;
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No hay empresa asociada' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    logger.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Error al obtener la empresa' }, { status: 500 });
  }
}

// PATCH - Actualizar información de la empresa (solo administradores)
// Para super_admin: acepta ?companyId= para actualizar empresa seleccionada
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar la empresa' },
        { status: 403 }
      );
    }

    // Para super_admin: permitir actualizar empresa seleccionada vía query param
    let companyId = user.companyId;
    if (user.role === 'super_admin') {
      const { searchParams } = new URL(req.url);
      const selectedCompanyId = searchParams.get('companyId');
      if (selectedCompanyId) {
        companyId = selectedCompanyId;
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No hay empresa para actualizar' }, { status: 400 });
    }

    const body = await req.json();

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        nombre: body.nombre,
        cif: body.cif,
        direccion: body.direccion,
        telefono: body.telefono,
        email: body.email,
        ciudad: body.ciudad,
        codigoPostal: body.codigoPostal,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    logger.error('Error updating company:', error);
    return NextResponse.json({ error: 'Error al actualizar la empresa' }, { status: 500 });
  }
}
