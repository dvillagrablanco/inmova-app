import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as socialService from '@/lib/services/coliving-social-service';

export const dynamic = 'force-dynamic';
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
    const { tenantId, comentario } = await request.json();
    if (!tenantId || !comentario) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    const result = await socialService.addComment(postId, tenantId, comentario);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.post);
  } catch (error) {
    logger.error('Error en POST /api/coliving/feed/[id]/comment:', error);
    return NextResponse.json(
      { error: 'Error al añadir comentario' },
      { status: 500 }
    );
  }
}
