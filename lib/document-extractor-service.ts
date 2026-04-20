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
import { existsSync, unlinkSync } from 'fs';
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
 * Convierte PDF a texto.
 *
 * Solo intenta `pdftotext` (PDF nativo). Si devuelve vacío (PDF escaneado),
 * NO hace OCR (demasiado costoso para procesar masivamente).
 *
 * Los PDFs escaneados que requieren OCR se devolverán como '' y deben
 * procesarse aparte con un job dedicado más lento.
 *
 * Para forzar OCR en un PDF concreto, usar processS3DocumentWithOCR().
 */
function pdfToText(localPath: string, forceOcr = false): string {
  // Intento 1: pdftotext directo (solo PDFs nativos)
  try {
    const out = execSync(`pdftotext -layout -nopgbrk "${localPath}" -`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 15_000,
    });
    if (out.trim().length > 100) {
      return out.substring(0, 100_000);
    }
  } catch (e) {
    logger.warn(`[DocExtractor] pdftotext failed for ${localPath}`);
  }

  if (!forceOcr) {
    // Skip OCR para procesamiento masivo
    return '';
  }

  // Intento 2: OCR con Tesseract (solo si forceOcr=true)
  try {
    const tmpBase = localPath.replace(/\.pdf$/i, '_ocr');
    execSync(`pdftoppm -png -r 100 -f 1 -l 1 "${localPath}" "${tmpBase}" 2>/dev/null`, {
      timeout: 20_000,
      killSignal: 'SIGKILL',
    });
    const pageImg = `${tmpBase}-01.png`;
    const pageImgAlt = `${tmpBase}-1.png`;
    const imgPath = existsSync(pageImg)
      ? pageImg
      : existsSync(pageImgAlt)
        ? pageImgAlt
        : null;
    if (!imgPath) return '';
    let text = '';
    try {
      text = execSync(`tesseract "${imgPath}" - -l spa --psm 6 2>/dev/null`, {
        encoding: 'utf-8',
        maxBuffer: 20 * 1024 * 1024,
        timeout: 30_000,
        killSignal: 'SIGKILL',
      });
    } catch {
      // skip
    }
    try { unlinkSync(imgPath); } catch {}
    return text.substring(0, 30_000);
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
 *
 * @param forceOcr Si true, fuerza OCR para PDFs escaneados (lento)
 */
export async function processS3Document(
  s3Key: string,
  docType?: DocType,
  forceOcr = false
): Promise<{ docType: DocType; text: string; data: ExtractedData | null } | null> {
  if (!s3Key.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  const tmpDir = '/tmp/vidaro-docs';
  if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });
  const localPath = path.join(tmpDir, `${Date.now()}-${path.basename(s3Key)}`);

  try {
    await downloadFromS3(s3Key, localPath);
    const text = pdfToText(localPath, forceOcr);
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
