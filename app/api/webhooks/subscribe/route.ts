/**
 * API: Gestionar Suscripciones de Webhooks
 *
 * Permite a las compañías registrar URLs para recibir eventos webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { registerWebhookSubscription, WebhookEventType } from '@/lib/webhook-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface SubscribeRequest {
  url: string;
  events: WebhookEventType[];
  secret?: string;
}

/**
 * POST /api/webhooks/subscribe
 *
 * Body:
 * {
 *   url: 'https://example.com/webhooks',
 *   events: ['USER_CREATED', 'PROPERTY_CREATED'],
 *   secret: 'optional_hmac_secret'
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo administradores y super_admin pueden gestionar webhooks
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden configurar webhooks.' },
        { status: 403 }
      );
    }

    const body: SubscribeRequest = await req.json();
    const { url, events, secret } = body;

    // Validaciones
    if (!url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'Los campos "url" y "events" son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de URL
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Validar eventos
    const validEvents: WebhookEventType[] = [
      'USER_CREATED',
      'USER_ONBOARDING_COMPLETED',
      'PROPERTY_CREATED',
      'PROPERTY_UPDATED',
      'PROPERTY_DELETED',
      'TENANT_CREATED',
      'TENANT_UPDATED',
      'CONTRACT_CREATED',
      'CONTRACT_SIGNED',
      'PAYMENT_CREATED',
      'PAYMENT_RECEIVED',
      'MAINTENANCE_CREATED',
      'MAINTENANCE_RESOLVED',
      'DOCUMENT_UPLOADED',
    ];

    const invalidEvents = events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: `Eventos inválidos: ${invalidEvents.join(', ')}`,
          validEvents,
        },
        { status: 400 }
      );
    }

    // Registrar suscripción
    const generatedSecret = await registerWebhookSubscription(
      session.user.companyId,
      session.user.id,
      url,
      events,
      secret
    );

    logger.info(`Webhook suscrito para compañía ${session.user.companyId}`, {
      url,
      events,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook suscrito exitosamente',
      subscription: {
        url,
        events,
        hasSecret: true,
        secret: secret || generatedSecret,
      },
    });
  } catch (error: any) {
    logger.error('Error en /api/webhooks/subscribe:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/subscribe
 *
 * Obtiene información sobre eventos disponibles
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const availableEvents = [
    {
      event: 'USER_CREATED',
      description: 'Se crea un nuevo usuario',
    },
    {
      event: 'USER_ONBOARDING_COMPLETED',
      description: 'Un usuario completa el onboarding',
    },
    {
      event: 'PROPERTY_CREATED',
      description: 'Se crea una nueva propiedad',
    },
    {
      event: 'CONTRACT_CREATED',
      description: 'Se crea un nuevo contrato',
    },
    {
      event: 'PAYMENT_RECEIVED',
      description: 'Se recibe un pago',
    },
    {
      event: 'MAINTENANCE_CREATED',
      description: 'Se crea una orden de mantenimiento',
    },
  ];

  return NextResponse.json({
    availableEvents,
    info: {
      authentication:
        'Los webhooks incluyen firma HMAC-SHA256 en el header X-INMOVA-Signature si se proporciona un secret',
      timeout: '10 segundos',
      retries: 'Máximo 3 intentos',
      format: 'JSON con estructura: { event, timestamp, data }',
    },
  });
}
