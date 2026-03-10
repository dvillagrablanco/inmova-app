/**
 * API Route: Datos de Idealista Data Platform
 * GET /api/valuations/idealista-data?city=Madrid&postalCode=28001
 *
 * Obtiene datos profesionales de mercado desde Idealista Data Platform.
 * Requiere sesión activa y credenciales de Idealista Data configuradas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const postalCode = searchParams.get('postalCode') || undefined;

    if (!city) {
      return NextResponse.json({ error: 'Parámetro city requerido' }, { status: 400 });
    }

    const { getIdealistaDataReport, isIdealistaDataConfigured } =
      await import('@/lib/idealista-data-service');

    if (!isIdealistaDataConfigured()) {
      return NextResponse.json(
        {
          error: 'Idealista Data no configurado',
          message:
            'Configura IDEALISTA_DATA_EMAIL y IDEALISTA_DATA_PASSWORD en las variables de entorno.',
          configured: false,
        },
        { status: 503 }
      );
    }

    const report = await getIdealistaDataReport(city, postalCode);

    if (!report) {
      return NextResponse.json({
        success: false,
        message: `No se encontraron datos de Idealista Data para ${city}${postalCode ? ` (CP: ${postalCode})` : ''}`,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
      source: 'idealista_data_platform',
      message: `Datos obtenidos de Idealista Data Platform para ${city}`,
    });
  } catch (error: any) {
    logger.error('[API IdealistaData] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos de Idealista Data', message: error.message },
      { status: 500 }
    );
  }
}
