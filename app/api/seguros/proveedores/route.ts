// @ts-nocheck
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

const createProviderSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
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
  tiposSeguro: z.array(z.string()).default([]),
  activo: z.boolean().default(true),
  notas: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

// GET - List all providers for company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');

    // Multi-company scope
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role,
      primaryCompanyId: (session.user as any).companyId,
      request,
    });
    const companyFilter =
      scope.scopeCompanyIds.length > 1
        ? { in: scope.scopeCompanyIds }
        : scope.activeCompanyId || (session.user as any).companyId;

    const providers = await prisma.insuranceProvider.findMany({
      where: {
        companyId: companyFilter,
        ...(activo !== null && activo !== undefined && activo !== ''
          ? { activo: activo === 'true' }
          : {}),
      },
      include: {
        _count: {
          select: {
            quotations: true,
            quoteRequests: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(providers);
  } catch (error) {
    logger.error('[Proveedores GET]:', error);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}

// POST - Create provider
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const prisma = await getPrisma();
    const body = await request.json();
    const validated = createProviderSchema.parse(body);

    // Use active company from scope (not holding)
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role,
      primaryCompanyId: (session.user as any).companyId,
      request,
    });

    const provider = await prisma.insuranceProvider.create({
      data: {
        ...validated,
        companyId: scope.activeCompanyId || session.user.companyId,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Proveedores POST]:', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}
