import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as socialService from '@/lib/services/coliving-social-service';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const buildingId = searchParams.get('buildingId') || undefined;
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId requerido' },
        { status: 400 }
      );
    const result = await socialService.getFeed(companyId, buildingId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.posts);
  } catch (error) {
    logger.error('Error en GET /api/coliving/feed:', error);
    return NextResponse.json(
      { error: 'Error al obtener feed' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await socialService.createActivityPost(body);
    return NextResponse.json(result.post, { status: 201 });
    logger.error('Error en POST /api/coliving/feed:', error);
      { error: 'Error al crear publicación' },
