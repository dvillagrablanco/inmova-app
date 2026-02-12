import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { crearPlantilla } from '@/lib/sms-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const plantillas = await prisma.sMSTemplate.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ plantillas });
  } catch (error: any) {
    logger.error('Error fetching SMS templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const plantilla = await crearPlantilla(
      session.user.companyId,
      data,
      session.user.id
    );

    return NextResponse.json({ 
      success: true, 
      plantilla,
      message: 'Plantilla creada exitosamente' 
    });
  } catch (error: any) {
    logger.error('Error creating SMS template:', error);
    return NextResponse.json(
      { error: 'Error al crear plantilla', details: error.message },
      { status: 500 }
    );
  }
}
