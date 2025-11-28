import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenants = await prisma.tenant.findMany({
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
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Error al obtener inquilinos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nombreCompleto, dni, email, telefono, fechaNacimiento, scoring, nivelRiesgo, notas } = body;

    if (!nombreCompleto || !dni || !email || !telefono || !fechaNacimiento) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: {
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
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Error al crear inquilino' }, { status: 500 });
  }
}