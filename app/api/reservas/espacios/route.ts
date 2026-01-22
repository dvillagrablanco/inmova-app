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
    const disponible = searchParams.get('disponible');

    try {
      const espacios = await prisma.espacioComun.findMany({
        where: {
          companyId: session.user.companyId,
          ...(tipo && { tipo }),
          ...(disponible !== null && { disponible: disponible === 'true' }),
        },
        orderBy: { nombre: 'asc' },
      });

      return NextResponse.json(espacios);
    } catch (dbError) {
      // Si la tabla no existe, usar espacios comunes existentes
      try {
        const espaciosComunes = await prisma.espacioComun.findMany({
          where: {
            companyId: session.user.companyId,
          },
          orderBy: { nombre: 'asc' },
        });
        return NextResponse.json(espaciosComunes);
      } catch {
        // Retornar array vacío si no hay tabla
        console.warn('[API Espacios] Tabla no disponible');
        return NextResponse.json([]);
      }
    }
  } catch (error: any) {
    console.error('[API Espacios] Error:', error);
    return NextResponse.json({ error: 'Error al obtener espacios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, tipo, capacidad, ubicacion, descripcion, precio, amenities, horarioApertura, horarioCierre } = body;

    if (!nombre || !tipo) {
      return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 });
    }

    try {
      const espacio = await prisma.espacioComun.create({
        data: {
          nombre,
          tipo,
          capacidad: capacidad || 0,
          ubicacion,
          descripcion,
          precio,
          amenities: amenities || [],
          horarioApertura,
          horarioCierre,
          disponible: true,
          companyId: session.user.companyId,
        }
      });

      return NextResponse.json(espacio, { status: 201 });
    } catch (dbError) {
      console.warn('[API Espacios] Error de BD:', dbError);
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }
  } catch (error: any) {
    console.error('[API Espacios] Error:', error);
    return NextResponse.json({ error: 'Error al crear espacio' }, { status: 500 });
  }
}
