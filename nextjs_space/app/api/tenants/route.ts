import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();

    const tenants = await prisma.tenant.findMany({
      where: { companyId: user.companyId },
      include: {
        units: {
          include: {
            building: true,
          },
        },
        contracts: {
          where: { estado: 'activo' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tenants);
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener inquilinos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');

    const body = await req.json();
    const { nombreCompleto, dni, email, telefono, fechaNacimiento, scoring, nivelRiesgo, notas } = body;

    if (!nombreCompleto || !dni || !email || !telefono || !fechaNacimiento) {
      return badRequestResponse('Faltan campos requeridos');
    }

    const tenant = await prisma.tenant.create({
      data: {
        companyId: user.companyId,
        nombreCompleto,
        dni,
        email,
        telefono,
        fechaNacimiento: new Date(fechaNacimiento),
        scoring: scoring ? parseInt(scoring) : 50,
        nivelRiesgo: nivelRiesgo || 'medio',
        notas,
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear inquilino' }, { status: 500 });
  }
}