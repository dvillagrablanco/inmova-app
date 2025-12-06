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
    const buildingId = searchParams.get('buildingId');
    if (!tenantId && !buildingId) {
      return NextResponse.json(
        { error: 'tenantId o buildingId requerido' },
        { status: 400 }
      );
    let result;
    if (tenantId) {
      result = await conciergeService.getPendingPackages(tenantId);
    } else if (buildingId) {
      result = await conciergeService.getBuildingPackages(buildingId);
    if (!result || !result.success) {
        { error: result?.error || 'Error al obtener paquetes' },
    return NextResponse.json(result.packages);
  } catch (error) {
    logger.error('Error en GET /api/coliving/packages:', error);
    return NextResponse.json(
      { error: 'Error al obtener paquetes' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await conciergeService.registerPackage(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.package, { status: 201 });
    logger.error('Error en POST /api/coliving/packages:', error);
      { error: 'Error al registrar paquete' },
