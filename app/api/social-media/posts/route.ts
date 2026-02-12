import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getCompanyPosts,
  publishToSocialMedia,
  getSocialMediaStats,
} from '@/lib/social-media-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const statsParam = searchParams.get('stats');

    if (type === 'stats' || statsParam === 'true') {
      const stats = await getSocialMediaStats(session.user.companyId);
      return NextResponse.json(stats);
    }

    const accountId = searchParams.get('accountId') || undefined;
    const estado = searchParams.get('estado') as any | undefined;

    const posts = await getCompanyPosts(session.user.companyId, {
      accountId,
      estado,
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, content, programar, scheduledFor } = body;

    const scheduleDate = scheduledFor || programar;

    const result = await publishToSocialMedia(
      accountId,
      content,
      session.user.id,
      scheduleDate ? new Date(scheduleDate) : undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al publicar' },
      { status: 500 }
    );
  }
}
