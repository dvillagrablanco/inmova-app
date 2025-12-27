import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as conciergeService from '@/lib/services/coliving-concierge-service';

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
    const { id: packageId } = params;
    const result = await conciergeService.markPackageAsCollected(packageId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.package);
  } catch (error) {
    logger.error('Error en POST /api/coliving/packages/[id]/collect:', error);
    return NextResponse.json(
      { error: 'Error al marcar paquete como recogido' },
      { status: 500 }
    );
  }
}
