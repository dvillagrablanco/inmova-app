import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { MODULOS_CATALOGO, SUBSCRIPTION_PACKS } from '@/lib/modules-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Devolver catálogo completo de módulos
    return NextResponse.json({
      modulos: MODULOS_CATALOGO,
      packs: SUBSCRIPTION_PACKS
    });
  } catch (error: any) {
    console.error('Error al obtener catálogo de módulos:', error);
    return NextResponse.json(
      { error: 'Error al obtener catálogo' },
      { status: 500 }
    );
  }
}
