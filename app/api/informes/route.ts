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

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    try {
      // Intentar obtener informes guardados de la BD
      const informes = await prisma.documento.findMany({
        where: {
          companyId: session.user.companyId,
          tipo: tipo || 'informe',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json(informes);
    } catch (dbError) {
      // Si no existe la tabla o hay error, retornar array vacío
      console.warn('[API Informes] BD no disponible');
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('[API Informes] Error:', error);
    return NextResponse.json({ error: 'Error al obtener informes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, tipo, configuracion, formato } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });
    }

    try {
      const informe = await prisma.documento.create({
        data: {
          nombre,
          tipo: tipo || 'informe',
          contenido: JSON.stringify(configuracion || {}),
          formato: formato || 'pdf',
          companyId: session.user.companyId,
          userId: session.user.id,
        }
      });

      return NextResponse.json(informe, { status: 201 });
    } catch (dbError) {
      console.warn('[API Informes] Error de BD:', dbError);
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }
  } catch (error: any) {
    console.error('[API Informes] Error:', error);
    return NextResponse.json({ error: 'Error al crear informe' }, { status: 500 });
  }
}
