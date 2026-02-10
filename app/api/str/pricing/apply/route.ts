export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const schema = z.object({
      listingId: z.string().min(1),
      price: z.number().positive(),
    });

    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const listing = await prisma.sTRListing.findFirst({
      where: { id: parsed.data.listingId, companyId: session.user.companyId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing no encontrado' }, { status: 404 });
    }

    await prisma.sTRListing.update({
      where: { id: listing.id },
      data: { precioPorNoche: parsed.data.price },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Precio actualizado correctamente' 
    });
  } catch (error) {
    logger.error('Error applying pricing:', error);
    return NextResponse.json(
      { error: 'Error al aplicar precio' },
      { status: 500 }
    );
  }
}
