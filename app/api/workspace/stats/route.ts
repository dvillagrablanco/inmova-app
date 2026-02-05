/**
 * API: Workspace Stats
 * GET /api/workspace/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { WorkspaceService } from '@/lib/services/workspace-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({
        success: false,
        data: {},
        error: 'No autorizado',
      });
    }

    const stats = await WorkspaceService.getStats(session.user.companyId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('[Workspace Stats Error]:', error);
    return NextResponse.json({
      success: false,
      data: {},
      error: 'Error obteniendo estadísticas',
      message: error.message,
    });
  }
}
