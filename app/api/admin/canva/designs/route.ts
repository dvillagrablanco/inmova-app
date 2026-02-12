import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const designSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  dimensions: z.string(),
  status: z.enum(['draft', 'published']),
  thumbnail: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  templateId: z.string().optional(),
  createdBy: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().optional(),
  category: z.string().optional(),
  dimensions: z.string().optional(),
});

type CanvaDesign = z.infer<typeof designSchema>;

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const extractDesigns = (settings: unknown): CanvaDesign[] => {
  const settingsObject = toObjectRecord(settings);
  const designsValue = settingsObject.designs;

  if (!Array.isArray(designsValue)) {
    return [];
  }

  return designsValue
    .map((item) => designSchema.safeParse(item))
    .filter((result): result is z.SafeParseSuccess<CanvaDesign> => result.success)
    .map((result) => result.data);
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

/**
 * GET /api/admin/canva/designs
 * Obtiene los diseños del usuario
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

    if (!role || !['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      select: { settings: true },
    });

    const designs = extractDesigns(integration?.settings);

    return NextResponse.json({
      success: true,
      designs,
      total: designs.length,
      message:
        designs.length > 0
          ? undefined
          : 'No hay diseños creados. Usa las plantillas para crear tu primer diseño.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Canva Designs Error]:', { message });
    return NextResponse.json(
      { error: 'Error al obtener diseños' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/canva/designs
 * Crear un nuevo diseño
 */
export async function POST(request: NextRequest) {
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

    if (!role || !['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const body = createSchema.parse(await request.json());
    const { name, templateId, category, dimensions } = body;

    const now = new Date();
    const newDesign: CanvaDesign = {
      id: crypto.randomUUID(),
      name,
      templateId,
      category: category ?? 'custom',
      dimensions: dimensions ?? '1080x1080',
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: sessionUser.id,
    };

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      select: { credentials: true, settings: true },
    });

    const existingDesigns = extractDesigns(integration?.settings);
    const nextDesigns = [...existingDesigns, newDesign];
    const baseSettings = toObjectRecord(integration?.settings);
    const nextSettings = { ...baseSettings, designs: nextDesigns };

    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      create: {
        companyId,
        provider: 'canva',
        name: 'Canva',
        category: 'design',
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
      design: newDesign,
      message: 'Diseño creado correctamente',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Canva Create Design Error]:', { message });
    return NextResponse.json(
      { error: 'Error al crear diseño' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/canva/designs
 * Eliminar un diseño
 */
export async function DELETE(request: NextRequest) {
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

    if (!role || !['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('id');

    if (!designId) {
      return NextResponse.json(
        { error: 'ID de diseño es requerido' },
        { status: 400 }
      );
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      select: { settings: true },
    });

    const existingDesigns = extractDesigns(integration?.settings);
    const nextDesigns = existingDesigns.filter((design) => design.id !== designId);

    if (existingDesigns.length === nextDesigns.length) {
      return NextResponse.json(
        { error: 'Diseño no encontrado' },
        { status: 404 }
      );
    }

    const baseSettings = toObjectRecord(integration?.settings);
    const nextSettings = { ...baseSettings, designs: nextDesigns };

    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      create: {
        companyId,
        provider: 'canva',
        name: 'Canva',
        category: 'design',
        credentials: {},
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        createdBy: sessionUser.id,
        lastSyncAt: new Date(),
      },
      update: {
        settings: nextSettings,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Diseño eliminado correctamente',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Canva Delete Design Error]:', { message });
    return NextResponse.json(
      { error: 'Error al eliminar diseño' },
      { status: 500 }
    );
  }
}
