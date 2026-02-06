/**
 * API Route: Configuración de Zucchetti
 *
 * GET /api/integrations/zucchetti/config - Obtener estado de la integración
 * DELETE /api/integrations/zucchetti/config - Desconectar Zucchetti
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import {
  getAltaiConfig,
  getZucchettiAuthMode,
  isAltaiConfigured,
} from '@/lib/zucchetti-altai-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ═══════════════════════════════════════════════════════════════
// GET - Obtener estado de la integración
// ═══════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        id: true,
        zucchettiEnabled: true,
        zucchettiCompanyId: true,
        zucchettiTokenExpiry: true,
        zucchettiLastSync: true,
        zucchettiSyncErrors: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Verificar si el token está expirado
    const tokenExpired = company.zucchettiTokenExpiry
      ? company.zucchettiTokenExpiry < new Date()
      : false;

    const authMode = getZucchettiAuthMode();
    const oauthConfigured = !!(
      process.env.ZUCCHETTI_CLIENT_ID && process.env.ZUCCHETTI_CLIENT_SECRET
    );
    const altaiConfigured = isAltaiConfigured();
    const serverConfigured = authMode === 'altai' ? altaiConfigured : oauthConfigured;
    const altaiConfig = getAltaiConfig();

    return NextResponse.json({
      success: true,
      data: {
        // Estado de configuración del servidor
        serverConfigured,
        authMode,
        oauthConfigured,
        altaiConfigured,

        // Estado de la integración de la empresa
        enabled: company.zucchettiEnabled,
        connected: company.zucchettiEnabled && !!company.zucchettiCompanyId && !tokenExpired,
        zucchettiCompanyId: company.zucchettiCompanyId || null,

        // Estado del token
        tokenExpired,
        tokenExpiresAt: company.zucchettiTokenExpiry?.toISOString() || null,

        // Sincronización
        lastSync: company.zucchettiLastSync?.toISOString() || null,
        syncErrors: company.zucchettiSyncErrors,

        // URLs para OAuth
        authorizeUrl:
          serverConfigured && authMode === 'oauth' ? '/api/integrations/zucchetti/authorize' : null,

        // Documentación
        docs: {
          apiUrl: process.env.ZUCCHETTI_API_URL || 'https://api.zucchetti.it/v1',
          oauthUrl: process.env.ZUCCHETTI_OAUTH_URL || 'https://auth.zucchetti.it/oauth',
          altaiApiUrl: altaiConfig.apiUrl,
          altaiAuthUrl: altaiConfig.authUrl || `${altaiConfig.apiUrl}${altaiConfig.authPath || ''}`,
        },
      },
    });
  } catch (error: any) {
    logger.error('[Zucchetti Config] Error obteniendo configuración:', error);
    return NextResponse.json({ error: 'Error obteniendo configuración' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Desconectar Zucchetti
// ═══════════════════════════════════════════════════════════════

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden desconectar integraciones
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'SUPERADMIN' &&
      session.user.role !== 'administrador' &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'Solo administradores pueden desconectar integraciones' },
        { status: 403 }
      );
    }

    // Desconectar eliminando todos los datos de Zucchetti
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        zucchettiEnabled: false,
        zucchettiAccessToken: null,
        zucchettiRefreshToken: null,
        zucchettiTokenExpiry: null,
        zucchettiCompanyId: null,
        zucchettiLastSync: null,
        zucchettiSyncErrors: 0,
        zucchettiWebhookSecret: null,
      },
    });

    // Crear log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'ZUCCHETTI_DISCONNECTED',
          entityType: 'INTEGRATION',
          entityId: session.user.companyId,
          companyId: session.user.companyId,
          userId: session.user.id,
          details: {
            disconnectedAt: new Date().toISOString(),
            disconnectedBy: session.user.email,
          },
        },
      });
    } catch (auditError) {
      logger.warn('[Zucchetti Config] Error creando audit log:', auditError);
    }

    logger.info(
      `[Zucchetti Config] ✅ Integración desconectada para empresa ${session.user.companyId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Zucchetti desconectado correctamente',
    });
  } catch (error: any) {
    logger.error('[Zucchetti Config] Error desconectando:', error);
    return NextResponse.json({ error: 'Error desconectando Zucchetti' }, { status: 500 });
  }
}
