/**
 * API Route: /api/firma-publica/[token]
 * 
 * Endpoint público para acceder a información de firma usando un token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Buscar el firmante por su token (usando el email hasheado como token por ahora)
    // En producción, deberías generar un token único y seguro
    const firmantes = await prisma.firmante.findMany({
      include: {
        documento: {
          include: {
            firmantes: {
              orderBy: { orden: 'asc' }
            },
            template: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    // Buscar el firmante cuyo token coincida
    // Por simplicidad, usamos un hash del email + documentoId como token
    let firmanteEncontrado = null;
    let documentoEncontrado = null;

    for (const firmante of firmantes) {
      const tokenGenerado = crypto
        .createHash('sha256')
        .update(`${firmante.email}-${firmante.documentoId}`)
        .digest('hex')
        .substring(0, 32);

      if (tokenGenerado === token) {
        firmanteEncontrado = firmante;
        documentoEncontrado = firmante.documento;
        break;
      }
    }

    if (!firmanteEncontrado || !documentoEncontrado) {
      return NextResponse.json(
        { error: 'Token inválido o documento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el documento ha expirado
    if (
      documentoEncontrado.fechaExpiracion &&
      new Date(documentoEncontrado.fechaExpiracion) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Este documento ha expirado' },
        { status: 410 }
      );
    }

    // Preparar respuesta
    const response = {
      titulo: documentoEncontrado.titulo,
      descripcion: documentoEncontrado.descripcion,
      estado: documentoEncontrado.estado,
      proveedor: documentoEncontrado.proveedor,
      proveedorUrl: firmanteEncontrado.urlFirma || documentoEncontrado.proveedorUrl,
      createdAt: documentoEncontrado.createdAt,
      enviadoEn: documentoEncontrado.enviadoEn,
      completadoEn: documentoEncontrado.completadoEn,
      requiereOrden: documentoEncontrado.requiereOrden,
      firmante: {
        nombre: firmanteEncontrado.nombre,
        email: firmanteEncontrado.email,
        rol: firmanteEncontrado.rol,
        orden: firmanteEncontrado.orden,
        estado: firmanteEncontrado.estado,
      },
      todosFirmantes: documentoEncontrado.firmantes.map((f) => ({
        nombre: f.nombre,
        email: f.email,
        rol: f.rol,
        orden: f.orden,
        estado: f.estado,
      })),
    };

    // Registrar acceso en audit log
    await prisma.signatureAuditLog.create({
      data: {
        documentoId: documentoEncontrado.id,
        evento: 'visualizado',
        descripcion: `Documento visualizado por ${firmanteEncontrado.nombre} (${firmanteEncontrado.email})`,
        firmanteEmail: firmanteEncontrado.email,
        firmanteNombre: firmanteEncontrado.nombre,
      },
    });

    logger.info('[API] Documento público accedido', {
      documentoId: documentoEncontrado.id,
      firmanteEmail: firmanteEncontrado.email,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    logError(error, { message: '[API] Error al obtener documento público' });
    return NextResponse.json(
      { error: 'Error al obtener documento', details: error.message },
      { status: 500 }
    );
  }
}
