import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

interface CommunicationIntegration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  stats: Record<string, string | number>;
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

    // Verificar qué integraciones están configuradas basándose en variables de entorno
    const integrations: CommunicationIntegration[] = [
      {
        id: 'crisp',
        name: 'Crisp',
        description: 'Chat en vivo y soporte',
        status: process.env.CRISP_WEBSITE_ID ? 'connected' : 'disconnected',
        stats: process.env.CRISP_WEBSITE_ID 
          ? { conversations: 0, satisfaction: 'N/A' }
          : { conversations: 0, satisfaction: 'N/A' }
      },
      {
        id: 'twilio',
        name: 'Twilio',
        description: 'SMS y llamadas',
        status: process.env.TWILIO_ACCOUNT_SID ? 'connected' : 'disconnected',
        stats: process.env.TWILIO_ACCOUNT_SID 
          ? { sms: 0, calls: 0 }
          : { sms: 0, calls: 0 }
      },
      {
        id: 'sendgrid',
        name: 'SendGrid',
        description: 'Email transaccional',
        status: process.env.SENDGRID_API_KEY ? 'connected' : 'disconnected',
        stats: process.env.SENDGRID_API_KEY 
          ? { sent: 0, delivered: 'N/A' }
          : { sent: 0, delivered: 'N/A' }
      },
      {
        id: 'gmail',
        name: 'Gmail SMTP',
        description: 'Email de respaldo',
        status: process.env.SMTP_HOST ? 'connected' : 'disconnected',
        stats: process.env.SMTP_HOST 
          ? { daily: 500, available: '100%' }
          : { daily: 0, available: 'N/A' }
      },
    ];

    return NextResponse.json({ integrations });
  } catch (error) {
    logger.error('Error al obtener estado de integraciones de comunicación:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado' },
      { status: 500 }
    );
  }
}
