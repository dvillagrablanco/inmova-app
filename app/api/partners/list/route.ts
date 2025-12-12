export const dynamic = 'force-dynamic';

/**
 * API: Listar partners activos
 * GET /api/partners/list
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PartnerService } from '@/lib/services/partner-service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const partners = await PartnerService.listActivePartners();

    return NextResponse.json({ partners });
  } catch (error) {
    console.error('Error al listar partners:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}