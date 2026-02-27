import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/investment/assets/[id]
 * P&L detallado por activo: rentabilidad neta desglosando
 * renta, IBI, comunidad, seguros, mantenimiento, hipoteca.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const assetId = params.id;

    // Obtener activo con relaciones
    const asset = await prisma.assetAcquisition.findFirst({
      where: { id: assetId, companyId },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ibiAnual: true,
            units: {
              select: {
                id: true,
                numero: true,
                tipo: true,
                estado: true,
                rentaMensual: true,
                superficieUtil: true,
                contracts: {
                  where: { estado: 'activo' },
                  select: {
                    id: true,
                    rentaMensual: true,
                    fechaInicio: true,
                    fechaFin: true,
                    tenant: {
                      select: { id: true, nombreCompleto: true },
                    },
                  },
                },
              },
            },
          },
        },
        unit: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            estado: true,
            rentaMensual: true,
            superficieUtil: true,
            contracts: {
              where: { estado: 'activo' },
              select: {
                id: true,
                rentaMensual: true,
                fechaInicio: true,
                fechaFin: true,
                tenant: {
                  select: { id: true, nombreCompleto: true },
                },
              },
            },
          },
        },
        mortgages: {
          where: { estado: 'activa' },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 });
    }

    // Calcular P&L
    const inversionTotal =
      asset.precioCompra +
      asset.gastosNotaria +
      asset.gastosRegistro +
      asset.gastosGestoria +
      asset.impuestoCompra +
      asset.otrosGastosCompra +
      (asset.reformasCapitalizadas || 0);

    // Ingresos: renta mensual de contratos activos
    let rentaMensual = 0;
    const unidades: any[] = [];

    if (asset.building?.units) {
      for (const unit of asset.building.units) {
        const contractRent = unit.contracts?.[0]?.rentaMensual || 0;
        const tenant = unit.contracts?.[0]?.tenant?.nombreCompleto || null;
        rentaMensual += contractRent;
        unidades.push({
          id: unit.id,
          numero: unit.numero,
          tipo: unit.tipo,
          estado: unit.estado,
          superficie: unit.superficieUtil,
          rentaMensual: contractRent,
          inquilino: tenant,
          ocupada: unit.estado === 'ocupada',
        });
      }
    } else if (asset.unit) {
      const contractRent = asset.unit.contracts?.[0]?.rentaMensual || 0;
      const tenant = asset.unit.contracts?.[0]?.tenant?.nombreCompleto || null;
      rentaMensual = contractRent;
      unidades.push({
        id: asset.unit.id,
        numero: asset.unit.numero,
        tipo: asset.unit.tipo,
        estado: asset.unit.estado,
        superficie: asset.unit.superficieUtil,
        rentaMensual: contractRent,
        inquilino: tenant,
        ocupada: asset.unit.estado === 'ocupada',
      });
    }

    const rentaAnual = rentaMensual * 12;

    // Gastos
    const ibiAnual = asset.building?.ibiAnual || 0;
    const hipotecaMensual = asset.mortgages?.reduce(
      (s: number, m: any) => s + (m.cuotaMensual || 0),
      0
    ) || 0;
    const hipotecaAnual = hipotecaMensual * 12;
    const capitalPendiente = asset.mortgages?.reduce(
      (s: number, m: any) => s + (m.capitalPendiente || 0),
      0
    ) || 0;

    // Gastos operativos (estimados: 15% de renta para comunidad, seguros, mantenimiento)
    const gastosOperativosEstimados = rentaAnual * 0.15;

    // Amortización (3% del valor catastral de construcción o 3% de precio compra)
    const baseAmortizacion =
      asset.valorCatastralConstruccion || asset.precioCompra * 0.7;
    const amortizacionAnual = baseAmortizacion * 0.03;

    // P&L
    const ingresoBrutoAnual = rentaAnual;
    const gastosDeduciblesAnuales =
      ibiAnual + gastosOperativosEstimados + amortizacionAnual;
    const noiAnual = ingresoBrutoAnual - gastosOperativosEstimados - ibiAnual;
    const cashFlowAnual = noiAnual - hipotecaAnual;
    const cashFlowMensual = cashFlowAnual / 12;

    // Yields
    const grossYield = inversionTotal > 0 ? (rentaAnual / inversionTotal) * 100 : 0;
    const netYield = inversionTotal > 0 ? (noiAnual / inversionTotal) * 100 : 0;
    const cashOnCash =
      inversionTotal - capitalPendiente > 0
        ? (cashFlowAnual / (inversionTotal - capitalPendiente)) * 100
        : 0;

    // Revalorización
    const valorMercado = asset.valorMercadoEstimado || asset.precioCompra;
    const plusvalia = valorMercado - asset.precioCompra;
    const plusvaliaPct = asset.precioCompra > 0 ? (plusvalia / asset.precioCompra) * 100 : 0;

    // Ocupación
    const totalUnidades = unidades.length;
    const ocupadas = unidades.filter((u) => u.ocupada).length;
    const ocupacion = totalUnidades > 0 ? (ocupadas / totalUnidades) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        asset: {
          id: asset.id,
          tipo: asset.assetType,
          fechaAdquisicion: asset.fechaAdquisicion,
          edificio: asset.building?.nombre || 'Sin edificio',
          direccion: asset.building?.direccion || '',
          referenciaCatastral: asset.referenciaCatastral,
        },
        inversion: {
          precioCompra: asset.precioCompra,
          gastosCompra:
            asset.gastosNotaria + asset.gastosRegistro + asset.gastosGestoria + asset.impuestoCompra,
          reformas: asset.reformasCapitalizadas || 0,
          total: inversionTotal,
        },
        ingresos: {
          rentaMensual,
          rentaAnual: ingresoBrutoAnual,
        },
        gastos: {
          ibiAnual,
          gastosOperativosEstimados,
          amortizacionAnual,
          hipotecaMensual,
          hipotecaAnual,
          capitalPendiente,
        },
        pyl: {
          noiAnual,
          cashFlowAnual,
          cashFlowMensual,
          grossYield: Math.round(grossYield * 100) / 100,
          netYield: Math.round(netYield * 100) / 100,
          cashOnCash: Math.round(cashOnCash * 100) / 100,
        },
        valoracion: {
          valorMercado,
          plusvalia,
          plusvaliaPct: Math.round(plusvaliaPct * 100) / 100,
        },
        ocupacion: {
          total: totalUnidades,
          ocupadas,
          porcentaje: Math.round(ocupacion * 100) / 100,
        },
        unidades,
      },
    });
  } catch (error: any) {
    logger.error('[Investment Asset Detail]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo detalle de activo' }, { status: 500 });
  }
}
