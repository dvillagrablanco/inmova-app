import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
interface Params {
  params: Promise<{ id: string }>;
}
/**
 * GET /api/admin-fincas/communities/[id]
 * Obtiene detalles de una comunidad específica
 */
export async function GET(request: NextRequest, { params }: Params) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const community = await prisma.communityManagement.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        building: true,
        facturas: {
          take: 10,
          orderBy: { fechaEmision: 'desc' },
        },
        movimientosCaja: {
          take: 20,
          orderBy: { fecha: 'desc' },
        },
        informes: {
          take: 5,
          orderBy: { generadoEn: 'desc' },
        },
      },
    });
    
    if (!community) {
      return NextResponse.json(
        { error: 'Comunidad no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(community);
  } catch (error) {
    logger.error('Error fetching community:', error);
    return NextResponse.json(
      { error: 'Error al obtener comunidad' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin-fincas/communities/[id]
 * Actualiza una comunidad
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    
    // Verificar que la comunidad existe y pertenece a la compañía
    const existing = await prisma.communityManagement.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Comunidad no encontrada' },
        { status: 404 }
      );
    }
    
    const community = await prisma.communityManagement.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json(community);
  } catch (error) {
    logger.error('Error updating community:', error);
    return NextResponse.json(
      { error: 'Error al actualizar comunidad' },
      { status: 500 }
    );
  }
}
