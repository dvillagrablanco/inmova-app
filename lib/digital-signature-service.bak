/**
 * Servicio de Firma Digital
 * Modo Demo + Preparado para integración con Signaturit/DocuSign
 */

import { prisma } from './db';

// Tipos de documentos que se pueden firmar
export enum TipoDocumento {
  CONTRATO = 'contrato',
  ADENDA = 'adenda',
  FINIQUITO = 'finiquito',
  AUTORIZACION = 'autorizacion',
  OTRO = 'otro'
}

// Estados del proceso de firma
export enum EstadoFirma {
  BORRADOR = 'borrador',
  ENVIADO = 'enviado',
  FIRMADO_PARCIAL = 'firmado_parcial',
  FIRMADO_COMPLETO = 'firmado_completo',
  RECHAZADO = 'rechazado',
  EXPIRADO = 'expirado'
}

interface FirmanteData {
  email: string;
  nombre: string;
  rol: string; // 'propietario', 'inquilino', 'gestor', 'testigo'
  tenantId?: string;
}

interface CrearDocumentoFirmaParams {
  companyId: string;
  contractId?: string;
  tenantId?: string;
  titulo: string;
  tipoDocumento: TipoDocumento;
  documentUrl: string;
  mensaje?: string;
  firmantes: FirmanteData[];
  creadoPor: string;
  diasExpiracion?: number;
}

/**
 * MODO DEMO: Crea una solicitud de firma digital simulada
 * En producción: Integrar con Signaturit/DocuSign API
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
    diasExpiracion = 30
  } = params;

  try {
    // Calcular fecha de expiración
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

    // MODO DEMO: Generar IDs simulados
    const signaturitRequestId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear el documento de firma en la base de datos
    const documento = await prisma.documentoFirma.create({
      data: {
        companyId,
        contractId,
        tenantId,
        titulo,
        tipoDocumento,
        documentUrl,
        signaturitRequestId, // En modo demo, es un ID simulado
        estado: EstadoFirma.ENVIADO,
        mensaje,
        diasExpiracion,
        fechaExpiracion,
        creadoPor,
        firmantes: {
          create: firmantes.map((firmante, index) => ({
            email: firmante.email,
            nombre: firmante.nombre,
            rol: firmante.rol,
            tenantId: firmante.tenantId,
            orden: index + 1,
            // MODO DEMO: Generar token simulado
            signaturitFirmanteId: `FIRMANTE_${Date.now()}_${index}`,
            tokenFirma: `TOKEN_${Math.random().toString(36).substr(2, 16)}`,
            estado: 'pendiente'
          }))
        }
      },
      include: {
        firmantes: true,
        tenant: true,
        contract: true
      }
    });

    // MODO DEMO: Simular envío de correos
    console.log(`📧 [MODO DEMO] Envío simulado de ${firmantes.length} invitaciones de firma`);
    firmantes.forEach((firmante, index) => {
      console.log(`  → ${firmante.nombre} <${firmante.email}>`);
      console.log(`     Link de firma: /firma-digital/firmar/${documento.id}?firmante=${index}`);
    });

    /*
    // EN PRODUCCIÓN: Integrar con Signaturit
    const signaturitResponse = await fetch('https://api.signaturit.com/v3/signatures.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SIGNATURIT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [{ name: titulo, url: documentUrl }],
        recipients: firmantes.map(f => ({
          email: f.email,
          fullname: f.nombre,
          role: f.rol
        })),
        subject: titulo,
        body: mensaje,
        expire_time: diasExpiracion
      })
    });
    
    const signaturitData = await signaturitResponse.json();
    
    // Actualizar con IDs reales de Signaturit
    await prisma.documentoFirma.update({
      where: { id: documento.id },
      data: {
        signaturitRequestId: signaturitData.id,
        // Actualizar firmantes con IDs reales...
      }
    });
    */

    return {
      success: true,
      documento,
      message: '[MODO DEMO] Documento enviado para firma (simulado)'
    };
  } catch (error) {
    console.error('Error creando solicitud de firma:', error);
    throw error;
  }
}

/**
 * MODO DEMO: Simula la firma de un documento por un firmante
 * En producción: Validar con Signaturit/DocuSign
 */
export async function firmarDocumento(
  documentoId: string,
  firmanteId: string,
  firmaData: {
    nombreCompleto: string;
    dni?: string;
    ubicacion?: string;
  }
) {
  try {
    // Verificar que el documento existe
    const documento = await prisma.documentoFirma.findUnique({
      where: { id: documentoId },
      include: { firmantes: true }
    });

    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    // Verificar que no ha expirado
    if (documento.fechaExpiracion && new Date() > documento.fechaExpiracion) {
      await prisma.documentoFirma.update({
        where: { id: documentoId },
        data: { estado: EstadoFirma.EXPIRADO }
      });
      throw new Error('El documento ha expirado');
    }

    // Buscar el firmante
    const firmante = documento.firmantes.find(f => f.id === firmanteId);
    if (!firmante) {
      throw new Error('Firmante no encontrado');
    }

    if (firmante.estado === 'firmado') {
      throw new Error('Este documento ya ha sido firmado por este usuario');
    }

    // MODO DEMO: Simular la firma
    const firmaUrl = `data:image/svg+xml;base64,${Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
        <text x="10" y="40" font-family="cursive" font-size="24" fill="#000">
          ${firmaData.nombreCompleto}
        </text>
      </svg>`
    ).toString('base64')}`;

    // Actualizar el firmante
    await prisma.firmante.update({
      where: { id: firmanteId },
      data: {
        estado: 'firmado',
        fechaFirma: new Date(),
        firmaUrl,
        ipAddress: '192.168.1.1', // En producción: obtener IP real
        userAgent: 'Demo Browser',
        ubicacion: firmaData.ubicacion || 'Ubicación no especificada'
      }
    });

    // Verificar si todos han firmado
    const firmantesPendientes = documento.firmantes.filter(
      f => f.id !== firmanteId && f.estado !== 'firmado'
    ).length;

    const nuevoEstado = firmantesPendientes === 0 
      ? EstadoFirma.FIRMADO_COMPLETO 
      : EstadoFirma.FIRMADO_PARCIAL;

    // Actualizar estado del documento
    const documentoActualizado = await prisma.documentoFirma.update({
      where: { id: documentoId },
      data: {
        estado: nuevoEstado,
        ...(nuevoEstado === EstadoFirma.FIRMADO_COMPLETO && {
          fechaFinalizacion: new Date()
        })
      },
      include: {
        firmantes: true
      }
    });

    /*
    // EN PRODUCCIÓN: Notificar a Signaturit
    await fetch(`https://api.signaturit.com/v3/signatures/${documento.signaturitRequestId}/documents/${firmanteId}/sign.json`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.SIGNATURIT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signature: firmaUrl
      })
    });
    */

    console.log(`✅ [MODO DEMO] Firma completada por ${firmaData.nombreCompleto}`);
    console.log(`   Estado del documento: ${nuevoEstado}`);

    return {
      success: true,
      documento: documentoActualizado,
      message: nuevoEstado === EstadoFirma.FIRMADO_COMPLETO
        ? 'Documento firmado completamente'
        : 'Firma registrada, esperando a otros firmantes'
    };
  } catch (error) {
    console.error('Error firmando documento:', error);
    throw error;
  }
}

/**
 * Rechazar un documento
 */
export async function rechazarDocumento(
  documentoId: string,
  firmanteId: string,
  motivo: string
) {
  try {
    // Actualizar firmante
    await prisma.firmante.update({
      where: { id: firmanteId },
      data: {
        estado: 'rechazado',
        fechaRechazo: new Date()
      }
    });

    // Actualizar documento
    await prisma.documentoFirma.update({
      where: { id: documentoId },
      data: {
        estado: EstadoFirma.RECHAZADO,
        motivoRechazo: motivo
      }
    });

    console.log(`❌ [MODO DEMO] Documento rechazado por firmante`);

    return {
      success: true,
      message: 'Documento rechazado'
    };
  } catch (error) {
    console.error('Error rechazando documento:', error);
    throw error;
  }
}

/**
 * Obtener el estado de un documento de firma
 */
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

  // Calcular estadísticas
  const totalFirmantes = documento.firmantes.length;
  const firmados = documento.firmantes.filter(f => f.estado === 'firmado').length;
  const pendientes = documento.firmantes.filter(f => f.estado === 'pendiente').length;
  const rechazados = documento.firmantes.filter(f => f.estado === 'rechazado').length;

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

/**
 * Reenviar invitación de firma a un firmante
 */
export async function reenviarInvitacion(
  documentoId: string,
  firmanteId: string
) {
  try {
    const firmante = await prisma.firmante.findUnique({
      where: { id: firmanteId },
      include: {
        documentoFirma: true
      }
    });

    if (!firmante) {
      throw new Error('Firmante no encontrado');
    }

    // MODO DEMO: Simular reenvío
    console.log(`📧 [MODO DEMO] Reenvío de invitación simulado`);
    console.log(`  → ${firmante.nombre} <${firmante.email}>`);

    /*
    // EN PRODUCCIÓN: Reenviar con Signaturit
    await fetch(`https://api.signaturit.com/v3/signatures/${firmante.documentoFirma.signaturitRequestId}/remind.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SIGNATURIT_API_KEY}`
      }
    });
    */

    return {
      success: true,
      message: '[MODO DEMO] Invitación reenviada (simulado)'
    };
  } catch (error) {
    console.error('Error reenviando invitación:', error);
    throw error;
  }
}

/**
 * Cancelar una solicitud de firma
 */
export async function cancelarSolicitudFirma(documentoId: string, motivo: string) {
  try {
    await prisma.documentoFirma.update({
      where: { id: documentoId },
      data: {
        estado: EstadoFirma.RECHAZADO,
        motivoRechazo: motivo,
        fechaCancelacion: new Date()
      }
    });

    console.log(`❌ [MODO DEMO] Solicitud de firma cancelada`);

    return {
      success: true,
      message: 'Solicitud cancelada'
    };
  } catch (error) {
    console.error('Error cancelando solicitud:', error);
    throw error;
  }
}
