/**
 * API Endpoint: Listar Matches de Inquilino
 * 
 * GET /api/matching?tenantId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { getTenantMatches } from '@/lib/tenant-matching-service';
import { withRateLimit } from '@/lib/rate-limiting';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';
import type { Prisma } from '@/types/prisma-types';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  tenantId: z.string().min(1),
  unitId: z.string().min(1),
  status: z.enum(['SUGGESTED', 'VIEWED', 'CONTACTED', 'RENTED', 'REJECTED']),
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

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
    } catch (error: unknown) {
      logger.error('Error fetching matches:', error);
      return NextResponse.json(
        { error: 'Error al obtener matches', details: getErrorMessage(error) },
        { status: 500 }
      );
    }
  });
}

// PATCH - Actualizar estado de un match
export async function PATCH(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const companyId = session.user.companyId;
      if (!companyId) {
        return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
      }

      const body = updateSchema.parse(await req.json());
      const prisma = getPrismaClient();

      const existing = await prisma.tenantPropertyMatch.findUnique({
        where: { tenantId_unitId: { tenantId: body.tenantId, unitId: body.unitId } },
      });

      if (!existing || existing.companyId !== companyId) {
        return NextResponse.json({ error: 'Match no encontrado' }, { status: 404 });
      }

      const updateData: Prisma.TenantPropertyMatchUpdateInput = {
        status: body.status,
      };
      const now = new Date();
      if (body.status === 'VIEWED') {
        updateData.viewedAt = now;
      }
      if (body.status === 'CONTACTED') {
        updateData.contactedAt = now;
      }

      const updated = await prisma.tenantPropertyMatch.update({
        where: { tenantId_unitId: { tenantId: body.tenantId, unitId: body.unitId } },
        data: updateData,
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      logger.error('Error updating match status:', error);
      return NextResponse.json(
        { error: 'Error al actualizar estado del match', details: getErrorMessage(error) },
        { status: 500 }
      );
    }
  });
}
