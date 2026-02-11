import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/bank-import/companies
 * 
 * Devuelve las empresas a las que el usuario tiene acceso,
 * para seleccionar al importar extractos bancarios.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener empresa principal del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        companyId: true,
        company: {
          select: { id: true, nombre: true, iban: true },
        },
      },
    });

    // Obtener empresas adicionales vía UserCompanyAccess
    const additionalAccess = await prisma.userCompanyAccess.findMany({
      where: {
        userId: session.user.id,
        activo: true,
      },
      include: {
        company: {
          select: { id: true, nombre: true, iban: true },
        },
      },
    });

    const companies: Array<{ id: string; nombre: string; iban: string | null }> = [];

    // Añadir empresa principal
    if (user?.company) {
      companies.push(user.company);
    }

    // Añadir empresas con acceso multi-empresa
    for (const access of additionalAccess) {
      if (access.company && !companies.some(c => c.id === access.company.id)) {
        companies.push(access.company);
      }
    }

    // Si el usuario es de una empresa que tiene filiales, incluirlas
    if (user?.companyId) {
      const childCompanies = await prisma.company.findMany({
        where: {
          parentCompanyId: user.companyId,
          activo: true,
        },
        select: { id: true, nombre: true, iban: true },
      });

      for (const child of childCompanies) {
        if (!companies.some(c => c.id === child.id)) {
          companies.push(child);
        }
      }

      // También buscar si el usuario está en una filial, incluir la matriz y hermanas
      const currentCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { parentCompanyId: true },
      });

      if (currentCompany?.parentCompanyId) {
        const siblings = await prisma.company.findMany({
          where: {
            OR: [
              { id: currentCompany.parentCompanyId },
              { parentCompanyId: currentCompany.parentCompanyId },
            ],
            activo: true,
          },
          select: { id: true, nombre: true, iban: true },
        });

        for (const sibling of siblings) {
          if (!companies.some(c => c.id === sibling.id)) {
            companies.push(sibling);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      companies: companies.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error obteniendo empresas', details: error.message },
      { status: 500 }
    );
  }
}
