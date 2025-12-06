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
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId requerido' },
        { status: 400 }
      );
    const result = await socialService.getColivingProfile(tenantId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.profile);
  } catch (error) {
    logger.error('Error en GET /api/coliving/profiles:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await socialService.createColivingProfile(body);
    return NextResponse.json(result.profile, { status: 201 });
    logger.error('Error en POST /api/coliving/profiles:', error);
      { error: 'Error al crear perfil' },
export async function PATCH(request: NextRequest) {
    const { profileId, ...updates } = await request.json();
    if (!profileId) {
        { error: 'profileId requerido' },
    const result = await socialService.updateColivingProfile(profileId, updates);
    logger.error('Error en PATCH /api/coliving/profiles:', error);
      { error: 'Error al actualizar perfil' },
