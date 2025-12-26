/**
 * API: /api/integrations/[integrationId]/test
 * POST: Probar conexión de integración
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IntegrationManager } from '@/lib/integration-manager';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: {
    integrationId: string;
  };
}

/**
 * POST /api/integrations/[integrationId]/test
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que la integración pertenece a la empresa
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        id: params.integrationId,
        companyId: session.user.companyId,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Ejecutar test
    const result = await IntegrationManager.testIntegration(params.integrationId);

    logger.info(
      `Integration test ${result.success ? 'passed' : 'failed'} for ${params.integrationId}`
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
    });
  } catch (error) {
    logger.error('Error testing integration:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
