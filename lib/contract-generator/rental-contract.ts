/**
 * Generador de contratos de arrendamiento
 */

import { ContractData, GeneratedContract, InventoryItem } from './types';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import crypto from 'crypto';

/**
 * Genera un contrato de arrendamiento completo
 */
export function generateRentalContract(data: ContractData): GeneratedContract {
  const id = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const html = generateContractHTML(data);
  const pdfContent = generatePDFContent(data);
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  
  return {
    id,
    html,
    pdfContent,
    data,
    generatedAt: new Date(),
    hash,
  };
}

/**
 * Genera el HTML del contrato
 */
function generateContractHTML(data: ContractData): string {
  const { landlord, tenant, property, terms, inventory } = data;
  
  const startDateFormatted = format(terms.startDate, "d 'de' MMMM 'de' yyyy", { locale: es });
  const endDate = addMonths(terms.startDate, terms.durationMonths);
  const endDateFormatted = format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es });
  
  const contractTypeTitle = getContractTypeTitle(terms.type);
  const lawReference = getLawReference(terms.type);
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${contractTypeTitle}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { text-align: center; font-size: 16pt; margin-bottom: 30px; }
    h2 { font-size: 13pt; margin-top: 25px; margin-bottom: 10px; }
    .header { text-align: center; margin-bottom: 40px; }
    .parties { margin-bottom: 30px; }
    .party { margin-bottom: 15px; }
    .clauses { margin-top: 30px; }
    .clause { margin-bottom: 20px; text-align: justify; }
    .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; text-align: center; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 10px; }
    .inventory-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .inventory-table th, .inventory-table td { border: 1px solid #000; padding: 8px; text-align: left; }
    .inventory-table th { background-color: #f0f0f0; }
    .footer { margin-top: 40px; text-align: center; font-size: 10pt; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${contractTypeTitle}</h1>
    <p><strong>Referencia:</strong> ${data.landlord.documentId.substring(0, 4)}/${format(terms.startDate, 'yyyy')}</p>
  </div>
  
  <p>En ${property.city}, a ${startDateFormatted}</p>
  
  <h2>REUNIDOS</h2>
  
  <div class="parties">
    <div class="party">
      <p><strong>DE UNA PARTE, COMO ARRENDADOR/A:</strong></p>
      <p>D./Dña. <strong>${landlord.name}</strong>, mayor de edad, con ${landlord.documentType} núm. <strong>${landlord.documentId}</strong>, 
      con domicilio en ${landlord.address}, ${landlord.postalCode} ${landlord.city}, 
      teléfono ${landlord.phone}, email: ${landlord.email}.</p>
    </div>
    
    <div class="party">
      <p><strong>DE OTRA PARTE, COMO ARRENDATARIO/A:</strong></p>
      <p>D./Dña. <strong>${tenant.name}</strong>, mayor de edad, con ${tenant.documentType} núm. <strong>${tenant.documentId}</strong>, 
      con domicilio a efectos de notificaciones en ${tenant.address}, ${tenant.postalCode} ${tenant.city}, 
      teléfono ${tenant.phone}, email: ${tenant.email}.</p>
    </div>
  </div>
  
  <p>Ambas partes se reconocen mutuamente capacidad legal para contratar y obligarse y, en especial, 
  para el otorgamiento del presente contrato de arrendamiento, y a tal efecto:</p>
  
  <h2>EXPONEN</h2>
  
  <p><strong>PRIMERO.-</strong> Que el/la ARRENDADOR/A es propietario/a del inmueble sito en 
  <strong>${property.address}, ${property.floor ? `Planta ${property.floor}` : ''} ${property.door ? `Puerta ${property.door}` : ''}, 
  ${property.postalCode} ${property.city} (${property.province})</strong>
  ${property.cadastralReference ? `, con referencia catastral ${property.cadastralReference}` : ''}.
  </p>
  
  <p>El inmueble tiene una superficie aproximada de <strong>${property.area} m²</strong>, 
  consta de <strong>${property.bedrooms} habitaciones</strong> y <strong>${property.bathrooms} baños</strong>,
  ${property.hasGarage ? 'con plaza de garaje,' : ''} 
  ${property.hasStorage ? 'con trastero,' : ''}
  ${property.furnished ? 'amueblado según inventario adjunto' : 'sin amueblar'}.
  ${property.energyCertificate ? `Calificación energética: ${property.energyCertificate}.` : ''}</p>
  
  <p><strong>SEGUNDO.-</strong> Que el/la ARRENDATARIO/A está interesado/a en el arrendamiento de la vivienda 
  descrita para destinarla a ${terms.type === 'HABITUAL' ? 'su vivienda habitual y permanente' : 
    terms.type === 'TEMPORADA' ? 'uso temporal' : 
    terms.type === 'HABITACION' ? 'uso de habitación' : 'uso comercial'}.</p>
  
  <p><strong>TERCERO.-</strong> Que ambas partes convienen formalizar el presente contrato de arrendamiento, 
  que se regirá por ${lawReference}, y por las siguientes:</p>
  
  <h2>ESTIPULACIONES</h2>
  
  <div class="clauses">
    <div class="clause">
      <p><strong>PRIMERA.- OBJETO DEL CONTRATO</strong></p>
      <p>El/la ARRENDADOR/A arrienda al/la ARRENDATARIO/A, que acepta, el inmueble descrito en el expositivo primero.</p>
    </div>
    
    <div class="clause">
      <p><strong>SEGUNDA.- DURACIÓN</strong></p>
      <p>El presente contrato tendrá una duración de <strong>${terms.durationMonths} meses</strong>, 
      comenzando el día <strong>${startDateFormatted}</strong> y finalizando el día <strong>${endDateFormatted}</strong>.</p>
      ${terms.type === 'HABITUAL' ? `
      <p>De conformidad con el artículo 9 de la LAU, si llegada la fecha de vencimiento del contrato hubiera transcurrido 
      un periodo mínimo de cinco años, y ninguna de las partes hubiese notificado a la otra, al menos con cuatro meses de 
      antelación a aquella fecha en el caso del arrendador y con dos meses de antelación en el caso del arrendatario, su 
      voluntad de no renovarlo, el contrato se prorrogará obligatoriamente por plazos anuales hasta un máximo de tres años más.</p>
      ` : ''}
    </div>
    
    <div class="clause">
      <p><strong>TERCERA.- RENTA</strong></p>
      <p>La renta mensual se fija en <strong>${formatCurrency(terms.monthlyRent)}</strong> 
      (${numberToWords(terms.monthlyRent)} euros), pagaderos dentro de los <strong>${terms.paymentDay} primeros días</strong> 
      de cada mes ${terms.paymentMethod === 'TRANSFER' ? `mediante transferencia bancaria a la cuenta IBAN ${terms.iban}` : 
        terms.paymentMethod === 'DOMICILIATION' ? 'mediante domiciliación bancaria' : 'en efectivo'}.</p>
      
      <p>En esta renta ${getIncludedExpensesText(terms.includedExpenses)}.</p>
    </div>
    
    <div class="clause">
      <p><strong>CUARTA.- ACTUALIZACIÓN DE LA RENTA</strong></p>
      <p>La renta se actualizará anualmente conforme al índice ${terms.updateIndex === 'IPC' ? 'de Precios al Consumo (IPC)' : 
        terms.updateIndex === 'IGC' ? 'de Garantía de Competitividad (IGC)' : 
        'de Referencia de Arrendamientos de Vivienda (IRAV)'} publicado por el Instituto Nacional de Estadística.</p>
    </div>
    
    <div class="clause">
      <p><strong>QUINTA.- FIANZA</strong></p>
      <p>El/la ARRENDATARIO/A entrega en este acto al/la ARRENDADOR/A la cantidad de 
      <strong>${formatCurrency(terms.monthlyRent * terms.depositMonths)}</strong> 
      (${numberToWords(terms.monthlyRent * terms.depositMonths)} euros), equivalente a 
      <strong>${terms.depositMonths} ${terms.depositMonths === 1 ? 'mensualidad' : 'mensualidades'}</strong> de renta, 
      en concepto de fianza legal.</p>
      ${terms.additionalGuarantee && terms.additionalGuarantee > 0 ? `
      <p>Adicionalmente, se constituye una garantía adicional de <strong>${formatCurrency(terms.additionalGuarantee)}</strong>.</p>
      ` : ''}
      <p>Esta fianza será depositada en el organismo correspondiente de la Comunidad Autónoma.</p>
    </div>
    
    <div class="clause">
      <p><strong>SEXTA.- ESTADO DEL INMUEBLE</strong></p>
      <p>El/la ARRENDATARIO/A declara conocer el inmueble y lo recibe en perfecto estado de conservación, 
      comprometiéndose a devolverlo en las mismas condiciones al término del contrato, salvo el desgaste normal por el uso.</p>
    </div>
    
    <div class="clause">
      <p><strong>SÉPTIMA.- GASTOS</strong></p>
      <p>Serán a cargo del/la ARRENDATARIO/A los suministros de agua, electricidad, gas e internet que se contraten a su nombre.</p>
      <p>Serán a cargo del/la ARRENDADOR/A el IBI, la cuota de comunidad de propietarios y el seguro del continente.</p>
    </div>
    
    <div class="clause">
      <p><strong>OCTAVA.- OBRAS Y MODIFICACIONES</strong></p>
      <p>El/la ARRENDATARIO/A no podrá realizar obras que modifiquen la configuración del inmueble sin el consentimiento 
      expreso y por escrito del/la ARRENDADOR/A.</p>
    </div>
    
    <div class="clause">
      <p><strong>NOVENA.- SUBARRIENDO Y CESIÓN</strong></p>
      <p>El/la ARRENDATARIO/A ${terms.sublettingAllowed ? 'podrá subarrendar parcialmente' : 'NO podrá subarrendar ni ceder'} 
      el inmueble sin el consentimiento expreso y por escrito del/la ARRENDADOR/A.</p>
    </div>
    
    <div class="clause">
      <p><strong>DÉCIMA.- USO DEL INMUEBLE</strong></p>
      <p>El/la ARRENDATARIO/A se obliga a utilizar el inmueble exclusivamente para el destino pactado, 
      a respetar las normas de la comunidad de propietarios y a no realizar actividades molestas, insalubres, nocivas o peligrosas.</p>
      ${terms.petsAllowed ? '<p>Se permite la tenencia de mascotas, respetando las normas de convivencia.</p>' : 
        '<p>No se permite la tenencia de mascotas sin autorización expresa del arrendador.</p>'}
    </div>
    
    ${terms.additionalClauses && terms.additionalClauses.length > 0 ? `
    <div class="clause">
      <p><strong>CLÁUSULAS ADICIONALES</strong></p>
      ${terms.additionalClauses.map((clause, i) => `<p>${i + 11}.- ${clause}</p>`).join('')}
    </div>
    ` : ''}
    
    <div class="clause">
      <p><strong>JURISDICCIÓN</strong></p>
      <p>Para cualquier controversia que pudiera derivarse de este contrato, las partes se someten a los 
      Juzgados y Tribunales del lugar donde radica el inmueble.</p>
    </div>
  </div>
  
  ${inventory && inventory.length > 0 ? `
  <h2>ANEXO: INVENTARIO</h2>
  <table class="inventory-table">
    <thead>
      <tr>
        <th>Elemento</th>
        <th>Cantidad</th>
        <th>Estado</th>
        <th>Observaciones</th>
      </tr>
    </thead>
    <tbody>
      ${inventory.map(item => `
      <tr>
        <td>${item.item}</td>
        <td>${item.quantity}</td>
        <td>${item.condition}</td>
        <td>${item.notes || '-'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  <p>Y en prueba de conformidad, las partes firman el presente contrato por duplicado ejemplar, 
  en el lugar y fecha indicados en el encabezamiento.</p>
  
  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-line">
        <p><strong>EL/LA ARRENDADOR/A</strong></p>
        <p>${landlord.name}</p>
        <p>DNI: ${landlord.documentId}</p>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <p><strong>EL/LA ARRENDATARIO/A</strong></p>
        <p>${tenant.name}</p>
        <p>DNI: ${tenant.documentId}</p>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>Documento generado por Inmova • ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
    <p>Hash de verificación: ${crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16)}</p>
  </div>
</body>
</html>
  `;
}

/**
 * Genera contenido para PDF (texto plano estructurado)
 */
function generatePDFContent(data: ContractData): string {
  // Similar al HTML pero sin tags para sistemas que generen PDF de otra manera
  return JSON.stringify(data, null, 2);
}

/**
 * Helpers
 */
function getContractTypeTitle(type: string): string {
  const titles: Record<string, string> = {
    HABITUAL: 'CONTRATO DE ARRENDAMIENTO DE VIVIENDA HABITUAL',
    TEMPORADA: 'CONTRATO DE ARRENDAMIENTO DE TEMPORADA',
    HABITACION: 'CONTRATO DE ARRENDAMIENTO DE HABITACIÓN',
    LOCAL: 'CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL',
  };
  return titles[type] || 'CONTRATO DE ARRENDAMIENTO';
}

function getLawReference(type: string): string {
  if (type === 'HABITUAL') {
    return 'la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos (LAU), modificada por el Real Decreto-ley 7/2019 y la Ley 12/2023, de 24 de mayo, por el derecho a la vivienda';
  }
  return 'la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos (LAU)';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function numberToWords(num: number): string {
  const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  if (num === 0) return 'cero';
  if (num === 100) return 'cien';
  if (num === 1000) return 'mil';
  
  // Simplificación para números comunes
  const intPart = Math.floor(num);
  
  if (intPart < 10) return units[intPart];
  if (intPart < 20) return teens[intPart - 10];
  if (intPart < 100) {
    const t = Math.floor(intPart / 10);
    const u = intPart % 10;
    if (u === 0) return tens[t];
    if (t === 2) return `veinti${units[u]}`;
    return `${tens[t]} y ${units[u]}`;
  }
  if (intPart < 1000) {
    const h = Math.floor(intPart / 100);
    const rest = intPart % 100;
    if (rest === 0) return hundreds[h];
    return `${hundreds[h]} ${numberToWords(rest)}`;
  }
  if (intPart < 10000) {
    const th = Math.floor(intPart / 1000);
    const rest = intPart % 1000;
    const thStr = th === 1 ? 'mil' : `${units[th]} mil`;
    if (rest === 0) return thStr;
    return `${thStr} ${numberToWords(rest)}`;
  }
  
  return String(intPart);
}

function getIncludedExpensesText(expenses: ContractData['terms']['includedExpenses']): string {
  const included: string[] = [];
  const excluded: string[] = [];
  
  if (expenses.water) included.push('agua'); else excluded.push('agua');
  if (expenses.electricity) included.push('electricidad'); else excluded.push('electricidad');
  if (expenses.gas) included.push('gas'); else excluded.push('gas');
  if (expenses.internet) included.push('internet'); else excluded.push('internet');
  if (expenses.community) included.push('comunidad'); else excluded.push('comunidad');
  
  if (included.length === 0) {
    return 'NO están incluidos los gastos de suministros';
  }
  if (excluded.length === 0) {
    return 'ESTÁN INCLUIDOS todos los gastos de suministros';
  }
  return `ESTÁN INCLUIDOS: ${included.join(', ')}. NO INCLUIDOS: ${excluded.join(', ')}`;
}
