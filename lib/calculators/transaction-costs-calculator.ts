/**
 * Calculadora de Gastos de Compraventa
 * 
 * Estima todos los gastos asociados a la compra o venta
 * de un inmueble, incluyendo impuestos por CCAA.
 */

export type ComunidadAutonoma = 
  | 'Andalucía' | 'Aragón' | 'Asturias' | 'Baleares' | 'Canarias'
  | 'Cantabria' | 'Castilla-La Mancha' | 'Castilla y León' | 'Cataluña'
  | 'Extremadura' | 'Galicia' | 'La Rioja' | 'Madrid' | 'Murcia'
  | 'Navarra' | 'País Vasco' | 'Valencia' | 'Ceuta' | 'Melilla';

export interface TransactionCostsInput {
  /** Tipo de transacción */
  transactionType: 'BUY' | 'SELL';
  /** Precio del inmueble (€) */
  propertyPrice: number;
  /** Tipo de inmueble */
  propertyType: 'NEW' | 'SECONDHAND';
  /** Comunidad Autónoma */
  comunidadAutonoma: ComunidadAutonoma;
  /** Primera vivienda habitual */
  isFirstHome: boolean;
  /** Edad del comprador */
  buyerAge?: number;
  /** Familia numerosa */
  largeFamily?: boolean;
  /** Discapacidad >= 33% */
  disability?: boolean;
  /** Importe de hipoteca (si aplica) */
  mortgageAmount?: number;
  /** Años de tenencia (para venta) */
  yearsOwned?: number;
  /** Precio de compra original (para venta) */
  originalPurchasePrice?: number;
}

export interface CostItem {
  /** Nombre del gasto */
  name: string;
  /** Importe (€) */
  amount: number;
  /** Descripción */
  description: string;
  /** Es estimación */
  isEstimate: boolean;
  /** Tipo */
  type: 'tax' | 'fee' | 'service';
}

export interface TransactionCostsOutput {
  /** Desglose de gastos */
  breakdown: CostItem[];
  /** Total de gastos (€) */
  totalCosts: number;
  /** Precio efectivo (precio + gastos para compra, precio - gastos para venta) */
  effectivePrice: number;
  /** Porcentaje sobre precio */
  costsPercent: number;
  /** Bonificaciones aplicadas */
  bonificationsApplied: string[];
  /** Resumen por tipo */
  summary: {
    taxes: number;
    fees: number;
    services: number;
  };
}

// Tipos impositivos ITP por CCAA (2024-2025)
const ITP_RATES: Record<ComunidadAutonoma, { base: number; reduced?: number; young?: number }> = {
  'Andalucía': { base: 7, reduced: 3.5, young: 3.5 },
  'Aragón': { base: 8, reduced: 4, young: 6 },
  'Asturias': { base: 8, reduced: 3, young: 3 },
  'Baleares': { base: 8, reduced: 5, young: 5 },
  'Canarias': { base: 6.5, reduced: 4, young: 4 },
  'Cantabria': { base: 10, reduced: 5, young: 5 },
  'Castilla-La Mancha': { base: 9, reduced: 6, young: 6 },
  'Castilla y León': { base: 8, reduced: 4, young: 4 },
  'Cataluña': { base: 10, reduced: 5, young: 5 },
  'Extremadura': { base: 8, reduced: 4, young: 4 },
  'Galicia': { base: 9, reduced: 3, young: 3 },
  'La Rioja': { base: 7, reduced: 5, young: 5 },
  'Madrid': { base: 6, reduced: 4, young: 4 },
  'Murcia': { base: 8, reduced: 3, young: 3 },
  'Navarra': { base: 6, reduced: 5, young: 5 },
  'País Vasco': { base: 4, reduced: 2.5, young: 2.5 },
  'Valencia': { base: 10, reduced: 8, young: 8 },
  'Ceuta': { base: 6, reduced: 6, young: 6 },
  'Melilla': { base: 6, reduced: 6, young: 6 },
};

// AJD por CCAA
const AJD_RATES: Record<ComunidadAutonoma, number> = {
  'Andalucía': 1.5,
  'Aragón': 1.5,
  'Asturias': 1.2,
  'Baleares': 1.5,
  'Canarias': 0.75,
  'Cantabria': 1.5,
  'Castilla-La Mancha': 1.5,
  'Castilla y León': 1.5,
  'Cataluña': 1.5,
  'Extremadura': 1.5,
  'Galicia': 1.5,
  'La Rioja': 1.0,
  'Madrid': 0.75,
  'Murcia': 1.5,
  'Navarra': 0.5,
  'País Vasco': 0.5,
  'Valencia': 1.5,
  'Ceuta': 0.5,
  'Melilla': 0.5,
};

/**
 * Calcula los gastos de una transacción inmobiliaria
 */
export function calculateTransactionCosts(input: TransactionCostsInput): TransactionCostsOutput {
  const breakdown: CostItem[] = [];
  const bonifications: string[] = [];
  
  if (input.transactionType === 'BUY') {
    // === COMPRA ===
    
    if (input.propertyType === 'NEW') {
      // IVA (10% vivienda, 21% locales/garajes)
      breakdown.push({
        name: 'IVA',
        amount: input.propertyPrice * 0.10,
        description: '10% sobre precio de compra (vivienda nueva)',
        isEstimate: false,
        type: 'tax',
      });
      
      // AJD
      const ajdRate = AJD_RATES[input.comunidadAutonoma] || 1.5;
      breakdown.push({
        name: 'AJD (Actos Jurídicos Documentados)',
        amount: input.propertyPrice * (ajdRate / 100),
        description: `${ajdRate}% sobre precio - ${input.comunidadAutonoma}`,
        isEstimate: false,
        type: 'tax',
      });
    } else {
      // ITP - Segunda mano
      const itpData = ITP_RATES[input.comunidadAutonoma] || { base: 8 };
      let itpRate = itpData.base;
      
      // Aplicar bonificaciones
      if (input.isFirstHome && itpData.reduced) {
        itpRate = itpData.reduced;
        bonifications.push('Vivienda habitual');
      }
      
      if (input.buyerAge && input.buyerAge < 35 && itpData.young) {
        itpRate = Math.min(itpRate, itpData.young);
        bonifications.push('Joven < 35 años');
      }
      
      if (input.largeFamily) {
        itpRate = Math.max(itpRate - 1, itpData.reduced || 4);
        bonifications.push('Familia numerosa');
      }
      
      if (input.disability) {
        itpRate = Math.max(itpRate - 1, itpData.reduced || 4);
        bonifications.push('Discapacidad >= 33%');
      }
      
      breakdown.push({
        name: 'ITP (Transmisiones Patrimoniales)',
        amount: input.propertyPrice * (itpRate / 100),
        description: `${itpRate}% sobre precio - ${input.comunidadAutonoma}`,
        isEstimate: false,
        type: 'tax',
      });
    }
    
    // Notaría (estimación basada en precio)
    let notaryFee: number;
    if (input.propertyPrice < 100000) {
      notaryFee = 600;
    } else if (input.propertyPrice < 200000) {
      notaryFee = 800;
    } else if (input.propertyPrice < 400000) {
      notaryFee = 1000;
    } else {
      notaryFee = 1200;
    }
    
    breakdown.push({
      name: 'Notaría',
      amount: notaryFee,
      description: 'Honorarios notariales (estimación según arancel)',
      isEstimate: true,
      type: 'fee',
    });
    
    // Registro de la Propiedad
    breakdown.push({
      name: 'Registro de la Propiedad',
      amount: notaryFee * 0.6,
      description: 'Inscripción registral (estimación)',
      isEstimate: true,
      type: 'fee',
    });
    
    // Gestoría
    breakdown.push({
      name: 'Gestoría',
      amount: 400,
      description: 'Gestión de documentación y trámites',
      isEstimate: true,
      type: 'service',
    });
    
    // Si hay hipoteca
    if (input.mortgageAmount && input.mortgageAmount > 0) {
      breakdown.push({
        name: 'Tasación',
        amount: 350,
        description: 'Tasación oficial para hipoteca',
        isEstimate: true,
        type: 'service',
      });
      
      // Nota: Desde 2019, el banco paga AJD de hipoteca
    }
    
  } else {
    // === VENTA ===
    
    // Plusvalía municipal (muy variable, estimación conservadora)
    const yearsOwned = input.yearsOwned || 10;
    const plusvaliaEstimate = Math.min(input.propertyPrice * 0.015 * Math.min(yearsOwned, 20), input.propertyPrice * 0.05);
    
    breakdown.push({
      name: 'Plusvalía Municipal',
      amount: plusvaliaEstimate,
      description: `Impuesto incremento valor terrenos (~${yearsOwned} años tenencia). MUY VARIABLE según municipio`,
      isEstimate: true,
      type: 'tax',
    });
    
    // IRPF sobre ganancia patrimonial
    if (input.originalPurchasePrice && input.originalPurchasePrice < input.propertyPrice) {
      const gain = input.propertyPrice - input.originalPurchasePrice;
      // Tipos: 19% hasta 6.000€, 21% 6.000-50.000€, 23% 50.000-200.000€, 26% >200.000€
      let irpfTax = 0;
      if (gain <= 6000) {
        irpfTax = gain * 0.19;
      } else if (gain <= 50000) {
        irpfTax = 6000 * 0.19 + (gain - 6000) * 0.21;
      } else if (gain <= 200000) {
        irpfTax = 6000 * 0.19 + 44000 * 0.21 + (gain - 50000) * 0.23;
      } else {
        irpfTax = 6000 * 0.19 + 44000 * 0.21 + 150000 * 0.23 + (gain - 200000) * 0.26;
      }
      
      breakdown.push({
        name: 'IRPF Ganancia Patrimonial',
        amount: irpfTax,
        description: `Impuesto sobre ganancia de ${gain.toLocaleString('es-ES')}€. Exenciones posibles por reinversión vivienda habitual`,
        isEstimate: true,
        type: 'tax',
      });
    }
    
    // Cancelación registral hipoteca
    if (input.mortgageAmount && input.mortgageAmount > 0) {
      breakdown.push({
        name: 'Cancelación registral hipoteca',
        amount: 500,
        description: 'Notaría + Registro para cancelar hipoteca',
        isEstimate: true,
        type: 'fee',
      });
    }
    
    // Certificado energético
    breakdown.push({
      name: 'Certificado energético',
      amount: 80,
      description: 'Obligatorio para vender',
      isEstimate: true,
      type: 'service',
    });
    
    // Cédula habitabilidad (algunas CCAA)
    if (['Cataluña', 'Baleares', 'Valencia'].includes(input.comunidadAutonoma)) {
      breakdown.push({
        name: 'Cédula de habitabilidad',
        amount: 120,
        description: 'Obligatorio en ' + input.comunidadAutonoma,
        isEstimate: true,
        type: 'service',
      });
    }
  }
  
  // Calcular totales
  const totalCosts = breakdown.reduce((sum, item) => sum + item.amount, 0);
  
  const summary = {
    taxes: breakdown.filter(i => i.type === 'tax').reduce((sum, i) => sum + i.amount, 0),
    fees: breakdown.filter(i => i.type === 'fee').reduce((sum, i) => sum + i.amount, 0),
    services: breakdown.filter(i => i.type === 'service').reduce((sum, i) => sum + i.amount, 0),
  };
  
  const effectivePrice = input.transactionType === 'BUY'
    ? input.propertyPrice + totalCosts
    : input.propertyPrice - totalCosts;
  
  return {
    breakdown: breakdown.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100,
    })),
    totalCosts: Math.round(totalCosts * 100) / 100,
    effectivePrice: Math.round(effectivePrice * 100) / 100,
    costsPercent: Math.round((totalCosts / input.propertyPrice) * 10000) / 100,
    bonificationsApplied: bonifications,
    summary: {
      taxes: Math.round(summary.taxes * 100) / 100,
      fees: Math.round(summary.fees * 100) / 100,
      services: Math.round(summary.services * 100) / 100,
    },
  };
}
