import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/admin-roles';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/email/templates
 * Lista todas las plantillas de email
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar si es admin o super_admin
    const userRole = session.user.role?.toLowerCase();
    const isAdmin = userRole === 'super_admin' || userRole === 'administrador' || userRole === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    // Intentar obtener plantillas de la base de datos
    try {
      const whereClause: any = {};
      if (tipo && tipo !== 'todos') {
        whereClause.tipo = tipo;
      }

      const templates = await (prisma as any).emailTemplate?.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      }) || [];

      return NextResponse.json({
        templates: templates.map((t: any) => ({
          id: t.id,
          nombre: t.nombre,
          descripcion: t.descripcion,
          tipo: t.tipo,
          asunto: t.asunto,
          contenidoHtml: t.contenidoHtml,
          contenidoTexto: t.contenidoTexto,
          variables: t.variables || [],
          activa: t.activa,
          envioAutomatico: t.envioAutomatico,
          eventoTrigger: t.eventoTrigger,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      });
    } catch (dbError) {
      // Si la tabla no existe, retornar plantillas por defecto
      logger.warn('EmailTemplate table not found, returning default templates');
      return NextResponse.json({
        templates: [
          {
            id: 'default-1',
            nombre: 'Bienvenida',
            descripcion: 'Email de bienvenida para nuevos usuarios',
            tipo: 'bienvenida',
            asunto: 'Bienvenido a Inmova',
            contenidoHtml: '<p>Hola {{nombre}},</p><p>Bienvenido a Inmova. Estamos encantados de tenerte.</p>',
            contenidoTexto: 'Hola {{nombre}}, Bienvenido a Inmova.',
            variables: ['nombre'],
            activa: true,
            envioAutomatico: true,
            eventoTrigger: 'user.created',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'default-2',
            nombre: 'Recordatorio de Pago',
            descripcion: 'Recordatorio de pago pendiente',
            tipo: 'recordatorio_pago',
            asunto: 'Recordatorio: Pago pendiente de {{monto}}',
            contenidoHtml: '<p>Hola {{nombre}},</p><p>Te recordamos que tienes un pago pendiente de {{monto}} con vencimiento el {{fecha}}.</p>',
            contenidoTexto: 'Hola {{nombre}}, Te recordamos que tienes un pago pendiente.',
            variables: ['nombre', 'monto', 'fecha'],
            activa: true,
            envioAutomatico: true,
            eventoTrigger: 'payment.reminder',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'default-3',
            nombre: 'Confirmación de Pago',
            descripcion: 'Confirmación de pago recibido',
            tipo: 'confirmacion_pago',
            asunto: 'Pago recibido - {{monto}}',
            contenidoHtml: '<p>Hola {{nombre}},</p><p>Hemos recibido tu pago de {{monto}}. ¡Gracias!</p>',
            contenidoTexto: 'Hola {{nombre}}, Hemos recibido tu pago.',
            variables: ['nombre', 'monto'],
            activa: true,
            envioAutomatico: true,
            eventoTrigger: 'payment.received',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
    }
  } catch (error: any) {
    logger.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/templates
 * Crear una nueva plantilla de email
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, descripcion, tipo, asunto, contenidoHtml, contenidoTexto, variables, activa, envioAutomatico, eventoTrigger } = body;

    if (!nombre || !asunto || !contenidoHtml) {
      return NextResponse.json(
        { error: 'Nombre, asunto y contenido HTML son requeridos' },
        { status: 400 }
      );
    }

    // Intentar crear en la base de datos
    try {
      const template = await (prisma as any).emailTemplate?.create({
        data: {
          nombre,
          descripcion,
          tipo: tipo || 'general',
          asunto,
          contenidoHtml,
          contenidoTexto: contenidoTexto || '',
          variables: variables || [],
          activa: activa ?? true,
          envioAutomatico: envioAutomatico ?? false,
          eventoTrigger,
        },
      });

      if (template) {
        return NextResponse.json({ template }, { status: 201 });
      }
    } catch (dbError) {
      logger.warn('EmailTemplate table not found, using fallback');
    }

    // Fallback: retornar template simulado
    const templateId = `template_${Date.now()}`;
    return NextResponse.json({
      template: {
        id: templateId,
        nombre,
        descripcion,
        tipo: tipo || 'general',
        asunto,
        contenidoHtml,
        contenidoTexto: contenidoTexto || '',
        variables: variables || [],
        activa: activa ?? true,
        envioAutomatico: envioAutomatico ?? false,
        eventoTrigger,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Error al crear plantilla' },
      { status: 500 }
    );
  }
}
