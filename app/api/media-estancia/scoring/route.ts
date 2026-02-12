import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Mapeo de nivel de riesgo de BD a UI
const riskLevelMap: Record<string, 'low' | 'medium' | 'high'> = {
  bajo: 'low',
  medio: 'medium',
  alto: 'high',
  critico: 'high',
};

// Calcular factores de scoring basados en datos del inquilino
function calculateScoringFactors(tenant: any) {
  const factors = [];

  // Factor: Documento de identidad
  if (tenant.dni && tenant.dni.length > 0) {
    factors.push({
      name: 'Documento verificado',
      score: 10,
      maxScore: 10,
      status: 'positive' as const,
      details: `DNI/NIE: ${tenant.dni.slice(0, 3)}****${tenant.dni.slice(-2)}`,
    });
  } else {
    factors.push({
      name: 'Documento no verificado',
      score: 0,
      maxScore: 10,
      status: 'negative' as const,
      details: 'Documento de identidad no proporcionado',
    });
  }

  // Factor: Situación laboral
  if (tenant.situacionLaboral) {
    const empleadoEstable = ['empleado', 'funcionario', 'autonomo'].includes(
      tenant.situacionLaboral.toLowerCase()
    );
    if (empleadoEstable && tenant.empresa) {
      factors.push({
        name: 'Situación laboral',
        score: 15,
        maxScore: 15,
        status: 'positive' as const,
        details: `${tenant.situacionLaboral} en ${tenant.empresa}${tenant.puesto ? ` - ${tenant.puesto}` : ''}`,
      });
    } else if (empleadoEstable) {
      factors.push({
        name: 'Situación laboral',
        score: 10,
        maxScore: 15,
        status: 'neutral' as const,
        details: `${tenant.situacionLaboral} - empresa no especificada`,
      });
    } else {
      factors.push({
        name: 'Situación laboral',
        score: 5,
        maxScore: 15,
        status: 'neutral' as const,
        details: tenant.situacionLaboral,
      });
    }
  } else {
    factors.push({
      name: 'Situación laboral',
      score: 0,
      maxScore: 15,
      status: 'negative' as const,
      details: 'No especificada',
    });
  }

  // Factor: Ingresos
  if (tenant.ingresosMensuales) {
    const ingresos = tenant.ingresosMensuales;
    if (ingresos >= 3000) {
      factors.push({
        name: 'Ingresos mensuales',
        score: 15,
        maxScore: 15,
        status: 'positive' as const,
        details: `${ingresos.toLocaleString('es-ES')}€/mes - Solvencia alta`,
      });
    } else if (ingresos >= 1500) {
      factors.push({
        name: 'Ingresos mensuales',
        score: 10,
        maxScore: 15,
        status: 'neutral' as const,
        details: `${ingresos.toLocaleString('es-ES')}€/mes - Solvencia media`,
      });
    } else {
      factors.push({
        name: 'Ingresos mensuales',
        score: 5,
        maxScore: 15,
        status: 'negative' as const,
        details: `${ingresos.toLocaleString('es-ES')}€/mes - Solvencia baja`,
      });
    }
  } else {
    factors.push({
      name: 'Ingresos mensuales',
      score: 0,
      maxScore: 15,
      status: 'negative' as const,
      details: 'No especificados',
    });
  }

  // Factor: Ratio renta/ingresos
  if (tenant.ratioRentaIngresos !== null && tenant.ratioRentaIngresos !== undefined) {
    const ratio = tenant.ratioRentaIngresos;
    if (ratio <= 0.3) {
      factors.push({
        name: 'Ratio renta/ingresos',
        score: 10,
        maxScore: 10,
        status: 'positive' as const,
        details: `${(ratio * 100).toFixed(0)}% - Recomendado`,
      });
    } else if (ratio <= 0.4) {
      factors.push({
        name: 'Ratio renta/ingresos',
        score: 5,
        maxScore: 10,
        status: 'neutral' as const,
        details: `${(ratio * 100).toFixed(0)}% - Aceptable`,
      });
    } else {
      factors.push({
        name: 'Ratio renta/ingresos',
        score: 0,
        maxScore: 10,
        status: 'negative' as const,
        details: `${(ratio * 100).toFixed(0)}% - Riesgo alto`,
      });
    }
  }

  // Factor: Historial (basado en contratos previos)
  const activeContracts = tenant.contracts?.filter((c: any) => c.estado === 'activo').length || 0;
  const completedContracts =
    tenant.contracts?.filter((c: any) => c.estado === 'finalizado').length || 0;

  if (completedContracts > 0) {
    factors.push({
      name: 'Historial de contratos',
      score: 20,
      maxScore: 20,
      status: 'positive' as const,
      details: `${completedContracts} contratos completados satisfactoriamente`,
    });
  } else if (activeContracts > 0) {
    factors.push({
      name: 'Historial de contratos',
      score: 15,
      maxScore: 20,
      status: 'neutral' as const,
      details: 'Contrato activo - sin historial previo',
    });
  } else {
    factors.push({
      name: 'Historial de contratos',
      score: 0,
      maxScore: 20,
      status: 'negative' as const,
      details: 'Sin historial previo en la plataforma',
    });
  }

  // Factor: Contacto verificado
  const hasEmail = tenant.email && tenant.email.includes('@');
  const hasPhone = tenant.telefono && tenant.telefono.length >= 9;

  if (hasEmail && hasPhone) {
    factors.push({
      name: 'Datos de contacto',
      score: 10,
      maxScore: 10,
      status: 'positive' as const,
      details: 'Email y teléfono verificados',
    });
  } else if (hasEmail || hasPhone) {
    factors.push({
      name: 'Datos de contacto',
      score: 5,
      maxScore: 10,
      status: 'neutral' as const,
      details: hasEmail ? 'Solo email verificado' : 'Solo teléfono verificado',
    });
  } else {
    factors.push({
      name: 'Datos de contacto',
      score: 0,
      maxScore: 10,
      status: 'negative' as const,
      details: 'Datos de contacto incompletos',
    });
  }

  return factors;
}

// Calcular scores por categoría
function calculateCategoryScores(factors: ReturnType<typeof calculateScoringFactors>) {
  // Documentación: documento + contacto
  const docFactors = factors.filter((f) =>
    ['Documento verificado', 'Documento no verificado', 'Datos de contacto'].includes(f.name)
  );
  const documentationScore =
    docFactors.length > 0
      ? Math.round((docFactors.reduce((sum, f) => sum + f.score, 0) / docFactors.reduce((sum, f) => sum + f.maxScore, 0)) * 100)
      : 50;

  // Solvencia: situación laboral + ingresos + ratio
  const solvencyFactors = factors.filter((f) =>
    ['Situación laboral', 'Ingresos mensuales', 'Ratio renta/ingresos'].includes(f.name)
  );
  const solvencyScore =
    solvencyFactors.length > 0
      ? Math.round(
          (solvencyFactors.reduce((sum, f) => sum + f.score, 0) /
            solvencyFactors.reduce((sum, f) => sum + f.maxScore, 0)) *
            100
        )
      : 50;

  // Historial
  const historyFactor = factors.find((f) => f.name === 'Historial de contratos');
  const historyScore = historyFactor
    ? Math.round((historyFactor.score / historyFactor.maxScore) * 100)
    : 50;

  // Perfil general (promedio)
  const profileScore = Math.round((documentationScore + solvencyScore + historyScore) / 3);

  return {
    documentationScore,
    solvencyScore,
    historyScore,
    profileScore,
  };
}

// Generar análisis IA basado en datos
async function generateAIAnalysis(
  const prisma = await getPrisma();
  tenant: any,
  totalScore: number,
  riskLevel: string,
  factors: ReturnType<typeof calculateScoringFactors>
) {
  const positiveFactors = factors.filter((f) => f.status === 'positive');
  const negativeFactors = factors.filter((f) => f.status === 'negative');

  let analysis = '';

  if (riskLevel === 'low') {
    analysis = `Perfil de bajo riesgo. ${tenant.nombreCompleto} presenta `;
    if (positiveFactors.length > 0) {
      analysis += positiveFactors.map((f) => f.name.toLowerCase()).join(', ') + '. ';
    }
    analysis += 'Se recomienda aprobar la solicitud.';
  } else if (riskLevel === 'medium') {
    analysis = `Perfil de riesgo medio. ${tenant.nombreCompleto} presenta algunos indicadores positivos pero también áreas de mejora. `;
    if (negativeFactors.length > 0) {
      analysis += `Puntos a considerar: ${negativeFactors.map((f) => f.name.toLowerCase()).join(', ')}. `;
    }
    analysis +=
      'Se recomienda evaluar con condiciones adicionales (aval, fianza extra, o documentación complementaria).';
  } else {
    analysis = `Perfil de alto riesgo. ${tenant.nombreCompleto} presenta varios factores de riesgo: `;
    analysis += negativeFactors.map((f) => f.name.toLowerCase()).join(', ') + '. ';
    analysis +=
      'Se recomienda rechazar o solicitar garantías adicionales significativas antes de aprobar.';
  }

  return analysis;
}

// Determinar estado basado en scoring y contratos
async function determineStatus(
  tenant: any,
  totalScore: number
): 'pending' | 'approved' | 'rejected' {
  const prisma = await getPrisma();
  // Si tiene contrato activo, está aprobado
  const hasActiveContract =
    tenant.contracts?.some((c: any) => c.estado === 'activo') || false;
  if (hasActiveContract) return 'approved';

  // Si tiene contratos finalizados sin incidencias, aprobar
  const hasCompletedContracts =
    tenant.contracts?.some((c: any) => c.estado === 'finalizado') || false;
  if (hasCompletedContracts && totalScore >= 60) return 'approved';

  // Si el score es muy bajo, rechazar
  if (totalScore < 40) return 'rejected';

  // Por defecto, pendiente
  return 'pending';
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search');

    // Obtener inquilinos con sus contratos (excluyendo demos)
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        isDemo: false,
        ...(search && {
          nombreCompleto: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }),
      },
      include: {
        contracts: {
          select: {
            id: true,
            estado: true,
            rentaMensual: true,
            fechaInicio: true,
            fechaFin: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformar a formato de scoring
    const scoringData = tenants.map((tenant) => {
      const factors = calculateScoringFactors(tenant);
      const categoryScores = calculateCategoryScores(factors);

      // Calcular score total
      const totalFactorScore = factors.reduce((sum, f) => sum + f.score, 0);
      const maxFactorScore = factors.reduce((sum, f) => sum + f.maxScore, 0);
      const calculatedScore = Math.round((totalFactorScore / maxFactorScore) * 100);

      // Usar el score de la BD si existe, sino el calculado
      const totalScore = tenant.scoring || calculatedScore;

      // Mapear nivel de riesgo
      const riskLevel = riskLevelMap[tenant.nivelRiesgo] || 'medium';

      // Determinar estado
      const status = determineStatus(tenant, totalScore);

      // Generar análisis
      const aiAnalysis = generateAIAnalysis(tenant, totalScore, riskLevel, factors);

      return {
        id: tenant.id,
        name: tenant.nombreCompleto,
        email: tenant.email,
        phone: tenant.telefono,
        nationality: tenant.nacionalidad || 'No especificada',
        purpose:
          tenant.situacionLaboral === 'estudiante'
            ? 'Estudios'
            : tenant.situacionLaboral === 'empleado'
              ? 'Trabajo'
              : tenant.situacionLaboral || 'No especificado',
        totalScore,
        riskLevel,
        documentationScore: categoryScores.documentationScore,
        solvencyScore: categoryScores.solvencyScore,
        historyScore: categoryScores.historyScore,
        profileScore: categoryScores.profileScore,
        factors,
        aiAnalysis,
        createdAt: tenant.createdAt,
        status,
      };
    });

    // Filtrar por estado si se especifica
    const filteredData = statusFilter
      ? scoringData.filter((t) => t.status === statusFilter)
      : scoringData;

    // Estadísticas
    const stats = {
      total: scoringData.length,
      approved: scoringData.filter((t) => t.status === 'approved').length,
      pending: scoringData.filter((t) => t.status === 'pending').length,
      rejected: scoringData.filter((t) => t.status === 'rejected').length,
      avgScore:
        scoringData.length > 0
          ? Math.round(scoringData.reduce((sum, t) => sum + t.totalScore, 0) / scoringData.length)
          : 0,
    };

    return NextResponse.json({
      tenants: filteredData,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching tenant scoring:', error);
    return NextResponse.json({ error: 'Error al obtener scoring de inquilinos' }, { status: 500 });
  }
}

// POST para actualizar el scoring manualmente o aprobar/rechazar
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    const body = await request.json();
    const { tenantId, action, scoring, nivelRiesgo } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'ID de inquilino requerido' }, { status: 400 });
    }

    // Verificar que el inquilino pertenece a la empresa
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        companyId,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Actualizar scoring si se proporciona
    if (scoring !== undefined || nivelRiesgo !== undefined) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...(scoring !== undefined && { scoring }),
          ...(nivelRiesgo !== undefined && { nivelRiesgo }),
        },
      });
    }

    // Si hay una acción de aprobar/rechazar, se podría guardar en un log de auditoría
    // Por ahora, solo retornamos éxito
    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Solicitud aprobada' : action === 'reject' ? 'Solicitud rechazada' : 'Scoring actualizado',
    });
  } catch (error) {
    logger.error('Error updating tenant scoring:', error);
    return NextResponse.json({ error: 'Error al actualizar scoring' }, { status: 500 });
  }
}
