import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
interface Params {
  params: Promise<{ id: string }>;
}
/**
 * GET /api/admin-fincas/reports/[id]
 * Obtiene un informe específico
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }
    const { id } = await params;
    const report = await prisma.communityReport.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        community: true,
      },
    });
    if (!report) {
      return NextResponse.json(
        { error: 'Informe no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Error al obtener informe' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin-fincas/reports/[id]
 * Actualiza un informe (observaciones, documento)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    // Verificar que el informe existe y pertenece a la compañía
    const existing = await prisma.communityReport.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Informe no encontrado' },
        { status: 404 }
      );
    }
    const report = await prisma.communityReport.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Error al actualizar informe' },
      { status: 500 }
    );
  }
}
