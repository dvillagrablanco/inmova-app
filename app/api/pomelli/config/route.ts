export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API ENDPOINT: Configuración de Pomelli
 * GET: Obtener configuración actual
 * POST: Crear/Actualizar configuración
 * DELETE: Eliminar configuración
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { validatePomelliCredentials } from '@/lib/pomelli-integration';
import { encryptField } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener companyId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Solo admin y super_admin pueden ver la configuración
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener configuración de Pomelli
    const config = await prisma.pomelliConfig.findUnique({
      where: { companyId: user.companyId },
      include: {
        profiles: {
          select: {
            id: true,
            platform: true,
            profileName: true,
            profileUsername: true,
            profileImageUrl: true,
            isActive: true,
            isConnected: true,
            followersCount: true,
            lastSyncAt: true,
          },
        },
      },
    });

    if (!config) {
      return NextResponse.json({
        configured: false,
        profiles: [],
      });
    }

    // No enviar credenciales sensibles al cliente
    return NextResponse.json({
      configured: true,
      enabled: config.enabled,
      lastSyncAt: config.lastSyncAt,
      profiles: config.profiles,
      hasWebhook: !!config.webhookUrl,
    });
  } catch (error: unknown) {
    logger.error('Error getting Pomelli config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const schema = z.object({
      apiKey: z.string().min(1),
      apiSecret: z.string().min(1),
      webhookUrl: z.string().url().optional().nullable().or(z.literal('')),
      enabled: z.boolean().optional(),
    });

    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { apiKey, apiSecret, webhookUrl, enabled } = parsed.data;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'API Key y API Secret son requeridos' },
        { status: 400 }
      );
    }

    // Validar credenciales con Pomelli
    const isValid = await validatePomelliCredentials(apiKey, apiSecret);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales de Pomelli inválidas' },
        { status: 400 }
      );
    }

    // Crear o actualizar configuración
    const encryptedSecret = encryptField(apiSecret);
    const config = await prisma.pomelliConfig.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        apiKey,
        apiSecret: encryptedSecret,
        webhookUrl: webhookUrl || null,
        enabled: enabled !== false,
        lastSyncAt: new Date(),
      },
      update: {
        apiKey,
        apiSecret: encryptedSecret,
        webhookUrl: webhookUrl || null,
        enabled: enabled !== false,
        lastSyncAt: new Date(),
      },
    });

    logger.info(`Pomelli config saved for company ${user.companyId}`);

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        enabled: config.enabled,
        hasWebhook: !!config.webhookUrl,
        lastSyncAt: config.lastSyncAt,
      },
    });
  } catch (error: unknown) {
    logger.error('Error saving Pomelli config:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Eliminar configuración
    await prisma.pomelliConfig.delete({
      where: { companyId: user.companyId },
    });

    logger.info(`Pomelli config deleted for company ${user.companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada correctamente',
    });
  } catch (error: unknown) {
    logger.error('Error deleting Pomelli config:', error);
    return NextResponse.json(
      { error: 'Error al eliminar configuración' },
      { status: 500 }
    );
  }
}
