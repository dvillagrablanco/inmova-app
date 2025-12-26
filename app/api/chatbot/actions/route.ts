import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/chatbot/actions - Ejecutar acción del chatbot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, accion, parametros } = body;

    if (!sessionId || !accion) {
      return NextResponse.json({ error: 'sessionId y acción son requeridos' }, { status: 400 });
    }

    // Buscar el inquilino por email
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    let resultado = 'exito';
    let errorDetalle = null;

    try {
      switch (accion) {
        case 'solicitar_mantenimiento':
          // Crear solicitud de mantenimiento
          const { titulo, descripcion, prioridad = 'media' } = parametros || {};

          if (!titulo || !descripcion) {
            throw new Error('Titulo y descripción son requeridos');
          }

          // Obtener unidad del inquilino
          const contract = await prisma.contract.findFirst({
            where: {
              tenantId: tenant.id,
              estado: 'activo',
            },
            include: { unit: true },
          });

          if (!contract) {
            throw new Error('No se encontró contrato activo');
          }

          await prisma.maintenanceRequest.create({
            data: {
              unitId: contract.unitId,
              titulo,
              descripcion,
              prioridad,
              estado: 'pendiente',
            },
          });
          break;

        case 'ver_pagos':
          // No requiere acción, solo retornar información
          resultado = 'informacion_disponible';
          break;

        case 'descargar_documento':
          // Esta acción sería manejada desde el frontend
          resultado = 'redireccion_requerida';
          break;

        case 'escalar_humano':
          // Marcar conversación para escalamiento
          await prisma.chatbotConversation.updateMany({
            where: { sessionId },
            data: {
              estado: 'escalada',
              escaladoMotivo: parametros?.motivo || 'Solicitud del usuario',
            },
          });
          break;

        default:
          throw new Error(`Acción desconocida: ${accion}`);
      }
    } catch (error: any) {
      resultado = 'error';
      errorDetalle = error.message;
    }

    // Registrar acción
    const actionRecord = await prisma.chatbotAction.create({
      data: {
        companyId: tenant.companyId,
        sessionId,
        tenantId: tenant.id,
        accion,
        parametros: parametros || {},
        resultado,
        errorDetalle,
      },
    });

    return NextResponse.json({
      success: resultado === 'exito',
      resultado,
      errorDetalle,
      action: actionRecord,
    });
  } catch (error: any) {
    logger.error('Error al ejecutar acción:', error);
    return NextResponse.json(
      { error: 'Error al ejecutar acción', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/chatbot/actions - Obtener historial de acciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    const actions = await prisma.chatbotAction.findMany({
      where: {
        sessionId,
        tenantId: tenant.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(actions);
  } catch (error: any) {
    logger.error('Error al obtener acciones:', error);
    return NextResponse.json({ error: 'Error al obtener acciones' }, { status: 500 });
  }
}
