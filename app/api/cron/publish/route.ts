/**
 * 🚀 CRON JOB: Publicar posts programados
 * Se ejecuta cada 15 minutos para enviar posts al webhook externo
 *
 * Vercel Cron: Cada 15 minutos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { markPostAsPublished, markPostAsFailed } from '@/app/actions/auto-growth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface WebhookPayload {
  platform: string;
  content: string;
  imageUrl?: string;
  scheduledFor?: string;
  metadata: {
    topic: string;
    postId: string;
    campaign: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autorización (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Auto-Growth] 🚀 Verificando posts programados para publicar...');

    // 2. Obtener posts SCHEDULED cuya fecha ya pasó
    const now = new Date();
    const scheduledPosts = await prisma.marketingSocialPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
        webhookSent: false,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5, // Publicar máximo 5 posts por ejecución
    });

    if (scheduledPosts.length === 0) {
      console.log('[Auto-Growth] ✅ No hay posts listos para publicar');
      return NextResponse.json({
        success: true,
        message: 'No scheduled posts ready',
        published: 0,
      });
    }

    console.log(`[Auto-Growth] 📤 Publicando ${scheduledPosts.length} posts...`);

    // 3. Verificar webhook URL configurado
    const webhookUrl = process.env.SOCIAL_AUTOMATION_WEBHOOK;
    if (!webhookUrl) {
      console.error('[Auto-Growth] ❌ SOCIAL_AUTOMATION_WEBHOOK no configurado');
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook URL not configured',
          message: 'Set SOCIAL_AUTOMATION_WEBHOOK in environment variables',
        },
        { status: 500 }
      );
    }

    // 4. Enviar cada post al webhook
    const results = await Promise.allSettled(
      scheduledPosts.map(async (post) => {
        try {
          // Construir payload
          const payload: WebhookPayload = {
            platform: post.platform.toLowerCase(),
            content: post.content,
            imageUrl: post.imageUrl || undefined,
            scheduledFor: post.scheduledAt?.toISOString(),
            metadata: {
              topic: post.topic,
              postId: post.id,
              campaign: 'auto-growth-engine',
            },
          };

          // Generar firma HMAC
          const signature = generateHMACSignature(payload);

          // Enviar al webhook
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Inmova-Signature': signature,
              'X-Inmova-Timestamp': Date.now().toString(),
              'User-Agent': 'Inmova-Auto-Growth/1.0',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
          }

          const responseData = await response.json().catch(() => ({}));

          // Marcar como publicado
          await markPostAsPublished(post.id);

          console.log(
            `[Auto-Growth] ✅ Post ${post.id} publicado: ${post.platform} - ${post.topic}`
          );

          return {
            success: true,
            postId: post.id,
            platform: post.platform,
            topic: post.topic,
            webhookResponse: responseData,
          };
        } catch (error) {
          console.error(`[Auto-Growth] ❌ Error publicando post ${post.id}:`, error);

          // Marcar como fallido
          await markPostAsFailed(post.id, String(error));

          return {
            success: false,
            postId: post.id,
            error: String(error),
          };
        }
      })
    );

    // 5. Contar éxitos y fallos
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    );

    console.log(
      `[Auto-Growth] 🎉 Publicación completada: ${successful.length} éxitos, ${failed.length} fallos`
    );

    // 6. Si hay fallos, enviar alerta (opcional)
    if (failed.length > 0) {
      await sendFailureAlert(failed);
    }

    return NextResponse.json({
      success: true,
      message: `Published ${successful.length} posts`,
      processed: scheduledPosts.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'rejected' }
      ),
    });
  } catch (error) {
    console.error('[Auto-Growth] 💥 Error crítico:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler para testing manual (requiere autenticación)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Crear un request mock para POST
  const mockRequest = new NextRequest(req.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  return POST(mockRequest);
}

// ============================================
// HELPERS
// ============================================

/**
 * Genera firma HMAC SHA-256 para el webhook
 */
function generateHMACSignature(payload: WebhookPayload): string {
  const secret = process.env.SOCIAL_AUTOMATION_WEBHOOK_SECRET || 'default-secret-change-me';
  const data = JSON.stringify(payload);

  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Envía alerta cuando hay fallos en la publicación
 */
async function sendFailureAlert(failures: any[]) {
  try {
    console.error('[Auto-Growth] 🚨 Alertas de fallos:', failures);

    // TODO: Implementar envío de alerta (email, Slack, etc.)
    // Por ahora solo loggeamos

    // Ejemplo con Slack:
    // if (process.env.SLACK_WEBHOOK_URL) {
    //   await fetch(process.env.SLACK_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       text: `🚨 Auto-Growth: ${failures.length} posts fallaron al publicar`,
    //       blocks: [
    //         {
    //           type: 'section',
    //           text: {
    //             type: 'mrkdwn',
    //             text: failures.map(f => `• Post ${f.postId}: ${f.error}`).join('\n'),
    //           },
    //         },
    //       ],
    //     }),
    //   });
    // }
  } catch (error) {
    console.error('[Auto-Growth] Error enviando alerta:', error);
  }
}
