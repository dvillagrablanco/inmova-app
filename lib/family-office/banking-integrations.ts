/**
 * FAMILY OFFICE — INTEGRACIONES BANCARIAS MULTI-ENTIDAD
 *
 * 3 niveles de integración:
 * 1. PSD2/Open Banking (Nordigen/GoCardless): Bankinter, Santander, BBVA, CaixaBank
 * 2. SWIFT MT940/MT535: Banca March, CACEIS, Inversis
 * 3. OCR PDF (Claude IA): Pictet, UBS, cualquier entidad
 *
 * Todas las entidades se normalizan al mismo formato: FinancialAccount + FinancialPosition
 */

import logger from '@/lib/logger';

// ============================================================================
// CONFIGURACIÓN DE ENTIDADES
// ============================================================================

export interface BankEntityConfig {
  id: string;
  name: string;
  country: string;
  type: 'banca_privada' | 'gestora_fondos' | 'custodio' | 'banca_comercial';
  integrationLevel: 'psd2' | 'swift' | 'ocr_pdf' | 'manual';
  nordigenInstitutionId?: string; // Para PSD2
  swiftBIC?: string;
  logo: string;
  capabilities: ('saldos' | 'movimientos' | 'posiciones' | 'ordenes')[];
  notes: string;
}

export const BANK_ENTITIES: BankEntityConfig[] = [
  // ── NIVEL 1: PSD2 / Open Banking (automático) ──
  {
    id: 'bankinter',
    name: 'Bankinter',
    country: 'ES',
    type: 'banca_comercial',
    integrationLevel: 'psd2',
    nordigenInstitutionId: 'BANKINTER_BKBKESMMXXX',
    swiftBIC: 'BKBKESMMXXX',
    logo: '/images/banks/bankinter.svg',
    capabilities: ['saldos', 'movimientos'],
    notes: 'Ya integrado via GoCardless/Nordigen. Cuentas de Rovida y Viroda.',
  },
  {
    id: 'santander',
    name: 'Banco Santander',
    country: 'ES',
    type: 'banca_comercial',
    integrationLevel: 'psd2',
    nordigenInstitutionId: 'SANTANDER_ES_BSCHESMMXXX',
    swiftBIC: 'BSCHESMMXXX',
    logo: '/images/banks/santander.svg',
    capabilities: ['saldos', 'movimientos'],
    notes: 'PSD2 via Nordigen. Soporta multi-cuenta.',
  },
  {
    id: 'bbva',
    name: 'BBVA',
    country: 'ES',
    type: 'banca_comercial',
    integrationLevel: 'psd2',
    nordigenInstitutionId: 'BBVA_BBVAESMMXXX',
    swiftBIC: 'BBVAESMMXXX',
    logo: '/images/banks/bbva.svg',
    capabilities: ['saldos', 'movimientos'],
    notes: 'PSD2 via Nordigen + BBVA Open Platform API.',
  },
  {
    id: 'caixabank',
    name: 'CaixaBank',
    country: 'ES',
    type: 'banca_comercial',
    integrationLevel: 'psd2',
    nordigenInstitutionId: 'CAIXABANK_CAIXESBBXXX',
    swiftBIC: 'CAIXESBBXXX',
    logo: '/images/banks/caixabank.svg',
    capabilities: ['saldos', 'movimientos'],
    notes: 'PSD2 via Nordigen.',
  },

  // ── NIVEL 2: SWIFT MT940/MT535 (semi-automático) ──
  {
    id: 'banca_march',
    name: 'Banca March',
    country: 'ES',
    type: 'banca_privada',
    integrationLevel: 'swift',
    swiftBIC: 'BMARES2MXXX',
    logo: '/images/banks/banca-march.svg',
    capabilities: ['saldos', 'movimientos', 'posiciones'],
    notes: 'Extractos SWIFT MT940 (movimientos) y MT535 (posiciones de custodia). Banca privada.',
  },
  {
    id: 'caceis',
    name: 'CACEIS Bank',
    country: 'FR',
    type: 'custodio',
    integrationLevel: 'swift',
    swiftBIC: 'CACABORJXXX',
    logo: '/images/banks/caceis.svg',
    capabilities: ['posiciones', 'movimientos'],
    notes: 'Custodio institucional. SWIFT MT535 para posiciones de fondos. Principal gestora de Vidaro (€844K beneficios 2025).',
  },
  {
    id: 'inversis',
    name: 'Inversis',
    country: 'ES',
    type: 'gestora_fondos',
    integrationLevel: 'swift',
    swiftBIC: 'INVLESMMXXX',
    logo: '/images/banks/inversis.svg',
    capabilities: ['posiciones', 'movimientos'],
    notes: 'Plataforma de fondos/SICAVs. API propietaria o XML. Vidaro: €776K beneficios 2025.',
  },

  // ── NIVEL 3: OCR PDF con IA (manual + asistido) ──
  {
    id: 'pictet',
    name: 'Pictet & Cie',
    country: 'CH',
    type: 'banca_privada',
    integrationLevel: 'ocr_pdf',
    swiftBIC: 'PICTCHGGXXX',
    logo: '/images/banks/pictet.svg',
    capabilities: ['posiciones', 'movimientos'],
    notes: 'Banca privada suiza. Extractos PDF en formato propio. Claude OCR para extracción. Vidaro: €583K beneficios 2025.',
  },
  {
    id: 'ubs',
    name: 'UBS',
    country: 'CH',
    type: 'banca_privada',
    integrationLevel: 'ocr_pdf',
    swiftBIC: 'UBSWCHZH80A',
    logo: '/images/banks/ubs.svg',
    capabilities: ['posiciones', 'movimientos'],
    notes: 'Banca privada global. Extractos PDF. Wealth Management reports.',
  },
];

// ============================================================================
// PARSER SWIFT MT940 (Movimientos bancarios)
// ============================================================================

export interface MT940Movement {
  fecha: string; // YYYY-MM-DD
  concepto: string;
  importe: number;
  tipo: 'credito' | 'debito';
  referencia: string;
  saldoDespues?: number;
}

/**
 * Parser de extractos SWIFT MT940 (movimientos bancarios)
 * Formato estándar internacional usado por Banca March, CACEIS, etc.
 */
export function parseMT940(rawText: string): {
  cuenta: string;
  entidad: string;
  saldoInicial: number;
  saldoFinal: number;
  movimientos: MT940Movement[];
} {
  const lines = rawText.split('\n');
  const movimientos: MT940Movement[] = [];
  let cuenta = '';
  let entidad = '';
  let saldoInicial = 0;
  let saldoFinal = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // :25: Account identification
    if (line.startsWith(':25:')) {
      cuenta = line.substring(4).trim();
    }

    // :60F: Opening balance
    if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
      const balStr = line.substring(5);
      const match = balStr.match(/[CD](\d{6})([A-Z]{3})([\d,]+)/);
      if (match) {
        saldoInicial = parseFloat(match[3].replace(',', '.'));
        if (balStr.startsWith('D')) saldoInicial = -saldoInicial;
      }
    }

    // :61: Statement line (movement)
    if (line.startsWith(':61:')) {
      const stmtLine = line.substring(4);
      // Format: YYMMDDYYMMDD[CD]amount//reference
      const dateMatch = stmtLine.match(/^(\d{6})/);
      const amountMatch = stmtLine.match(/[CD]([\d,]+)/);
      const refMatch = stmtLine.match(/\/\/(.+)/);

      let concepto = '';
      // Next line :86: contains the description
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith(':86:')) {
        concepto = lines[i + 1].trim().substring(4);
        i++;
      }

      if (dateMatch && amountMatch) {
        const dateStr = dateMatch[1];
        const year = parseInt('20' + dateStr.substring(0, 2));
        const month = parseInt(dateStr.substring(2, 4));
        const day = parseInt(dateStr.substring(4, 6));
        const fecha = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        let importe = parseFloat(amountMatch[1].replace(',', '.'));
        const tipo = stmtLine.includes('D') ? 'debito' : 'credito';
        if (tipo === 'debito') importe = -importe;

        movimientos.push({
          fecha,
          concepto,
          importe,
          tipo,
          referencia: refMatch?.[1] || '',
        });
      }
    }

    // :62F: Closing balance
    if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
      const balStr = line.substring(5);
      const match = balStr.match(/[CD](\d{6})([A-Z]{3})([\d,]+)/);
      if (match) {
        saldoFinal = parseFloat(match[3].replace(',', '.'));
        if (balStr.startsWith('D')) saldoFinal = -saldoFinal;
      }
    }

    i++;
  }

  return { cuenta, entidad, saldoInicial, saldoFinal, movimientos };
}

// ============================================================================
// PARSER SWIFT MT535 (Posiciones de custodia)
// ============================================================================

export interface MT535Position {
  isin: string;
  nombre: string;
  cantidad: number;
  valorMercado: number;
  divisa: string;
  precioUnitario: number;
}

/**
 * Parser de SWIFT MT535 (posiciones de custodia)
 * Usado por CACEIS, Banca March para reportar posiciones en fondos/valores
 */
export function parseMT535(rawText: string): {
  cuenta: string;
  fecha: string;
  posiciones: MT535Position[];
  valorTotal: number;
} {
  const posiciones: MT535Position[] = [];
  let cuenta = '';
  let fecha = '';
  let valorTotal = 0;

  // Simplified parser — real MT535 is complex
  const blocks = rawText.split(':16R:');

  for (const block of blocks) {
    // ISIN
    const isinMatch = block.match(/:35B:ISIN\s+(\w{12})/);
    const nameMatch = block.match(/:35B:.*\n\/\/(.+)/);
    const qtyMatch = block.match(/:93B:.*UNIT\/\/(\d+[\.,]?\d*)/);
    const valMatch = block.match(/:19A:.*MKTN\/\/[A-Z]{3}(\d+[\.,]?\d*)/);
    const priceMatch = block.match(/:90[AB]:.*\/\/[A-Z]{3}(\d+[\.,]?\d*)/);
    const curMatch = block.match(/:19A:.*MKTN\/\/([A-Z]{3})/);

    if (isinMatch) {
      const cantidad = qtyMatch ? parseFloat(qtyMatch[1].replace(',', '.')) : 0;
      const valor = valMatch ? parseFloat(valMatch[1].replace(',', '.')) : 0;
      const precio = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

      posiciones.push({
        isin: isinMatch[1],
        nombre: nameMatch?.[1]?.trim() || isinMatch[1],
        cantidad,
        valorMercado: valor,
        divisa: curMatch?.[1] || 'EUR',
        precioUnitario: precio,
      });

      valorTotal += valor;
    }
  }

  // Account and date
  const acctMatch = rawText.match(/:97A:.*SAFE\/\/(\S+)/);
  const dateMatch = rawText.match(/:98A:.*STAT\/\/(\d{8})/);
  if (acctMatch) cuenta = acctMatch[1];
  if (dateMatch) {
    const d = dateMatch[1];
    fecha = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
  }

  return { cuenta, fecha, posiciones, valorTotal };
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtener configuración de una entidad por ID
 */
export function getBankEntity(entityId: string): BankEntityConfig | undefined {
  return BANK_ENTITIES.find((e) => e.id === entityId);
}

/**
 * Listar entidades por nivel de integración
 */
export function getEntitiesByLevel(level: BankEntityConfig['integrationLevel']): BankEntityConfig[] {
  return BANK_ENTITIES.filter((e) => e.integrationLevel === level);
}

/**
 * Listar todas las entidades con estado de conexión
 */
export function getAllEntitiesWithStatus(): Array<BankEntityConfig & { connected: boolean }> {
  return BANK_ENTITIES.map((e) => ({
    ...e,
    connected: false, // Se actualiza en runtime consultando FinancialAccount
  }));
}
