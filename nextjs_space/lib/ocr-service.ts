import Tesseract from 'tesseract.js';

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
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
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
    console.error('Error en OCR:', error);
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
export async function processContract(
  imageFile: File | string
): Promise<OCRResult> {
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
