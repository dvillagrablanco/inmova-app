/**
 * API Route: Index Property for Semantic Search
 * 
 * POST /api/v1/properties/[id]/index
 * 
 * Genera embedding para una propiedad.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { indexProperty } from '@/lib/semantic-search-service';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const propertyId = params.id;

    // Verificar ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { companyId: true },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    if (property.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Indexar
    await indexProperty(propertyId);

    return NextResponse.json({
      success: true,
      message: 'Propiedad indexada correctamente',
    });
  } catch (error: any) {
    logger.error('Error indexing property:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
