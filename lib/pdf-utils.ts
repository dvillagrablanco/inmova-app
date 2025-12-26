import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReceiptData {
  payment: {
    id: string;
    periodo: string;
    monto: number;
    fechaVencimiento: string | Date;
    fechaPago: string | Date | null;
    estado: string;
    metodoPago: string | null;
  };
  tenant: {
    nombreCompleto: string;
    dni: string;
    email: string;
    telefono: string;
  };
  unit: {
    numero: string;
    tipo: string;
    direccion: string;
    edificio: string;
  };
  contract: {
    id: string;
    fechaInicio: string | Date;
    fechaFin: string | Date;
    rentaMensual: number;
  };
  company: {
    nombre: string;
    cif: string | null;
    direccion: string | null;
    telefono: string | null;
    email: string | null;
    logoUrl: string | null;
    colorPrimario: string | null;
    colorSecundario: string | null;
    pieDocumento: string | null;
  };
}

export function generateReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = data.company.colorPrimario || '#000000';
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(primaryColor);

  // Header con color de marca
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo y nombre de empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.company.nombre, 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO DE PAGO', 15, 30);

  // Reset color
  doc.setTextColor(0, 0, 0);

  // Información de la empresa
  let yPos = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA EMPRESA:', 15, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (data.company.cif) (doc.text(`CIF: ${data.company.cif}`, 15, yPos), (yPos += 5));
  if (data.company.direccion)
    (doc.text(`Dirección: ${data.company.direccion}`, 15, yPos), (yPos += 5));
  if (data.company.telefono)
    (doc.text(`Teléfono: ${data.company.telefono}`, 15, yPos), (yPos += 5));
  if (data.company.email) (doc.text(`Email: ${data.company.email}`, 15, yPos), (yPos += 5));

  // Información del inquilino (lado derecho)
  yPos = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL INQUILINO:', pageWidth - 100, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(data.tenant.nombreCompleto, pageWidth - 100, yPos);
  yPos += 5;
  doc.text(`DNI: ${data.tenant.dni}`, pageWidth - 100, yPos);
  yPos += 5;
  doc.text(`Email: ${data.tenant.email}`, pageWidth - 100, yPos);
  yPos += 5;
  doc.text(`Teléfono: ${data.tenant.telefono}`, pageWidth - 100, yPos);

  // Línea separadora
  yPos = 90;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos, pageWidth - 15, yPos);

  // Detalles del recibo
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DEL PAGO', 15, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Tabla de detalles
  (doc as any).autoTable({
    startY: yPos,
    head: [['Concepto', 'Valor']],
    body: [
      ['Propiedad', `${data.unit.edificio} - Unidad ${data.unit.numero}`],
      ['Dirección', data.unit.direccion],
      ['Período', data.payment.periodo],
      ['Fecha de Vencimiento', formatDate(data.payment.fechaVencimiento)],
      ['Fecha de Pago', data.payment.fechaPago ? formatDate(data.payment.fechaPago) : 'Pendiente'],
      ['Método de Pago', data.payment.metodoPago || 'N/A'],
      ['Estado', data.payment.estado.toUpperCase()],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [rgb.r, rgb.g, rgb.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 },
    },
  });

  // Total
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos - 7, pageWidth - 30, 15, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 100, yPos);
  doc.text(`€${data.payment.monto.toFixed(2)}`, pageWidth - 40, yPos, {
    align: 'right',
  });

  // Pie de documento
  if (data.company.pieDocumento) {
    yPos = pageHeight - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const splitText = doc.splitTextToSize(data.company.pieDocumento, pageWidth - 30);
    doc.text(splitText, 15, yPos);
  }

  // Número de recibo y fecha de generación
  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(`Número de Recibo: ${data.payment.id}`, 15, yPos);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 15, yPos, {
    align: 'right',
  });

  return doc;
}

export function downloadReceipt(data: ReceiptData, filename?: string) {
  const doc = generateReceipt(data);
  const fname = filename || `recibo_${data.payment.periodo}_${data.tenant.dni}.pdf`;
  doc.save(fname);
}
