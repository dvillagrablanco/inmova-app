/**
 * POST /api/family-office/upload-statement
 * Upload bank statements for processing:
 * - SWIFT MT940 (movements) — Banca March, CACEIS, etc.
 * - SWIFT MT535 (positions) — Inversis, CACEIS
 * - PDF (OCR with Claude) — Pictet, UBS, any bank
 * - CAMT.053 XML — Bankinter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bank = formData.get('bank') as string; // bankinter, inversis, caceis, pictet, ubs, banca_march
    const type = formData.get('type') as string; // mt940, mt535, pdf, camt053
    const companyId = formData.get('companyId') as string;
    const accountId = formData.get('accountId') as string;

    if (!file || !bank || !type) {
      return NextResponse.json({ error: 'file, bank y type son requeridos' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileSize = buffer.length;

    logger.info('[Upload Statement]', { bank, type, fileName, fileSize, companyId });

    // Upload to S3
    let s3Key: string;
    try {
      const { uploadFile } = await import('@/lib/s3');
      const timestamp = Date.now();
      s3Key = `financial-statements/${bank}/${timestamp}_${fileName}`;
      await uploadFile(s3Key, buffer, file.type || 'application/octet-stream');
    } catch (s3Error: any) {
      logger.warn('[Upload Statement] S3 upload failed, processing from memory:', s3Error.message);
      s3Key = `local:${fileName}`;
    }

    // Process based on type
    let result: any = { uploaded: true, s3Key, bank, type, fileName, fileSize };

    if (type === 'mt940') {
      // Parse SWIFT MT940 movements
      try {
        const { parseMT940 } = await import('@/lib/family-office/banking-integrations');
        const text = buffer.toString('utf-8');
        const parsed = parseMT940(text);
        result.parsed = {
          cuenta: parsed.cuenta,
          movimientos: parsed.movimientos.length,
          saldoInicial: parsed.saldoInicial,
          saldoFinal: parsed.saldoFinal,
        };
        result.message = `MT940 parseado: ${parsed.movimientos.length} movimientos`;
      } catch (e: any) {
        result.parseError = e.message;
      }
    } else if (type === 'mt535') {
      // Parse SWIFT MT535 positions
      try {
        const { parseMT535 } = await import('@/lib/parsers/swift-mt535-parser');
        const text = buffer.toString('utf-8');
        const parsed = parseMT535(text);
        result.parsed = parsed;
        result.message = `MT535 parseado: ${Array.isArray(parsed) ? parsed.length : 0} posiciones`;
      } catch (e: any) {
        result.parseError = e.message;
      }
    } else if (type === 'pdf') {
      // PDF — will be processed with Claude OCR
      result.message = 'PDF subido. Procesamiento OCR pendiente — usar /api/family-office/import/pictet-pdf para Pictet o enviar a Claude para extracción.';
      result.ocrEndpoint = '/api/family-office/import/pictet-pdf';
    } else if (type === 'camt053') {
      result.message = 'CAMT.053 subido. Usar script import-bank-movements-camt053.ts para importar.';
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('[Upload Statement]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET — List supported banks and file types
 */
export async function GET() {
  return NextResponse.json({
    supportedBanks: [
      { id: 'bankinter', name: 'Bankinter', types: ['camt053', 'mt940'], connection: 'psd2' },
      { id: 'inversis', name: 'Inversis', types: ['mt535', 'pdf'], connection: 'swift' },
      { id: 'caceis', name: 'CACEIS Bank', types: ['mt535', 'mt940'], connection: 'swift' },
      { id: 'pictet', name: 'Pictet & Cie', types: ['pdf'], connection: 'ocr_pdf' },
      { id: 'ubs', name: 'UBS', types: ['pdf'], connection: 'ocr_pdf' },
      { id: 'banca_march', name: 'Banca March', types: ['mt940', 'mt535'], connection: 'swift' },
      { id: 'andbank', name: 'AndBank', types: ['pdf', 'mt940'], connection: 'swift' },
      { id: 'bbva', name: 'BBVA', types: ['camt053', 'pdf'], connection: 'psd2' },
      { id: 'santander', name: 'Banco Santander', types: ['camt053', 'pdf'], connection: 'psd2' },
      { id: 'caixabank', name: 'CaixaBank', types: ['camt053', 'pdf'], connection: 'psd2' },
    ],
    fileTypes: {
      mt940: { description: 'SWIFT MT940 — Movimientos bancarios', format: 'text' },
      mt535: { description: 'SWIFT MT535 — Posiciones de custodia', format: 'text' },
      pdf: { description: 'Extracto PDF — OCR con IA (Claude)', format: 'binary' },
      camt053: { description: 'CAMT.053 — ISO 20022 XML', format: 'xml' },
    },
  });
}
