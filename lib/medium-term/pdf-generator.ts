/**
 * GENERADOR DE PDF PARA CONTRATOS DE MEDIA ESTANCIA
 * 
 * Genera PDF profesional del contrato legal usando Puppeteer o jsPDF
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  generarContratoMediaEstanciaHTML,
  type DatosContratoMediaEstancia,
} from '../contract-templates/medium-term-template';
import { prisma } from '../db';

// ==========================================
// TIPOS
// ==========================================

export interface GeneratePDFOptions {
  contractId: string;
  includeInventory?: boolean;
  includePhotos?: boolean;
  watermark?: string;
  language?: 'es' | 'en' | 'fr';
}

export interface PDFResult {
  buffer: Buffer;
  filename: string;
  size: number;
  pages: number;
}

// ==========================================
// ESTILOS CSS PARA PDF
// ==========================================

const PDF_STYLES = `
  @page {
    size: A4;
    margin: 20mm;
  }
  
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #333;
    margin: 0;
    padding: 0;
  }
  
  .header {
    text-align: center;
    border: 2px solid #333;
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .header h1 {
    font-size: 16pt;
    margin: 0 0 5px 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  .header .subtitle {
    font-size: 10pt;
    color: #666;
    margin: 0;
  }
  
  .section {
    margin-bottom: 15px;
    page-break-inside: avoid;
  }
  
  .section-title {
    font-size: 12pt;
    font-weight: bold;
    border-bottom: 1px solid #999;
    padding-bottom: 5px;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .clause {
    margin-bottom: 15px;
    text-align: justify;
  }
  
  .clause-title {
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 5px;
  }
  
  .parties-box {
    border: 1px solid #ccc;
    padding: 10px;
    margin-bottom: 10px;
    background-color: #f9f9f9;
  }
  
  .party-label {
    font-weight: bold;
    color: #666;
    font-size: 9pt;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  
  .party-name {
    font-size: 12pt;
    font-weight: bold;
    margin-bottom: 3px;
  }
  
  .party-details {
    font-size: 10pt;
    color: #555;
  }
  
  .property-box {
    border: 1px solid #333;
    padding: 15px;
    margin: 15px 0;
  }
  
  .property-address {
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .property-details {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .property-detail {
    flex: 1;
    min-width: 120px;
    padding: 5px;
    background: #f5f5f5;
    text-align: center;
  }
  
  .property-detail-label {
    font-size: 8pt;
    color: #666;
    text-transform: uppercase;
  }
  
  .property-detail-value {
    font-size: 11pt;
    font-weight: bold;
  }
  
  .temporality-box {
    border-left: 4px solid #2563eb;
    padding: 10px 15px;
    margin: 15px 0;
    background-color: #eff6ff;
  }
  
  .temporality-title {
    font-weight: bold;
    color: #1e40af;
    margin-bottom: 5px;
  }
  
  .economic-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }
  
  .economic-table th,
  .economic-table td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }
  
  .economic-table th {
    background-color: #f0f0f0;
    font-weight: bold;
  }
  
  .economic-table .amount {
    text-align: right;
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }
  
  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 15px 0;
  }
  
  .service-item {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: center;
    font-size: 10pt;
  }
  
  .service-included {
    background-color: #dcfce7;
    border-color: #86efac;
  }
  
  .service-excluded {
    background-color: #fee2e2;
    border-color: #fca5a5;
  }
  
  .signature-area {
    margin-top: 50px;
    page-break-inside: avoid;
  }
  
  .signature-box {
    display: inline-block;
    width: 45%;
    margin: 10px 2%;
    text-align: center;
  }
  
  .signature-line {
    border-bottom: 1px solid #333;
    height: 60px;
    margin-bottom: 5px;
  }
  
  .signature-label {
    font-size: 10pt;
    color: #666;
  }
  
  .footer {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #ccc;
    text-align: center;
    font-size: 8pt;
    color: #999;
  }
  
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 60pt;
    color: rgba(0, 0, 0, 0.05);
    z-index: -1;
    white-space: nowrap;
  }
  
  .inventory-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin: 10px 0;
  }
  
  .inventory-table th,
  .inventory-table td {
    border: 1px solid #ddd;
    padding: 5px;
  }
  
  .inventory-table th {
    background-color: #f0f0f0;
  }
  
  .page-break {
    page-break-before: always;
  }
`;

// ==========================================
// FUNCIONES DE GENERACIÓN
// ==========================================

/**
 * Genera HTML formateado para el contrato
 */
export function generateContractHTML(
  datos: DatosContratoMediaEstancia,
  options: Partial<GeneratePDFOptions> = {}
): string {
  const fechaActual = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Arrendamiento por Temporada</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
  ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
  
  <!-- ENCABEZADO -->
  <div class="header">
    <h1>Contrato de Arrendamiento por Temporada</h1>
    <p class="subtitle">Artículo 3.2 de la Ley de Arrendamientos Urbanos (LAU)</p>
  </div>
  
  <!-- PARTES -->
  <div class="section">
    <div class="section-title">Partes Contratantes</div>
    
    <div class="parties-box">
      <div class="party-label">Arrendador</div>
      <div class="party-name">${datos.arrendador.nombre}</div>
      <div class="party-details">
        DNI/NIE: ${datos.arrendador.dni}<br>
        Domicilio: ${datos.arrendador.direccion}<br>
        ${datos.arrendador.telefono ? `Teléfono: ${datos.arrendador.telefono}<br>` : ''}
        ${datos.arrendador.email ? `Email: ${datos.arrendador.email}` : ''}
      </div>
    </div>
    
    <div class="parties-box">
      <div class="party-label">Arrendatario</div>
      <div class="party-name">${datos.arrendatario.nombre}</div>
      <div class="party-details">
        DNI/NIE/Pasaporte: ${datos.arrendatario.dni}<br>
        ${datos.arrendatario.nacionalidad ? `Nacionalidad: ${datos.arrendatario.nacionalidad}<br>` : ''}
        Domicilio: ${datos.arrendatario.direccion}<br>
        ${datos.arrendatario.telefono ? `Teléfono: ${datos.arrendatario.telefono}<br>` : ''}
        ${datos.arrendatario.email ? `Email: ${datos.arrendatario.email}` : ''}
      </div>
    </div>
  </div>
  
  <!-- INMUEBLE -->
  <div class="section">
    <div class="section-title">Inmueble Arrendado</div>
    
    <div class="property-box">
      <div class="property-address">
        ${datos.inmueble.direccion}
      </div>
      <div class="property-details">
        <div class="property-detail">
          <div class="property-detail-label">Municipio</div>
          <div class="property-detail-value">${datos.inmueble.municipio}</div>
        </div>
        <div class="property-detail">
          <div class="property-detail-label">Provincia</div>
          <div class="property-detail-value">${datos.inmueble.provincia}</div>
        </div>
        <div class="property-detail">
          <div class="property-detail-label">C.P.</div>
          <div class="property-detail-value">${datos.inmueble.codigoPostal}</div>
        </div>
        ${datos.inmueble.superficie ? `
        <div class="property-detail">
          <div class="property-detail-label">Superficie</div>
          <div class="property-detail-value">${datos.inmueble.superficie} m²</div>
        </div>
        ` : ''}
        ${datos.inmueble.habitaciones ? `
        <div class="property-detail">
          <div class="property-detail-label">Habitaciones</div>
          <div class="property-detail-value">${datos.inmueble.habitaciones}</div>
        </div>
        ` : ''}
        ${datos.inmueble.banos ? `
        <div class="property-detail">
          <div class="property-detail-label">Baños</div>
          <div class="property-detail-value">${datos.inmueble.banos}</div>
        </div>
        ` : ''}
      </div>
    </div>
    
    ${datos.inmueble.referenciaCatastral ? `
    <p><strong>Referencia Catastral:</strong> ${datos.inmueble.referenciaCatastral}</p>
    ` : ''}
    <p><strong>Estado:</strong> ${datos.inmueble.amueblado ? 'Completamente amueblado' : 'Sin amueblar'}</p>
  </div>
  
  <!-- MOTIVO DE TEMPORALIDAD -->
  <div class="section">
    <div class="temporality-box">
      <div class="temporality-title">⚠️ MOTIVO DE TEMPORALIDAD (Art. 3.2 LAU)</div>
      <p><strong>Motivo:</strong> ${datos.motivoTemporalidad}</p>
      <p>${datos.descripcionMotivo}</p>
    </div>
  </div>
  
  <!-- DURACIÓN -->
  <div class="section">
    <div class="section-title">Duración del Contrato</div>
    
    <table class="economic-table">
      <tr>
        <th>Concepto</th>
        <th>Detalle</th>
      </tr>
      <tr>
        <td>Fecha de inicio</td>
        <td><strong>${format(datos.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es })}</strong></td>
      </tr>
      <tr>
        <td>Fecha de finalización</td>
        <td><strong>${format(datos.fechaFin, "d 'de' MMMM 'de' yyyy", { locale: es })}</strong></td>
      </tr>
      <tr>
        <td>Duración total</td>
        <td><strong>${datos.duracionMeses} meses</strong></td>
      </tr>
    </table>
    
    ${datos.prorrateo ? `
    <p><strong>Desglose de prorrateo:</strong></p>
    <table class="economic-table">
      <tr>
        <th>Período</th>
        <th class="amount">Importe</th>
      </tr>
      ${datos.prorrateo.diasPrimerMes > 0 ? `
      <tr>
        <td>Primer mes (${datos.prorrateo.diasPrimerMes} días)</td>
        <td class="amount">${datos.prorrateo.importePrimerMes.toFixed(2)} €</td>
      </tr>
      ` : ''}
      <tr>
        <td>Meses completos (${datos.prorrateo.mesesCompletos})</td>
        <td class="amount">${(datos.rentaMensual * datos.prorrateo.mesesCompletos).toFixed(2)} €</td>
      </tr>
      ${datos.prorrateo.diasUltimoMes > 0 ? `
      <tr>
        <td>Último mes (${datos.prorrateo.diasUltimoMes} días)</td>
        <td class="amount">${datos.prorrateo.importeUltimoMes.toFixed(2)} €</td>
      </tr>
      ` : ''}
      <tr style="background-color: #f0f0f0;">
        <td><strong>TOTAL CONTRATO</strong></td>
        <td class="amount"><strong>${datos.prorrateo.importeTotal.toFixed(2)} €</strong></td>
      </tr>
    </table>
    ` : ''}
  </div>
  
  <!-- CONDICIONES ECONÓMICAS -->
  <div class="section">
    <div class="section-title">Condiciones Económicas</div>
    
    <table class="economic-table">
      <tr>
        <th>Concepto</th>
        <th class="amount">Importe</th>
      </tr>
      <tr>
        <td>Renta mensual</td>
        <td class="amount">${datos.rentaMensual.toFixed(2)} €</td>
      </tr>
      <tr>
        <td>Fianza legal (${datos.mesesFianza} ${datos.mesesFianza > 1 ? 'meses' : 'mes'})</td>
        <td class="amount">${datos.fianza.toFixed(2)} €</td>
      </tr>
      ${datos.depositoSuministros ? `
      <tr>
        <td>Depósito suministros</td>
        <td class="amount">${datos.depositoSuministros.toFixed(2)} €</td>
      </tr>
      ` : ''}
      <tr style="background-color: #f0f0f0;">
        <td><strong>Total a entregar a la firma</strong></td>
        <td class="amount"><strong>${(datos.fianza + (datos.depositoSuministros || 0)).toFixed(2)} €</strong></td>
      </tr>
    </table>
  </div>
  
  <!-- SERVICIOS INCLUIDOS -->
  ${datos.serviciosIncluidos ? `
  <div class="section">
    <div class="section-title">Servicios Incluidos en la Renta</div>
    
    <div class="services-grid">
      <div class="service-item ${datos.serviciosIncluidos.wifi ? 'service-included' : 'service-excluded'}">
        ${datos.serviciosIncluidos.wifi ? '✓' : '✗'} WiFi
      </div>
      <div class="service-item ${datos.serviciosIncluidos.agua ? 'service-included' : 'service-excluded'}">
        ${datos.serviciosIncluidos.agua ? '✓' : '✗'} Agua
      </div>
      <div class="service-item ${datos.serviciosIncluidos.luz ? 'service-included' : 'service-excluded'}">
        ${datos.serviciosIncluidos.luz ? '✓' : '✗'} Electricidad
      </div>
      <div class="service-item ${datos.serviciosIncluidos.gas ? 'service-included' : 'service-excluded'}">
        ${datos.serviciosIncluidos.gas ? '✓' : '✗'} Gas
      </div>
      <div class="service-item ${datos.serviciosIncluidos.calefaccion ? 'service-included' : 'service-excluded'}">
        ${datos.serviciosIncluidos.calefaccion ? '✓' : '✗'} Calefacción
      </div>
      <div class="service-item ${datos.serviciosIncluidos.comunidad ? 'service-included' : 'service-excluded'}">
        ${datos.serviciosIncluidos.comunidad ? '✓' : '✗'} Comunidad
      </div>
    </div>
    
    ${datos.serviciosIncluidos.limpieza ? `
    <p><strong>Servicio de limpieza:</strong> ${datos.serviciosIncluidos.limpiezaFrecuencia || 'Semanal'}</p>
    ` : ''}
  </div>
  ` : ''}
  
  <!-- CLÁUSULAS LEGALES -->
  <div class="page-break"></div>
  
  <div class="section">
    <div class="section-title">Cláusulas del Contrato</div>
    
    <div class="clause">
      <div class="clause-title">PRIMERA - Objeto</div>
      <p>El arrendador cede en arrendamiento al arrendatario la vivienda descrita para su uso como RESIDENCIA TEMPORAL. Este arrendamiento se configura como ARRENDAMIENTO PARA USO DISTINTO DE VIVIENDA HABITUAL (arrendamiento por temporada), al amparo del artículo 3.2 de la LAU.</p>
    </div>
    
    <div class="clause">
      <div class="clause-title">SEGUNDA - Duración</div>
      <p>El contrato tendrá la duración indicada y quedará extinguido automáticamente a su término sin necesidad de requerimiento previo. La permanencia posterior sin consentimiento conllevará indemnización del doble de la renta diaria.</p>
    </div>
    
    <div class="clause">
      <div class="clause-title">TERCERA - Renta y pagos</div>
      <p>El pago se realizará por mensualidades anticipadas, dentro de los primeros cinco días de cada mes, mediante transferencia bancaria. El impago durante quince días será causa de resolución.</p>
    </div>
    
    <div class="clause">
      <div class="clause-title">CUARTA - Fianza</div>
      <p>La fianza será depositada en el organismo autonómico correspondiente y devuelta en el plazo máximo de un mes desde la entrega de llaves, previa verificación del estado de la vivienda.</p>
    </div>
    
    <div class="clause">
      <div class="clause-title">QUINTA - Inventario</div>
      <p>Se realizará inventario de entrada y salida con fotografías. El arrendatario responderá de los daños más allá del desgaste normal por uso ordinario.</p>
    </div>
    
    <div class="clause">
      <div class="clause-title">SEXTA - Desistimiento</div>
      <p>Preaviso mínimo: ${datos.diasPreaviso} días. Penalización por desistimiento: ${datos.penalizacionDesistimiento}% del tiempo restante.</p>
    </div>
    
    <div class="clause">
      <div class="clause-title">SÉPTIMA - Obligaciones</div>
      <p>El arrendatario destinará la vivienda exclusivamente a residencia temporal personal, sin subarrendar ni ceder. Respetará las normas de convivencia de la comunidad.</p>
    </div>
    
    <div class="clause">
      <div class="clause-title">OCTAVA - Régimen legal</div>
      <p>Este contrato se rige por el artículo 3.2 de la LAU y el Código Civil. Queda excluida la aplicación del régimen de vivienda habitual (Título II LAU).</p>
    </div>
  </div>
  
  ${datos.clausulasAdicionales ? `
  <div class="section">
    <div class="section-title">Cláusulas Adicionales</div>
    <p>${datos.clausulasAdicionales}</p>
  </div>
  ` : ''}
  
  <!-- FIRMAS -->
  <div class="signature-area">
    <div class="section-title">Firmas</div>
    <p>En ${datos.firmadoEn || datos.inmueble.municipio}, a ${fechaActual}</p>
    
    <div style="display: flex; justify-content: space-between; margin-top: 30px;">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">
          EL ARRENDADOR<br>
          ${datos.arrendador.nombre}
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">
          EL ARRENDATARIO<br>
          ${datos.arrendatario.nombre}
        </div>
      </div>
    </div>
  </div>
  
  <!-- PIE DE PÁGINA -->
  <div class="footer">
    <p>Documento generado por INMOVA APP | www.inmovaapp.com</p>
    <p>Este contrato tiene plena validez legal conforme a la Ley 29/1994 de Arrendamientos Urbanos</p>
  </div>
</body>
</html>
`;
}

/**
 * Genera PDF del contrato usando el HTML
 * Nota: En producción usar Puppeteer o un servicio de PDF
 */
export async function generateContractPDF(
  contractId: string,
  options: Partial<GeneratePDFOptions> = {}
): Promise<PDFResult> {
  // Obtener datos del contrato
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      unit: {
        include: { building: true },
      },
      tenant: true,
    },
  });

  if (!contract) {
    throw new Error('Contrato no encontrado');
  }

  // Construir datos para la plantilla
  const datos: DatosContratoMediaEstancia = {
    arrendador: {
      nombre: 'Propietario (datos de empresa)', // TODO: Obtener de company
      dni: 'B-12345678',
      direccion: 'Dirección del propietario',
    },
    arrendatario: {
      nombre: contract.tenant.nombre,
      dni: contract.tenant.dni || 'Pendiente',
      direccion: contract.tenant.direccion || 'Pendiente',
      telefono: contract.tenant.telefono || undefined,
      email: contract.tenant.email,
    },
    inmueble: {
      direccion: contract.unit.direccion || '',
      municipio: contract.unit.building?.city || '',
      provincia: contract.unit.building?.province || '',
      codigoPostal: contract.unit.building?.postalCode || '',
      superficie: contract.unit.superficie || undefined,
      habitaciones: contract.unit.habitaciones || undefined,
      banos: contract.unit.banos || undefined,
      amueblado: contract.unit.amueblado || false,
    },
    rentaMensual: contract.rentaMensual,
    fianza: contract.deposito,
    mesesFianza: contract.mesesFianza,
    depositoSuministros: contract.depositoSuministros || undefined,
    fechaInicio: contract.fechaInicio,
    fechaFin: contract.fechaFin,
    duracionMeses: contract.duracionMesesPrevista || 6,
    motivoTemporalidad: contract.motivoTemporalidad || 'trabajo',
    descripcionMotivo: contract.descripcionMotivo || '',
    serviciosIncluidos: contract.serviciosIncluidos as any,
    diasPreaviso: contract.diasPreaviso || 30,
    penalizacionDesistimiento: contract.penalizacionDesistimiento || 50,
    clausulasAdicionales: contract.clausulasAdicionales || undefined,
  };

  // Generar HTML
  const html = generateContractHTML(datos, options);

  // En un entorno real, usaríamos Puppeteer:
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdf = await page.pdf({ format: 'A4' });
  // await browser.close();

  // Por ahora, devolvemos el HTML como buffer
  const buffer = Buffer.from(html, 'utf-8');
  const filename = `contrato-media-estancia-${contractId}-${format(new Date(), 'yyyyMMdd')}.pdf`;

  return {
    buffer,
    filename,
    size: buffer.length,
    pages: 3, // Estimado
  };
}

/**
 * Genera PDF del inventario
 */
export async function generateInventoryPDF(
  contractId: string,
  type: 'entrada' | 'salida'
): Promise<PDFResult> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      unit: { include: { building: true } },
      tenant: true,
    },
  });

  if (!contract) {
    throw new Error('Contrato no encontrado');
  }

  const inventario = type === 'entrada' 
    ? contract.inventarioEntrada 
    : contract.inventarioSalida;

  if (!inventario) {
    throw new Error(`Inventario de ${type} no encontrado`);
  }

  const items = (inventario as any).items || [];
  const fechaRealizacion = (inventario as any).fechaRealizacion;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Inventario de ${type === 'entrada' ? 'Entrada' : 'Salida'}</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
  <div class="header">
    <h1>Inventario de ${type === 'entrada' ? 'Entrada' : 'Salida'}</h1>
    <p class="subtitle">Contrato de Arrendamiento por Temporada</p>
  </div>
  
  <div class="section">
    <p><strong>Inmueble:</strong> ${contract.unit.direccion}, ${contract.unit.building?.city}</p>
    <p><strong>Inquilino:</strong> ${contract.tenant.nombre}</p>
    <p><strong>Fecha:</strong> ${fechaRealizacion ? format(new Date(fechaRealizacion), "d 'de' MMMM 'de' yyyy", { locale: es }) : 'No especificada'}</p>
  </div>
  
  <div class="section">
    <div class="section-title">Listado de Items</div>
    
    <table class="inventory-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Ubicación</th>
          <th>Cantidad</th>
          <th>Estado</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any) => `
          <tr>
            <td>${item.nombre}</td>
            <td>${item.ubicacion}</td>
            <td>${item.cantidad}</td>
            <td>${item.estado}</td>
            <td>${item.observaciones || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="signature-area">
    <div style="display: flex; justify-content: space-between; margin-top: 30px;">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">PROPIETARIO</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">INQUILINO</div>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>Generado por INMOVA APP | www.inmovaapp.com</p>
  </div>
</body>
</html>
`;

  const buffer = Buffer.from(html, 'utf-8');
  const filename = `inventario-${type}-${contractId}-${format(new Date(), 'yyyyMMdd')}.pdf`;

  return {
    buffer,
    filename,
    size: buffer.length,
    pages: Math.ceil(items.length / 20) || 1,
  };
}

export default {
  generateContractHTML,
  generateContractPDF,
  generateInventoryPDF,
};
