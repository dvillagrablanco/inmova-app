import { NextRequest, NextResponse } from 'next/server';
import logger, { logError } from '@/lib/logger';
import { requireSession } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/portal-proveedor/dashboard - Dashboard del proveedor
export async function GET(req: NextRequest) {
  // Auth guard: requiere sesion autenticada
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;

  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID requerido' },
        { status: 400 }
      );
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Obtener estadísticas de órdenes de trabajo
    const ordenes = await prisma.providerWorkOrder.findMany({
      where: { providerId },
      include: {
        building: true,
        unit: true,
      },
    });

    // Calcular KPIs
    const totalOrdenes = ordenes.length;
    const ordenesPendientes = ordenes.filter(
      (o) => o.estado === 'asignada' || o.estado === 'aceptada'
    ).length;
    const ordenesEnProgreso = ordenes.filter(
      (o) => o.estado === 'en_progreso'
    ).length;
    const ordenesCompletadas = ordenes.filter(
      (o) => o.estado === 'completada'
    ).length;

    // Calcular ingresos totales
    const ingresosTotales = ordenes
      .filter((o) => o.estado === 'completada' && o.costoTotal)
      .reduce((sum, o) => sum + (o.costoTotal || 0), 0);

    // Calcular ingresos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ingresosMes = ordenes
      .filter(
        (o) =>
          o.estado === 'completada' &&
          o.fechaCompletado &&
          new Date(o.fechaCompletado) >= inicioMes &&
          o.costoTotal
      )
      .reduce((sum, o) => sum + (o.costoTotal || 0), 0);

    // Calcular rating promedio
    const ordenesConValoracion = ordenes.filter(
      (o) => o.valoracion !== null && o.valoracion > 0
    );
    const ratingPromedio =
      ordenesConValoracion.length > 0
        ? ordenesConValoracion.reduce(
            (sum, o) => sum + (o.valoracion || 0),
            0
          ) / ordenesConValoracion.length
        : 0;

    // Órdenes recientes (las últimas 10)
    const ordenesRecientes = ordenes
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      proveedor: {
        id: proveedor.id,
        nombre: proveedor.nombre,
        tipo: proveedor.tipo,
        email: proveedor.email,
        telefono: proveedor.telefono,
        rating: proveedor.rating,
      },
      kpis: {
        totalOrdenes,
        ordenesPendientes,
        ordenesEnProgreso,
        ordenesCompletadas,
        ingresosTotales,
        ingresosMes,
        ratingPromedio: Math.round(ratingPromedio * 10) / 10,
      },
      ordenesRecientes,
    });
  } catch (error) {
    logger.error('Error al obtener dashboard de proveedor:', error);
    return NextResponse.json(
      { error: 'Error al obtener dashboard' },
      { status: 500 }
    );
  }
}
