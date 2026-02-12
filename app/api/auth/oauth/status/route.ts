/**
 * API Endpoint: Estado de Conexiones OAuth
 * 
 * GET /api/auth/oauth/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';


import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID no encontrado' },
        { status: 400 }
      );
    }

    // Obtener conexiones actuales
    const connections = await prisma.socialMediaAccount.findMany({
      where: {
        companyId,
        activo: true,
      },
      select: {
        platform: true,
        accountName: true,
        accountId: true,
        tokenExpiry: true,
        createdAt: true,
      },
    });

    // Mapear a formato esperado por el frontend
    const platforms = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER'];
    
    const connectionsMap = platforms.map((platform) => {
      const connection = connections.find((c) => c.platform === platform);
      
      if (connection) {
        return {
          platform,
          connected: true,
          accountName: connection.accountName,
          accountHandle: connection.accountId,
          connectedAt: connection.createdAt.toISOString(),
          expiresAt: connection.tokenExpiry?.toISOString(),
        };
      }

      return {
        platform,
        connected: false,
      };
    });

    return NextResponse.json({
      success: true,
      connections: connectionsMap,
    });

  } catch (error: any) {
    logger.error('Error fetching OAuth status:', error);
    
    return NextResponse.json(
      {
        error: 'Error obteniendo estado de conexiones',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
