import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CREATE_ALLOWED_ROLES = new Set(['administrador', 'gestor', 'super_admin']);
const ROLE_ALLOWLIST: UserRole[] = [
  'super_admin',
  'administrador',
  'gestor',
  'operador',
  'soporte',
  'community_manager',
  'socio_ewoorker',
  'contratista_ewoorker',
  'subcontratista_ewoorker',
];

function resolveUserRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') {
    return null;
  }
  return ROLE_ALLOWLIST.includes(role as UserRole) ? (role as UserRole) : null;
}

const createCompanySchema = z.object({
  nombre: z.string().min(2).optional(),
  cif: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  parentCompanyId: z.string().optional().nullable(),
  tipo: z.enum(['empresa', 'holding', 'personal']).default('empresa'),
});

async function userHasCompanyAccess(userId: string, companyId: string) {
  const access = await prisma.userCompanyAccess.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  if (access?.activo) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  return user?.companyId === companyId;
}

/**
 * GET /api/user/companies
 * Obtiene todas las empresas a las que tiene acceso el usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = resolveUserRole(session.user.role);
    if (!role) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 403 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id,
      role,
      primaryCompanyId: session.user.companyId,
      request,
    });

    if (scope.accessibleCompanyIds.length === 0) {
      return NextResponse.json({
        success: true,
        companies: [],
        currentCompanyId: scope.activeCompanyId,
      });
    }

    const companies = await prisma.company.findMany({
      where: {
        id: { in: scope.accessibleCompanyIds },
      },
      select: {
        id: true,
        nombre: true,
        logoUrl: true,
        estadoCliente: true,
        activo: true,
        dominioPersonalizado: true,
        tags: true,
        parentCompanyId: true,
        parentCompany: {
          select: { id: true, nombre: true },
        },
        _count: {
          select: { childCompanies: true },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    const enrichedCompanies = companies.map((company) => ({
      ...company,
      roleInCompany: role,
      isCurrent: company.id === scope.activeCompanyId,
      isPrimary: company.id === session.user.companyId,
      hasChildren: (company as any)._count?.childCompanies > 0,
    }));

    return NextResponse.json({
      success: true,
      companies: enrichedCompanies,
      currentCompanyId: scope.activeCompanyId,
    });
  } catch (error) {
    logger.error('Error fetching user companies:', error);
    return NextResponse.json(
      { error: 'Error al obtener las empresas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/companies
 * Crea una nueva empresa para el usuario actual
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!CREATE_ALLOWED_ROLES.has(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear empresas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      nombre,
      cif,
      email,
      telefono,
      ciudad,
      parentCompanyId,
      tipo,
    } = parsed.data;

    const displayName =
      nombre ||
      (tipo === 'personal'
        ? `Personal - ${session.user.name || session.user.email || 'Usuario'}`
        : undefined);

    if (!displayName) {
      return NextResponse.json(
        { error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      );
    }

    if (parentCompanyId && parentCompanyId === 'null') {
      return NextResponse.json(
        { error: 'Holding inválida' },
        { status: 400 }
      );
    }

    if (parentCompanyId) {
      const parentExists = await prisma.company.findUnique({
        where: { id: parentCompanyId },
        select: { id: true },
      });

      if (!parentExists) {
        return NextResponse.json(
          { error: 'La holding seleccionada no existe' },
          { status: 404 }
        );
      }

      if (session.user.role !== 'super_admin') {
        const hasParentAccess = await userHasCompanyAccess(
          session.user.id,
          parentCompanyId
        );
        if (!hasParentAccess) {
          return NextResponse.json(
            { error: 'No tienes acceso a la holding seleccionada' },
            { status: 403 }
          );
        }
      }
    }

    const tags = new Set<string>();
    if (tipo === 'personal') tags.add('personal');
    if (tipo === 'holding') tags.add('holding');

    const company = await prisma.company.create({
      data: {
        nombre: displayName,
        cif: cif || null,
        email: email || null,
        telefono: telefono || null,
        ciudad: ciudad || null,
        estadoCliente: 'activo',
        tags: Array.from(tags),
        parentCompanyId: tipo === 'holding' ? null : parentCompanyId || null,
      },
      select: {
        id: true,
        nombre: true,
        logoUrl: true,
        estadoCliente: true,
        activo: true,
        dominioPersonalizado: true,
        tags: true,
        parentCompanyId: true,
        parentCompany: {
          select: { id: true, nombre: true },
        },
        _count: {
          select: { childCompanies: true },
        },
      },
    });

    const roleInCompany = resolveUserRole(session.user.role);
    if (!roleInCompany) {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    await prisma.userCompanyAccess.upsert({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId: company.id,
        },
      },
      create: {
        userId: session.user.id,
        companyId: company.id,
        roleInCompany,
        grantedBy: session.user.id,
        activo: true,
      },
      update: {
        activo: true,
        roleInCompany,
      },
    });

    return NextResponse.json({ success: true, company }, { status: 201 });
  } catch (error) {
    logger.error('Error creating user company:', error);
    return NextResponse.json(
      { error: 'Error al crear la empresa' },
      { status: 500 }
    );
  }
}
