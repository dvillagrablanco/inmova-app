# 🛠️ Herramientas Descargables para Inmova

**Basado en análisis de ZONA3 Campus**  
**Fecha**: 11 de Enero de 2026

---

## 📊 Resumen de Recursos Identificados en ZONA3

De la exploración de ZONA3, identifiqué las siguientes categorías de herramientas:

| Categoría | Descripción | Prioridad para Inmova |
|-----------|-------------|----------------------|
| **Calculadoras** | Herramientas de cálculo financiero | 🔴 CRÍTICA |
| **Contratos** | Plantillas legales | 🔴 CRÍTICA |
| **Guías** | Documentación educativa | 🟡 ALTA |
| **Base de datos de hipotecas** | Comparador bancario | 🟡 ALTA |
| **Directorio de profesionales** | Red de servicios | 🟢 MEDIA |
| **Informes de mercado** | Análisis y tendencias | 🟢 MEDIA |

---

## 🔴 PRIORIDAD CRÍTICA: Calculadoras Financieras

### 1. **Calculadora de Rentabilidad de Alquiler**

**Propósito**: Calcular ROI, rentabilidad bruta/neta, cashflow

```typescript
// lib/calculators/rental-yield-calculator.ts
interface RentalYieldInput {
  purchasePrice: number;          // Precio de compra
  renovationCost: number;         // Coste de reforma
  closingCosts: number;           // Gastos de compra (notaría, registro, ITP)
  monthlyRent: number;            // Alquiler mensual
  annualExpenses: {
    ibi: number;                  // IBI
    communityFees: number;        // Comunidad
    insurance: number;            // Seguro hogar
    maintenanceReserve: number;   // Reserva mantenimiento (5-10%)
    managementFee: number;        // Gestión (si aplica)
    vacancyRate: number;          // Tasa vacío (% anual)
  };
  financing?: {
    loanAmount: number;
    interestRate: number;
    termYears: number;
  };
}

interface RentalYieldOutput {
  grossYield: number;             // Rentabilidad bruta %
  netYield: number;               // Rentabilidad neta %
  cashOnCashReturn: number;       // Retorno sobre capital invertido %
  monthlyCashflow: number;        // Cashflow mensual €
  annualCashflow: number;         // Cashflow anual €
  paybackYears: number;           // Años para recuperar inversión
  capRate: number;                // Cap Rate %
  totalInvestment: number;        // Inversión total
  annualIncome: number;           // Ingresos anuales
  annualExpenses: number;         // Gastos anuales
  noi: number;                    // Net Operating Income
}

export function calculateRentalYield(input: RentalYieldInput): RentalYieldOutput {
  const totalInvestment = input.purchasePrice + input.renovationCost + input.closingCosts;
  const annualRent = input.monthlyRent * 12;
  const effectiveRent = annualRent * (1 - input.annualExpenses.vacancyRate / 100);
  
  const totalAnnualExpenses = 
    input.annualExpenses.ibi +
    input.annualExpenses.communityFees * 12 +
    input.annualExpenses.insurance +
    (effectiveRent * input.annualExpenses.maintenanceReserve / 100) +
    (effectiveRent * input.annualExpenses.managementFee / 100);
  
  const noi = effectiveRent - totalAnnualExpenses;
  
  // Si hay financiación
  let annualMortgage = 0;
  let cashInvested = totalInvestment;
  
  if (input.financing) {
    const monthlyRate = input.financing.interestRate / 100 / 12;
    const numPayments = input.financing.termYears * 12;
    const monthlyPayment = input.financing.loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    annualMortgage = monthlyPayment * 12;
    cashInvested = totalInvestment - input.financing.loanAmount;
  }
  
  const annualCashflow = noi - annualMortgage;
  
  return {
    grossYield: (annualRent / totalInvestment) * 100,
    netYield: (noi / totalInvestment) * 100,
    cashOnCashReturn: cashInvested > 0 ? (annualCashflow / cashInvested) * 100 : 0,
    monthlyCashflow: annualCashflow / 12,
    annualCashflow,
    paybackYears: cashInvested / Math.max(annualCashflow, 1),
    capRate: (noi / input.purchasePrice) * 100,
    totalInvestment,
    annualIncome: effectiveRent,
    annualExpenses: totalAnnualExpenses,
    noi
  };
}
```

**UI sugerida**: Formulario con campos + gráfico de barras comparativo + tabla de resultados

---

### 2. **Calculadora de Hipoteca**

**Propósito**: Simular cuotas, TAE, tabla de amortización

```typescript
// lib/calculators/mortgage-calculator.ts
interface MortgageInput {
  propertyPrice: number;
  downPaymentPercent: number;
  interestRate: number;           // % anual
  termYears: number;
  type: 'FIXED' | 'VARIABLE';
  euribor?: number;               // Para variable
  differential?: number;          // Para variable
  openingFee?: number;            // Comisión apertura %
  appraisalCost?: number;
  notaryCost?: number;
}

interface MortgageOutput {
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  tae: number;
  amortizationTable: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
  firstYearPayments: number;
  averageMonthlyInterest: number;
}

export function calculateMortgage(input: MortgageInput): MortgageOutput {
  const downPayment = input.propertyPrice * (input.downPaymentPercent / 100);
  const loanAmount = input.propertyPrice - downPayment;
  
  const effectiveRate = input.type === 'VARIABLE' 
    ? (input.euribor || 0) + (input.differential || 0)
    : input.interestRate;
  
  const monthlyRate = effectiveRate / 100 / 12;
  const numPayments = input.termYears * 12;
  
  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  // Generar tabla de amortización
  const amortizationTable = [];
  let balance = loanAmount;
  
  for (let month = 1; month <= numPayments; month++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance -= principal;
    
    amortizationTable.push({
      month,
      payment: monthlyPayment,
      principal,
      interest,
      balance: Math.max(0, balance)
    });
  }
  
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - loanAmount;
  
  // Calcular TAE (simplificado)
  const costs = (input.openingFee || 0) / 100 * loanAmount + 
                (input.appraisalCost || 0) + 
                (input.notaryCost || 0);
  const tae = ((totalPayment + costs) / loanAmount - 1) / input.termYears * 100;
  
  return {
    loanAmount,
    monthlyPayment,
    totalPayment,
    totalInterest,
    tae,
    amortizationTable,
    firstYearPayments: monthlyPayment * 12,
    averageMonthlyInterest: totalInterest / numPayments
  };
}
```

---

### 3. **Calculadora de Flipping / Reforma**

**Propósito**: Calcular rentabilidad de compra-reforma-venta

```typescript
// lib/calculators/flip-calculator.ts
interface FlipInput {
  purchasePrice: number;
  purchaseCosts: {              // Gastos de compra
    itp: number;                // ITP o IVA
    notary: number;
    registry: number;
    agency: number;
  };
  renovationBudget: number;
  renovationContingency: number; // % extra por imprevistos
  holdingCosts: {               // Costes de tenencia
    monthsToRenovate: number;
    monthsToSell: number;
    utilities: number;          // mensual
    insurance: number;          // mensual
    taxes: number;              // mensual (IBI prorrateado)
  };
  sellingPrice: number;
  sellingCosts: {
    agencyFee: number;          // %
    plusvalia: number;
    capitalGainsTax: number;    // % (19-23%)
  };
  financing?: {
    loanAmount: number;
    interestRate: number;
    months: number;
  };
}

interface FlipOutput {
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  roi: number;                  // Return on Investment %
  annualizedRoi: number;        // ROI anualizado %
  profitMargin: number;         // Margen de beneficio %
  breakdownCosts: {
    purchase: number;
    renovation: number;
    holding: number;
    selling: number;
    financing: number;
  };
  breakEvenPrice: number;       // Precio mínimo de venta
  daysToComplete: number;
}

export function calculateFlip(input: FlipInput): FlipOutput {
  // Costes de compra
  const purchaseCosts = input.purchasePrice + 
    input.purchaseCosts.itp + 
    input.purchaseCosts.notary + 
    input.purchaseCosts.registry + 
    input.purchaseCosts.agency;
  
  // Costes de reforma
  const renovationTotal = input.renovationBudget * (1 + input.renovationContingency / 100);
  
  // Costes de tenencia
  const totalMonths = input.holdingCosts.monthsToRenovate + input.holdingCosts.monthsToSell;
  const holdingTotal = totalMonths * (
    input.holdingCosts.utilities + 
    input.holdingCosts.insurance + 
    input.holdingCosts.taxes
  );
  
  // Costes de venta
  const agencyFee = input.sellingPrice * (input.sellingCosts.agencyFee / 100);
  const capitalGains = Math.max(0, input.sellingPrice - input.purchasePrice - renovationTotal);
  const capitalGainsTax = capitalGains * (input.sellingCosts.capitalGainsTax / 100);
  const sellingTotal = agencyFee + input.sellingCosts.plusvalia + capitalGainsTax;
  
  // Costes de financiación
  let financingCosts = 0;
  if (input.financing) {
    const monthlyInterest = input.financing.loanAmount * (input.financing.interestRate / 100 / 12);
    financingCosts = monthlyInterest * input.financing.months;
  }
  
  const totalCosts = purchaseCosts + renovationTotal + holdingTotal + sellingTotal + financingCosts;
  const grossProfit = input.sellingPrice - input.purchasePrice - renovationTotal;
  const netProfit = input.sellingPrice - totalCosts;
  
  const cashInvested = input.financing 
    ? totalCosts - input.financing.loanAmount 
    : totalCosts;
  
  const roi = (netProfit / cashInvested) * 100;
  const annualizedRoi = (roi / totalMonths) * 12;
  
  return {
    totalCosts,
    grossProfit,
    netProfit,
    roi,
    annualizedRoi,
    profitMargin: (netProfit / input.sellingPrice) * 100,
    breakdownCosts: {
      purchase: purchaseCosts,
      renovation: renovationTotal,
      holding: holdingTotal,
      selling: sellingTotal,
      financing: financingCosts
    },
    breakEvenPrice: totalCosts,
    daysToComplete: totalMonths * 30
  };
}
```

---

### 4. **Calculadora de Subida de Alquiler (IPC)**

**Propósito**: Calcular incrementos legales según normativa

```typescript
// lib/calculators/rent-increase-calculator.ts
interface RentIncreaseInput {
  currentRent: number;
  contractStartDate: Date;
  lastUpdateDate: Date;
  updateType: 'IPC' | 'IGC' | 'CUSTOM';  // IPC, Índice Garantía Competitividad, o custom
  customRate?: number;
  applyLimit?: boolean;           // Límite 2% (2024) o 3% (2025)
}

interface RentIncreaseOutput {
  newRent: number;
  increase: number;
  increasePercent: number;
  appliedIndex: string;
  maxAllowedIncrease: number;
  isLimitApplied: boolean;
  legalReference: string;
}

// Datos históricos de IPC (simplificado)
const IPC_DATA: Record<string, number> = {
  '2024-12': 2.8,
  '2024-11': 2.4,
  '2024-10': 1.8,
  '2025-01': 2.9,
  // ... más datos
};

export function calculateRentIncrease(input: RentIncreaseInput): RentIncreaseOutput {
  const monthKey = `${input.lastUpdateDate.getFullYear()}-${String(input.lastUpdateDate.getMonth() + 1).padStart(2, '0')}`;
  
  let rate: number;
  let appliedIndex: string;
  
  switch (input.updateType) {
    case 'IPC':
      rate = IPC_DATA[monthKey] || 3.0;
      appliedIndex = `IPC ${monthKey}: ${rate}%`;
      break;
    case 'IGC':
      rate = 2.0; // IGC suele ser menor
      appliedIndex = `IGC: ${rate}%`;
      break;
    case 'CUSTOM':
      rate = input.customRate || 0;
      appliedIndex = `Personalizado: ${rate}%`;
      break;
  }
  
  // Aplicar límites legales si corresponde (2024: 3%, 2025: 3%)
  let maxAllowed = rate;
  let isLimitApplied = false;
  
  if (input.applyLimit) {
    const year = new Date().getFullYear();
    const limit = year === 2024 ? 3.0 : 3.0; // Límites actuales
    if (rate > limit) {
      maxAllowed = limit;
      isLimitApplied = true;
    }
  }
  
  const finalRate = input.applyLimit ? maxAllowed : rate;
  const increase = input.currentRent * (finalRate / 100);
  const newRent = input.currentRent + increase;
  
  return {
    newRent: Math.round(newRent * 100) / 100,
    increase: Math.round(increase * 100) / 100,
    increasePercent: finalRate,
    appliedIndex,
    maxAllowedIncrease: maxAllowed,
    isLimitApplied,
    legalReference: 'Art. 18 LAU - Actualización de renta'
  };
}
```

---

### 5. **Calculadora de Gastos de Compraventa**

**Propósito**: Estimar todos los gastos al comprar/vender

```typescript
// lib/calculators/transaction-costs-calculator.ts
interface TransactionCostsInput {
  transactionType: 'BUY' | 'SELL';
  propertyPrice: number;
  propertyType: 'NEW' | 'SECONDHAND';
  location: {
    comunidadAutonoma: string;
    municipality: string;
  };
  hasGarage: boolean;
  garagePrice?: number;
  hasStorage: boolean;
  storagePrice?: number;
  mortgageAmount?: number;
  isFirstHome: boolean;
  buyerAge?: number;              // Para bonificaciones jóvenes
  largeFamily?: boolean;
  disability?: boolean;
}

interface TransactionCostsOutput {
  breakdown: {
    name: string;
    amount: number;
    description: string;
    isEstimate: boolean;
  }[];
  totalCosts: number;
  effectivePrice: number;         // Precio + costes
  costsPercent: number;
  bonificationsApplied: string[];
}

// Tipos impositivos por CCAA (simplificado)
const ITP_RATES: Record<string, number> = {
  'Madrid': 6,
  'Cataluña': 10,
  'Andalucía': 7,
  'Valencia': 10,
  'País Vasco': 4,
  // ...
};

export function calculateTransactionCosts(input: TransactionCostsInput): TransactionCostsOutput {
  const breakdown: any[] = [];
  const bonifications: string[] = [];
  
  if (input.transactionType === 'BUY') {
    // IVA o ITP
    if (input.propertyType === 'NEW') {
      // IVA 10% + AJD
      breakdown.push({
        name: 'IVA',
        amount: input.propertyPrice * 0.10,
        description: '10% sobre precio de compra (vivienda nueva)',
        isEstimate: false
      });
      
      const ajdRate = input.location.comunidadAutonoma === 'Madrid' ? 0.007 : 0.015;
      breakdown.push({
        name: 'AJD',
        amount: input.propertyPrice * ajdRate,
        description: `${ajdRate * 100}% Actos Jurídicos Documentados`,
        isEstimate: false
      });
    } else {
      // ITP
      let itpRate = ITP_RATES[input.location.comunidadAutonoma] || 8;
      
      // Bonificaciones
      if (input.isFirstHome && input.buyerAge && input.buyerAge < 35) {
        itpRate = Math.max(itpRate - 2, 4);
        bonifications.push('Bonificación jóvenes <35 años');
      }
      if (input.largeFamily) {
        itpRate = Math.max(itpRate - 1, 4);
        bonifications.push('Bonificación familia numerosa');
      }
      
      breakdown.push({
        name: 'ITP',
        amount: input.propertyPrice * (itpRate / 100),
        description: `${itpRate}% Impuesto Transmisiones Patrimoniales`,
        isEstimate: false
      });
    }
    
    // Notaría
    const notaryBase = input.propertyPrice < 100000 ? 500 : 
                       input.propertyPrice < 200000 ? 700 : 900;
    breakdown.push({
      name: 'Notaría',
      amount: notaryBase,
      description: 'Honorarios notariales (estimación)',
      isEstimate: true
    });
    
    // Registro
    breakdown.push({
      name: 'Registro de la Propiedad',
      amount: notaryBase * 0.7,
      description: 'Inscripción en el Registro',
      isEstimate: true
    });
    
    // Gestoría
    breakdown.push({
      name: 'Gestoría',
      amount: 400,
      description: 'Gestión de trámites (opcional)',
      isEstimate: true
    });
    
    // Si hay hipoteca
    if (input.mortgageAmount) {
      breakdown.push({
        name: 'Tasación',
        amount: 350,
        description: 'Tasación oficial para hipoteca',
        isEstimate: true
      });
    }
  } else {
    // VENTA
    // Plusvalía municipal
    breakdown.push({
      name: 'Plusvalía Municipal',
      amount: input.propertyPrice * 0.02, // Estimación muy simplificada
      description: 'Impuesto incremento valor terrenos (variable)',
      isEstimate: true
    });
    
    // Cancelación hipoteca si existe
    if (input.mortgageAmount) {
      breakdown.push({
        name: 'Cancelación hipoteca',
        amount: 500,
        description: 'Gastos cancelación registral',
        isEstimate: true
      });
    }
    
    // Certificado energético
    breakdown.push({
      name: 'Certificado energético',
      amount: 80,
      description: 'Obligatorio para vender',
      isEstimate: true
    });
  }
  
  const totalCosts = breakdown.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    breakdown,
    totalCosts,
    effectivePrice: input.propertyPrice + (input.transactionType === 'BUY' ? totalCosts : -totalCosts),
    costsPercent: (totalCosts / input.propertyPrice) * 100,
    bonificationsApplied: bonifications
  };
}
```

---

## 🔴 PRIORIDAD CRÍTICA: Plantillas de Contratos

### Contratos a Desarrollar

| Contrato | Formato | Descripción |
|----------|---------|-------------|
| **Contrato de arrendamiento vivienda** | PDF/DOCX | LAU actualizado, con cláusulas opcionales |
| **Contrato de arrendamiento habitación** | PDF/DOCX | Para coliving/estudiantes |
| **Contrato de arrendamiento local comercial** | PDF/DOCX | Uso comercial/oficinas |
| **Contrato de arrendamiento garaje** | PDF/DOCX | Parking independiente |
| **Contrato de arrendamiento temporal** | PDF/DOCX | Vacacional/temporada |
| **Anexo inventario** | PDF/DOCX | Listado de enseres y estado |
| **Documento de fianza** | PDF/DOCX | Recibo depósito garantía |
| **Carta de no renovación** | PDF/DOCX | Preaviso legal |
| **Carta de subida de alquiler** | PDF/DOCX | Con cálculo IPC |
| **Acta de entrega de llaves** | PDF/DOCX | Checklist entrada/salida |
| **Autorización de domiciliación** | PDF/DOCX | SEPA para cobros |

### Implementación Sugerida

```typescript
// lib/contracts/contract-generator.ts
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContractData {
  type: 'VIVIENDA' | 'HABITACION' | 'LOCAL' | 'GARAJE' | 'TEMPORAL';
  landlord: {
    name: string;
    dni: string;
    address: string;
    email: string;
    phone: string;
  };
  tenant: {
    name: string;
    dni: string;
    address: string;
    email: string;
    phone: string;
  };
  property: {
    address: string;
    cadastralRef: string;
    squareMeters: number;
    rooms: number;
    features: string[];
  };
  terms: {
    startDate: Date;
    endDate: Date;
    monthlyRent: number;
    deposit: number;
    depositMonths: number;
    paymentDay: number;
    bankAccount: string;
    updateIndex: 'IPC' | 'IGC' | 'NONE';
  };
  clauses: {
    petsAllowed: boolean;
    smokingAllowed: boolean;
    sublettingAllowed: boolean;
    renovationsAllowed: boolean;
    customClauses: string[];
  };
}

export async function generateRentalContract(data: ContractData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Header
  doc.fontSize(16).font('Helvetica-Bold')
     .text('CONTRATO DE ARRENDAMIENTO DE VIVIENDA', { align: 'center' });
  doc.moveDown();
  
  // Lugar y fecha
  doc.fontSize(11).font('Helvetica')
     .text(`En ${data.property.address.split(',').pop()?.trim()}, a ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`);
  doc.moveDown();
  
  // Reunidos
  doc.fontSize(12).font('Helvetica-Bold').text('REUNIDOS');
  doc.fontSize(11).font('Helvetica');
  
  doc.text(`De una parte, como ARRENDADOR:`);
  doc.text(`D./Dña. ${data.landlord.name}, con DNI/NIE ${data.landlord.dni}, con domicilio en ${data.landlord.address}.`);
  doc.moveDown(0.5);
  
  doc.text(`De otra parte, como ARRENDATARIO:`);
  doc.text(`D./Dña. ${data.tenant.name}, con DNI/NIE ${data.tenant.dni}, con domicilio en ${data.tenant.address}.`);
  doc.moveDown();
  
  // Exponen
  doc.fontSize(12).font('Helvetica-Bold').text('EXPONEN');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Que el ARRENDADOR es propietario del inmueble sito en ${data.property.address}, con referencia catastral ${data.property.cadastralRef}, de ${data.property.squareMeters} m² construidos.`);
  doc.moveDown();
  
  // Estipulaciones
  doc.fontSize(12).font('Helvetica-Bold').text('ESTIPULACIONES');
  doc.fontSize(11).font('Helvetica');
  
  // Cláusulas
  let clauseNum = 1;
  
  // 1. Objeto
  doc.font('Helvetica-Bold').text(`${clauseNum}. OBJETO DEL CONTRATO`);
  doc.font('Helvetica').text(`El arrendador cede en arrendamiento la vivienda descrita para uso de vivienda habitual del arrendatario.`);
  doc.moveDown(0.5);
  clauseNum++;
  
  // 2. Duración
  doc.font('Helvetica-Bold').text(`${clauseNum}. DURACIÓN`);
  doc.font('Helvetica').text(`El presente contrato tendrá una duración de ${Math.round((data.terms.endDate.getTime() - data.terms.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))} meses, desde el ${format(data.terms.startDate, 'dd/MM/yyyy')} hasta el ${format(data.terms.endDate, 'dd/MM/yyyy')}, prorrogable conforme al artículo 9 de la LAU.`);
  doc.moveDown(0.5);
  clauseNum++;
  
  // 3. Renta
  doc.font('Helvetica-Bold').text(`${clauseNum}. RENTA`);
  doc.font('Helvetica').text(`La renta mensual se fija en ${data.terms.monthlyRent.toLocaleString('es-ES')} EUROS (${data.terms.monthlyRent}€), pagaderos dentro de los primeros ${data.terms.paymentDay} días de cada mes mediante transferencia a la cuenta ${data.terms.bankAccount}.`);
  doc.moveDown(0.5);
  clauseNum++;
  
  // 4. Fianza
  doc.font('Helvetica-Bold').text(`${clauseNum}. FIANZA`);
  doc.font('Helvetica').text(`El arrendatario entrega en este acto la cantidad de ${data.terms.deposit.toLocaleString('es-ES')} EUROS (${data.terms.deposit}€), equivalente a ${data.terms.depositMonths} mensualidad(es), en concepto de fianza legal.`);
  doc.moveDown(0.5);
  clauseNum++;
  
  // 5. Actualización
  if (data.terms.updateIndex !== 'NONE') {
    doc.font('Helvetica-Bold').text(`${clauseNum}. ACTUALIZACIÓN DE RENTA`);
    doc.font('Helvetica').text(`La renta se actualizará anualmente conforme al ${data.terms.updateIndex}, de acuerdo con el artículo 18 de la LAU.`);
    doc.moveDown(0.5);
    clauseNum++;
  }
  
  // Cláusulas adicionales
  if (!data.clauses.petsAllowed) {
    doc.font('Helvetica-Bold').text(`${clauseNum}. PROHIBICIÓN DE ANIMALES`);
    doc.font('Helvetica').text(`No se permite la tenencia de animales en la vivienda sin consentimiento expreso del arrendador.`);
    doc.moveDown(0.5);
    clauseNum++;
  }
  
  // ... más cláusulas
  
  // Firmas
  doc.moveDown(2);
  doc.text('Y en prueba de conformidad, firman el presente contrato por duplicado en el lugar y fecha indicados.');
  doc.moveDown(2);
  
  doc.text('EL ARRENDADOR', { continued: true, width: 200 });
  doc.text('EL ARRENDATARIO', { align: 'right' });
  doc.moveDown(3);
  doc.text('Fdo: ' + data.landlord.name, { continued: true, width: 200 });
  doc.text('Fdo: ' + data.tenant.name, { align: 'right' });
  
  doc.end();
  
  return new Promise(resolve => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
```

---

## 🟡 PRIORIDAD ALTA: Guías y Documentación

### Guías PDF a Crear

| Guía | Páginas Est. | Contenido |
|------|--------------|-----------|
| **Guía fiscal para propietarios** | 20-30 | IRPF, deducciones, sociedades |
| **Guía LAU actualizada** | 15-20 | Resumen ley arrendamientos |
| **Guía de screening de inquilinos** | 10-15 | Verificación, documentos, red flags |
| **Guía de valoración de inmuebles** | 15-20 | Métodos, comparables, factores |
| **Checklist de inspección** | 5-10 | Lista verificación estado vivienda |
| **Guía de home staging** | 10-15 | Tips para preparar vivienda |
| **Guía de fotografía inmobiliaria** | 10-15 | Cómo hacer fotos profesionales |
| **Guía de certificado energético** | 8-10 | Qué es, cómo mejorar, costes |
| **Guía de reforma rentable** | 15-20 | ROI de reformas, prioridades |
| **Guía de financiación** | 15-20 | Hipotecas, tipos, negociación |

---

## 🟡 PRIORIDAD ALTA: Base de Datos de Hipotecas

### Funcionalidad

```typescript
// lib/mortgages/mortgage-database.ts
interface MortgageProduct {
  id: string;
  bank: string;
  bankLogo: string;
  productName: string;
  type: 'FIXED' | 'VARIABLE' | 'MIXED';
  
  // Condiciones
  tin: number;                    // Tipo Interés Nominal
  tae: number;                    // TAE
  euriborDifferential?: number;   // Para variables
  fixedPeriodYears?: number;      // Para mixtas
  
  // Límites
  maxLtv: number;                 // Loan to Value máximo (%)
  minAmount: number;
  maxAmount: number;
  minTermYears: number;
  maxTermYears: number;
  
  // Comisiones
  openingFee: number;             // %
  earlyRepaymentFee: number;      // %
  subrogationFee: number;         // %
  
  // Bonificaciones
  bonifications: {
    description: string;
    reduction: number;            // % de reducción en TIN
    requirement: string;
  }[];
  
  // Requisitos
  requirements: string[];
  
  // Metadata
  lastUpdated: Date;
  sourceUrl: string;
}

// API para comparar hipotecas
export async function compareMortgages(
  amount: number,
  termYears: number,
  propertyValue: number,
  userProfile: {
    hasPayroll: boolean;
    hasInsurance: boolean;
    hasCreditCards: boolean;
  }
): Promise<{
  product: MortgageProduct;
  monthlyPayment: number;
  totalCost: number;
  effectiveTae: number;
}[]> {
  // Obtener productos de BD
  const products = await prisma.mortgageProduct.findMany({
    where: {
      minAmount: { lte: amount },
      maxAmount: { gte: amount },
      minTermYears: { lte: termYears },
      maxTermYears: { gte: termYears },
      maxLtv: { gte: (amount / propertyValue) * 100 }
    },
    orderBy: { tae: 'asc' }
  });
  
  return products.map(product => {
    // Calcular TIN efectivo con bonificaciones
    let effectiveTin = product.tin;
    product.bonifications.forEach(bonus => {
      if (
        (bonus.requirement === 'PAYROLL' && userProfile.hasPayroll) ||
        (bonus.requirement === 'INSURANCE' && userProfile.hasInsurance) ||
        (bonus.requirement === 'CARDS' && userProfile.hasCreditCards)
      ) {
        effectiveTin -= bonus.reduction;
      }
    });
    
    // Calcular cuota
    const monthlyRate = effectiveTin / 100 / 12;
    const numPayments = termYears * 12;
    const monthlyPayment = amount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return {
      product,
      monthlyPayment,
      totalCost: monthlyPayment * numPayments + (product.openingFee / 100 * amount),
      effectiveTae: product.tae // Simplificado
    };
  });
}
```

---

## 🟢 PRIORIDAD MEDIA: Directorio de Profesionales

### Categorías

| Categoría | Subcategorías |
|-----------|---------------|
| **Reformas** | Albañiles, Electricistas, Fontaneros, Pintores |
| **Legal** | Abogados inmobiliarios, Notarías, Gestorías |
| **Financiero** | Brokers hipotecarios, Asesores fiscales |
| **Marketing** | Fotógrafos, Home stagers, Diseñadores |
| **Servicios** | Limpieza, Mudanzas, Cerrajeros |
| **Certificaciones** | Certificado energético, ITE, Tasadores |

---

## 📅 Roadmap de Implementación

### Fase 1 (4 semanas) - Calculadoras Core
- [ ] Calculadora de rentabilidad
- [ ] Calculadora de hipoteca
- [ ] Calculadora de gastos compraventa
- [ ] UI/UX de herramientas

### Fase 2 (4 semanas) - Contratos
- [ ] Generador de contratos PDF
- [ ] 5 plantillas principales
- [ ] Sistema de personalización
- [ ] Firma digital (integración DocuSign)

### Fase 3 (3 semanas) - Guías
- [ ] 5 guías principales en PDF
- [ ] Sistema de descarga
- [ ] Versiones actualizables

### Fase 4 (3 semanas) - Base de Datos
- [ ] Scraping/API de hipotecas
- [ ] Comparador UI
- [ ] Alertas de cambios

### Fase 5 (2 semanas) - Directorio
- [ ] CRUD de profesionales
- [ ] Sistema de reviews
- [ ] Verificación de perfiles

---

## 💰 Monetización de Herramientas

| Herramienta | Free | Pro (€29/mes) | Business (€99/mes) |
|-------------|------|---------------|-------------------|
| Calculadoras básicas | ✅ | ✅ | ✅ |
| Calculadoras avanzadas | ❌ | ✅ | ✅ |
| Contratos (3/mes) | ✅ | ✅ | ✅ |
| Contratos ilimitados | ❌ | ✅ | ✅ |
| Guías PDF | ❌ | ✅ | ✅ |
| Comparador hipotecas | ✅ (limitado) | ✅ | ✅ |
| Directorio profesionales | ✅ (ver) | ✅ (contactar) | ✅ + API |
| Exportar a Excel | ❌ | ✅ | ✅ |
| Branding personalizado | ❌ | ❌ | ✅ |

---

**Última actualización**: 11 de Enero de 2026
