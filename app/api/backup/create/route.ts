import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createBackup } from '@/lib/backup-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear backups' },
        { status: 403 }
      );
    }

    const { tipo = 'manual' } = await req.json();
    const companyId = (session.user as any).companyId;

    const result = await createBackup({
      companyId,
      tipo,
      inicioPor: session.user.id,
    });

    return NextResponse.json({
      success: true,
      backup: result.backup,
      registros: result.registros,
      tamano: result.tamano,
    });
  } catch (error: any) {
    logger.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Error al crear backup', details: error.message },
      { status: 500 }
    );
  }
}
