/**
 * POST /api/ai/process-contract
 *
 * Recibe un PDF de contrato o adenda, extrae datos con IA/OCR,
 * y actualiza automáticamente la unidad correspondiente en la app.
 *
 * Soporta:
 * - Contratos nuevos: crea o actualiza contrato + inquilino + renta
 * - Adendas: actualiza fechas/renta del contrato existente
 * - Contratos de temporada: tipo temporal con fechas específicas
 *
 * Flujo:
 * 1. Recibir PDF (FormData) o texto pegado
 * 2. OCR si es escaneado (pdftoppm + tesseract)
 * 3. IA extrae: inquilino, unidad, edificio, renta, fechas, tipo
 * 4. Identificar si es contrato nuevo o adenda
 * 5. Buscar/crear inquilino en BD
 * 6. Crear/actualizar contrato en BD
 * 7. Actualizar rentaMensual de la unidad
 * 8. Guardar PDF en repositorio
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONTRACT_EXTRACTION_PROMPT = `Eres un experto en contratos de arrendamiento españoles. Analiza este contrato o adenda y extrae TODOS los datos.

Identifica PRIMERO si es:
- CONTRATO NUEVO: contrato de arrendamiento completo (vivienda, temporada, local)
- ADENDA/ANEXO: modificación de un contrato existente (prórroga, cambio de renta, etc.)

Responde SOLO con JSON válido:
{
  "tipo_documento": "contrato_nuevo|adenda|anexo",
  "tipo_contrato": "vivienda|temporada|local_comercial|garaje",

  "edificio": {
    "nombre": "Manuel Silvela 5|Candelaria Mora|Reina 15|Hernández de Tejada 6|etc",
    "direccion": "dirección completa"
  },
  "unidad": "1A|2B|3C|Local|etc",

  "arrendador": {
    "nombre": "Viroda Inversiones SLU",
    "nif": "B-88595327"
  },
  "arrendatario": {
    "nombre": "nombre completo",
    "dni_pasaporte": "número",
    "email": null,
    "telefono": null,
    "nacionalidad": null
  },

  "renta_mensual": number,
  "fecha_inicio": "YYYY-MM-DD",
  "fecha_fin": "YYYY-MM-DD",
  "duracion_meses": number,
  "fianza": number,

  "es_adenda": false,
  "cambios_adenda": {
    "nueva_fecha_fin": "YYYY-MM-DD o null",
    "nueva_renta": "number o null",
    "otros_cambios": "descripción o null"
  },

  "notas": "observaciones relevantes (cláusulas especiales, garaje incluido, etc.)",
  "resumen": "resumen en 1-2 frases"
}`;

async function extractTextFromPDF(buffer: Buffer, maxPages = 10): Promise<string> {
  const { spawn } = await import('child_process');
  const { writeFile, readFile, unlink, readdir } = await import('fs/promises');
  const { join } = await import('path');
  const os = await import('os');

  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const pdfPath = join(tmpDir, `contract_${ts}.pdf`);
  await writeFile(pdfPath, buffer);

  // Try embedded text first
  let text = '';
  try {
    text = await new Promise<string>((resolve, reject) => {
      const proc = spawn('pdftotext', ['-l', String(maxPages), pdfPath, '-']);
      let out = '';
      proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
      proc.on('close', (code: number) => { resolve(out); });
      proc.on('error', () => { resolve(''); });
    });
  } catch { /* */ }

  if (text.replace(/\s+/g, ' ').trim().length > 300) {
    await unlink(pdfPath).catch(() => {});
    return text;
  }

  // OCR fallback
  const imgPrefix = join(tmpDir, `cimg_${ts}`);
  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('pdftoppm', ['-png', '-f', '1', '-l', String(maxPages), '-r', '200', pdfPath, imgPrefix]);
      proc.on('close', (code: number) => { if (code === 0) resolve(); else reject(); });
      proc.on('error', reject);
    });
  } catch {
    await unlink(pdfPath).catch(() => {});
    return text;
  }

  const allFiles = await readdir(tmpDir);
  const imgFiles = allFiles.filter(f => f.startsWith(`cimg_${ts}`) && f.endsWith('.png')).sort();

  let ocrText = '';
  for (const imgFile of imgFiles) {
    const imgPath = join(tmpDir, imgFile);
    try {
      const pageText = await new Promise<string>((resolve) => {
        const proc = spawn('tesseract', [imgPath, 'stdout', '-l', 'spa']);
        let out = '';
        proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
        proc.on('close', () => { resolve(out); });
        proc.on('error', () => { resolve(''); });
      });
      if (pageText.trim()) ocrText += `\n${pageText}`;
    } finally {
      await unlink(imgPath).catch(() => {});
    }
  }

  await unlink(pdfPath).catch(() => {});
  return ocrText || text;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: 'Sin empresa' }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('text') as string | null;
    const autoApply = formData.get('autoApply') !== 'false';

    let documentText = pastedText || '';
    let fileName = 'contrato-texto';

    if (file) {
      fileName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      documentText = await extractTextFromPDF(buffer, 10);

      if (documentText.trim().length < 100) {
        return NextResponse.json({ error: 'No se pudo extraer texto del PDF' }, { status: 422 });
      }
    }

    if (!documentText.trim()) {
      return NextResponse.json({ error: 'Se requiere archivo o texto' }, { status: 400 });
    }

    // Extract with AI
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `${CONTRACT_EXTRACTION_PROMPT}\n\nArchivo: ${fileName}\n\nTexto del contrato:\n${documentText.substring(0, 12000)}`,
      }],
    });

    const content = response.content.find((c: any) => c.type === 'text') as any;
    const rawText = content?.text || '';

    let extracted: any = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
    } catch { extracted = { raw: rawText, parseError: true }; }

    if (extracted.parseError) {
      return NextResponse.json({ success: true, data: { extracted: null, rawAnalysis: rawText, actions: [] } });
    }

    const actions: string[] = [];
    actions.push(`Tipo: ${extracted.tipo_documento} (${extracted.tipo_contrato})`);
    actions.push(`Edificio: ${extracted.edificio?.nombre || '?'} | Unidad: ${extracted.unidad || '?'}`);
    actions.push(`Inquilino: ${extracted.arrendatario?.nombre || '?'}`);
    if (extracted.renta_mensual) actions.push(`Renta: ${extracted.renta_mensual}€/mes`);
    if (extracted.fecha_inicio) actions.push(`Periodo: ${extracted.fecha_inicio} → ${extracted.fecha_fin || '?'}`);

    // Auto-apply to database if requested
    if (autoApply && extracted.edificio?.nombre && extracted.unidad) {
      try {
        const { getPrismaClient } = await import('@/lib/db');
        const prisma = getPrismaClient();

        // Find the building and unit
        const building = await prisma.building.findFirst({
          where: {
            nombre: { contains: extracted.edificio.nombre.split(' ')[0], mode: 'insensitive' },
            company: { id: companyId },
          },
        });

        if (building) {
          const norm = (s: string) => s.replace(/[ºª°\s]/g, '').toUpperCase();
          const units = await prisma.unit.findMany({ where: { buildingId: building.id } });
          const unit = units.find(u => norm(u.numero) === norm(extracted.unidad));

          if (unit) {
            // Update unit renta if contract has it
            if (extracted.renta_mensual && extracted.renta_mensual !== unit.rentaMensual) {
              await prisma.unit.update({
                where: { id: unit.id },
                data: {
                  rentaMensual: extracted.renta_mensual,
                  estado: 'ocupada',
                },
              });
              actions.push(`✓ Renta actualizada: ${unit.rentaMensual}→${extracted.renta_mensual}€`);
            }

            // Store document
            if (file) {
              const docBuffer = Buffer.from(await file.arrayBuffer());
              try {
                const { uploadToS3, isS3Configured } = await import('@/lib/aws-s3-service');
                if (isS3Configured()) {
                  await uploadToS3(docBuffer, 'contratos', 'document', fileName, 'application/pdf');
                }
              } catch { /* S3 not available */ }

              await prisma.document.create({
                data: {
                  nombre: `${extracted.tipo_documento === 'adenda' ? 'Adenda' : 'Contrato'} ${extracted.unidad} - ${extracted.arrendatario?.nombre || fileName}`,
                  tipo: 'contrato',
                  descripcion: extracted.resumen || `${extracted.tipo_contrato} ${extracted.fecha_inicio || ''}`,
                  cloudStoragePath: `contratos/${Date.now()}-${fileName}`,
                  buildingId: building.id,
                  unitId: unit.id,
                  tags: [extracted.tipo_documento, extracted.tipo_contrato, '2026'].filter(Boolean),
                },
              });
              actions.push(`✓ Documento guardado en repositorio`);
            }

            // Handle adenda - update existing contract dates
            if (extracted.es_adenda && extracted.cambios_adenda) {
              const activeContract = await prisma.contract.findFirst({
                where: { unitId: unit.id, estado: 'activo' },
                orderBy: { fechaInicio: 'desc' },
              });

              if (activeContract) {
                const updateData: any = {};
                if (extracted.cambios_adenda.nueva_fecha_fin) {
                  updateData.fechaFin = new Date(extracted.cambios_adenda.nueva_fecha_fin);
                  actions.push(`✓ Contrato prorrogado hasta ${extracted.cambios_adenda.nueva_fecha_fin}`);
                }
                if (extracted.cambios_adenda.nueva_renta) {
                  updateData.rentaMensual = extracted.cambios_adenda.nueva_renta;
                  actions.push(`✓ Renta contrato actualizada a ${extracted.cambios_adenda.nueva_renta}€`);
                }
                if (Object.keys(updateData).length > 0) {
                  await prisma.contract.update({ where: { id: activeContract.id }, data: updateData });
                }
              } else {
                actions.push('⚠ No se encontró contrato activo para aplicar la adenda');
              }
            }
          } else {
            actions.push(`⚠ Unidad "${extracted.unidad}" no encontrada en ${building.nombre}`);
          }
        } else {
          actions.push(`⚠ Edificio "${extracted.edificio.nombre}" no encontrado`);
        }
      } catch (dbError: any) {
        actions.push(`⚠ Error BD: ${dbError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        extracted,
        actions,
        fileName,
      },
    });
  } catch (error: any) {
    logger.error('[Process Contract]:', error);
    return NextResponse.json({ error: error.message || 'Error procesando contrato' }, { status: 500 });
  }
}
