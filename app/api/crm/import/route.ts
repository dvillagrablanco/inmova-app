export const dynamic = 'force-dynamic';

/**
 * API: /api/crm/import
 *
 * POST: Importar leads desde diferentes fuentes
 *
 * Body:
 * {
 *   source: 'linkedin_job' | 'csv' | 'manual' | 'target_clients',
 *   jobId?: string,                    // Para linkedin_job
 *   leads?: ImportLeadData[],          // Para csv/manual
 *   options: ImportOptions
 * }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CRMLeadImporter } from '@/lib/crm-lead-importer';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { source, jobId, leads, options } = body;

    if (!source) {
      return NextResponse.json(
        { error: 'Se requiere especificar la fuente de importación' },
        { status: 400 }
      );
    }

    let result;

    switch (source) {
      case 'linkedin_job':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Se requiere jobId para importar desde LinkedIn' },
            { status: 400 }
          );
        }
        result = await CRMLeadImporter.importFromLinkedInJob(
          jobId,
          session.user.companyId,
          options || { source: 'linkedin' }
        );
        break;

      case 'csv':
      case 'manual':
        if (!leads || !Array.isArray(leads)) {
          return NextResponse.json({ error: 'Se requiere array de leads' }, { status: 400 });
        }
        result = await CRMLeadImporter.importFromCSV(
          session.user.companyId,
          leads,
          options || { source: 'website' }
        );
        break;

      case 'target_clients':
        // Importar clientes objetivo predefinidos de INMOVA
        result = await CRMLeadImporter.importTargetClients(session.user.companyId);
        break;

      default:
        return NextResponse.json({ error: 'Fuente de importación no válida' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error importing leads:', error);
    return NextResponse.json(
      { error: 'Error al importar leads', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Retornar queries predefinidas de LinkedIn para INMOVA
    const queries = CRMLeadImporter.getINMOVALinkedInQueries();

    return NextResponse.json({ queries });
  } catch (error: any) {
    console.error('Error getting import queries:', error);
    return NextResponse.json(
      { error: 'Error al obtener queries', details: error.message },
      { status: 500 }
    );
  }
}
