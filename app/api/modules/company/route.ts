import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { MODULOS_CATALOGO } from '@/lib/modules-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    // Obtener módulos activados de la empresa
    const companyModules = await prisma.companyModule.findMany({
      where: { companyId },
      orderBy: { moduloCodigo: 'asc' }
    });

    // Enriquecer con información del catálogo
    const enrichedModules = companyModules.map(cm => {
      const definition = MODULOS_CATALOGO.find(m => m.codigo === cm.moduloCodigo);
      return {
        ...cm,
        nombre: definition?.nombre || cm.moduloCodigo,
        descripcion: definition?.descripcion || '',
        categoria: definition?.categoria || 'otro',
        icono: definition?.icono || 'Package',
        esCore: definition?.esCore || false
      };
    });

    return NextResponse.json({ modules: enrichedModules });
  } catch (error: any) {
    logger.error('Error al obtener módulos de empresa:', error);
    return NextResponse.json(
      { error: 'Error al obtener módulos' },
      { status: 500 }
    );
  }
}
