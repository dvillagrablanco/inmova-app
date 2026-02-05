/**
 * API: Document Import Batches
 *
 * GET /api/onboarding/documents/batches
 * Lista batches de importación de la empresa
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: session.user.companyId,
    };
    if (status) where.status = status;

    const [batches, total] = await Promise.all([
      prisma.documentImportBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.documentImportBatch.count({ where }),
    ]);

    return NextResponse.json({
      data: batches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo batches:', error);
    return NextResponse.json({ error: 'Error al obtener batches' }, { status: 500 });
  }
}
