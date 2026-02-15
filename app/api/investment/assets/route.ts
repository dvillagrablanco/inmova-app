import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createAssetSchema = z.object({
  buildingId: z.string().optional(),
  unitId: z.string().optional(),
  assetType: z.enum(['vivienda', 'local_comercial', 'oficina', 'garaje', 'trastero', 'nave_industrial', 'solar', 'otro']),
  fechaAdquisicion: z.string().datetime(),
  precioCompra: z.number().positive(),
  gastosNotaria: z.number().min(0).default(0),
  gastosRegistro: z.number().min(0).default(0),
  gastosGestoria: z.number().min(0).default(0),
  impuestoCompra: z.number().min(0).default(0),
  otrosGastosCompra: z.number().min(0).default(0),
  valorCatastralTotal: z.number().min(0).optional(),
  valorCatastralSuelo: z.number().min(0).optional(),
  valorCatastralConstruccion: z.number().min(0).optional(),
  referenciaCatastral: z.string().optional(),
  valorMercadoEstimado: z.number().min(0).optional(),
  reformasCapitalizadas: z.number().min(0).default(0),
  notas: z.string().optional(),
});

/**
 * GET /api/investment/assets - Lista activos de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const assets = await prisma.assetAcquisition.findMany({
      where: { companyId: session.user.companyId },
      include: {
        building: { select: { id: true, nombre: true, direccion: true } },
        unit: { select: { id: true, numero: true, tipo: true } },
        mortgages: { where: { estado: 'activa' }, select: { id: true, capitalPendiente: true, cuotaMensual: true } },
      },
      orderBy: { fechaAdquisicion: 'desc' },
    });

    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    logger.error('[Investment Assets GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo activos' }, { status: 500 });
  }
}

/**
 * POST /api/investment/assets - Registrar nuevo activo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createAssetSchema.parse(body);

    const inversionTotal = validated.precioCompra
      + validated.gastosNotaria
      + validated.gastosRegistro
      + validated.gastosGestoria
      + validated.impuestoCompra
      + validated.otrosGastosCompra
      + validated.reformasCapitalizadas;

    const prisma = getPrismaClient();
    const asset = await prisma.assetAcquisition.create({
      data: {
        companyId: session.user.companyId,
        ...validated,
        fechaAdquisicion: new Date(validated.fechaAdquisicion),
        inversionTotal,
        valorContableNeto: inversionTotal,
      },
    });

    // Generar tabla de amortizacion
    const { generateDepreciationTable } = await import('@/lib/investment-service');
    await generateDepreciationTable(asset.id).catch(err => {
      logger.warn('[Asset] Depreciation table generation failed:', err);
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Investment Assets POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando activo' }, { status: 500 });
  }
}
