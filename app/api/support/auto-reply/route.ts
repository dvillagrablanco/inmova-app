/**
 * POST /api/support/auto-reply
 * Recibe una consulta de soporte y responde automáticamente con IA + KB.
 * Si no puede resolver, crea un ticket para respuesta manual.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchArticles } from '@/lib/knowledge-base-data';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { question, category } = await request.json();
    if (!question || question.length < 5) {
      return NextResponse.json({ error: 'Pregunta muy corta' }, { status: 400 });
    }

    const kbResults = searchArticles(question);

    if (kbResults.length > 0) {
      return NextResponse.json({
        answered: true,
        source: 'knowledge_base',
        articles: kbResults.map(a => ({
          id: a.id,
          title: a.title,
          excerpt: a.excerpt,
          content: a.content,
        })),
        message: `Encontramos ${kbResults.length} artículo(s) que pueden ayudarte. Si no resuelven tu duda, abre un ticket y te responderemos en menos de 24h.`,
      });
    }

    let aiResponse: string | null = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Eres el asistente de soporte de INMOVA, una plataforma de gestión inmobiliaria.
Responde de forma breve y útil. Si no sabes la respuesta, di que crearás un ticket.
Pregunta del usuario: ${question}`,
          }],
        });

        const textBlock = msg.content.find((b: any) => b.type === 'text');
        aiResponse = textBlock ? (textBlock as any).text : null;
      } catch (aiError) {
        logger.warn('[Support AutoReply] AI error, falling back to ticket:', aiError);
      }
    }

    if (aiResponse) {
      return NextResponse.json({
        answered: true,
        source: 'ai',
        response: aiResponse,
        message: 'Respuesta generada por IA. Si necesitas más ayuda, abre un ticket.',
      });
    }

    const prisma = await getPrisma();
    const companyId = (session.user as any).companyId;
    if (companyId) {
      await prisma.notification.create({
        data: {
          companyId,
          tipo: 'info',
          titulo: 'Consulta de soporte recibida',
          mensaje: `Tu consulta ha sido registrada. Te responderemos en menos de 24h.\n\nPregunta: ${question.substring(0, 200)}`,
          entityType: 'SUPPORT_TICKET',
        },
      });
    }

    const { sendEmail } = await import('@/lib/email-config');
    await sendEmail({
      to: session.user.email!,
      subject: 'Hemos recibido tu consulta - INMOVA',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#4F46E5;">Consulta recibida</h2>
        <p>Hola ${session.user.name || ''},</p>
        <p>Hemos recibido tu consulta y te responderemos en menos de 24 horas.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;color:#4b5563;"><strong>Tu pregunta:</strong></p>
          <p style="margin:8px 0 0;color:#1f2937;">${question}</p>
        </div>
        <p>Mientras tanto, puede que encuentres la respuesta en nuestro <a href="${process.env.NEXTAUTH_URL}/ayuda" style="color:#4F46E5;">Centro de Ayuda</a>.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">INMOVA · Soporte · Lun-Vie 9-18h</p>
      </div>`,
    });

    return NextResponse.json({
      answered: false,
      source: 'ticket',
      message: 'Hemos registrado tu consulta. Te responderemos por email en menos de 24 horas.',
    });
  } catch (error: any) {
    logger.error('[Support AutoReply] Error:', error);
    return NextResponse.json({ error: 'Error procesando consulta' }, { status: 500 });
  }
}
