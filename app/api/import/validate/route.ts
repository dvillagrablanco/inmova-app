import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseCSV, validateImportData, ImportableEntity, SYSTEM_MAPPINGS } from '@/lib/import-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;,
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as ImportableEntity;
    const sourceSystem = (formData.get('sourceSystem') as keyof typeof SYSTEM_MAPPINGS) || 'generic_csv';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!entityType) {
      return NextResponse.json(
        { error: 'Tipo de entidad no especificado' },
        { status: 400 }
      );
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

    // Validar los datos
    const validationResult = await validateImportData(
      data,
      entityType,
      sourceSystem,
      session.user.companyId
    );

    return NextResponse.json({
      ...validationResult,
      totalRecords: data.length
    });
  } catch (error: any) {
    logger.error('Error validating import:', error);
    return NextResponse.json(
      { error: error.message || 'Error al validar el archivo' },
      { status: 500 }
    );
  }
}
