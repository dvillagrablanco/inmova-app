import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { obtenerEstadoDocumento } from '@/lib/digital-signature-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/digital-signature/[id]
 * Obtiene el estado detallado de un documento de firma
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const result = await obtenerEstadoDocumento(params.id);

    // Verificar que el documento pertenece a la compañía del usuario
    if (result.documento.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error obteniendo estado de documento:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado del documento' },
      { status: 500 }
    );
  }
}
