import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { reenviarInvitacion } from '@/lib/digital-signature-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/digital-signature/[id]/reminder
 * Envía recordatorios a firmantes pendientes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar permisos
    if (!['administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tiene permisos para enviar recordatorios' },
        { status: 403 }
      );
    }

    const documento = await prisma.documentoFirma.findUnique({
      where: { id: params.id },
      include: {
        firmantes: {
          where: {
            estado: 'pendiente'
          }
        }
      }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    if (documento.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Enviar recordatorios a firmantes pendientes
    const recordatoriosEnviados: string[] = [];
    for (const firmante of documento.firmantes) {
      await reenviarInvitacion(params.id, firmante.id);
      recordatoriosEnviados.push(firmante.email);
    }

    logger.info(`📧 Recordatorios enviados para documento ${params.id}: ${recordatoriosEnviados.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `Recordatorios enviados a ${recordatoriosEnviados.length} firmante(s)`,
      recipients: recordatoriosEnviados
    });
  } catch (error) {
    logger.error('Error enviando recordatorios:', error);
    return NextResponse.json(
      { error: 'Error enviando recordatorios' },
      { status: 500 }
    );
  }
}
