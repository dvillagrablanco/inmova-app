import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logger, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/workflows/[id]/toggle - Activa/desactiva un workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el workflow existe y pertenece a la empresa
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow no encontrado' },
        { status: 404 }
      );
    }

    // Toggle isActive
    const updated = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        isActive: !workflow.isActive,
      },
    });

    logger.info(
      `Workflow ${updated.isActive ? 'activated' : 'deactivated'}: ${updated.id}`,
      {
        metadata: {
          workflowId: updated.id,
          userId: session.user.id,
        }
      }
    );

    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (error) {
    logger.error('POST /api/workflows/[id]/toggle', { error });
    return NextResponse.json(
      { error: 'Error al cambiar estado del workflow' },
      { status: 500 }
    );
  }
}
