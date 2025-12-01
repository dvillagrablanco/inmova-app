import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    const shares = await prisma.documentShare.findMany({
      where: { tenantId: tenant.id },
      include: {
        document: {
          include: {
            tenant: {
              select: {
                nombreCompleto: true,
              },
            },
            unit: {
              select: {
                numero: true,
                building: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
            building: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ shares });
  } catch (error: any) {
    console.error('Error fetching shared documents:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar documentos compartidos' },
      { status: 500 }
    );
  }
}
