import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
      // Intentar obtener historial de documentos generados
      const historial = await prisma.documento.findMany({
        where: {
          companyId: session.user.companyId,
          tipo: { in: ['informe', 'reporte'] },
        },
        select: {
          id: true,
          nombre: true,
          tipo: true,
          formato: true,
          createdAt: true,
          url: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return NextResponse.json(historial.map(h => ({
        id: h.id,
        nombreReporte: h.nombre,
        generadoEl: h.createdAt,
        formato: h.formato || 'pdf',
        url: h.url,
        descargado: !!h.url,
      })));
    } catch (dbError) {
      // Si no existe la tabla, retornar array vacío
      console.warn('[API Historial] BD no disponible');
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('[API Historial] Error:', error);
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}
