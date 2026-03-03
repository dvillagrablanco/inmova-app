import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { parseAccountingJournal } from '@/lib/parsers/accounting-journal-parser';
import { importJournalWithMapping } from '@/lib/accounting-import-service';
import { parseAnalyticsMapping } from '@/lib/parsers/analytics-mapping-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const ADMIN_ROLES = ['super_admin', 'administrador'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const mappingFile = formData.get('mapping') as File | null;
    let mappingResult;

    if (mappingFile && mappingFile.size > 0) {
      try {
        const mappingBuffer = Buffer.from(await mappingFile.arrayBuffer());
        mappingResult = await parseAnalyticsMapping(mappingBuffer);
      } catch (e) {
        logger.warn('[Family Office Import] Mapping parse failed, using journal only', e);
      }
    }

    if (mappingResult) {
      const result = await importJournalWithMapping(buffer, mappingResult);
      return NextResponse.json({
        success: result.success,
        company: result.company,
        totalEntries: result.totalEntries,
        totalDebe: result.summary.totalDebe,
        totalHaber: result.summary.totalHaber,
        entriesProcessed: result.entriesProcessed,
        entriesWithAuxiliar1Override: result.entriesWithAuxiliar1Override,
        entriesFromMapping: result.entriesFromMapping,
        entriesDefault: result.entriesDefault,
        byCostCenter: result.summary.byCostCenter,
        byCategory: result.summary.byCategory,
        errors: result.errors,
      });
    }

    const journal = await parseAccountingJournal(buffer);
    return NextResponse.json({
      company: journal.company,
      totalEntries: journal.totalEntries,
      totalDebe: journal.totalDebe,
      totalHaber: journal.totalHaber,
      dateRange: journal.dateRange,
    });
  } catch (error) {
    logger.error('[Family Office Import Journal]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
