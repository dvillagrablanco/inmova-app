/**
 * API Route: /api/signature-documents/[id]/send
 * 
 * Envía un documento para firma usando DocuSign.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { docuSignService } from '@/lib/signature-providers/docusign-service';
import { getSignedDownloadUrl } from '@/lib/s3';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const documentoId = params.id;

    // Obtener documento
    const documento = await prisma.documentoFirma.findUnique({
      where: {
        id: documentoId,
        companyId: session.user.companyId
      },
      include: {
        firmantes: true
      }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    if (documento.estado !== 'borrador') {
      return NextResponse.json(
        { error: 'El documento ya fue enviado' },
        { status: 400 }
      );
    }

    // Obtener PDF desde S3
    const pdfUrl = await getSignedDownloadUrl(documento.cloud_storage_path!);
    
    // Descargar PDF
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // Preparar firmantes para DocuSign
    const firmantes = documento.firmantes.map((f) => ({
      nombre: f.nombre,
      email: f.email,
      orden: f.orden,
      rol: f.rol
    }));

    // Crear envelope en DocuSign
    const envelope = await docuSignService.createEnvelope({
      documento: {
        nombre: documento.titulo,
        pdfBase64: pdfBase64
      },
      firmantes: firmantes,
      asunto: `Firma de documento: ${documento.titulo}`,
      mensaje: `Por favor, revise y firme el documento "${documento.titulo}".`,
      ordenSecuencial: documento.requiereOrden,
      diasExpiracion: documento.diasExpiracion || 30
    });

    // Actualizar documento con información del envelope
    const documentoActualizado = await prisma.documentoFirma.update({
      where: { id: documentoId },
      data: {
        proveedorId: envelope.envelopeId,
        proveedorUrl: envelope.uri,
        estado: 'pendiente',
        enviadoEn: new Date()
      }
    });

    // Obtener estado del envelope desde DocuSign
    const envelopeStatus = await docuSignService.getEnvelopeStatus(envelope.envelopeId);

    // Actualizar firmantes con información de DocuSign
    for (const firmante of documento.firmantes) {
      const docusignFirmante = envelopeStatus.firmantes.find(
        (f) => f.email === firmante.email
      );

      if (docusignFirmante) {
        // Mapear estado de DocuSign a nuestro enum SignerStatus
        // Valores válidos: pendiente, visto, firmado, rechazado, expirado
        let estadoFirmante: 'pendiente' | 'visto' | 'firmado' | 'rechazado' | 'expirado' = 'pendiente';
        
        if (docusignFirmante.estado === 'delivered') {
          estadoFirmante = 'visto';
        } else if (docusignFirmante.estado === 'signed' || docusignFirmante.estado === 'completed') {
          estadoFirmante = 'firmado';
        } else if (docusignFirmante.estado === 'declined') {
          estadoFirmante = 'rechazado';
        } else if (docusignFirmante.estado === 'sent') {
          estadoFirmante = 'pendiente';
        }

        await prisma.firmante.update({
          where: { id: firmante.id },
          data: {
            estado: estadoFirmante,
            enviadoEn: docusignFirmante.fechaEnvio || new Date(),
            proveedorRecipientId: `recipient_${firmante.orden}`,
            urlFirma: envelope.uri
          }
        });
      }
    }

    // Registrar evento en audit log
    await prisma.signatureAuditLog.create({
      data: {
        documentoId: documento.id,
        evento: 'enviado',
        descripcion: `Documento enviado para firma a ${documento.firmantes.length} firmante(s)`,
        proveedorData: {
          envelopeId: envelope.envelopeId,
          proveedor: 'docusign'
        }
      }
    });

    logger.info('[API] Documento enviado para firma', {
      documentoId: documento.id,
      envelopeId: envelope.envelopeId,
      firmantes: documento.firmantes.length
    });

    return NextResponse.json({
      ...documentoActualizado,
      envelope: {
        envelopeId: envelope.envelopeId,
        estado: envelope.estado
      }
    });
  } catch (error: any) {
    logError(error, { message: '[API] Error al enviar documento para firma' });
    return NextResponse.json(
      { error: 'Error al enviar documento', details: error.message },
      { status: 500 }
    );
  }
}
