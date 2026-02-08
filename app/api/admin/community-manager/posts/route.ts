import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PLATFORM_MAP = {
  instagram: 'INSTAGRAM',
  facebook: 'FACEBOOK',
  linkedin: 'LINKEDIN',
  twitter: 'TWITTER',
} as const;

type PlatformInput = keyof typeof PLATFORM_MAP;
type SocialMediaPlatform = string;

const STATUS_MAP = {
  draft: 'borrador',
  scheduled: 'programado',
  published: 'publicado',
  failed: 'error',
} as const;

type PostStatusInput = keyof typeof STATUS_MAP;
type SocialPostStatus = (typeof STATUS_MAP)[PostStatusInput];

const STATUS_TO_UI: Record<SocialPostStatus, PostStatusInput> = {
  borrador: 'draft',
  programado: 'scheduled',
  publicado: 'published',
  error: 'failed',
};

const postSchema = z.object({
  content: z.string().min(1),
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin', 'twitter'])).min(1),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  scheduledDate: z.string().optional(),
  mediaUrl: z.string().url().optional(),
});

const isVideoUrl = (url: string): boolean => {
  const lowered = url.toLowerCase();
  return ['.mp4', '.mov', '.webm', '.mkv'].some((ext) => lowered.endsWith(ext));
};

const mapPostToResponse = (
  post: {
    id: string;
    estado: SocialPostStatus;
    mensaje: string;
    imagenesUrls: string[];
    videoUrl: string | null;
    fechaProgramada: Date | null;
    fechaPublicacion: Date | null;
    createdAt: Date;
    likes: number;
    comentarios: number;
    compartidos: number;
  },
  platform: string | null
) => {
  const platformValue = platform ? platform.toLowerCase() : 'unknown';
  const scheduledDate = post.fechaProgramada ?? post.fechaPublicacion ?? post.createdAt;
  const engagement =
    post.likes > 0 || post.comentarios > 0 || post.compartidos > 0
      ? {
          likes: post.likes,
          comments: post.comentarios,
          shares: post.compartidos,
        }
      : undefined;

  return {
    id: post.id,
    content: post.mensaje,
    platforms: [platformValue],
    scheduledDate: scheduledDate.toISOString(),
    status: STATUS_TO_UI[post.estado],
    type: 'post' as const,
    mediaUrl: post.videoUrl ?? post.imagenesUrls[0],
    engagement,
  };
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
 * GET /api/admin/community-manager/posts
 * Obtiene los posts programados/publicados
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

    const posts = await prisma.socialMediaPost.findMany({
      where: { companyId },
      include: {
        account: { select: { platform: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = posts.map((post) =>
      mapPostToResponse(post, post.account?.platform ?? null)
    );

    return NextResponse.json({
      success: true,
      posts: mapped,
      total: mapped.length,
      message:
        mapped.length > 0
          ? undefined
          : 'No hay publicaciones. Crea tu primera publicación.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Community Manager Posts Error]:', { message });
    return NextResponse.json(
      { error: 'Error al obtener publicaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/community-manager/posts
 * Crear una nueva publicación
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
    const { content, platforms, status, scheduledDate, mediaUrl } = postSchema.parse(body);
    const statusValue: PostStatusInput = status ?? 'scheduled';
    const scheduledAt = scheduledDate ? new Date(scheduledDate) : new Date();

    const requestedPlatforms = platforms.map((platform) => PLATFORM_MAP[platform]);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const accounts = await prisma.socialMediaAccount.findMany({
      where: {
        companyId,
        platform: { in: requestedPlatforms as SocialMediaPlatform[] },
        activo: true,
      },
    });

    const accountByPlatform = new Map<SocialMediaPlatform, typeof accounts[0]>();
    const accountPlatformById = new Map<string, SocialMediaPlatform>();
    accounts.forEach((account) => {
      accountByPlatform.set(account.platform, account);
      accountPlatformById.set(account.id, account.platform);
    });

    const missingPlatforms = requestedPlatforms.filter((platform) => !accountByPlatform.has(platform));
    if (missingPlatforms.length > 0) {
      return NextResponse.json(
        {
          error: 'Faltan cuentas conectadas para algunas plataformas',
          missingPlatforms: missingPlatforms.map((platform) => platform.toLowerCase()),
        },
        { status: 400 }
      );
    }

    const isVideo = mediaUrl ? isVideoUrl(mediaUrl) : false;
    const createData = accounts.map((account) => ({
      companyId,
      accountId: account.id,
      estado: STATUS_MAP[statusValue],
      mensaje: content,
      imagenesUrls: mediaUrl && !isVideo ? [mediaUrl] : [],
      videoUrl: mediaUrl && isVideo ? mediaUrl : undefined,
      fechaProgramada: statusValue === 'scheduled' ? scheduledAt : null,
      fechaPublicacion: statusValue === 'published' ? new Date() : null,
      creadoPor: sessionUser.id,
    }));

    const createdPosts = await prisma.$transaction(
      createData.map((data) => prisma.socialMediaPost.create({ data }))
    );

    const responsePosts = createdPosts.map((post) =>
      mapPostToResponse(post, accountPlatformById.get(post.accountId) ?? null)
    );

    return NextResponse.json({
      success: true,
      posts: responsePosts,
      message:
        statusValue === 'draft' ? 'Borrador guardado' : 'Publicación programada correctamente',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Community Manager Create Post Error]:', { message });
    return NextResponse.json(
      { error: 'Error al crear publicación' },
      { status: 500 }
    );
  }
}
