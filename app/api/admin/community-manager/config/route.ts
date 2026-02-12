import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración por defecto
const DEFAULT_CONFIG = {
  autoPost: false,
  postFrequency: 'weekly',
  customDaysPerWeek: 3,
  bestTimeToPost: '10:00',
  hashtagStrategy: 'auto',
  contentStyle: 'professional',
  aiModel: 'claude-3-5-sonnet',
  temperature: 0.7,
};

const CONFIG_PROVIDER = 'community_manager';

const configSchema = z.object({
  autoPost: z.boolean(),
  postFrequency: z.enum(['daily', 'weekly', 'custom']),
  customDaysPerWeek: z.number().int().min(1).max(7),
  bestTimeToPost: z.string(),
  hashtagStrategy: z.enum(['auto', 'manual', 'mixed']),
  contentStyle: z.enum(['professional', 'casual', 'mixed']),
  aiModel: z.string(),
  temperature: z.number().min(0).max(1),
});

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  const prisma = await getPrisma();
  if (role && companyId) {
    return { role, companyId };
  }

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });

  return {
    role: role ?? user?.role ?? null,
    companyId: companyId ?? user?.companyId ?? null,
  };
};

const extractConfig = (settings: unknown) => {
  const settingsObject = toObjectRecord(settings);
  const storedConfig = settingsObject.config;
  const parsed = configSchema.safeParse(storedConfig);
  if (parsed.success) {
    return parsed.data;
  }
  return DEFAULT_CONFIG;
};

/**
 * GET /api/admin/community-manager/config
 * Obtiene la configuración del Community Manager
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!role || !['super_admin'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: CONFIG_PROVIDER } },
      select: { settings: true },
    });

    const config = extractConfig(integration?.settings);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Community Manager Config Error]:', { message });
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/community-manager/config
 * Actualizar la configuración del Community Manager
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!role || !['super_admin'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración es requerida' },
        { status: 400 }
      );
    }

    const parsed = configSchema.partial().parse(config);
    const nextConfig = { ...DEFAULT_CONFIG, ...parsed };

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: CONFIG_PROVIDER } },
      select: { credentials: true, settings: true },
    });

    const baseSettings = toObjectRecord(integration?.settings);
    const nextSettings = { ...baseSettings, config: nextConfig };
    const now = new Date();

    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: CONFIG_PROVIDER } },
      create: {
        companyId,
        provider: CONFIG_PROVIDER,
        name: 'Community Manager',
        category: 'community_manager',
        credentials: integration?.credentials ?? {},
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        createdBy: sessionUser.id,
        lastSyncAt: now,
      },
      update: {
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        lastSyncAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      config: nextConfig,
      message: 'Configuración guardada correctamente',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Community Manager Update Config Error]:', { message });
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
