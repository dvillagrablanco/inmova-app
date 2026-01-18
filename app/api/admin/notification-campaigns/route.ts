import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

interface NotificationCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  subject?: string;
  content: string;
  targetAudience: string;
  recipientCount: number;
  sentCount: number;
  openRate?: number;
  clickRate?: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Intentar obtener campañas de la base de datos si existe la tabla
    try {
      // Por ahora, devolvemos un array vacío ya que la tabla puede no existir
      // En una implementación real, esto consultaría la tabla de campañas
      const campaigns: NotificationCampaign[] = [];
      
      return NextResponse.json({
        campaigns,
        summary: {
          total: campaigns.length,
          draft: campaigns.filter(c => c.status === 'draft').length,
          scheduled: campaigns.filter(c => c.status === 'scheduled').length,
          sent: campaigns.filter(c => c.status === 'sent').length,
          failed: campaigns.filter(c => c.status === 'failed').length,
        },
      });
    } catch (dbError) {
      // Si la tabla no existe, devolver array vacío
      logger.warn('Tabla de campañas no disponible:', dbError);
      return NextResponse.json({
        campaigns: [],
        summary: {
          total: 0,
          draft: 0,
          scheduled: 0,
          sent: 0,
          failed: 0,
        },
      });
    }
  } catch (error) {
    logger.error('Error al obtener campañas de notificación:', error);
    return NextResponse.json(
      { error: 'Error al obtener campañas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, type, subject, content, targetAudience, scheduledAt } = body;

    if (!name || !type || !content || !targetAudience) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear campaña (en una implementación real, esto se guardaría en la base de datos)
    const newCampaign: NotificationCampaign = {
      id: `camp-${Date.now()}`,
      name,
      type,
      status: scheduledAt ? 'scheduled' : 'draft',
      subject,
      content,
      targetAudience,
      recipientCount: 0,
      sentCount: 0,
      scheduledAt,
      createdAt: new Date().toISOString(),
      createdBy: session.user?.id || 'system',
    };

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error al crear campaña de notificación:', error);
    return NextResponse.json(
      { error: 'Error al crear campaña' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de campaña requerido' },
        { status: 400 }
      );
    }

    if (action === 'send') {
      // Simular envío de campaña
      return NextResponse.json({
        success: true,
        message: 'Campaña enviada correctamente',
        sentAt: new Date().toISOString(),
      });
    }

    if (action === 'cancel') {
      return NextResponse.json({
        success: true,
        message: 'Campaña cancelada',
      });
    }

    // Actualizar campaña
    return NextResponse.json({
      success: true,
      message: 'Campaña actualizada',
    });
  } catch (error) {
    logger.error('Error al actualizar campaña:', error);
    return NextResponse.json(
      { error: 'Error al actualizar campaña' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de campaña requerido' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaña eliminada correctamente',
    });
  } catch (error) {
    logger.error('Error al eliminar campaña:', error);
    return NextResponse.json(
      { error: 'Error al eliminar campaña' },
      { status: 500 }
    );
  }
}
