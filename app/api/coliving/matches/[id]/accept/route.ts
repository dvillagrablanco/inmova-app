import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as socialService from '@/lib/services/coliving-social-service';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = params;
    const result = await socialService.acceptMatch(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.match);
  } catch (error) {
    logger.error('Error en POST /api/coliving/matches/[id]/accept:', error);
    return NextResponse.json({ error: 'Error al aceptar match' }, { status: 500 });
  }
}
