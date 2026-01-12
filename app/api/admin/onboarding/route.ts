import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { isSuperAdmin } from '@/lib/admin-roles';
import { subDays } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Pasos de onboarding estándar
const ONBOARDING_STEPS = [
  { id: 'profile', name: 'Perfil completado', description: 'Datos básicos de la empresa' },
  { id: 'users', name: 'Usuarios creados', description: 'Al menos 1 usuario adicional' },
  { id: 'building', name: 'Primer edificio', description: 'Crear primer edificio/propiedad' },
  { id: 'unit', name: 'Primera unidad', description: 'Crear primera unidad' },
  { id: 'tenant', name: 'Primer inquilino', description: 'Registrar primer inquilino' },
  { id: 'contract', name: 'Primer contrato', description: 'Crear primer contrato' },
];

// Schema de validación para query params
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['all', 'pending', 'in_progress', 'completed', 'stalled']).default('all'),
  search: z.string().optional(),
});

/**
 * GET /api/admin/onboarding
 * Obtiene el estado de onboarding de todas las empresas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    // Parsear query params
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, status, search } = queryResult.data;
    const skip = (page - 1) * limit;
    const sevenDaysAgo = subDays(new Date(), 7);

    // Construir filtros base - Excluir empresas de prueba de las analíticas
    const baseWhere: any = {
      esEmpresaPrueba: false, // Excluir empresas ficticias/de prueba
    };
    if (search) {
      baseWhere.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { contactoPrincipal: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtener empresas con métricas de onboarding
    const companies = await prisma.company.findMany({
      where: baseWhere,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptionPlan: { select: { nombre: true } },
        _count: {
          select: {
            users: true,
            buildings: true,
            tenants: true,
          },
        },
      },
    });

    // Calcular estado de onboarding para cada empresa
    const companiesWithOnboarding = await Promise.all(
      companies.map(async (company) => {
        // Obtener métricas adicionales
        const [unitsCount, contractsCount, recentActivity] = await Promise.all([
          prisma.unit.count({
            where: { building: { companyId: company.id } },
          }),
          prisma.contract.count({
            where: { unit: { building: { companyId: company.id } } },
          }),
          prisma.auditLog.findFirst({
            where: { companyId: company.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        // Calcular pasos completados
        const stepsCompleted = [];
        
        // 1. Perfil completado (tiene CIF, dirección, teléfono)
        if (company.cif && company.direccion && company.telefono) {
          stepsCompleted.push('profile');
        }
        
        // 2. Usuarios creados (al menos 2)
        if (company._count.users >= 2) {
          stepsCompleted.push('users');
        }
        
        // 3. Primer edificio
        if (company._count.buildings >= 1) {
          stepsCompleted.push('building');
        }
        
        // 4. Primera unidad
        if (unitsCount >= 1) {
          stepsCompleted.push('unit');
        }
        
        // 5. Primer inquilino
        if (company._count.tenants >= 1) {
          stepsCompleted.push('tenant');
        }
        
        // 6. Primer contrato
        if (contractsCount >= 1) {
          stepsCompleted.push('contract');
        }

        const progress = Math.round((stepsCompleted.length / ONBOARDING_STEPS.length) * 100);
        
        // Determinar estado de onboarding
        let onboardingStatus: 'pending' | 'in_progress' | 'completed' | 'stalled';
        if (progress === 100) {
          onboardingStatus = 'completed';
        } else if (progress === 0) {
          onboardingStatus = 'pending';
        } else if (recentActivity && recentActivity.createdAt < sevenDaysAgo) {
          onboardingStatus = 'stalled';
        } else {
          onboardingStatus = 'in_progress';
        }

        return {
          id: company.id,
          nombre: company.nombre,
          contactoPrincipal: company.contactoPrincipal,
          emailContacto: company.emailContacto,
          plan: company.subscriptionPlan?.nombre || 'Sin plan',
          createdAt: company.createdAt,
          onboarding: {
            status: onboardingStatus,
            progress,
            stepsCompleted,
            totalSteps: ONBOARDING_STEPS.length,
            lastActivity: recentActivity?.createdAt || company.createdAt,
          },
          metrics: {
            users: company._count.users,
            buildings: company._count.buildings,
            units: unitsCount,
            tenants: company._count.tenants,
            contracts: contractsCount,
          },
        };
      })
    );

    // Filtrar por status si se especificó
    let filteredCompanies = companiesWithOnboarding;
    if (status !== 'all') {
      filteredCompanies = companiesWithOnboarding.filter(
        (c) => c.onboarding.status === status
      );
    }

    // Calcular estadísticas globales
    const allCompaniesForStats = await prisma.company.findMany({
      where: baseWhere,
      include: {
        _count: { select: { users: true, buildings: true, tenants: true } },
      },
    });

    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    let stalledCount = 0;

    for (const company of allCompaniesForStats) {
      const hasProfile = company.cif && company.direccion && company.telefono;
      const hasUsers = company._count.users >= 2;
      const hasBuilding = company._count.buildings >= 1;
      
      const steps = [hasProfile, hasUsers, hasBuilding].filter(Boolean).length;
      const progress = Math.round((steps / 6) * 100);

      if (progress === 100) completedCount++;
      else if (progress === 0) pendingCount++;
      else stalledCount++; // Simplificación para stats
    }

    inProgressCount = allCompaniesForStats.length - completedCount - pendingCount - stalledCount;
    if (inProgressCount < 0) inProgressCount = 0;

    const total = await prisma.company.count({ where: baseWhere });

    return NextResponse.json({
      companies: filteredCompanies,
      pagination: {
        page,
        limit,
        total: status === 'all' ? total : filteredCompanies.length,
        totalPages: Math.ceil((status === 'all' ? total : filteredCompanies.length) / limit),
      },
      stats: {
        total: allCompaniesForStats.length,
        completed: completedCount,
        inProgress: inProgressCount,
        pending: pendingCount,
        stalled: stalledCount,
        averageProgress: allCompaniesForStats.length > 0
          ? Math.round(companiesWithOnboarding.reduce((sum, c) => sum + c.onboarding.progress, 0) / companiesWithOnboarding.length)
          : 0,
      },
      steps: ONBOARDING_STEPS,
    });
  } catch (error) {
    logger.error('Error fetching onboarding data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de onboarding' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/onboarding
 * Actualiza el estado de onboarding de una empresa (notas, agente asignado, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyId, notes, assignedAgent } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId es requerido' },
        { status: 400 }
      );
    }

    // Actualizar notas de admin en la empresa
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        notasAdmin: notes,
        // Si tuviéramos campo de agente asignado:
        // assignedAgentId: assignedAgent,
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        companyId,
        action: 'UPDATE',
        entityType: 'ONBOARDING',
        entityId: companyId,
        changes: JSON.stringify({ notes, assignedAgent }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        nombre: company.nombre,
        notasAdmin: company.notasAdmin,
      },
    });
  } catch (error) {
    logger.error('Error updating onboarding:', error);
    return NextResponse.json(
      { error: 'Error al actualizar onboarding' },
      { status: 500 }
    );
  }
}
