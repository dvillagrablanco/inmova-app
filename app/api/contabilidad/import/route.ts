export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

/**
 * POST /api/contabilidad/import
 *
 * Endpoint para importación de datos contables:
 * - Acepta XLSX (diario general, índice subcuentas)
 * - Acepta CAMT.053 XML (movimientos bancarios)
 * - Acepta CSV (extractos)
 *
 * Extrae automáticamente: fianzas, ingresos, gastos, IBI, amortizaciones
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'super_admin' && role !== 'administrador') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as string; // 'diario', 'subcuentas', 'camt053', 'csv'
    const sociedad = formData.get('sociedad') as string; // 'rovida', 'vidaro', 'viroda'

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.toLowerCase();

    // Detect file type
    let detectedType = tipo;
    if (!detectedType) {
      if (filename.endsWith('.xml') || filename.includes('camt')) detectedType = 'camt053';
      else if (filename.includes('diario')) detectedType = 'diario';
      else if (filename.includes('subcuenta')) detectedType = 'subcuentas';
      else if (filename.endsWith('.csv')) detectedType = 'csv';
      else detectedType = 'diario';
    }

    logger.info('[Contabilidad Import]', {
      filename: file.name,
      size: buffer.length,
      tipo: detectedType,
      sociedad,
      user: session.user.email,
    });

    // Save to /tmp for processing
    const fs = await import('fs');
    const path = await import('path');
    const tmpDir = '/tmp/contabilidad-import';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `${Date.now()}_${file.name}`);
    fs.writeFileSync(tmpPath, buffer);

    // Return metadata - actual processing happens via scripts
    return NextResponse.json({
      success: true,
      message: `Archivo ${file.name} recibido. Tipo: ${detectedType}`,
      metadata: {
        filename: file.name,
        size: buffer.length,
        tipo: detectedType,
        sociedad,
        tmpPath,
        processedAt: new Date().toISOString(),
      },
      nextSteps: detectedType === 'camt053'
        ? 'Ejecutar: npx tsx scripts/import-bank-movements-camt053.ts'
        : detectedType === 'diario'
          ? 'Los datos del diario se procesan con los scripts de seed'
          : 'Archivo guardado para procesamiento',
    });
  } catch (error: unknown) {
    logger.error('[Contabilidad Import]:', error);
    return NextResponse.json({ error: 'Error importando archivo' }, { status: 500 });
  }
}
