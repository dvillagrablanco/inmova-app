import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // Obtener plantillas de automatización
    const templates = await prisma.automationTemplate.findMany({
      orderBy: [
        { popular: 'desc' },
        { vecesUsada: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    return NextResponse.json(templates);
  } catch (error) {
    logger.error('Error fetching automation templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}
