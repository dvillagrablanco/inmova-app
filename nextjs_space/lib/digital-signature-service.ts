import { prisma } from '@/lib/db';
import { SignatureStatus, SignerStatus } from '@prisma/client';
import logger, { logError } from '@/lib/logger';

// ============================================================================
// CONFIGURACIÓN - Variables de Entorno
// ============================================================================
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID;
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY;
const DOCUSIGN_BASE_PATH = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';

const SIGNATURIT_API_KEY = process.env.SIGNATURIT_API_KEY;
const SIGNATURIT_SANDBOX = process.env.SIGNATURIT_SANDBOX === 'true';

// Detectar si hay credenciales configuradas
const isDocuSignConfigured = !!(DOCUSIGN_INTEGRATION_KEY && DOCUSIGN_USER_ID && DOCUSIGN_ACCOUNT_ID);
const isSignaturitConfigured = !!SIGNATURIT_API_KEY;

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
  provider?: 'docusign' | 'signaturit' | 'demo';
}

// ============================================================================
// FUNCIONES AUXILIARES - Integración con Proveedores
// ============================================================================

/**
 * Determina qué proveedor usar basándose en la configuración y preferencias
 */
export function getActiveProvider(): 'docusign' | 'signaturit' | 'demo' {
  if (isDocuSignConfigured) return 'docusign';
  if (isSignaturitConfigured) return 'signaturit';
  return 'demo';
}

/**
 * Envia documento a DocuSign (cuando esté configurado)
 * 
 * NOTA IMPORTANTE: La integración real de DocuSign está preparada pero requiere
 * implementación manual debido a incompatibilidades del paquete docusign-esign con Next.js.
 * 
 * Ver documentación completa en:
 * - /home/ubuntu/homming_vidaro/INTEGRACION_DOCUSIGN_VIDARO.md
 * - /home/ubuntu/homming_vidaro/GUIA_RAPIDA_DOCUSIGN.md
 * 
 * Para activar la integración real:
 * 1. Obtener credenciales de DocuSign (ver guías)
 * 2. Configurar variables de entorno en .env
 * 3. Implementar el código de integración proporcionado en la documentación
 */
async function enviarDocuSignEnvelope(params: {
  titulo: string;
  documentUrl: string;
  mensaje?: string;
  firmantes: FirmanteData[];
  diasExpiracion: number;
}) {
  // TODO: Implementar integración real con DocuSign API
  // Referencia: Ver INTEGRACION_DOCUSIGN_VIDARO.md para código completo
  
  const isConfigured = isDocuSignConfigured;
  
  logger.info('📧 [DocuSign] Envío de documento', {
    modo: isConfigured ? 'PREPARADO (requiere implementación)' : 'DEMO',
    titulo: params.titulo,
    firmantes: params.firmantes.length,
    credencialesConfiguradas: isConfigured
  });
  
  return {
    envelopeId: `DS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'sent',
    message: isConfigured 
      ? 'Documento preparado para DocuSign (Consulte la documentación para activar integración real)'
      : 'Documento enviado via DocuSign (MODO DEMO - Configure credenciales en .env)'
  };
}

/**
 * Envia documento a Signaturit (cuando esté configurado)
 */
async function enviarSignaturitDocument(params: {
  titulo: string;
  documentUrl: string;
  mensaje?: string;
  firmantes: FirmanteData[];
  diasExpiracion: number;
}) {
  // TODO: Implementar integración real con Signaturit API
  // Referencia: https://docs.signaturit.com/
  
  logger.info('📧 [Signaturit] Envío de documento (preparado para integración real)');
  
  return {
    documentId: `SIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'sent',
    message: 'Documento enviado via Signaturit (simulado - configure credenciales)'
  };
}

/**
 * Crea una solicitud de firma digital
 */
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
    diasExpiracion = 30,
    provider: requestedProvider
  } = params;

  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

  // Determinar proveedor a usar
  const provider = requestedProvider || getActiveProvider();
  let externalId: string;
  let providerMessage: string;

  // Enviar a proveedor externo si está configurado
  if (provider === 'docusign' && isDocuSignConfigured) {
    const result = await enviarDocuSignEnvelope({
      titulo,
      documentUrl,
      mensaje,
      firmantes,
      diasExpiracion
    });
    externalId = result.envelopeId;
    providerMessage = result.message;
  } else if (provider === 'signaturit' && isSignaturitConfigured) {
    const result = await enviarSignaturitDocument({
      titulo,
      documentUrl,
      mensaje,
      firmantes,
      diasExpiracion
    });
    externalId = result.documentId;
    providerMessage = result.message;
  } else {
    // Modo demo
    externalId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    providerMessage = '[MODO DEMO] Documento enviado para firma (simulado)';
  }

  const documento = await prisma.documentoFirma.create({
    data: {
      companyId,
      contractId,
      tenantId,
      titulo,
      tipoDocumento,
      urlDocumento: documentUrl,
      signaturitId: externalId,
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

  logger.info(`✍️ Solicitud de firma creada: ${documento.id} via ${provider}`);

  return {
    success: true,
    documento,
    provider,
    message: providerMessage
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
