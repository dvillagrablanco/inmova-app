import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BUSINESS_VERTICALS = [
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
] as const;

type BusinessVerticalValue = (typeof BUSINESS_VERTICALS)[number];
const isBusinessVertical = (value: string): value is BusinessVerticalValue =>
  BUSINESS_VERTICALS.includes(value as BusinessVerticalValue);

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
    let primaryVertical: BusinessVerticalValue | null =
      company.businessVertical ?? null;
    
    if (primaryVertical === 'mixto' && company.verticals && company.verticals.length > 0) {
      const firstVertical = company.verticals.find(
        (value): value is BusinessVerticalValue => isBusinessVertical(value)
      );
      if (firstVertical) {
        primaryVertical = firstVertical;
      }
    }

    const allVerticals =
      company.verticals && company.verticals.length > 0
        ? company.verticals.filter((value): value is BusinessVerticalValue =>
            isBusinessVertical(value)
          )
        : company.businessVertical
        ? [company.businessVertical]
        : [];

    return NextResponse.json({
      vertical: primaryVertical,
      allVerticals,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API Error]:', { message });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
