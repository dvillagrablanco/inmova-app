import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission, forbiddenResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PropertyReport {
  id: string;
  nombre: string;
  direccion: string;
  ingresosBrutos: number;
  gastos: number;
  ingresosNetos: number;
  rentabilidadBruta: number;
  rentabilidadNeta: number;
  roi: number;
  unidades: number;
  unidadesOcupadas: number;
  tasaOcupacion: number;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    
    // Verificar permiso de visualización de reportes
    if (user.role === 'operador') {
      return forbiddenResponse('No tienes permiso para ver reportes financieros');
    }
    
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'global'; // global, por_propiedad, flujo_caja
    const periodo = searchParams.get('periodo') || '12'; // meses

    const meses = parseInt(periodo);
    const now = new Date();
    const fechaInicio = new Date(now);
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);

    if (tipo === 'por_propiedad') {
      // Optimización: Usar agregaciones SQL nativas
      const reportes: PropertyReport[] = await prisma.$queryRaw`
        WITH building_stats AS (
          SELECT 
            b.id,
            b.nombre,
            b.direccion,
            COUNT(DISTINCT u.id) as total_units,
            COUNT(DISTINCT CASE WHEN u.estado = 'ocupada' THEN u.id END) as occupied_units
          FROM "Building" b
          LEFT JOIN "Unit" u ON u."buildingId" = b.id
          WHERE b."companyId" = ${companyId}
          GROUP BY b.id, b.nombre, b.direccion
        ),
        building_income AS (
          SELECT 
            b.id as building_id,
            COALESCE(SUM(p.monto), 0) as total_income
          FROM "Building" b
          LEFT JOIN "Unit" u ON u."buildingId" = b.id
          LEFT JOIN "Contract" c ON c."unitId" = u.id
          LEFT JOIN "Payment" p ON p."contractId" = c.id
          WHERE b."companyId" = ${companyId}
            AND p.estado = 'pagado'
            AND p."fechaVencimiento" >= ${fechaInicio}
          GROUP BY b.id
        ),
        building_expenses AS (
          SELECT 
            b.id as building_id,
            COALESCE(SUM(e.monto), 0) as total_expenses
          FROM "Building" b
          LEFT JOIN "Expense" e ON e."buildingId" = b.id
          WHERE b."companyId" = ${companyId}
            AND e.fecha >= ${fechaInicio}
          GROUP BY b.id
        )
        SELECT 
          bs.id,
          bs.nombre,
          bs.direccion,
          COALESCE(bi.total_income, 0)::float as "ingresosBrutos",
          COALESCE(be.total_expenses, 0)::float as gastos,
          (COALESCE(bi.total_income, 0) - COALESCE(be.total_expenses, 0))::float as "ingresosNetos",
          bs.total_units::int as unidades,
          bs.occupied_units::int as "unidadesOcupadas",
          CASE 
            WHEN bs.total_units > 0 THEN (bs.occupied_units::float / bs.total_units::float * 100)
            ELSE 0 
          END::float as "tasaOcupacion"
        FROM building_stats bs
        LEFT JOIN building_income bi ON bi.building_id = bs.id
        LEFT JOIN building_expenses be ON be.building_id = bs.id
        ORDER BY bs.nombre
      `;

      // Calcular métricas adicionales
      const reportesConMetricas = reportes.map((r: any) => {
        const rentabilidadBruta = r.ingresosBrutos > 0 
          ? (r.ingresosBrutos / (r.ingresosBrutos + r.gastos)) * 100 
          : 0;
        const rentabilidadNeta = r.ingresosBrutos > 0 
          ? (r.ingresosNetos / r.ingresosBrutos) * 100 
          : 0;
        const roi = r.gastos > 0 ? (r.ingresosNetos / r.gastos) * 100 : 0;

        return {
          ...r,
          ingresosBrutos: Math.round(r.ingresosBrutos * 100) / 100,
          gastos: Math.round(r.gastos * 100) / 100,
          ingresosNetos: Math.round(r.ingresosNetos * 100) / 100,
          rentabilidadBruta: Math.round(rentabilidadBruta * 10) / 10,
          rentabilidadNeta: Math.round(rentabilidadNeta * 10) / 10,
          roi: Math.round(roi * 10) / 10,
          tasaOcupacion: Math.round(r.tasaOcupacion * 10) / 10,
        };
      });

      return NextResponse.json({ reportes: reportesConMetricas, periodo: meses });
    }

    if (tipo === 'flujo_caja') {
      // Optimización: Usar agregación SQL para flujo de caja
      const flujoCajaData: any[] = await prisma.$queryRaw`
        WITH RECURSIVE months AS (
          SELECT 
            DATE_TRUNC('month', ${fechaInicio}::timestamp) as month_start,
            DATE_TRUNC('month', ${fechaInicio}::timestamp) + INTERVAL '1 month' - INTERVAL '1 day' as month_end
          UNION ALL
          SELECT 
            month_start + INTERVAL '1 month',
            month_end + INTERVAL '1 month'
          FROM months
          WHERE month_start < ${now}
        ),
        monthly_income AS (
          SELECT 
            DATE_TRUNC('month', p."fechaVencimiento") as month,
            SUM(p.monto) as income
          FROM "Payment" p
          JOIN "Contract" c ON c.id = p."contractId"
          JOIN "Unit" u ON u.id = c."unitId"
          JOIN "Building" b ON b.id = u."buildingId"
          WHERE b."companyId" = ${companyId}
            AND p.estado = 'pagado'
            AND p."fechaVencimiento" >= ${fechaInicio}
            AND p."fechaVencimiento" <= ${now}
          GROUP BY DATE_TRUNC('month', p."fechaVencimiento")
        ),
        monthly_expenses AS (
          SELECT 
            DATE_TRUNC('month', e.fecha) as month,
            SUM(e.monto) as expenses
          FROM "Expense" e
          JOIN "Building" b ON b.id = e."buildingId"
          WHERE b."companyId" = ${companyId}
            AND e.fecha >= ${fechaInicio}
            AND e.fecha <= ${now}
          GROUP BY DATE_TRUNC('month', e.fecha)
        )
        SELECT 
          m.month_start,
          COALESCE(i.income, 0)::float as ingresos,
          COALESCE(e.expenses, 0)::float as gastos
        FROM months m
        LEFT JOIN monthly_income i ON i.month = m.month_start
        LEFT JOIN monthly_expenses e ON e.month = m.month_start
        ORDER BY m.month_start
      `;

      const flujoCaja = flujoCajaData.map((item: any) => ({
        mes: new Date(item.month_start).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        ingresos: Math.round(item.ingresos * 100) / 100,
        gastos: Math.round(item.gastos * 100) / 100,
        neto: Math.round((item.ingresos - item.gastos) * 100) / 100,
      }));

      return NextResponse.json({ flujoCaja, periodo: meses });
    }

    // Reporte global (por defecto) - Optimizado con agregaciones SQL
    const globalStats: any = await prisma.$queryRaw`
      WITH company_income AS (
        SELECT COALESCE(SUM(p.monto), 0) as total_income
        FROM "Payment" p
        JOIN "Contract" c ON c.id = p."contractId"
        JOIN "Unit" u ON u.id = c."unitId"
        JOIN "Building" b ON b.id = u."buildingId"
        WHERE b."companyId" = ${companyId}
          AND p.estado = 'pagado'
          AND p."fechaVencimiento" >= ${fechaInicio}
      ),
      company_expenses AS (
        SELECT COALESCE(SUM(e.monto), 0) as total_expenses
        FROM "Expense" e
        JOIN "Building" b ON b.id = e."buildingId"
        WHERE b."companyId" = ${companyId}
          AND e.fecha >= ${fechaInicio}
      ),
      company_units AS (
        SELECT 
          COUNT(*) as total_units,
          COUNT(CASE WHEN u.estado = 'ocupada' THEN 1 END) as occupied_units
        FROM "Unit" u
        JOIN "Building" b ON b.id = u."buildingId"
        WHERE b."companyId" = ${companyId}
      )
      SELECT 
        ci.total_income::float as "ingresosBrutos",
        ce.total_expenses::float as gastos,
        cu.total_units::int as unidades,
        cu.occupied_units::int as "unidadesOcupadas"
      FROM company_income ci, company_expenses ce, company_units cu
    `;

    const stats = globalStats[0] || {
      ingresosBrutos: 0,
      gastos: 0,
      unidades: 0,
      unidadesOcupadas: 0,
    };
    const ingresosNetos = stats.ingresosBrutos - stats.gastos;
    const rentabilidadBruta = stats.ingresosBrutos > 0 
      ? (stats.ingresosBrutos / (stats.ingresosBrutos + stats.gastos)) * 100 
      : 0;
    const rentabilidadNeta = stats.ingresosBrutos > 0 
      ? (ingresosNetos / stats.ingresosBrutos) * 100 
      : 0;
    const roi = stats.gastos > 0 ? (ingresosNetos / stats.gastos) * 100 : 0;
    const tasaOcupacion = stats.unidades > 0 
      ? (stats.unidadesOcupadas / stats.unidades) * 100 
      : 0;

    return NextResponse.json({
      global: {
        ingresosBrutos: Math.round(stats.ingresosBrutos * 100) / 100,
        gastos: Math.round(stats.gastos * 100) / 100,
        ingresosNetos: Math.round(ingresosNetos * 100) / 100,
        rentabilidadBruta: Math.round(rentabilidadBruta * 10) / 10,
        rentabilidadNeta: Math.round(rentabilidadNeta * 10) / 10,
        roi: Math.round(roi * 10) / 10,
        unidades: stats.unidades,
        unidadesOcupadas: stats.unidadesOcupadas,
        tasaOcupacion: Math.round(tasaOcupacion * 10) / 10,
      },
      periodo: meses,
    });
  } catch (error: any) {
    logger.error('Error al generar reportes:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 });
  }
}
