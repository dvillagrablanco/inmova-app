import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/companies/bulk
 * Operaciones en lote sobre empresas (solo super_admin)
 * 
 * Body: {
 *   action: 'activate' | 'deactivate' | 'changePlan' | 'changeStatus',
 *   companyIds: string[],
 *   ...additionalParams
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const { action, companyIds, ...params } = await request.json();

    if (!action || !companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.company.updateMany({
          where: { id: { in: companyIds } },
          data: { activo: true },
        });
        break;

      case 'deactivate':
        result = await prisma.company.updateMany({
          where: { id: { in: companyIds } },
          data: { activo: false },
        });
        break;

      case 'changePlan':
        if (!params.subscriptionPlanId) {
          return NextResponse.json(
            { error: 'subscriptionPlanId es requerido para changePlan' },
            { status: 400 }
          );
        }
        result = await prisma.company.updateMany({
          where: { id: { in: companyIds } },
          data: { subscriptionPlanId: params.subscriptionPlanId },
        });
        break;

      case 'changeStatus':
        if (!params.estadoCliente) {
          return NextResponse.json(
            { error: 'estadoCliente es requerido para changeStatus' },
            { status: 400 }
          );
        }
        result = await prisma.company.updateMany({
          where: { id: { in: companyIds } },
          data: { estadoCliente: params.estadoCliente },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id || '',
        action: 'UPDATE',
        entityType: 'Company',
        entityId: 'bulk',
        entityName: `Bulk operation on ${result.count} companies`,
        changes: JSON.stringify({
          action: `BULK_${action.toUpperCase()}`,
          companyIds,
          params,
          affectedCount: result.count,
        }),
        companyId: session.user.companyId || companyIds[0],
      },
    });

    return NextResponse.json({
      success: true,
      affectedCount: result.count,
      action,
      message: `${result.count} empresa(s) actualizada(s)`,
    });
  } catch (error) {
    console.error('Error en operación en lote:', error);
    return NextResponse.json(
      { error: 'Error al ejecutar operación en lote' },
      { status: 500 }
    );
  }
}
