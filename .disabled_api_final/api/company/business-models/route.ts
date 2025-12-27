import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getBusinessModelsForCompany,
  activateBusinessModelForCompany,
  deactivateBusinessModelForCompany,
  getActiveModulesForCompany,
  BUSINESS_MODEL_MODULES
} from '@/lib/modules-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/company/business-models
 * Obtiene los modelos de negocio activos de la empresa del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const activeBusinessModels = await getBusinessModelsForCompany(companyId);
    const activeModules = await getActiveModulesForCompany(companyId);

    // Obtener información de módulos por modelo de negocio
    const businessModelInfo = Object.keys(BUSINESS_MODEL_MODULES).map(model => ({
      model,
      isActive: activeBusinessModels.includes(model),
      modules: BUSINESS_MODEL_MODULES[model],
      moduleCount: BUSINESS_MODEL_MODULES[model].length
    }));

    return NextResponse.json({
      activeBusinessModels,
      activeModules,
      businessModelInfo,
      availableBusinessModels: Object.keys(BUSINESS_MODEL_MODULES)
    });
  } catch (error: any) {
    logger.error('Error al obtener modelos de negocio:', error);
    return NextResponse.json(
      { error: 'Error al obtener modelos de negocio' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/company/business-models
 * Activa o desactiva un modelo de negocio para la empresa
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden modificar modelos de negocio
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar modelos de negocio' },
        { status: 403 }
      );
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const body = await req.json();
    const { businessModel, active } = body;

    if (!businessModel) {
      return NextResponse.json(
        { error: 'El modelo de negocio es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el modelo de negocio existe
    if (!BUSINESS_MODEL_MODULES[businessModel]) {
      return NextResponse.json(
        { error: 'Modelo de negocio no válido' },
        { status: 400 }
      );
    }

    if (active) {
      await activateBusinessModelForCompany(companyId, businessModel);
      logger.info(`Modelo de negocio ${businessModel} activado para empresa ${companyId}`);
    } else {
      await deactivateBusinessModelForCompany(companyId, businessModel);
      logger.info(`Modelo de negocio ${businessModel} desactivado para empresa ${companyId}`);
    }

    // Obtener los módulos activos actualizados
    const activeModules = await getActiveModulesForCompany(companyId);

    return NextResponse.json({
      success: true,
      businessModel,
      active,
      activeModules
    });
  } catch (error: any) {
    logger.error('Error al modificar modelo de negocio:', error);
    return NextResponse.json(
      { error: 'Error al modificar modelo de negocio' },
      { status: 500 }
    );
  }
}
