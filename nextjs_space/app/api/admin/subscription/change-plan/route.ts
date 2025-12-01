import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Only super admins can change plans
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { companyId, newPlanId } = body;

    if (!companyId || !newPlanId) {
      return NextResponse.json(
        { error: 'companyId y newPlanId son requeridos' },
        { status: 400 }
      );
    }

    // Get company current plan
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptionPlan: true,
        modules: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Get new plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan || !newPlan.activo) {
      return NextResponse.json(
        { error: 'Plan de suscripción no encontrado o inactivo' },
        { status: 404 }
      );
    }

    const oldPlan = company.subscriptionPlan;
    const isUpgrade = newPlan.precioMensual > (oldPlan?.precioMensual || 0);
    const isDowngrade = newPlan.precioMensual < (oldPlan?.precioMensual || 0);

    // Update company subscription plan
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionPlanId: newPlanId,
        updatedAt: new Date(),
      },
      include: {
        subscriptionPlan: true,
      },
    });

    // Get modules from new plan
    const newPlanModules = (newPlan.modulosIncluidos as string[]) || [];

    // Deactivate modules not included in new plan
    const currentModuleCodes = company.modules.map((m) => m.moduloCodigo);
    const modulesToDeactivate = currentModuleCodes.filter(
      (code) => !newPlanModules.includes(code)
    );

    // Activate modules included in new plan that are not currently active
    const modulesToActivate = newPlanModules.filter(
      (code) => !currentModuleCodes.includes(code)
    );

    // Update modules
    if (modulesToDeactivate.length > 0) {
      await prisma.companyModule.deleteMany({
        where: {
          companyId,
          moduloCodigo: { in: modulesToDeactivate },
        },
      });
    }

    if (modulesToActivate.length > 0) {
      await prisma.companyModule.createMany({
        data: modulesToActivate.map((codigo) => ({
          companyId,
          moduloCodigo: codigo,
          activo: true,
        })),
      });
    }

    // Log audit
    await auditLog({
      userId: session.user.id,
      companyId,
      action: isUpgrade ? 'PLAN_UPGRADE' : isDowngrade ? 'PLAN_DOWNGRADE' : 'PLAN_CHANGE',
      entityType: 'subscription',
      entityId: updatedCompany.id,
      details: {
        oldPlan: oldPlan?.nombre || 'Sin plan',
        newPlan: newPlan.nombre,
        oldPrice: oldPlan?.precioMensual || 0,
        newPrice: newPlan.precioMensual,
        modulesActivated: modulesToActivate,
        modulesDeactivated: modulesToDeactivate,
      },
    });

    return NextResponse.json({
      message: isUpgrade
        ? 'Plan actualizado exitosamente (upgrade)'
        : isDowngrade
        ? 'Plan actualizado exitosamente (downgrade)'
        : 'Plan cambiado exitosamente',
      company: updatedCompany,
      changes: {
        isUpgrade,
        isDowngrade,
        modulesActivated: modulesToActivate,
        modulesDeactivated: modulesToDeactivate,
      },
    });
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return NextResponse.json(
      { error: 'Error al cambiar el plan de suscripción' },
      { status: 500 }
    );
  }
}
