import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  activateModuleForCompany, 
  deactivateModuleForCompany 
} from '@/lib/modules-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'administrador' && userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo los administradores y superadministradores pueden modificar módulos' },
        { status: 403 }
      );
    }

    const { moduloCodigo, activo } = await req.json();
    const companyId = (session.user as any).companyId;
    const userId = session.user.id;

    if (!moduloCodigo) {
      return NextResponse.json(
        { error: 'Código de módulo requerido' },
        { status: 400 }
      );
    }

    // Verificar que el módulo esté incluido en el plan de suscripción si se quiere activar
    if (activo) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          subscriptionPlan: true,
        },
      });

      if (!company) {
        return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
      }

      if (company.subscriptionPlan) {
        const modulosIncluidos = (company.subscriptionPlan.modulosIncluidos as string[]) || [];
        if (!modulosIncluidos.includes(moduloCodigo)) {
          return NextResponse.json(
            {
              error: 'Módulo no incluido en el plan',
              message: `El módulo "${moduloCodigo}" no está incluido en tu plan de suscripción actual (${company.subscriptionPlan.nombre}). Actualiza tu plan para acceder a este módulo.`,
              upgradeRequired: true,
              currentPlan: company.subscriptionPlan.nombre,
            },
            { status: 403 }
          );
        }
      }

      await activateModuleForCompany(companyId, moduloCodigo, userId);
    } else {
      await deactivateModuleForCompany(companyId, moduloCodigo);
    }

    return NextResponse.json({
      success: true,
      message: activo ? 'Módulo activado' : 'Módulo desactivado'
    });
  } catch (error: any) {
    logger.error('Error al modificar módulo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al modificar módulo' },
      { status: 500 }
    );
  }
}
