import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/company/vertical
 * Obtiene la vertical de negocio principal de la empresa del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({
        vertical: null,
        allVerticals: [],
        success: false,
        error: 'No autenticado',
      });
    }
    
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        businessVertical: true,
        verticals: true, // Array de verticales si es mixto
      },
    });

    if (!company) {
      return NextResponse.json({
        vertical: null,
        allVerticals: [],
        success: false,
        error: 'Empresa no encontrada',
      });
    }

    // Si es mixto, retornar el primer vertical o el más usado
    let primaryVertical = company.businessVertical;
    
    if (company.businessVertical === 'mixto' && company.verticals && company.verticals.length > 0) {
      // Seleccionar el primer vertical como principal
      primaryVertical = company.verticals[0];
    }

    return NextResponse.json({
      vertical: primaryVertical,
      allVerticals: company.verticals || [company.businessVertical],
      success: true,
    });
  } catch (error: any) {
    logger.error('[API Error]:', error);
    return NextResponse.json({
      vertical: null,
      allVerticals: [],
      success: false,
      error: 'Error interno del servidor',
    });
  }
}
