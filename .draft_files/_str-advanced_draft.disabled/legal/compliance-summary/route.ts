/**
 * API para obtener resumen de cumplimiento legal
 * GET /api/str-advanced/legal/compliance-summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getLegalComplianceSummary } from '@/lib/str-advanced-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const summary = await getLegalComplianceSummary(session.user.companyId);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Error obteniendo resumen:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo resumen' },
      { status: 500 }
    );
  }
}
