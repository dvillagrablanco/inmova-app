export const dynamic = 'force-dynamic';

/**
 * API: /api/integrations/[integrationId]/logs
 * GET: Obtener logs de una integración
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { IntegrationManager } from '@/lib/integration-manager';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: {
    integrationId: string;
  };
}

/**
 * GET /api/integrations/[integrationId]/logs
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que la integración pertenece a la empresa
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        id: params.integrationId,
        companyId: session.user.companyId,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await IntegrationManager.getIntegrationLogs(
      params.integrationId,
      limit
    );

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error('Error getting integration logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
