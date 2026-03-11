/**
 * POST /api/ai/process-escritura
 *
 * Recibe un PDF de escritura notarial, realiza OCR si es escaneado,
 * extrae datos estructurados con IA, guarda el documento en el repositorio
 * y crea/actualiza los registros en la app (Building, Unit, AssetAcquisition, Document).
 *
 * Flujo:
 * 1. Recibir PDF (FormData)
 * 2. Convertir páginas a imágenes (pdftoppm) - múltiples páginas
 * 3. OCR con Tesseract si no hay texto embebido
 * 4. Enviar texto a Claude para extracción estructurada
 * 5. Guardar PDF en repositorio (S3 o local)
 * 6. Crear Document en BD vinculado al edificio
 * 7. Crear/actualizar AssetAcquisition con precio de compra
 * 8. Devolver datos extraídos + acciones realizadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ESCRITURA_EXTRACTION_PROMPT = `Eres un experto en escrituras notariales españolas. Analiza este texto de una escritura y extrae TODOS los datos relevantes.

Responde SOLO con JSON válido (sin markdown) con esta estructura:
{
  "tipo_escritura": "compraventa_edificio|compraventa_vivienda|compraventa_local|compraventa_garajes|ampliacion_capital|otro",
  "numero_escritura": number,
  "fecha": "YYYY-MM-DD",
  "notario": "nombre completo",
  "comprador": {
    "nombre": "razón social completa",
    "nif": "CIF/NIF",
    "tipo": "SLU|SL|SA|persona_fisica"
  },
  "vendedor": {
    "nombre": "razón social completa",
    "nif": "CIF/NIF"
  },
  "precio_total": number,
  "forma_pago": "descripción breve",
  "inmueble": {
    "direccion": "dirección completa con número y ciudad",
    "ciudad": "Madrid|Barcelona|etc",
    "codigo_postal": "28XXX",
    "tipo": "edificio_residencial|local_comercial|garajes|vivienda|oficina",
    "descripcion": "breve descripción del inmueble"
  },
  "fincas": [
    {
      "numero_finca": "1",
      "tipo": "vivienda|local|garaje|trastero|oficina|sotano",
      "descripcion": "Ej: Vivienda 1ºA planta primera",
      "planta": "0|1|2|...|sotano|atico",
      "superficie_construida": number,
      "superficie_util": number,
      "referencia_catastral": "string o null",
      "valor_escriturado": number,
      "cuota_participacion": number,
      "registro_propiedad": "RP X de Ciudad, tomo, libro, folio, finca"
    }
  ],
  "datos_registrales": {
    "registro": "nombre del registro",
    "estado_cargas": "libre|con_cargas|descripción",
    "arrendamientos": "descripción si hay inquilinos mencionados"
  },
  "impuesto_aplicable": "ITP|IVA_AJD|exento",
  "resumen": "Resumen en 2-3 frases de la operación"
}

REGLAS:
- Si el OCR tiene errores, interpreta el texto correcto
- Los precios pueden estar en texto: "trescientos mil euros" = 300000
- Las superficies en texto: "ochenta metros cuadrados" = 80
- Extrae TODAS las fincas/unidades mencionadas
- Si no encuentras un dato, pon null
- Las referencias catastrales tienen formato: XXXXXXXYYZZZZZ (7 dígitos + 2 letras + 4 dígitos + letras)`;

async function extractTextFromPDF(pdfBuffer: Buffer, maxPages = 20): Promise<{ text: string; method: 'embedded' | 'ocr'; pages: number }> {
  const { spawn } = await import('child_process');
  const { writeFile, readFile, unlink, readdir } = await import('fs/promises');
  const { join } = await import('path');
  const os = await import('os');

  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const pdfPath = join(tmpDir, `esc_${ts}.pdf`);
  await writeFile(pdfPath, pdfBuffer);

  // First try pdftotext (embedded text)
  let embeddedText = '';
  try {
    embeddedText = await new Promise<string>((resolve, reject) => {
      const proc = spawn('pdftotext', ['-l', String(maxPages), pdfPath, '-']);
      let out = '';
      proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
      proc.on('close', (code: number) => { if (code === 0) resolve(out); else reject(new Error('pdftotext failed')); });
      proc.on('error', reject);
    });
  } catch { /* pdftotext not available or failed */ }

  const cleanText = embeddedText.replace(/\s+/g, ' ').trim();
  if (cleanText.length > 500) {
    await unlink(pdfPath).catch(() => {});
    return { text: embeddedText, method: 'embedded', pages: maxPages };
  }

  // Fallback: OCR with pdftoppm + tesseract
  logger.info('[Escritura OCR] PDF escaneado detectado, procesando con OCR...');

  const imgPrefix = join(tmpDir, `esc_img_${ts}`);
  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('pdftoppm', ['-png', '-f', '1', '-l', String(maxPages), '-r', '200', pdfPath, imgPrefix]);
      proc.on('close', (code: number) => { if (code === 0) resolve(); else reject(new Error('pdftoppm failed')); });
      proc.on('error', reject);
    });
  } catch (e) {
    await unlink(pdfPath).catch(() => {});
    throw new Error('pdftoppm no disponible para OCR de PDFs escaneados');
  }

  // Find generated images and OCR each
  const allFiles = await readdir(tmpDir);
  const imgFiles = allFiles
    .filter(f => f.startsWith(`esc_img_${ts}`) && f.endsWith('.png'))
    .sort();

  let ocrText = '';
  let pagesProcessed = 0;

  for (const imgFile of imgFiles) {
    const imgPath = join(tmpDir, imgFile);
    try {
      const pageText = await new Promise<string>((resolve, reject) => {
        const proc = spawn('tesseract', [imgPath, 'stdout', '-l', 'spa']);
        let out = '';
        proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
        proc.on('close', (code: number) => { resolve(out); });
        proc.on('error', () => { resolve(''); });
      });
      if (pageText.trim()) {
        ocrText += `\n--- PAGE ${pagesProcessed + 1} ---\n${pageText}`;
      }
      pagesProcessed++;
    } finally {
      await unlink(imgPath).catch(() => {});
    }
  }

  await unlink(pdfPath).catch(() => {});
  return { text: ocrText, method: 'ocr', pages: pagesProcessed };
}

async function extractDataWithAI(text: string, fileName: string): Promise<any> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no configurada');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const truncated = text.substring(0, 15000);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `${ESCRITURA_EXTRACTION_PROMPT}\n\nArchivo: ${fileName}\n\nTexto de la escritura:\n${truncated}`,
    }],
  });

  const content = response.content.find((c: any) => c.type === 'text') as any;
  const rawText = content?.text || '';

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* parse error */ }

  return { raw: rawText, parseError: true };
}

async function storeDocument(
  pdfBuffer: Buffer,
  fileName: string,
  companyId: string,
  buildingId: string | null,
  extractedData: any,
) {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  let storagePath = `escrituras/${Date.now()}-${fileName}`;

  // Try S3 first
  try {
    const { uploadToS3, isS3Configured } = await import('@/lib/aws-s3-service');
    if (isS3Configured()) {
      const result = await uploadToS3(pdfBuffer, 'escrituras', 'document', fileName, 'application/pdf');
      storagePath = result.key || storagePath;
      logger.info(`[Escritura] Guardada en S3: ${storagePath}`);
    }
  } catch {
    // S3 not available, use local
    try {
      const { saveFile } = await import('@/lib/local-storage');
      const result = await saveFile(pdfBuffer, `escrituras/${fileName}`, { type: 'escritura' });
      storagePath = result.path;
      logger.info(`[Escritura] Guardada localmente: ${storagePath}`);
    } catch { /* local storage also failed */ }
  }

  // Create Document record
  const doc = await prisma.document.create({
    data: {
      nombre: `Escritura ${extractedData.numero_escritura || ''} - ${extractedData.inmueble?.direccion || fileName}`,
      tipo: 'otro',
      descripcion: extractedData.resumen || `${extractedData.tipo_escritura} (${extractedData.fecha})`,
      cloudStoragePath: storagePath,
      ...(buildingId && { buildingId }),
      tags: ['escritura', extractedData.tipo_escritura, extractedData.fecha?.substring(0, 4)].filter(Boolean),
    },
  });

  return doc;
}

async function createOrUpdateAssetAcquisition(
  companyId: string,
  buildingId: string | null,
  extractedData: any,
) {
  if (!extractedData.precio_total || extractedData.precio_total <= 0) return null;

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const notas = [
    `Escritura nº ${extractedData.numero_escritura}`,
    extractedData.notario ? `Notario: ${extractedData.notario}` : null,
    extractedData.vendedor?.nombre ? `Vendedor: ${extractedData.vendedor.nombre}` : null,
    extractedData.vendedor?.nif ? `NIF vendedor: ${extractedData.vendedor.nif}` : null,
    extractedData.forma_pago ? `Pago: ${extractedData.forma_pago}` : null,
    extractedData.impuesto_aplicable ? `Impuesto: ${extractedData.impuesto_aplicable}` : null,
  ].filter(Boolean).join('\n');

  const refCatastral = extractedData.fincas?.[0]?.referencia_catastral || null;

  const existing = buildingId
    ? await prisma.assetAcquisition.findFirst({ where: { companyId, buildingId } })
    : null;

  if (existing) {
    const updated = await prisma.assetAcquisition.update({
      where: { id: existing.id },
      data: {
        precioCompra: extractedData.precio_total,
        inversionTotal: extractedData.precio_total,
        valorContableNeto: extractedData.precio_total,
        fechaAdquisicion: new Date(extractedData.fecha),
        ...(refCatastral && { referenciaCatastral: refCatastral }),
        notas,
      },
    });
    return { action: 'updated', id: updated.id };
  }

  const created = await prisma.assetAcquisition.create({
    data: {
      companyId,
      ...(buildingId && { buildingId }),
      assetType: 'otro',
      fechaAdquisicion: new Date(extractedData.fecha || new Date()),
      precioCompra: extractedData.precio_total,
      inversionTotal: extractedData.precio_total,
      valorContableNeto: extractedData.precio_total,
      ...(refCatastral && { referenciaCatastral: refCatastral }),
      notas,
    },
  });
  return { action: 'created', id: created.id };
}

async function findOrSuggestBuilding(extractedData: any, companyId: string) {
  if (!extractedData.inmueble?.direccion) return null;

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const addr = extractedData.inmueble.direccion;
  const words = addr.split(/[\s,]+/).filter((w: string) => w.length > 3 && !/^\d+$/.test(w));

  for (const word of words) {
    const building = await prisma.building.findFirst({
      where: {
        companyId,
        OR: [
          { nombre: { contains: word, mode: 'insensitive' } },
          { direccion: { contains: word, mode: 'insensitive' } },
        ],
      },
    });
    if (building) return building;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('text') as string | null;

    if (!file && !pastedText) {
      return NextResponse.json({ error: 'Se requiere un archivo PDF o texto' }, { status: 400 });
    }

    const actions: string[] = [];
    let extractedData: any = {};
    let ocrMethod = 'text';
    let pagesProcessed = 0;

    // STEP 1: Extract text
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      logger.info(`[Escritura] Procesando: ${file.name} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);

      const result = await extractTextFromPDF(buffer, 25);
      ocrMethod = result.method;
      pagesProcessed = result.pages;
      actions.push(`Texto extraído: ${result.method === 'ocr' ? 'OCR Tesseract' : 'texto embebido'} (${result.pages} páginas)`);

      if (result.text.trim().length < 100) {
        return NextResponse.json({
          error: 'No se pudo extraer texto del PDF. El archivo puede estar dañado o protegido.',
        }, { status: 422 });
      }

      // STEP 2: AI extraction
      extractedData = await extractDataWithAI(result.text, file.name);
      actions.push('Datos extraídos con IA');

      if (extractedData.parseError) {
        return NextResponse.json({
          success: true,
          data: {
            extractedData: null,
            rawAnalysis: extractedData.raw,
            actions,
            warning: 'La IA no pudo estructurar los datos. Revisa el análisis en bruto.',
          },
        });
      }

      // STEP 3: Find matching building
      const building = await findOrSuggestBuilding(extractedData, companyId);
      const buildingId = building?.id || null;
      if (building) {
        actions.push(`Edificio encontrado: ${building.nombre}`);
      } else {
        actions.push('Edificio no encontrado en BD - pendiente de vincular manualmente');
      }

      // STEP 4: Store document
      const doc = await storeDocument(buffer, file.name, companyId, buildingId, extractedData);
      actions.push(`Documento guardado: ${doc.id}`);

      // STEP 5: Create/update AssetAcquisition
      if (extractedData.precio_total) {
        const assetResult = await createOrUpdateAssetAcquisition(companyId, buildingId, extractedData);
        if (assetResult) {
          actions.push(`AssetAcquisition ${assetResult.action}: ${assetResult.id} (${extractedData.precio_total.toLocaleString('es-ES')}€)`);
        }
      }
    } else if (pastedText) {
      extractedData = await extractDataWithAI(pastedText, 'texto-pegado');
      actions.push('Datos extraídos con IA desde texto pegado');
    }

    return NextResponse.json({
      success: true,
      data: {
        extractedData,
        ocrMethod,
        pagesProcessed,
        actions,
        summary: extractedData.resumen || null,
      },
    });
  } catch (error: any) {
    logger.error('[Process Escritura]:', error);
    return NextResponse.json({
      error: error.message || 'Error procesando escritura',
    }, { status: 500 });
  }
}
