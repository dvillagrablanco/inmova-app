import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as socialService from '@/lib/services/coliving-social-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id: postId } = params;
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId requerido' },
        { status: 400 }
      );
    }

    const result = await socialService.likePost(postId, tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ liked: result.liked });
  } catch (error) {
    console.error('Error en POST /api/coliving/feed/[id]/like:', error);
    return NextResponse.json(
      { error: 'Error al dar like' },
      { status: 500 }
    );
  }
}
