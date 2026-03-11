import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const updateProviderSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').optional(),
  cif: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  web: z.string().optional().nullable(),
  contactoNombre: z.string().optional().nullable(),
  contactoEmail: z.string().email().optional().nullable(),
  contactoTelefono: z.string().optional().nullable(),
  contactoCargo: z.string().optional().nullable(),
  tiposSeguro: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
  notas: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

async function getCompanyIds(session: any, request: NextRequest) {
  const { resolveCompanyScope } = await import('@/lib/company-scope');
  const scope = await resolveCompanyScope({
    userId: session.user.id as string,
    role: (session.user as any).role,
    primaryCompanyId: (session.user as any).companyId,
    request,
  });
  return scope.scopeCompanyIds;
}

// GET - Get single provider by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const companyIds = await getCompanyIds(session, request);
    const provider = await prisma.insuranceProvider.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            quotations: true,
            quoteRequests: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    if (!(companyIds as string[]).includes(provider.companyId)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    logger.error('[Proveedores GET by ID]:', error);
    return NextResponse.json({ error: 'Error al obtener proveedor' }, { status: 500 });
  }
}

// PUT - Update provider
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const prisma = await getPrisma();
    const companyIds = await getCompanyIds(session, request);

    const existing = await prisma.insuranceProvider.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    if (!(companyIds as string[]).includes(existing.companyId)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateProviderSchema.parse(body);

    const updated = await prisma.insuranceProvider.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Proveedores PUT]:', error);
    return NextResponse.json({ error: 'Error al actualizar proveedor' }, { status: 500 });
  }
}

// DELETE - Delete provider
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const prisma = await getPrisma();
    const companyIds = await getCompanyIds(session, request);

    const existing = await prisma.insuranceProvider.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    if (!(companyIds as string[]).includes(existing.companyId)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.insuranceProvider.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Proveedor eliminado' });
  } catch (error) {
    logger.error('[Proveedores DELETE]:', error);
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 });
  }
}
