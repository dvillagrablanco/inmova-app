/**
 * Servicio de extracción de datos desde documentos PDF/DOCX en S3.
 *
 * Usa pdftotext + Claude Anthropic para extraer:
 *   - Contratos de alquiler → renta, fianza, fechas, garante, tenant, IBAN
 *   - Escrituras → precio, RC catastral, superficie, vendedor, comprador
 *   - Recibos IBI → importe, año, RC
 *   - Pólizas seguro → número póliza, prima, suma asegurada
 *   - SEPA → IBAN, mandato
 *   - Justificantes fianza → importe depósito
 *
 * Procesa en batch desde S3 y actualiza Inmova automáticamente.
 */
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import Anthropic from '@anthropic-ai/sdk';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import logger from '@/lib/logger';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const BUCKET = process.env.AWS_BUCKET || 'inmova';

export type DocType =
  | 'contrato_alquiler'
  | 'escritura_compraventa'
  | 'recibo_ibi'
  | 'poliza_seguro'
  | 'sepa'
  | 'fianza'
  | 'otro';

export interface ExtractedContractData {
  tipo: 'contrato_alquiler';
  numeroContrato?: string;
  fechaInicio?: string;
  fechaFin?: string;
  duracionMeses?: number;
  rentaMensual?: number;
  fianza?: number;
  mesesFianza?: number;
  diaPago?: number;
  arrendador?: string;
  arrendadorNif?: string;
  arrendatario?: string;
  arrendatarioNif?: string;
  arrendatarioTelefono?: string;
  arrendatarioEmail?: string;
  garante?: string;
  garanteNif?: string;
  iban?: string;
  inmueble?: {
    direccion?: string;
    descripcion?: string;
    referenciaCatastral?: string;
  };
  ipc?: boolean;
  resumen?: string;
}

export interface ExtractedSepaData {
  tipo: 'sepa';
  iban?: string;
  bic?: string;
  titular?: string;
  titularNif?: string;
  acreedor?: string;
  acreedorId?: string;
  mandatoId?: string;
  fecha?: string;
}

export interface ExtractedFianzaData {
  tipo: 'fianza';
  importe?: number;
  numeroExpediente?: string;
  organismo?: string;
  fecha?: string;
  arrendatario?: string;
  inmueble?: string;
}

export interface ExtractedPolicyData {
  tipo: 'poliza_seguro';
  numeroPoliza?: string;
  aseguradora?: string;
  primaAnual?: number;
  primaMensual?: number;
  sumaAsegurada?: number;
  fechaInicio?: string;
  fechaVencimiento?: string;
  cobertura?: string[];
  inmueble?: string;
}

export type ExtractedData =
  | ExtractedContractData
  | ExtractedSepaData
  | ExtractedFianzaData
  | ExtractedPolicyData
  | { tipo: 'otro'; resumen?: string };

/**
 * Detecta el tipo de documento por el nombre.
 */
export function detectDocType(filename: string): DocType {
  const n = filename.toLowerCase();
  if (n.includes('sepa') || n.includes('mandato')) return 'sepa';
  if (
    n.includes('fianza') ||
    n.includes('depos') ||
    n.includes('modelo_25') ||
    n.includes('justificante')
  )
    return 'fianza';
  if (n.includes('poliza') || n.includes('seguro')) return 'poliza_seguro';
  if (n.includes('escritura') || n.includes('notario')) return 'escritura_compraventa';
  if (n.includes('ibi')) return 'recibo_ibi';
  if (
    n.includes('contrato') ||
    n.includes('arrendamiento') ||
    n.includes('alquiler') ||
    n.includes('adenda')
  )
    return 'contrato_alquiler';
  return 'otro';
}

/**
 * Descarga el PDF de S3 a /tmp.
 */
async function downloadFromS3(key: string, localPath: string): Promise<void> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const result = await s3.send(cmd);
  if (!result.Body) throw new Error('Empty body from S3');
  const chunks: Buffer[] = [];
  // @ts-expect-error AsyncIterable
  for await (const chunk of result.Body) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  await writeFile(localPath, buffer);
}

/**
 * Convierte PDF a texto. Primero intenta pdftotext (PDF nativo); si devuelve
 * vacío (PDF escaneado), hace OCR con Tesseract sobre las páginas convertidas
 * a imagen con pdftoppm.
 */
function pdfToText(localPath: string): string {
  // Intento 1: pdftotext directo
  try {
    const out = execSync(`pdftotext -layout -nopgbrk "${localPath}" -`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
    if (out.trim().length > 100) {
      return out.substring(0, 100_000);
    }
  } catch (e) {
    logger.warn(`[DocExtractor] pdftotext failed for ${localPath}`);
  }

  // Intento 2: OCR con Tesseract (PDF escaneado)
  // Usar pdftoppm para convertir a PNG y luego tesseract en cada página
  try {
    const tmpBase = localPath.replace(/\.pdf$/i, '_ocr');
    // Convertir hasta 5 páginas a PNG (resolución 200 DPI)
    execSync(
      `pdftoppm -png -r 200 -l 5 "${localPath}" "${tmpBase}" 2>/dev/null`,
      { timeout: 120_000 }
    );
    let allText = '';
    for (let i = 1; i <= 5; i++) {
      const pageImg = `${tmpBase}-${i.toString().padStart(2, '0')}.png`;
      const pageImgAlt = `${tmpBase}-${i}.png`;
      const imgPath = require('fs').existsSync(pageImg)
        ? pageImg
        : require('fs').existsSync(pageImgAlt)
          ? pageImgAlt
          : null;
      if (!imgPath) break;
      try {
        const ocrOut = execSync(`tesseract "${imgPath}" - -l spa+eng 2>/dev/null`, {
          encoding: 'utf-8',
          maxBuffer: 50 * 1024 * 1024,
          timeout: 60_000,
        });
        allText += ocrOut + '\n\n';
        // Limpiar
        require('fs').unlinkSync(imgPath);
      } catch {
        // skip page
      }
    }
    return allText.substring(0, 100_000);
  } catch (e: any) {
    logger.warn(`[DocExtractor] OCR also failed: ${e?.message}`);
    return '';
  }
}

const PROMPTS: Record<DocType, string> = {
  contrato_alquiler: `Eres un experto en contratos de alquiler españoles. Extrae todos los datos relevantes en JSON (sin markdown):
{
  "tipo": "contrato_alquiler",
  "numeroContrato": "string o null",
  "fechaInicio": "YYYY-MM-DD o null",
  "fechaFin": "YYYY-MM-DD o null",
  "duracionMeses": number o null,
  "rentaMensual": number en euros (sin IVA si menciona explícito),
  "fianza": number,
  "mesesFianza": number,
  "diaPago": number (1-31),
  "arrendador": "razón social",
  "arrendadorNif": "CIF/NIF",
  "arrendatario": "nombre completo",
  "arrendatarioNif": "DNI/NIE",
  "arrendatarioTelefono": "tel o null",
  "arrendatarioEmail": "email o null",
  "garante": "nombre completo o null",
  "garanteNif": "DNI/NIE o null",
  "iban": "IBAN del cobro o null",
  "inmueble": {
    "direccion": "dirección completa",
    "descripcion": "breve descripción (planta, puerta, garaje X)",
    "referenciaCatastral": "RC 20 chars o null"
  },
  "ipc": true/false (cláusula actualización IPC),
  "resumen": "1-2 frases"
}

REGLAS: Si la información no está en el documento, usa null. Para fianza, si dice "una mensualidad" ponla = renta mensual.`,

  sepa: `Eres un experto en mandatos SEPA bancarios. Extrae los datos en JSON:
{
  "tipo": "sepa",
  "iban": "IBAN sin espacios",
  "bic": "BIC/SWIFT o null",
  "titular": "nombre completo del titular",
  "titularNif": "DNI/NIE/CIF",
  "acreedor": "nombre del acreedor (Inmova/Viroda/Vidaro/Rovida)",
  "acreedorId": "ID acreedor SEPA o null",
  "mandatoId": "referencia mandato o null",
  "fecha": "YYYY-MM-DD"
}`,

  fianza: `Eres un experto en justificantes de fianza arrendaticia. Extrae:
{
  "tipo": "fianza",
  "importe": number,
  "numeroExpediente": "string o null",
  "organismo": "IVIMA/Generalitat/Junta Castilla León/etc",
  "fecha": "YYYY-MM-DD",
  "arrendatario": "nombre del inquilino que la deposita",
  "inmueble": "dirección breve o referencia"
}`,

  poliza_seguro: `Extrae datos de la póliza de seguro en JSON:
{
  "tipo": "poliza_seguro",
  "numeroPoliza": "string",
  "aseguradora": "nombre",
  "primaAnual": number,
  "primaMensual": number,
  "sumaAsegurada": number,
  "fechaInicio": "YYYY-MM-DD",
  "fechaVencimiento": "YYYY-MM-DD",
  "cobertura": ["incendio", "robo", "responsabilidad civil", ...],
  "inmueble": "dirección o nombre del activo asegurado"
}`,

  escritura_compraventa: `Extrae datos de la escritura notarial en JSON (igual que /api/ai/process-escritura).`,

  recibo_ibi: `Extrae datos del recibo IBI:
{
  "tipo": "recibo_ibi",
  "ejercicio": number,
  "importe": number,
  "referenciaCatastral": "RC o null",
  "valorCatastral": number o null,
  "titular": "nombre del titular",
  "ayuntamiento": "ciudad"
}`,

  otro: `Extrae cualquier dato relevante en JSON con la clave 'tipo': 'otro' y 'resumen'.`,
};

/**
 * Extrae datos estructurados con Claude desde el texto de un documento.
 */
export async function extractDataFromText(
  text: string,
  docType: DocType
): Promise<ExtractedData | null> {
  if (!text || text.trim().length < 50) return null;
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const prompt = PROMPTS[docType];
  const truncatedText = text.substring(0, 50_000); // ~12k tokens

  try {
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nTEXTO DEL DOCUMENTO:\n${truncatedText}\n\nResponde SOLO con el JSON.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;
    const raw = content.text.trim();

    // Parse: limpiar markdown fences
    const jsonStr = raw
      .replace(/^```json?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    return JSON.parse(jsonStr);
  } catch (e: any) {
    logger.warn(`[DocExtractor] Extraction failed: ${e.message}`);
    return null;
  }
}

/**
 * Procesa un documento de S3 (key) y devuelve datos extraídos.
 */
export async function processS3Document(
  s3Key: string,
  docType?: DocType
): Promise<{ docType: DocType; text: string; data: ExtractedData | null } | null> {
  // Solo procesar PDFs
  if (!s3Key.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  const tmpDir = '/tmp/vidaro-docs';
  if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });
  const localPath = path.join(tmpDir, `${Date.now()}-${path.basename(s3Key)}`);

  try {
    await downloadFromS3(s3Key, localPath);
    const text = pdfToText(localPath);
    if (!text) {
      return { docType: docType || 'otro', text: '', data: null };
    }
    const detected = docType || detectDocType(path.basename(s3Key));
    const data = await extractDataFromText(text, detected);
    return { docType: detected, text, data };
  } catch (e: any) {
    logger.warn(`[DocExtractor] Process failed for ${s3Key}: ${e.message}`);
    return null;
  } finally {
    try {
      await unlink(localPath);
    } catch {
      // ignore
    }
  }
}
