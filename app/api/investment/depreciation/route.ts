import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/depreciation?assetId=xxx
 * Tabla de amortizacion de un activo.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    const prisma = getPrismaClient();

    if (assetId) {
      // Tabla de un activo especifico
      const asset = await prisma.assetAcquisition.findFirst({
        where: { id: assetId, companyId: session.user.companyId },
      });
      if (!asset) {
        return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 });
      }

      const entries = await prisma.depreciationEntry.findMany({
        where: { assetId },
        orderBy: { ano: 'asc' },
      });

      return NextResponse.json({ success: true, data: { asset, entries } });
    }

    // Resumen de amortizaciones de todos los activos
    const assets = await prisma.assetAcquisition.findMany({
      where: { companyId: session.user.companyId },
      select: {
        id: true,
        assetType: true,
        precioCompra: true,
        amortizacionAcumulada: true,
        valorContableNeto: true,
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
      },
    });

    const totalAmortizacionAcumulada = assets.reduce((s, a) => s + a.amortizacionAcumulada, 0);
    const totalValorContable = assets.reduce((s, a) => s + (a.valorContableNeto || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        assets,
        summary: {
          totalAssets: assets.length,
          totalAmortizacionAcumulada: Math.round(totalAmortizacionAcumulada * 100) / 100,
          totalValorContable: Math.round(totalValorContable * 100) / 100,
        },
      },
    });
  } catch (error: any) {
    logger.error('[Depreciation API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo amortizaciones' }, { status: 500 });
  }
}

/**
 * POST /api/investment/depreciation?assetId=xxx
 * Regenerar tabla de amortizacion de un activo.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    if (!assetId) {
      return NextResponse.json({ error: 'assetId requerido' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const asset = await prisma.assetAcquisition.findFirst({
      where: { id: assetId, companyId: session.user.companyId },
    });
    if (!asset) {
      return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 });
    }

    const { generateDepreciationTable } = await import('@/lib/investment-service');
    await generateDepreciationTable(assetId);

    return NextResponse.json({ success: true, message: 'Tabla de amortizacion regenerada' });
  } catch (error: any) {
    logger.error('[Depreciation POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error regenerando amortizacion' }, { status: 500 });
  }
}
