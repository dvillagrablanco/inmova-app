import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseCSV, importData, ImportableEntity, SYSTEM_MAPPINGS } from '@/lib/import-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar permisos de administrador
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para importar datos' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as ImportableEntity;
    const sourceSystem =
      (formData.get('sourceSystem') as keyof typeof SYSTEM_MAPPINGS) || 'generic_csv';
    const buildingId = formData.get('buildingId') as string | undefined;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!entityType) {
      return NextResponse.json({ error: 'Tipo de entidad no especificado' }, { status: 400 });
    }

    // Leer el contenido del archivo
    const fileContent = await file.text();

    // Parsear el CSV
    const data = await parseCSV(fileContent);

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío o no contiene datos válidos' },
        { status: 400 }
      );
    }

    // Ejecutar la importación
    const importResult = await importData(data, entityType, session.user.companyId, sourceSystem, {
      buildingId,
    });

    return NextResponse.json(importResult);
  } catch (error: any) {
    logger.error('Error executing import:', error);
    return NextResponse.json(
      { error: error.message || 'Error al importar los datos' },
      { status: 500 }
    );
  }
}
