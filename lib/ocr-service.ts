import Tesseract from 'tesseract.js';
import logger, { logError } from '@/lib/logger';
import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Servicio de OCR usando Tesseract.js
 * Permite escanear documentos, DNIs, contratos, etc.
 */

export interface OCRResult {
  text: string;
  confidence: number;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  language: string;
  processingTime: number;
  fileType?: 'image' | 'pdf' | 'doc' | 'docx';
  pageCount?: number;
}

export interface DNIData {
  numeroDocumento?: string;
  nombre?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  sexo?: string;
  nacionalidad?: string;
  fechaExpedicion?: string;
  fechaCaducidad?: string;
}

/**
 * Procesa una imagen con OCR
 */
export async function processImageOCR(
  imageFile: File | string,
  language: string = 'spa+eng'
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const result: any = await Tesseract.recognize(imageFile, language, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Tesseract.js v4 structure - extract lines from result
    const lines = (result.data.words || result.data.lines || []).map((item: any) => ({
      text: item.text,
      confidence: item.confidence,
      bbox: item.bbox,
    }));

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      lines,
      language: language,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Error en OCR:', error);
    throw new Error('Error al procesar la imagen con OCR');
  }
}

/**
 * Extrae datos específicos de un DNI español
 */
export function extractDNIData(ocrText: string): DNIData {
  const data: DNIData = {};

  // Extraer número de documento (DNI formato español: 12345678A)
  const dniMatch = ocrText.match(/\b\d{8}[A-Z]\b/);
  if (dniMatch) {
    data.numeroDocumento = dniMatch[0];
  }

  // Extraer fechas (formato DD.MM.YYYY o DD/MM/YYYY)
  const fechaRegex = /\b\d{2}[./-]\d{2}[./-]\d{4}\b/g;
  const fechas = ocrText.match(fechaRegex);
  if (fechas && fechas.length > 0) {
    data.fechaNacimiento = fechas[0];
    if (fechas.length > 1) data.fechaExpedicion = fechas[1];
    if (fechas.length > 2) data.fechaCaducidad = fechas[2];
  }

  // Extraer sexo (M o F)
  const sexoMatch = ocrText.match(/\b(M|F|MASCULINO|FEMENINO)\b/);
  if (sexoMatch) {
    data.sexo = sexoMatch[0];
  }

  // Extraer nacionalidad (ESP, ESPAÑOLA, etc.)
  const nacionalidadMatch = ocrText.match(/\b(ESP|ESPAÑA|ESPAÑOLA?)\b/i);
  if (nacionalidadMatch) {
    data.nacionalidad = 'Española';
  }

  return data;
}

/**
 * Procesa un DNI específicamente
 */
export async function processDNI(imageFile: File | string): Promise<{
  ocrResult: OCRResult;
  dniData: DNIData;
}> {
  const ocrResult = await processImageOCR(imageFile, 'spa');
  const dniData = extractDNIData(ocrResult.text);

  return {
    ocrResult,
    dniData,
  };
}

/**
 * Procesa un contrato o documento legal
 */
export async function processContract(imageFile: File | string): Promise<OCRResult> {
  return await processImageOCR(imageFile, 'spa');
}

/**
 * Extrae información clave de un contrato
 */
export interface ContractData {
  fechaInicio?: string;
  fechaFin?: string;
  rentaMensual?: number;
  nombreInquilino?: string;
  direccionPropiedad?: string;
}

export function extractContractData(ocrText: string): ContractData {
  const data: ContractData = {};

  // Extraer fechas
  const fechaRegex = /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}\b/g;
  const fechas = ocrText.match(fechaRegex);
  if (fechas && fechas.length > 0) {
    data.fechaInicio = fechas[0];
    if (fechas.length > 1) data.fechaFin = fechas[1];
  }

  // Extraer renta mensual (buscar números seguidos de € o euros)
  const rentaMatch = ocrText.match(/(\d{1,4}(?:[.,]\d{2})?)\s*(?:€|euros?|EUR)/i);
  if (rentaMatch) {
    const rentaStr = rentaMatch[1].replace(',', '.');
    data.rentaMensual = parseFloat(rentaStr);
  }

  return data;
}

/**
 * Procesa un archivo PDF
 */
export async function processPDF(fileBuffer: Buffer): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const pdfData = await (pdfParse as any)(fileBuffer);

    // Extraer líneas del texto
    const lines = pdfData.text
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => ({
        text: line,
        confidence: 100, // PDF text extraction is 100% confident as it's native text
        bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
      }));

    return {
      text: pdfData.text,
      confidence: 100,
      lines,
      language: 'spa',
      processingTime: Date.now() - startTime,
      fileType: 'pdf',
      pageCount: pdfData.numpages,
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error al procesar PDF'));
    throw new Error('Error al procesar el archivo PDF');
  }
}

/**
 * Procesa un archivo DOC o DOCX
 */
export async function processDOC(fileBuffer: Buffer): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = result.value;

    // Extraer líneas del texto
    const lines = text
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => ({
        text: line,
        confidence: 100, // DOC text extraction is 100% confident as it's native text
        bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
      }));

    return {
      text,
      confidence: 100,
      lines,
      language: 'spa',
      processingTime: Date.now() - startTime,
      fileType: 'docx',
      pageCount: 1,
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error al procesar DOC/DOCX'));
    throw new Error('Error al procesar el archivo DOC/DOCX');
  }
}

/**
 * Función universal para procesar cualquier tipo de archivo
 * (imagen, PDF, DOC, DOCX)
 */
export async function processDocument(file: File | Buffer, fileType?: string): Promise<OCRResult> {
  // Determinar el tipo de archivo
  let type: string;
  if (file instanceof File) {
    type = file.type;
  } else if (fileType) {
    type = fileType;
  } else {
    throw new Error('No se pudo determinar el tipo de archivo');
  }

  // Procesar según el tipo
  if (type.includes('pdf') || type === 'application/pdf') {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    return await processPDF(buffer);
  } else if (
    type.includes('word') ||
    type.includes('document') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword'
  ) {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    return await processDOC(buffer);
  } else if (type.includes('image')) {
    // Para imágenes, usar el OCR existente
    return await processImageOCR(file as File, 'spa+eng');
  } else {
    throw new Error(`Tipo de archivo no soportado: ${type}`);
  }
}

/**
 * Validar tipo de archivo soportado
 */
export function isFileTypeSupported(fileType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  return supportedTypes.includes(fileType);
}

/**
 * Obtener tipos de archivo soportados para un input file
 */
export function getSupportedFileTypes(): string {
  return 'image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}
