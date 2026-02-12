import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/admin/companies/[id] - Detalle de una empresa (solo super_admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        subscriptionPlan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        buildings: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        tenants: {
          select: {
            id: true,
            email: true,
          },
        },
        companyModules: {
          select: {
            id: true,
            moduloCodigo: true,
            activo: true,
          },
        },
        branding: true,
        _count: {
          select: {
            users: true,
            buildings: true,
            tenants: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    logger.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Error al obtener empresa' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/companies/[id] - Actualiza una empresa (solo super_admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Verificar dominio único si se proporciona
    if (data.dominioPersonalizado) {
      const existingDomain = await prisma.company.findFirst({
        where: {
          dominioPersonalizado: data.dominioPersonalizado,
          NOT: { id: params.id },
        },
      });
      
      if (existingDomain) {
        return NextResponse.json(
          { error: 'El dominio personalizado ya está en uso' },
          { status: 400 }
        );
      }
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.cif !== undefined && { cif: data.cif }),
        ...(data.direccion !== undefined && { direccion: data.direccion }),
        ...(data.telefono !== undefined && { telefono: data.telefono }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.codigoPostal !== undefined && { codigoPostal: data.codigoPostal }),
        ...(data.ciudad !== undefined && { ciudad: data.ciudad }),
        ...(data.pais !== undefined && { pais: data.pais }),
        ...(data.dominioPersonalizado !== undefined && { dominioPersonalizado: data.dominioPersonalizado }),
        ...(data.estadoCliente !== undefined && { estadoCliente: data.estadoCliente }),
        ...(data.contactoPrincipal !== undefined && { contactoPrincipal: data.contactoPrincipal }),
        ...(data.emailContacto !== undefined && { emailContacto: data.emailContacto }),
        ...(data.telefonoContacto !== undefined && { telefonoContacto: data.telefonoContacto }),
        ...(data.notasAdmin !== undefined && { notasAdmin: data.notasAdmin }),
        ...(data.maxUsuarios !== undefined && { maxUsuarios: data.maxUsuarios }),
        ...(data.maxPropiedades !== undefined && { maxPropiedades: data.maxPropiedades }),
        ...(data.maxEdificios !== undefined && { maxEdificios: data.maxEdificios }),
        ...(data.subscriptionPlanId !== undefined && { subscriptionPlanId: data.subscriptionPlanId }),
        ...(data.activo !== undefined && { activo: data.activo }),
        ...(data.category !== undefined && { category: data.category }),
      },
      include: {
        subscriptionPlan: true,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    logger.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Error al actualizar empresa' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/companies/[id] - Elimina una empresa (solo super_admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    logger.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Error al eliminar empresa' },
      { status: 500 }
    );
  }
}
