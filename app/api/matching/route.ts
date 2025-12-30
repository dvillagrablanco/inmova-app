/**
 * API Endpoint: Listar Matches de Inquilino
 * 
 * GET /api/matching?tenantId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTenantMatches } from '@/lib/tenant-matching-service';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      // 1. Autenticación
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      const companyId = session.user.companyId;
      if (!companyId) {
        return NextResponse.json(
          { error: 'Company ID no encontrado' },
          { status: 400 }
        );
      }

      // 2. Parsear query parameters
      const { searchParams } = new URL(req.url);
      const tenantId = searchParams.get('tenantId');

      if (!tenantId) {
        return NextResponse.json(
          { error: 'tenantId requerido' },
          { status: 400 }
        );
      }

      // 3. Obtener matches
      const matches = await getTenantMatches(tenantId, companyId);

      // 4. Respuesta
      return NextResponse.json({
        success: true,
        data: matches,
        total: matches.length,
      });
    } catch (error: any) {
      logger.error('Error fetching matches:', error);
      return NextResponse.json(
        { error: 'Error al obtener matches' },
        { status: 500 }
      );
    }
  });
}
