import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  activateModuleForCompany,
  deactivateModuleForCompany,
} from '@/lib/modules-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/modules/toggle-batch
 * Activa o desactiva múltiples módulos de una vez.
 * Body: { modules: string[], activo: boolean, companyId?: string }
 */
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
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

    const { modules, activo, companyId: bodyCompanyId } = await req.json();

    if (!Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de códigos de módulos' },
        { status: 400 }
      );
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = bodyCompanyId || cookieCompanyId || (session.user as any).companyId;
    const userId = session.user.id;

    if (!companyId) {
      return NextResponse.json(
        { error: 'No se pudo determinar la empresa' },
        { status: 400 }
      );
    }

    // Verificar plan de suscripción si se quieren activar
    let blockedModules: string[] = [];
    if (activo) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { subscriptionPlan: true },
      });

      if (!company) {
        return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
      }

      if (company.subscriptionPlan) {
        const planTier = company.subscriptionPlan.tier?.toLowerCase();
        const modulosIncluidos = (company.subscriptionPlan.modulosIncluidos as string[]) || [];
        const tieneAccesoTotal =
          ['empresarial', 'enterprise', 'premium', 'personalizado', 'business'].includes(planTier) ||
          modulosIncluidos.includes('*');

        if (!tieneAccesoTotal) {
          blockedModules = modules.filter(
            (m: string) => !modulosIncluidos.includes(m)
          );
        }
      }
    }

    // Filtrar módulos que se pueden procesar
    const processableModules = modules.filter(
      (m: string) => !blockedModules.includes(m)
    );

    // Procesar cada módulo
    const toggled: string[] = [];
    const errors: string[] = [];

    for (const moduloCodigo of processableModules) {
      try {
        if (activo) {
          await activateModuleForCompany(companyId, moduloCodigo, userId);
        } else {
          await deactivateModuleForCompany(companyId, moduloCodigo);
        }
        toggled.push(moduloCodigo);
      } catch (error: any) {
        logger.error(`Error toggling module ${moduloCodigo}:`, error);
        errors.push(moduloCodigo);
      }
    }

    return NextResponse.json({
      success: true,
      toggled,
      blocked: blockedModules,
      errors,
      message: activo
        ? `${toggled.length} módulos activados`
        : `${toggled.length} módulos desactivados`,
    });
  } catch (error: any) {
    logger.error('Error en toggle-batch de módulos:', error);
    return NextResponse.json(
      { error: error.message || 'Error al modificar módulos' },
      { status: 500 }
    );
  }
}
