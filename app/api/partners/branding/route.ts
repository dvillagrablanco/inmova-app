export const dynamic = 'force-dynamic';

/**
 * API: Obtener branding de partner
 * GET /api/partners/branding?code=CODIGO
 */

import { NextRequest, NextResponse } from 'next/server';
import { PartnerService } from '@/lib/services/partner-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Código de partner requerido' },
        { status: 400 }
      );
    }

    const branding = await PartnerService.getPartnerBranding(code);

    if (!branding) {
      return NextResponse.json(
        { error: 'Partner no encontrado o inactivo' },
        { status: 404 }
      );
    }

    return NextResponse.json({ branding });
  } catch (error) {
    console.error('Error en API de branding de partner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
