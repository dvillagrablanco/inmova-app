import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BLOG_PROVIDER = 'community_blog';

const blogPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  publishDate: z.string().optional(),
});

const storedBlogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  category: z.string(),
  status: z.enum(['draft', 'scheduled', 'published']),
  publishDate: z.string().nullable().optional(),
  views: z.number().int().nonnegative().optional(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
});

type StoredBlogPost = z.infer<typeof storedBlogPostSchema>;

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const extractBlogPosts = (settings: unknown): StoredBlogPost[] => {
  const settingsObject = toObjectRecord(settings);
  const postsValue = settingsObject.posts;

  if (!Array.isArray(postsValue)) {
    return [];
  }

  return postsValue
    .map((item) => storedBlogPostSchema.safeParse(item))
    .filter((result): result is z.SafeParseSuccess<StoredBlogPost> => result.success)
    .map((result) => result.data);
};

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
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
 * GET /api/admin/community-manager/blog
 * Obtiene los posts del blog
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
      where: { companyId_provider: { companyId, provider: BLOG_PROVIDER } },
      select: { settings: true },
    });

    const posts = extractBlogPosts(integration?.settings);

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
      message:
        posts.length > 0
          ? undefined
          : 'No hay artículos en el blog. Crea tu primer artículo.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Community Manager Blog Error]:', { message });
    return NextResponse.json(
      { error: 'Error al obtener artículos del blog' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/community-manager/blog
 * Crear un nuevo artículo del blog
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

    const body = await request.json();
    const { title, content, excerpt, category, status, publishDate } = blogPostSchema.parse(body);
    const statusValue = status ?? 'draft';
    const now = new Date();

    const newPost: StoredBlogPost = {
      id: crypto.randomUUID(),
      title,
      content,
      excerpt: excerpt ?? content.substring(0, 200),
      category: category ?? 'General',
      status: statusValue,
      publishDate:
        statusValue === 'published'
          ? now.toISOString()
          : publishDate ?? null,
      views: 0,
      createdAt: now.toISOString(),
      createdBy: sessionUser.id,
    };

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: BLOG_PROVIDER } },
      select: { id: true, credentials: true, settings: true },
    });

    const existingPosts = extractBlogPosts(integration?.settings);
    const updatedPosts = [...existingPosts, newPost];
    const baseSettings = toObjectRecord(integration?.settings);
    const nextSettings = { ...baseSettings, posts: updatedPosts };

    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: BLOG_PROVIDER } },
      create: {
        companyId,
        provider: BLOG_PROVIDER,
        name: 'Blog Community Manager',
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
      post: newPost,
      message: 'Artículo creado correctamente',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Community Manager Create Blog Post Error]:', { message });
    return NextResponse.json(
      { error: 'Error al crear artículo' },
      { status: 500 }
    );
  }
}
