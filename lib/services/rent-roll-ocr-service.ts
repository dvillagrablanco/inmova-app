import { InvestmentAnalysisService } from './investment-analysis-service';

export interface RentRollUnit {
  unitNumber: string;
  tenant?: string;
  occupied: boolean;
  currentRent: number;
  marketRent?: number;
  leaseStart?: Date;
  leaseEnd?: Date;
  deposit?: number;
  squareMeters?: number;
}

export interface ParsedRentRoll {
  buildingName?: string;
  address?: string;
  totalUnits: number;
  occupiedUnits: number;
  totalMonthlyRent: number;
  averageRentPerUnit: number;
  occupancyRate: number;
  units: RentRollUnit[];
  additionalInfo?: {
    propertyManager?: string;
    propertyTax?: number;
    insurance?: number;
    communityFees?: number;
  };
}

export class RentRollOCRService {
  /**
   * Procesa un documento de rent roll usando OCR
   */
  static async processDocument(
    fileBuffer: Buffer,
    fileName: string,
    userId: string
  ): Promise<ParsedRentRoll> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
      case 'pdf':
        return await this.processPDF(fileBuffer);
      case 'xlsx':
      case 'xls':
        return await this.processExcel(fileBuffer);
      case 'csv':
        return await this.processCSV(fileBuffer);
      case 'jpg':
      case 'jpeg':
      case 'png':
        return await this.processImage(fileBuffer);
      default:
        throw new Error('Formato de archivo no soportado');
    }
  }

  /**
   * Procesa un PDF de rent roll
   */
  private static async processPDF(buffer: Buffer): Promise<ParsedRentRoll> {
    // Implementación con pdf-parse o similar
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    
    return this.parseRentRollText(data.text);
  }

  /**
   * Procesa un Excel de rent roll
   */
  private static async processExcel(buffer: Buffer): Promise<ParsedRentRoll> {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    return this.parseRentRollData(data);
  }

  /**
   * Procesa un CSV de rent roll
   */
  private static async processCSV(buffer: Buffer): Promise<ParsedRentRoll> {
    const csv = require('csv-parse/sync');
    const records = csv.parse(buffer, {
      columns: true,
      skip_empty_lines: true,
    });

    return this.parseRentRollData(records);
  }

  /**
   * Procesa una imagen de rent roll usando OCR
   */
  private static async processImage(buffer: Buffer): Promise<ParsedRentRoll> {
    // Implementación con Tesseract.js u otro servicio OCR
    const Tesseract = require('tesseract.js');
    
    const { data: { text } } = await Tesseract.recognize(buffer, 'spa', {
      logger: m => console.log(m),
    });

    return this.parseRentRollText(text);
  }

  /**
   * Parse texto extraído de OCR
   */
  private static parseRentRollText(text: string): ParsedRentRoll {
    const lines = text.split('\n').filter(line => line.trim());
    const units: RentRollUnit[] = [];
    
    let buildingName: string | undefined;
    let address: string | undefined;
    let totalMonthlyRent = 0;

    // Patrones comunes en rent rolls
    const unitPattern = /(?:apto|apt|piso|local|unit)[\s#-]*(\d+[a-z]?)/i;
    const rentPattern = /€?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*€?/;
    const occupiedPattern = /(ocupado|occupied|alquilado|rented)/i;
    const vacantPattern = /(vacante|vacant|libre|disponible)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Intentar extraer nombre del edificio (primeras líneas)
      if (i < 3 && !buildingName && line.length > 5 && line.length < 100) {
        if (!line.match(/rent roll|informe|reporte/i)) {
          buildingName = line.trim();
        }
      }

      // Intentar extraer dirección
      if (line.match(/dirección|address|calle|avenida|av\./i) && !address) {
        address = line.replace(/dirección|address/i, '').trim();
      }

      // Buscar unidades
      const unitMatch = line.match(unitPattern);
      if (unitMatch) {
        const unitNumber = unitMatch[1];
        const rentMatch = line.match(rentPattern);
        const currentRent = rentMatch ? parseFloat(rentMatch[1].replace(/[,\.]/g, '')) : 0;
        const occupied = !line.match(vacantPattern) && (line.match(occupiedPattern) || currentRent > 0);

        units.push({
          unitNumber,
          currentRent,
          occupied,
        });

        if (currentRent > 0) {
          totalMonthlyRent += currentRent;
        }
      }
    }

    const occupiedUnits = units.filter(u => u.occupied).length;
    const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

    return {
      buildingName,
      address,
      totalUnits: units.length,
      occupiedUnits,
      totalMonthlyRent,
      averageRentPerUnit: units.length > 0 ? totalMonthlyRent / units.length : 0,
      occupancyRate,
      units,
    };
  }

  /**
   * Parse datos estructurados (Excel/CSV)
   */
  private static parseRentRollData(data: any[]): ParsedRentRoll {
    const units: RentRollUnit[] = [];
    let totalMonthlyRent = 0;

    // Mapeo de columnas comunes
    const columnMappings: { [key: string]: string } = {
      'unit': 'unitNumber',
      'unidad': 'unitNumber',
      'apt': 'unitNumber',
      'apartamento': 'unitNumber',
      'piso': 'unitNumber',
      'tenant': 'tenant',
      'inquilino': 'tenant',
      'arrendatario': 'tenant',
      'rent': 'currentRent',
      'renta': 'currentRent',
      'alquiler': 'currentRent',
      'occupied': 'occupied',
      'ocupado': 'occupied',
      'status': 'occupied',
      'estado': 'occupied',
      'lease_start': 'leaseStart',
      'inicio_contrato': 'leaseStart',
      'lease_end': 'leaseEnd',
      'fin_contrato': 'leaseEnd',
      'deposit': 'deposit',
      'deposito': 'deposit',
      'fianza': 'deposit',
      'sqm': 'squareMeters',
      'm2': 'squareMeters',
      'metros': 'squareMeters',
    };

    for (const row of data) {
      const unit: Partial<RentRollUnit> = {};
      
      // Normalizar nombres de columnas y mapear
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
        const mappedKey = columnMappings[normalizedKey];

        if (mappedKey) {
          if (mappedKey === 'currentRent' || mappedKey === 'marketRent' || mappedKey === 'deposit') {
            // Limpiar y convertir a número
            const numValue = typeof value === 'string' 
              ? parseFloat(value.replace(/[€$,\s]/g, ''))
              : Number(value);
            unit[mappedKey] = isNaN(numValue) ? 0 : numValue;
          } else if (mappedKey === 'occupied') {
            // Convertir a booleano
            unit[mappedKey] = this.parseBoolean(value);
          } else if (mappedKey === 'leaseStart' || mappedKey === 'leaseEnd') {
            // Convertir a fecha
            unit[mappedKey] = this.parseDate(value);
          } else {
            unit[mappedKey] = value;
          }
        }
      }

      // Validar que tenga al menos número de unidad
      if (unit.unitNumber) {
        // Si no tiene estado de ocupación, inferirlo de la renta
        if (unit.occupied === undefined) {
          unit.occupied = (unit.currentRent || 0) > 0;
        }

        units.push(unit as RentRollUnit);

        if (unit.currentRent && unit.occupied) {
          totalMonthlyRent += unit.currentRent;
        }
      }
    }

    const occupiedUnits = units.filter(u => u.occupied).length;
    const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

    return {
      totalUnits: units.length,
      occupiedUnits,
      totalMonthlyRent,
      averageRentPerUnit: units.length > 0 ? totalMonthlyRent / units.length : 0,
      occupancyRate,
      units,
    };
  }

  /**
   * Convierte string a booleano
   */
  private static parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    
    const strValue = String(value).toLowerCase().trim();
    return ['true', 'yes', 'si', 'sí', 'ocupado', 'occupied', 'rented', '1'].includes(strValue);
  }

  /**
   * Convierte string a fecha
   */
  private static parseDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Guarda rent roll en base de datos
   */
  static async saveRentRoll(
    userId: string,
    propertyId: string | undefined,
    parsedData: ParsedRentRoll,
    originalFileName: string
  ) {
    const { prisma } = require('@/lib/prisma');

    return await prisma.rentRoll.create({
      data: {
        userId,
        propertyId,
        fileName: originalFileName,
        buildingName: parsedData.buildingName,
        address: parsedData.address,
        totalUnits: parsedData.totalUnits,
        occupiedUnits: parsedData.occupiedUnits,
        totalMonthlyRent: parsedData.totalMonthlyRent,
        occupancyRate: parsedData.occupancyRate,
        units: parsedData.units as any,
        additionalInfo: parsedData.additionalInfo as any,
      },
    });
  }

  /**
   * Vincula rent roll con análisis de inversión
   */
  static async linkToInvestmentAnalysis(
    rentRollId: string,
    userId: string,
    purchasePrice: number,
    additionalParams?: any
  ) {
    const data = await InvestmentAnalysisService.createFromRentRoll(
      rentRollId,
      userId,
      { purchasePrice, ...additionalParams }
    );

    return data;
  }

  /**
   * Valida rent roll
   */
  static validateRentRoll(parsedData: ParsedRentRoll): {
    valid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validaciones críticas
    if (parsedData.units.length === 0) {
      errors.push('No se encontraron unidades en el documento');
    }

    if (parsedData.totalMonthlyRent === 0) {
      errors.push('No se encontró información de rentas');
    }

    // Validaciones de advertencia
    if (parsedData.occupancyRate < 70) {
      warnings.push(`Tasa de ocupación baja: ${parsedData.occupancyRate.toFixed(1)}%`);
    }

    if (parsedData.occupancyRate > 100) {
      errors.push('Tasa de ocupación inválida (>100%)');
    }

    const unitsWithoutRent = parsedData.units.filter(u => u.occupied && u.currentRent === 0);
    if (unitsWithoutRent.length > 0) {
      warnings.push(`${unitsWithoutRent.length} unidades ocupadas sin renta definida`);
    }

    const averageRent = parsedData.averageRentPerUnit;
    const outliers = parsedData.units.filter(u => 
      u.currentRent > 0 && (u.currentRent > averageRent * 3 || u.currentRent < averageRent * 0.3)
    );
    if (outliers.length > 0) {
      warnings.push(`${outliers.length} unidades con rentas atípicas (verificar)`);
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Genera resumen del rent roll
   */
  static generateSummary(parsedData: ParsedRentRoll) {
    const occupiedUnits = parsedData.units.filter(u => u.occupied);
    const vacantUnits = parsedData.units.filter(u => !u.occupied);

    return {
      overview: {
        totalUnits: parsedData.totalUnits,
        occupiedUnits: parsedData.occupiedUnits,
        vacantUnits: vacantUnits.length,
        occupancyRate: parsedData.occupancyRate,
      },
      income: {
        totalMonthlyRent: parsedData.totalMonthlyRent,
        averageRentPerUnit: parsedData.averageRentPerUnit,
        annualIncome: parsedData.totalMonthlyRent * 12,
        potentialAnnualIncome: parsedData.units.reduce((sum, u) => 
          sum + (u.marketRent || u.currentRent), 0
        ) * 12,
      },
      rentDistribution: {
        min: Math.min(...occupiedUnits.map(u => u.currentRent)),
        max: Math.max(...occupiedUnits.map(u => u.currentRent)),
        median: this.calculateMedian(occupiedUnits.map(u => u.currentRent)),
        average: parsedData.averageRentPerUnit,
      },
      vacantUnitsDetails: vacantUnits.map(u => ({
        unitNumber: u.unitNumber,
        marketRent: u.marketRent,
        potentialMonthlyIncome: u.marketRent || parsedData.averageRentPerUnit,
      })),
    };
  }

  private static calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }
}
