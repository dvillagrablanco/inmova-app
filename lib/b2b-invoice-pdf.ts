/**
 * Generador de PDFs para facturas B2B
 * Compatible con formato ContaSimple
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface B2BInvoiceData {
  numeroFactura: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  periodo: string;
  emisor: {
    nombre: string;
    cif: string | null;
    direccion: string | null;
    email: string | null;
    telefono: string | null;
  };
  cliente: {
    nombre: string;
    cif: string | null;
    direccion: string | null;
    email: string | null;
    telefono: string | null;
  };
  conceptos: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    iva: number;
    total: number;
  }>;
  subtotal: number;
  totalIva: number;
  total: number;
  notas?: string;
  terminosPago?: string;
}

/**
 * Genera un PDF de factura B2B compatible con ContaSimple
 */
export function generateB2BInvoicePDF(data: B2BInvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ==== HEADER ====
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text('FACTURA', pageWidth / 2, 25, { align: 'center' });

  // Número de factura y fechas
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Factura Nº: ${data.numeroFactura}`, pageWidth - margin, 25, { align: 'right' });
  doc.text(`Fecha: ${data.fechaEmision.toLocaleDateString('es-ES')}`, pageWidth - margin, 32, {
    align: 'right',
  });
  doc.text(
    `Vencimiento: ${data.fechaVencimiento.toLocaleDateString('es-ES')}`,
    pageWidth - margin,
    39,
    { align: 'right' }
  );
  doc.text(`Periodo: ${data.periodo}`, pageWidth - margin, 46, { align: 'right' });

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 52, pageWidth - margin, 52);

  // ==== EMISOR Y CLIENTE ====
  let currentY = 62;

  // Emisor (izquierda)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text('DATOS DEL EMISOR', margin, currentY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  currentY += 7;
  doc.text(data.emisor.nombre, margin, currentY);
  currentY += 5;

  if (data.emisor.cif) {
    doc.text(`CIF: ${data.emisor.cif}`, margin, currentY);
    currentY += 5;
  }

  if (data.emisor.direccion) {
    const direccionLines = doc.splitTextToSize(data.emisor.direccion, 80);
    doc.text(direccionLines, margin, currentY);
    currentY += direccionLines.length * 5;
  }

  if (data.emisor.telefono) {
    doc.text(`Tel: ${data.emisor.telefono}`, margin, currentY);
    currentY += 5;
  }

  if (data.emisor.email) {
    doc.text(`Email: ${data.emisor.email}`, margin, currentY);
  }

  // Cliente (derecha)
  currentY = 62;
  const clientX = pageWidth / 2 + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text('DATOS DEL CLIENTE', clientX, currentY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  currentY += 7;
  doc.text(data.cliente.nombre, clientX, currentY);
  currentY += 5;

  if (data.cliente.cif) {
    doc.text(`CIF: ${data.cliente.cif}`, clientX, currentY);
    currentY += 5;
  }

  if (data.cliente.direccion) {
    const direccionLines = doc.splitTextToSize(data.cliente.direccion, 80);
    doc.text(direccionLines, clientX, currentY);
    currentY += direccionLines.length * 5;
  }

  if (data.cliente.telefono) {
    doc.text(`Tel: ${data.cliente.telefono}`, clientX, currentY);
    currentY += 5;
  }

  if (data.cliente.email) {
    doc.text(`Email: ${data.cliente.email}`, clientX, currentY);
  }

  // ==== TABLA DE CONCEPTOS ====
  const tableStartY = 125;

  const tableData = data.conceptos.map((concepto) => [
    concepto.descripcion,
    concepto.cantidad.toString(),
    `€${concepto.precioUnitario.toFixed(2)}`,
    `${concepto.iva}%`,
    `€${concepto.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Descripción', 'Cant.', 'Precio Unit.', 'IVA', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 32 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // ==== TOTALES ====
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;
  const totalsX = pageWidth - margin - 60;
  let totalsY = finalY + 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  // Subtotal
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`€${data.subtotal.toFixed(2)}`, pageWidth - margin, totalsY, { align: 'right' });
  totalsY += 7;

  // IVA
  doc.text('IVA:', totalsX, totalsY);
  doc.text(`€${data.totalIva.toFixed(2)}`, pageWidth - margin, totalsY, { align: 'right' });
  totalsY += 7;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, totalsY, pageWidth - margin, totalsY);
  totalsY += 7;

  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text('TOTAL:', totalsX, totalsY);
  doc.text(`€${data.total.toFixed(2)}`, pageWidth - margin, totalsY, { align: 'right' });

  // ==== NOTAS Y TÉRMINOS DE PAGO ====
  totalsY += 15;

  if (data.terminosPago && totalsY < pageHeight - 40) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Términos de Pago:', margin, totalsY);

    doc.setFont('helvetica', 'normal');
    totalsY += 5;
    const terminosLines = doc.splitTextToSize(data.terminosPago, pageWidth - 2 * margin);
    doc.text(terminosLines, margin, totalsY);
    totalsY += terminosLines.length * 4;
  }

  if (data.notas && totalsY < pageHeight - 30) {
    totalsY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Notas:', margin, totalsY);

    doc.setFont('helvetica', 'normal');
    totalsY += 5;
    const notasLines = doc.splitTextToSize(data.notas, pageWidth - 2 * margin);
    doc.text(notasLines, margin, totalsY);
  }

  // ==== FOOTER ====
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Documento generado electrónicamente. Compatible con ContaSimple.',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
}

/**
 * Genera el buffer del PDF para envío o almacenamiento
 */
export function generateB2BInvoicePDFBuffer(data: B2BInvoiceData): Buffer {
  const doc = generateB2BInvoicePDF(data);
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
