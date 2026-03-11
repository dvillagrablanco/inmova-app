import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sidebar/counts
 * Retorna contadores reales para badges en el sidebar.
 * Consulta la BD para pagos pendientes, incidencias abiertas, etc.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any)?.companyId;
    if (!companyId) {
      return NextResponse.json({
        pagos_pendientes: 0,
        incidencias_abiertas: 0,
        contratos_por_vencer: 0,
        candidatos_nuevos: 0,
      });
    }

    let pagos_pendientes = 0;
    let incidencias_abiertas = 0;
    let contratos_por_vencer = 0;
    let candidatos_nuevos = 0;

    try {
      const { getPrismaClient } = await import('@/lib/db');
      const prisma = getPrismaClient();

      // Pagos pendientes: estado != 'pagado'
      pagos_pendientes = await prisma.payment.count({
        where: {
          contract: { unit: { building: { companyId } } },
          estado: { not: 'pagado' },
        },
      });

      // Incidencias abiertas: estado in (pendiente, en_proceso, abierta)
      incidencias_abiertas = await prisma.maintenanceRequest.count({
        where: {
          unit: { building: { companyId } },
          estado: { in: ['pendiente', 'en_progreso', 'programado'] },
        },
      });

      // Contratos que vencen en próximos 30 días
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      contratos_por_vencer = await prisma.contract.count({
        where: {
          unit: { building: { companyId } },
          estado: 'activo',
          fechaFin: { lte: in30Days, gte: new Date() },
        },
      });

      // Candidatos nuevos: estado = 'nuevo' o 'en_revision'
      candidatos_nuevos = await prisma.candidate.count({
        where: {
          unit: { building: { companyId } },
          estado: { in: ['nuevo', 'en_revision'] },
        },
      });
    } catch (dbError) {
      // Si la BD no tiene los modelos/datos, devolver 0s
      console.warn('[Sidebar Counts] DB query failed, returning zeros:', dbError);
    }

    return NextResponse.json({
      pagos_pendientes,
      incidencias_abiertas,
      contratos_por_vencer,
      candidatos_nuevos,
    });
  } catch (error) {
    console.error('[Sidebar Counts API] Error:', error);
    return NextResponse.json({
      pagos_pendientes: 0,
      incidencias_abiertas: 0,
      contratos_por_vencer: 0,
      candidatos_nuevos: 0,
    });
  }
}
