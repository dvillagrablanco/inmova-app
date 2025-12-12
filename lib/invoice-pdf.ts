import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  numeroFactura: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  proveedor: {
    nombre: string;
    email: string | null;
    telefono: string;
    direccion: string | null;
  };
  company: {
    nombre: string;
    direccion: string | null;
    email: string | null;
    telefono: string | null;
  };
  conceptos: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }>;
  subtotal: number;
  iva: number;
  montoIva: number;
  total: number;
  notas?: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', 105, 20, { align: 'center' });

  // Factura Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${data.numeroFactura}`, 14, 35);
  doc.text(`Fecha Emisión: ${data.fechaEmision.toLocaleDateString('es-ES')}`, 14, 42);
  doc.text(`Fecha Vencimiento: ${data.fechaVencimiento.toLocaleDateString('es-ES')}`, 14, 49);

  // Proveedor (De:)
  doc.setFont('helvetica', 'bold');
  doc.text('De:', 14, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(data.proveedor.nombre, 14, 72);
  if (data.proveedor.direccion) {
    doc.text(data.proveedor.direccion, 14, 79);
  }
  doc.text(`Tel: ${data.proveedor.telefono}`, 14, data.proveedor.direccion ? 86 : 79);
  if (data.proveedor.email) {
    doc.text(`Email: ${data.proveedor.email}`, 14, data.proveedor.direccion ? 93 : 86);
  }

  // Cliente (Para:)
  doc.setFont('helvetica', 'bold');
  doc.text('Para:', 120, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(data.company.nombre, 120, 72);
  if (data.company.direccion) {
    doc.text(data.company.direccion, 120, 79);
  }
  if (data.company.telefono) {
    doc.text(`Tel: ${data.company.telefono}`, 120, data.company.direccion ? 86 : 79);
  }
  if (data.company.email) {
    doc.text(
      `Email: ${data.company.email}`,
      120,
      data.company.direccion ? (data.company.telefono ? 93 : 86) : 79
    );
  }

  // Tabla de Conceptos
  const tableData = data.conceptos.map((concepto) => [
    concepto.descripcion,
    concepto.cantidad.toString(),
    `€${concepto.precioUnitario.toFixed(2)}`,
    `€${concepto.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 9 },
  });

  // Totales
  const finalY = (doc as any).lastAutoTable.finalY || 110;
  const totalsX = 140;

  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, totalsX, finalY + 10);
  doc.text(`€${data.subtotal.toFixed(2)}`, 185, finalY + 10, { align: 'right' });

  doc.text(`IVA (${data.iva}%):`, totalsX, finalY + 17);
  doc.text(`€${data.montoIva.toFixed(2)}`, 185, finalY + 17, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, totalsX, finalY + 27);
  doc.text(`€${data.total.toFixed(2)}`, 185, finalY + 27, { align: 'right' });

  // Notas
  if (data.notas) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notas:', 14, finalY + 45);
    const splitNotas = doc.splitTextToSize(data.notas, 180);
    doc.text(splitNotas, 14, finalY + 52);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Gracias por su preferencia',
    105,
    pageHeight - 20,
    { align: 'center' }
  );

  return doc;
}

export function saveInvoicePDF(data: InvoiceData, filename: string): void {
  const doc = generateInvoicePDF(data);
  doc.save(filename);
}

export function getInvoicePDFBlob(data: InvoiceData): Blob {
  const doc = generateInvoicePDF(data);
  return doc.output('blob');
}
