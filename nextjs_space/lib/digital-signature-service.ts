import { prisma } from './db';
import { SignatureStatus, SignerStatus } from '@prisma/client';
import logger, { logError } from '@/lib/logger';

interface FirmanteData {
  email: string;
  nombre: string;
  rol: string;
  tenantId?: string;
}

interface CrearDocumentoFirmaParams {
  companyId: string;
  contractId?: string;
  tenantId?: string;
  titulo: string;
  tipoDocumento: string;
  documentUrl: string;
  mensaje?: string;
  firmantes: FirmanteData[];
  creadoPor: string;
  diasExpiracion?: number;
}

export async function crearSolicitudFirma(params: CrearDocumentoFirmaParams) {
  const {
    companyId,
    contractId,
    tenantId,
    titulo,
    tipoDocumento,
    documentUrl,
    mensaje,
    firmantes,
    creadoPor,
    diasExpiracion = 30
  } = params;

  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

  const signaturitRequestId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const documento = await prisma.documentoFirma.create({
    data: {
      companyId,
      contractId,
      tenantId,
      titulo,
      tipoDocumento,
      urlDocumento: documentUrl,
      signaturitId: signaturitRequestId,
      estado: SignatureStatus.pendiente,
      diasExpiracion,
      fechaExpiracion,
      creadoPor,
      firmantes: {
        create: firmantes.map((firmante, index) => ({
          email: firmante.email,
          nombre: firmante.nombre,
          rol: firmante.rol,
          orden: index + 1,
          estado: SignerStatus.pendiente
        }))
      }
    },
    include: {
      firmantes: true,
      tenant: true,
      contract: true
    }
  });

  logger.info(`📧 [MODO DEMO] Envío simulado de ${firmantes.length} invitaciones de firma`);

  return {
    success: true,
    documento,
    message: '[MODO DEMO] Documento enviado para firma (simulado)'
  };
}

export async function firmarDocumento(
  documentoId: string,
  firmanteId: string,
  firmaData: {
    nombreCompleto: string;
    dni?: string;
    ubicacion?: string;
  }
) {
  const documento = await prisma.documentoFirma.findUnique({
    where: { id: documentoId },
    include: { firmantes: true }
  });

  if (!documento) {
    throw new Error('Documento no encontrado');
  }

  if (documento.fechaExpiracion && new Date() > documento.fechaExpiracion) {
    await prisma.documentoFirma.update({
      where: { id: documentoId },
      data: { estado: SignatureStatus.expirado }
    });
    throw new Error('El documento ha expirado');
  }

  const firmante = documento.firmantes.find(f => f.id === firmanteId);
  if (!firmante) {
    throw new Error('Firmante no encontrado');
  }

  if (firmante.estado === SignerStatus.firmado) {
    throw new Error('Este documento ya ha sido firmado por este usuario');
  }

  // Actualizar el firmante
  await prisma.firmante.update({
    where: { id: firmanteId },
    data: {
      estado: SignerStatus.firmado,
      firmadoEn: new Date(),
      ipFirma: '192.168.1.1',
      dispositivo: 'Demo Browser',
      geolocalizacion: firmaData.ubicacion || 'No especificada'
    }
  });

  const firmantesPendientes = documento.firmantes.filter(
    f => f.id !== firmanteId && f.estado !== SignerStatus.firmado
  ).length;

  const nuevoEstado = firmantesPendientes === 0 
    ? SignatureStatus.firmado 
    : SignatureStatus.pendiente;

  const documentoActualizado = await prisma.documentoFirma.update({
    where: { id: documentoId },
    data: {
      estado: nuevoEstado,
      ...(nuevoEstado === SignatureStatus.firmado && {
        fechaCompletada: new Date()
      })
    },
    include: {
      firmantes: true
    }
  });

  return {
    success: true,
    documento: documentoActualizado,
    message: nuevoEstado === SignatureStatus.firmado
      ? 'Documento firmado completamente'
      : 'Firma registrada, esperando a otros firmantes'
  };
}

export async function rechazarDocumento(
  documentoId: string,
  firmanteId: string,
  motivo: string
) {
  await prisma.firmante.update({
    where: { id: firmanteId },
    data: {
      estado: SignerStatus.rechazado,
      rechazadoEn: new Date(),
      motivoRechazo: motivo
    }
  });

  await prisma.documentoFirma.update({
    where: { id: documentoId },
    data: {
      estado: SignatureStatus.rechazado
    }
  });

  return {
    success: true,
    message: 'Documento rechazado'
  };
}

export async function obtenerEstadoDocumento(documentoId: string) {
  const documento = await prisma.documentoFirma.findUnique({
    where: { id: documentoId },
    include: {
      firmantes: true,
      tenant: true,
      contract: {
        include: {
          unit: {
            include: {
              building: true
            }
          }
        }
      }
    }
  });

  if (!documento) {
    throw new Error('Documento no encontrado');
  }

  const totalFirmantes = documento.firmantes.length;
  const firmados = documento.firmantes.filter(f => f.estado === SignerStatus.firmado).length;
  const pendientes = documento.firmantes.filter(f => f.estado === SignerStatus.pendiente).length;
  const rechazados = documento.firmantes.filter(f => f.estado === SignerStatus.rechazado).length;

  return {
    documento,
    estadisticas: {
      totalFirmantes,
      firmados,
      pendientes,
      rechazados,
      porcentajeCompletado: Math.round((firmados / totalFirmantes) * 100)
    }
  };
}

export async function reenviarInvitacion(
  documentoId: string,
  firmanteId: string
) {
  const firmante = await prisma.firmante.findUnique({
    where: { id: firmanteId }
  });

  if (!firmante) {
    throw new Error('Firmante no encontrado');
  }

  logger.info(`📧 [MODO DEMO] Reenvío de invitación simulado`);

  return {
    success: true,
    message: '[MODO DEMO] Invitación reenviada (simulado)'
  };
}

export async function cancelarSolicitudFirma(documentoId: string, motivo: string) {
  await prisma.documentoFirma.update({
    where: { id: documentoId },
    data: {
      estado: SignatureStatus.cancelado,
      canceladoEn: new Date()
    }
  });

  return {
    success: true,
    message: 'Solicitud cancelada'
  };
}
