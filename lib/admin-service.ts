/**
 * Servicio de Administración
 * 
 * Gestión de companies, users, billing, system stats.
 * Solo accesible por SUPERADMIN.
 * 
 * @module AdminService
 */

import { prisma } from './db';
import logger from './logger';
import { redis } from './redis';
import bcrypt from 'bcryptjs';

// ============================================================================
// COMPANY MANAGEMENT
// ============================================================================

/**
 * Lista todas las companies con stats
 */
export async function getAllCompanies(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  sortBy?: 'createdAt' | 'name' | 'users' | 'properties';
  sortOrder?: 'asc' | 'desc';
}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { legalName: { contains: options.search, mode: 'insensitive' } },
      { contactEmail: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  if (options.status) {
    where.status = options.status.toUpperCase();
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [options.sortBy || 'createdAt']: options.sortOrder || 'desc',
      },
      include: {
        _count: {
          select: {
            users: true,
            properties: true,
            contracts: true,
          },
        },
        subscription: {
          where: {
            status: { in: ['active', 'trialing'] },
          },
          take: 1,
        },
      },
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies: companies.map((c) => ({
      ...c,
      stats: {
        totalUsers: c._count.users,
        totalProperties: c._count.properties,
        totalContracts: c._count.contracts,
        hasActiveSubscription: c.subscription.length > 0,
      },
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Obtiene detalles de una company
 */
export async function getCompanyDetails(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          activo: true,
          lastLogin: true,
        },
      },
      subscription: {
        where: {
          status: { in: ['active', 'trialing'] },
        },
      },
      _count: {
        select: {
          properties: true,
          contracts: true,
          tenants: true,
        },
      },
    },
  });

  if (!company) {
    throw new Error('Company not found');
  }

  return company;
}

/**
 * Suspende una company
 */
export async function suspendCompany(companyId: string, reason: string): Promise<void> {
  await prisma.company.update({
    where: { id: companyId },
    data: {
      status: 'SUSPENDED',
      suspendedAt: new Date(),
      suspensionReason: reason,
    },
  });

  // Desactivar todos los usuarios
  await prisma.user.updateMany({
    where: { companyId },
    data: { activo: false },
  });

  logger.warn('⚠️ Company suspended', { companyId, reason });
}

/**
 * Reactiva una company
 */
export async function reactivateCompany(companyId: string): Promise<void> {
  await prisma.company.update({
    where: { id: companyId },
    data: {
      status: 'ACTIVE',
      suspendedAt: null,
      suspensionReason: null,
    },
  });

  logger.info('✅ Company reactivated', { companyId });
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Lista todos los usuarios del sistema
 */
export async function getAllUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  companyId?: string;
}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.search) {
    where.OR = [
      { email: { contains: options.search, mode: 'insensitive' } },
      { name: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  if (options.role) {
    where.role = options.role;
  }

  if (options.companyId) {
    where.companyId = options.companyId;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
        lastLogin: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Crea un usuario de sistema (SUPERADMIN)
 */
export async function createSystemUser(data: {
  email: string;
  password: string;
  name: string;
  role: 'SUPERADMIN';
}): Promise<any> {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      activo: true,
    },
  });

  logger.info('✅ System user created', { userId: user.id, role: data.role });

  return user;
}

/**
 * Desactiva un usuario
 */
export async function deactivateUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { activo: false },
  });

  logger.info('👤 User deactivated', { userId });
}

// ============================================================================
// BILLING & REVENUE
// ============================================================================

/**
 * Obtiene estadísticas de billing
 */
export async function getBillingStats(period: 'month' | 'year' = 'month'): Promise<{
  totalRevenue: number;
  activeSubscriptions: number;
  revenueByPlan: Record<string, number>;
  churnRate: number;
}> {
  const now = new Date();
  const startDate = new Date();
  if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  // Active subscriptions
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      status: { in: ['active', 'trialing'] },
    },
  });

  // Revenue (estimado, requiere Stripe webhooks para precisión)
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'trialing'] },
      createdAt: { gte: startDate },
    },
    include: {
      company: true,
    },
  });

  let totalRevenue = 0;
  const revenueByPlan: Record<string, number> = {};

  for (const sub of subscriptions) {
    // Simular revenue basado en plan (en producción, obtener de Stripe)
    const revenue = 99; // Placeholder
    totalRevenue += revenue;

    const plan = 'PROFESSIONAL'; // Placeholder
    revenueByPlan[plan] = (revenueByPlan[plan] || 0) + revenue;
  }

  // Churn rate (cancelaciones / total)
  const canceledCount = await prisma.subscription.count({
    where: {
      status: 'canceled',
      updatedAt: { gte: startDate },
    },
  });

  const churnRate = activeSubscriptions > 0 ? (canceledCount / activeSubscriptions) * 100 : 0;

  return {
    totalRevenue,
    activeSubscriptions,
    revenueByPlan,
    churnRate: Math.round(churnRate * 100) / 100,
  };
}

// ============================================================================
// SYSTEM STATS
// ============================================================================

/**
 * Obtiene estadísticas generales del sistema
 */
export async function getSystemStats(): Promise<{
  totalCompanies: number;
  totalUsers: number;
  totalProperties: number;
  totalContracts: number;
  totalTenants: number;
  activeContracts: number;
  systemHealth: {
    databaseConnected: boolean;
    redisConnected: boolean;
    apiResponseTime: number;
  };
}> {
  const cacheKey = 'admin:system-stats';
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const [
    totalCompanies,
    totalUsers,
    totalProperties,
    totalContracts,
    totalTenants,
    activeContracts,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.property.count(),
    prisma.contract.count(),
    prisma.tenant.count(),
    prisma.contract.count({
      where: {
        status: 'ACTIVE',
      },
    }),
  ]);

  // Health checks
  const startTime = Date.now();
  let databaseConnected = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseConnected = false;
  }

  let redisConnected = true;
  try {
    await redis.ping();
  } catch (error) {
    redisConnected = false;
  }

  const apiResponseTime = Date.now() - startTime;

  const stats = {
    totalCompanies,
    totalUsers,
    totalProperties,
    totalContracts,
    totalTenants,
    activeContracts,
    systemHealth: {
      databaseConnected,
      redisConnected,
      apiResponseTime,
    },
  };

  // Cache por 5 min
  await redis.setex(cacheKey, 300, JSON.stringify(stats));

  return stats;
}

/**
 * Obtiene logs de actividad reciente
 */
export async function getRecentActivity(limit: number = 50): Promise<any[]> {
  return await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

export default {
  getAllCompanies,
  getCompanyDetails,
  suspendCompany,
  reactivateCompany,
  getAllUsers,
  createSystemUser,
  deactivateUser,
  getBillingStats,
  getSystemStats,
  getRecentActivity,
};
