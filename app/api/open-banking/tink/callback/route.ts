/**
 * GET /api/open-banking/tink/callback
 * Callback de Tink Link tras autorización bancaria
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';
import { buildTinkUserId } from '@/lib/tink-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const credentialsId = searchParams.get('credentials_id');
  const error = searchParams.get('error');
  const companyId = searchParams.get('companyId');
  const userId = searchParams.get('userId');
  const connectionId = searchParams.get('connectionId');
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const prisma = getPrismaClient();

  const redirectToOpenBanking = (params: Record<string, string>) => {
    const url = new URL('/open-banking', appUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return NextResponse.redirect(url);
  };

  if (error) {
    logger.warn('[Tink Callback] Error:', error);
    if (connectionId) {
      await prisma.bankConnection.updateMany({
        where: { id: connectionId, proveedor: 'tink' },
        data: { estado: 'error', errorDetalle: error },
      });
    }
    return redirectToOpenBanking({ tink: 'error', message: error });
  }

  if (credentialsId) {
    logger.info('[Tink Callback] Success, credentials:', credentialsId);

    if (companyId && userId) {
      const tinkUserId = buildTinkUserId(companyId, userId);

      const existingConnection = connectionId
        ? await prisma.bankConnection.findFirst({
            where: { id: connectionId, companyId, userId, proveedor: 'tink' },
          })
        : await prisma.bankConnection.findFirst({
            where: { companyId, userId, proveedor: 'tink' },
            orderBy: { createdAt: 'desc' },
          });

      if (existingConnection) {
        await prisma.bankConnection.update({
          where: { id: existingConnection.id },
          data: {
            provider: 'tink',
            proveedorItemId: credentialsId,
            accessToken: tinkUserId,
            estado: 'conectado',
            ultimaSync: new Date(),
            errorDetalle: null,
          },
        });
      } else {
        await prisma.bankConnection.create({
          data: {
            companyId,
            userId,
            proveedor: 'tink',
            provider: 'tink',
            proveedorItemId: credentialsId,
            accessToken: tinkUserId,
            nombreBanco: 'Tink Open Banking',
            estado: 'conectado',
            scope: 'AIS',
            ultimaSync: new Date(),
          },
        });
      }
    }

    return redirectToOpenBanking({ tink: 'success', credentials: credentialsId });
  }

  return redirectToOpenBanking({ tink: 'unknown' });
}
