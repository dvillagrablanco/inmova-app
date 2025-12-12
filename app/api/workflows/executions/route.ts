import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
import logger from '@/lib/logger';

/**
 * GET /api/workflows/executions - Listar ejecuciones de workflows
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      workflow: {
        companyId: session.user.companyId,
      },
    };

    if (workflowId) {
      where.workflowId = workflowId;
    }

    if (status) {
      where.status = status;
    }

    const executions = await prisma.workflowExecution.findMany({
      where,
      include: {
        workflow: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(executions);
  } catch (error: any) {
    logger.error('Error obteniendo ejecuciones:', error);
    return NextResponse.json(
      { error: 'Error obteniendo ejecuciones' },
      { status: 500 }
    );
  }
}
