/**
 * API v1 - Webhooks Management
 * GET /api/v1/webhooks - Listar webhook subscriptions
 * POST /api/v1/webhooks - Crear webhook subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPIv1 } from '@/lib/api-v1/middleware';
import { generateWebhookSecret } from '@/lib/webhook-dispatcher';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(
    z.enum([
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
      'USER_CREATED',
    ])
  ),
  maxRetries: z.number().int().min(0).max(5).default(3),
});

/**
 * GET /api/v1/webhooks
 */
export const GET = withAPIv1(
  async (req: NextRequest, auth) => {
    const webhooks = await prisma.webhookSubscription.findMany({
      where: {
        companyId: auth.companyId!,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        maxRetries: true,
        successCount: true,
        failureCount: true,
        lastSuccessAt: true,
        lastFailureAt: true,
        createdAt: true,
        secret: false, // NO enviar secret en GET
      },
    });

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  },
  {
    requiredScopes: ['webhooks:read'],
  }
);

/**
 * POST /api/v1/webhooks
 * Crear nueva webhook subscription
 */
export const POST = withAPIv1(
  async (req: NextRequest, auth) => {
    const body = await req.json();
    const validated = createWebhookSchema.parse(body);

    // Generar secret
    const secret = generateWebhookSecret();

    // Crear subscription
    const webhook = await prisma.webhookSubscription.create({
      data: {
        companyId: auth.companyId!,
        url: validated.url,
        events: validated.events,
        secret,
        maxRetries: validated.maxRetries,
        active: true,
        createdBy: auth.userId!,
      },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        maxRetries: true,
        secret: true, // Enviar UNA VEZ
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: webhook,
        warning: 'Save the webhook secret securely. You will not be able to see it again.',
      },
      { status: 201 }
    );
  },
  {
    requiredScopes: ['webhooks:write'],
  }
);
