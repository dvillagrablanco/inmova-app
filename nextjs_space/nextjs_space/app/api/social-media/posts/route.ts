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
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
