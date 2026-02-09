import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type BusinessVertical =
  | 'alquiler_tradicional'
  | 'str_vacacional'
  | 'coliving'
  | 'room_rental'
  | 'construccion'
  | 'flipping'
  | 'servicios_profesionales'
  | 'comunidades'
  | 'mixto'
  | 'alquiler_comercial';

const allowedVerticals: BusinessVertical[] = [
  'alquiler_tradicional',
  'str_vacacional',
  'coliving',
  'room_rental',
  'construccion',
  'flipping',
  'servicios_profesionales',
  'comunidades',
  'mixto',
  'alquiler_comercial',
];

const isBusinessVertical = (value: string): value is BusinessVertical =>
  allowedVerticals.includes(value as BusinessVertical);

/**
 * GET /api/company/vertical
 * Obtiene la vertical de negocio principal de la empresa del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        businessVertical: true,
        verticals: true, // Array de verticales si es mixto
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Si es mixto, retornar el primer vertical válido
    let primaryVertical: BusinessVertical | null = company.businessVertical ?? null;

    if (company.businessVertical === 'mixto' && company.verticals && company.verticals.length > 0) {
      const candidate = company.verticals.find(isBusinessVertical);
      if (candidate) {
        primaryVertical = candidate;
      }
    }

    return NextResponse.json({
      vertical: primaryVertical,
      allVerticals:
        company.verticals?.filter(isBusinessVertical) ||
        (company.businessVertical ? [company.businessVertical] : []),
    });
  } catch (error: any) {
    logger.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
