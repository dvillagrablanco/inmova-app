import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateCSVTemplate, ImportableEntity } from '@/lib/import-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType') as ImportableEntity;

    if (!entityType) {
      return NextResponse.json({ error: 'Tipo de entidad no especificado' }, { status: 400 });
    }

    const template = generateCSVTemplate(entityType);

    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="plantilla_${entityType}.csv"`,
      },
    });
  } catch (error: any) {
    logger.error('Error generating template:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar la plantilla' },
      { status: 500 }
    );
  }
}
