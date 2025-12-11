/**
 * PDF Generator para Recibos de Pago
 * Genera recibos en PDF con el logo y datos de INMOVA
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface CompanyInfo {
  nombre: string;
  cif?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
}

interface PaymentReceiptData {
  id: string;
  periodo: string;
  monto: number;
  fechaPago: Date;
  metodoPago?: string;
  tenant: {
    nombreCompleto: string;
    dni: string;
    email: string;
  };
  contract: {
    unit: {
      numero: string;
      building: {
        nombre: string;
        direccion: string;
      };
    };
  };
  company: CompanyInfo;
}

export const generatePaymentReceiptPDF = async (
  paymentData: PaymentReceiptData
): Promise<Buffer> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Colores de INMOVA
  const primaryColor: [number, number, number] = [0, 0, 0]; // Negro
  const secondaryColor: [number, number, number] = [100, 100, 100]; // Gris

  // ============================================
  // ENCABEZADO
  // ============================================
  
  // Logo (si existe)
  if (paymentData.company.logoUrl) {
    try {
      // En producción, aquí se cargaría el logo desde S3
      // doc.addImage(logoData, 'PNG', 15, 15, 40, 20);
    } catch (error) {
      logger.info('No se pudo cargar el logo');
    }
  }

  // Nombre de la empresa
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(paymentData.company.nombre || 'INMOVA', 15, 25);
  
  // Datos de la empresa
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  let yPos = 32;
  
  if (paymentData.company.cif) {
    doc.text(`CIF: ${paymentData.company.cif}`, 15, yPos);
    yPos += 5;
  }
  if (paymentData.company.direccion) {
    doc.text(paymentData.company.direccion, 15, yPos);
    yPos += 5;
  }
  if (paymentData.company.telefono) {
    doc.text(`Tel: ${paymentData.company.telefono}`, 15, yPos);
    yPos += 5;
  }
  if (paymentData.company.email) {
    doc.text(`Email: ${paymentData.company.email}`, 15, yPos);
    yPos += 5;
  }

  // RECIBO - Título
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('RECIBO', pageWidth - 15, 25, { align: 'right' });
  
  // Número de recibo y fecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text(`Nº: REC-${paymentData.id.substring(0, 8).toUpperCase()}`, pageWidth - 15, 35, { align: 'right' });
  doc.text(
    `Fecha: ${format(new Date(paymentData.fechaPago), 'dd/MM/yyyy', { locale: es })}`,
    pageWidth - 15,
    42,
    { align: 'right' }
  );

  // ============================================
  // LÍNEA SEPARADORA
  // ============================================
  yPos = 55;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  // ============================================
  // DATOS DEL INQUILINO
  // ============================================
  yPos = 65;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DATOS DEL INQUILINO', 15, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text(`Nombre: ${paymentData.tenant.nombreCompleto}`, 15, yPos);
  yPos += 6;
  doc.text(`DNI: ${paymentData.tenant.dni}`, 15, yPos);
  yPos += 6;
  doc.text(`Email: ${paymentData.tenant.email}`, 15, yPos);

  // ============================================
  // DATOS DE LA PROPIEDAD
  // ============================================
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('PROPIEDAD ARRENDADA', 15, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text(`Edificio: ${paymentData.contract.unit.building.nombre}`, 15, yPos);
  yPos += 6;
  doc.text(`Dirección: ${paymentData.contract.unit.building.direccion}`, 15, yPos);
  yPos += 6;
  doc.text(`Unidad: ${paymentData.contract.unit.numero}`, 15, yPos);

  // ============================================
  // DETALLE DEL PAGO
  // ============================================
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DETALLE DEL PAGO', 15, yPos);

  yPos += 8;
  
  // Tabla de conceptos
  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Periodo', 'Importe']],
    body: [
      [
        'Renta Mensual',
        paymentData.periodo,
        `${paymentData.monto.toFixed(2)} €`,
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60 },
      2: { cellWidth: 'auto', halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });

  // Obtener posición Y después de la tabla
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 20;

  // ============================================
  // TOTAL
  // ============================================
  const totalY = finalY + 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, totalY, pageWidth - 30, 12, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL PAGADO:', pageWidth / 2 - 30, totalY + 8);
  doc.text(`${paymentData.monto.toFixed(2)} €`, pageWidth - 20, totalY + 8, { align: 'right' });

  // ============================================
  // MÉTODO DE PAGO
  // ============================================
  if (paymentData.metodoPago) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text(
      `Método de pago: ${paymentData.metodoPago}`,
      15,
      totalY + 20
    );
  }

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  const footerY = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este recibo ha sido generado automáticamente por el sistema INMOVA.',
    pageWidth / 2,
    footerY + 8,
    { align: 'center' }
  );
  doc.text(
    `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    pageWidth / 2,
    footerY + 13,
    { align: 'center' }
  );

  // Convertir a buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
};

export const generatePaymentReceiptFilename = (paymentId: string, periodo: string): string => {
  const periodoClean = periodo.replace(/\s+/g, '_').replace(/\//g, '-');
  return `recibo_${periodoClean}_${paymentId.substring(0, 8)}.pdf`;
};
