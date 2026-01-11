/**
 * Calculadora de Subida de Alquiler (IPC)
 * 
 * Calcula incrementos legales según normativa LAU vigente
 * y límites extraordinarios aplicables.
 */

export type UpdateIndex = 'IPC' | 'IGC' | 'IRAV' | 'CUSTOM';

export interface RentIncreaseInput {
  /** Alquiler actual (€) */
  currentRent: number;
  /** Fecha inicio del contrato */
  contractStartDate: Date;
  /** Fecha de última actualización */
  lastUpdateDate: Date;
  /** Índice a aplicar */
  updateIndex: UpdateIndex;
  /** Tasa personalizada (%) - solo si updateIndex = 'CUSTOM' */
  customRate?: number;
  /** Aplicar límite legal vigente */
  applyLegalLimit?: boolean;
  /** Tipo de arrendador */
  landlordType?: 'SMALL' | 'LARGE'; // Pequeño o gran tenedor
}

export interface RentIncreaseOutput {
  /** Nuevo alquiler (€) */
  newRent: number;
  /** Incremento (€) */
  increase: number;
  /** Porcentaje de incremento aplicado (%) */
  increasePercent: number;
  /** Índice aplicado */
  appliedIndex: string;
  /** Tasa del índice (%) */
  indexRate: number;
  /** Límite máximo legal (%) */
  legalLimit: number;
  /** Se aplicó el límite */
  isLimitApplied: boolean;
  /** Ahorro por límite (€) */
  savingFromLimit: number;
  /** Referencia legal */
  legalReference: string;
  /** Notas informativas */
  notes: string[];
}

// Datos históricos de IPC (últimos 12 meses - simplificado)
// En producción, usar API del INE
const IPC_HISTORY: Record<string, number> = {
  '2025-12': 2.8,
  '2025-11': 2.4,
  '2025-10': 2.2,
  '2025-09': 1.9,
  '2025-08': 2.1,
  '2025-07': 2.3,
  '2025-06': 2.5,
  '2025-05': 2.7,
  '2025-04': 2.9,
  '2025-03': 3.1,
  '2025-02': 3.3,
  '2025-01': 3.0,
  '2024-12': 2.8,
  '2024-11': 2.4,
  '2024-10': 1.8,
};

// Índice de Garantía de Competitividad (suele ser menor que IPC)
const IGC_HISTORY: Record<string, number> = {
  '2025-12': 2.0,
  '2025-11': 1.8,
  '2025-10': 1.7,
  '2024-12': 2.0,
};

/**
 * Obtiene el IPC del mes anterior a la fecha indicada
 */
function getIPC(date: Date): number {
  // Mes anterior
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();
  
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  
  const key = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  return IPC_HISTORY[key] || 2.5; // Default 2.5% si no hay datos
}

/**
 * Obtiene el IGC del mes anterior
 */
function getIGC(date: Date): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  
  const key = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  return IGC_HISTORY[key] || 2.0;
}

/**
 * Determina el límite legal vigente según la fecha
 */
function getLegalLimit(date: Date, landlordType?: string): { limit: number; reference: string } {
  const year = date.getFullYear();
  
  // Límites extraordinarios (actualizados para 2025-2026)
  // Estos límites cambian, verificar normativa vigente
  if (year >= 2025) {
    // Nuevo IRAV a partir de 2025
    return {
      limit: 3.0,
      reference: 'Art. 46 Ley de Vivienda - Límite 3% con IRAV',
    };
  } else if (year === 2024) {
    // Límite 3% en 2024
    return {
      limit: 3.0,
      reference: 'RDL 20/2022 (prorrogado) - Límite extraordinario 3%',
    };
  } else if (year === 2023) {
    return {
      limit: 2.0,
      reference: 'RDL 6/2022 - Límite extraordinario 2%',
    };
  }
  
  // Sin límite legal especial
  return {
    limit: Infinity,
    reference: 'Art. 18 LAU - Actualización según índice pactado',
  };
}

/**
 * Calcula el incremento de alquiler legal
 */
export function calculateRentIncrease(input: RentIncreaseInput): RentIncreaseOutput {
  const notes: string[] = [];
  
  // Obtener tasa según índice
  let indexRate: number;
  let appliedIndex: string;
  
  const updateDate = input.lastUpdateDate || new Date();
  
  switch (input.updateIndex) {
    case 'IPC':
      indexRate = getIPC(updateDate);
      appliedIndex = `IPC interanual`;
      notes.push(`IPC del mes anterior a la actualización: ${indexRate}%`);
      break;
    case 'IGC':
      indexRate = getIGC(updateDate);
      appliedIndex = `Índice Garantía Competitividad`;
      notes.push(`IGC es un índice alternativo, generalmente inferior al IPC`);
      break;
    case 'IRAV':
      // Nuevo índice a partir de 2025
      indexRate = Math.min(getIPC(updateDate), 3.0);
      appliedIndex = `IRAV (Índice Referencia Arrendamientos Vivienda)`;
      notes.push(`IRAV: nuevo índice desde 2025, máximo 3%`);
      break;
    case 'CUSTOM':
      indexRate = input.customRate || 0;
      appliedIndex = `Tasa personalizada`;
      notes.push(`Tasa pactada contractualmente: ${indexRate}%`);
      break;
    default:
      indexRate = getIPC(updateDate);
      appliedIndex = 'IPC (por defecto)';
  }
  
  // Obtener límite legal
  const { limit: legalLimit, reference: legalReference } = getLegalLimit(
    updateDate,
    input.landlordType
  );
  
  // Aplicar límite si corresponde
  let finalRate = indexRate;
  let isLimitApplied = false;
  let savingFromLimit = 0;
  
  if (input.applyLegalLimit !== false && legalLimit !== Infinity && indexRate > legalLimit) {
    finalRate = legalLimit;
    isLimitApplied = true;
    
    const originalIncrease = input.currentRent * (indexRate / 100);
    const limitedIncrease = input.currentRent * (legalLimit / 100);
    savingFromLimit = originalIncrease - limitedIncrease;
    
    notes.push(`⚠️ Se aplica límite legal del ${legalLimit}% en lugar del ${indexRate}%`);
    notes.push(`Ahorro para el inquilino: ${savingFromLimit.toFixed(2)}€/mes`);
  }
  
  // Calcular nuevo alquiler
  const increase = input.currentRent * (finalRate / 100);
  const newRent = input.currentRent + increase;
  
  // Verificar antigüedad del contrato
  const contractAge = Math.floor(
    (updateDate.getTime() - input.contractStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  );
  
  if (contractAge < 1) {
    notes.push(`ℹ️ El contrato tiene menos de 1 año. La actualización aplica a partir de la primera anualidad.`);
  }
  
  // Recordatorio de preaviso
  notes.push(`📅 Recordatorio: comunicar al inquilino con 30 días de antelación`);
  
  return {
    newRent: Math.round(newRent * 100) / 100,
    increase: Math.round(increase * 100) / 100,
    increasePercent: Math.round(finalRate * 100) / 100,
    appliedIndex,
    indexRate: Math.round(indexRate * 100) / 100,
    legalLimit: legalLimit === Infinity ? 0 : legalLimit,
    isLimitApplied,
    savingFromLimit: Math.round(savingFromLimit * 100) / 100,
    legalReference,
    notes,
  };
}

/**
 * Genera carta de actualización de renta
 */
export function generateRentUpdateLetter(
  landlordName: string,
  tenantName: string,
  propertyAddress: string,
  currentRent: number,
  newRent: number,
  effectiveDate: Date,
  index: string,
  rate: number
): string {
  const formattedDate = effectiveDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  return `
COMUNICACIÓN DE ACTUALIZACIÓN DE RENTA

En ${propertyAddress.split(',').pop()?.trim() || 'Madrid'}, a ${new Date().toLocaleDateString('es-ES')}

D./Dña. ${landlordName}, como ARRENDADOR/A del inmueble sito en ${propertyAddress},

COMUNICA a D./Dña. ${tenantName}, como ARRENDATARIO/A,

Que de conformidad con lo establecido en el contrato de arrendamiento y el artículo 18 de la Ley de Arrendamientos Urbanos, procede la actualización anual de la renta según el ${index}.

La renta actualizada será de ${newRent.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} mensuales (anteriormente ${currentRent.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}), lo que supone un incremento del ${rate}%.

Esta actualización será efectiva a partir del día ${formattedDate}.

Sin otro particular, reciba un cordial saludo.

Fdo: ${landlordName}
ARRENDADOR/A
  `.trim();
}
