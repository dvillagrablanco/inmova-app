/**
 * GET /api/companies/scope
 *
 * Devuelve las empresas del SCOPE actual del usuario, es decir, las
 * sociedades del grupo activo (incluye holding + filiales hermanas).
 *
 * Útil para selectores de "sociedad propietaria" cuando el usuario está
 * trabajando en un grupo de empresas y quiere mover una unidad de una
 * filial a otra (caso real grupo Vidaro: Viroda ↔ Rovida ↔ Vidaro).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    if (scope.scopeCompanyIds.length === 0) {
      return NextResponse.json([]);
    }

    const companies = await prisma.company.findMany({
      where: { id: { in: scope.scopeCompanyIds } },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(companies);
  } catch (error) {
    logger.error('[Companies scope GET]:', error);
    return NextResponse.json([], { status: 500 });
  }
}
