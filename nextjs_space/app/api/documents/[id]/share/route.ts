import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { tenantIds, puedeDescargar = true, puedeEditar = false } = await request.json();

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un inquilino' },
        { status: 400 }
      );
    }

    // Create shares for each tenant
    const shares = await Promise.all(
      tenantIds.map((tenantId: string) =>
        prisma.documentShare.create({
          data: {
            documentId: params.id,
            tenantId,
            compartidoPor: session.user.id,
            puedeDescargar,
            puedeEditar,
          },
        })
      )
    );

    // Create notification for each tenant
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (document) {
      await Promise.all(
        tenantIds.map((tenantId: string) => {
          const tenant = prisma.tenant.findUnique({ where: { id: tenantId } });
          return prisma.notification.create({
            data: {
              companyId: session.user.companyId,
              tipo: 'info',
              titulo: 'Nuevo documento compartido',
              mensaje: `Se ha compartido el documento "${document.nombre}" contigo`,
              entityId: params.id,
              entityType: 'document',
            },
          });
        })
      );
    }

    return NextResponse.json({ shares }, { status: 201 });
  } catch (error: any) {
    console.error('Error sharing document:', error);
    return NextResponse.json(
      { error: error.message || 'Error al compartir documento' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const shares = await prisma.documentShare.findMany({
      where: { documentId: params.id },
      include: {
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ shares });
  } catch (error: any) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar permisos' },
      { status: 500 }
    );
  }
}
