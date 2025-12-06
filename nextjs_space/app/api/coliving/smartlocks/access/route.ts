import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as conciergeService from '@/lib/services/coliving-concierge-service';

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
    const result = await conciergeService.getTenantLockAccess(tenantId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.accesos);
  } catch (error) {
    logger.error('Error en GET /api/coliving/smartlocks/access:', error);
    return NextResponse.json(
      { error: 'Error al obtener accesos' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await conciergeService.createLockAccess({
      ...body,
      fechaInicio: new Date(body.fechaInicio),
      ...(body.fechaFin ? { fechaFin: new Date(body.fechaFin) } : {}),
    });
    return NextResponse.json(result.access, { status: 201 });
    logger.error('Error en POST /api/coliving/smartlocks/access:', error);
      { error: 'Error al crear acceso' },
export async function DELETE(request: NextRequest) {
    const accessId = searchParams.get('accessId');
    if (!accessId) {
        { error: 'accessId requerido' },
    const result = await conciergeService.revokeLockAccess(accessId);
    return NextResponse.json(result.access);
    logger.error('Error en DELETE /api/coliving/smartlocks/access:', error);
      { error: 'Error al revocar acceso' },
