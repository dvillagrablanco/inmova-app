/**
 * Webhook de eventos de Retell AI
 * 
 * POST /api/retell/events
 * 
 * Recibe eventos del ciclo de vida de las llamadas:
 * - call_started: Cuando inicia una llamada
 * - call_ended: Cuando termina (incluye grabación y transcript)
 * - call_analyzed: Cuando el análisis de IA está listo
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RetellEvent {
  event: 'call_started' | 'call_ended' | 'call_analyzed';
  call: {
    call_id: string;
    agent_id?: string;
    call_status: string;
    start_timestamp?: number;
    end_timestamp?: number;
    duration_ms?: number;
    from_number?: string;
    to_number?: string;
    direction?: 'inbound' | 'outbound';
    recording_url?: string;
    transcript?: Array<{
      role: 'agent' | 'user';
      content: string;
      timestamp?: number;
    }>;
    transcript_object?: Array<{
      role: 'agent' | 'user';
      content: string;
      words?: Array<{
        word: string;
        start: number;
        end: number;
      }>;
    }>;
    call_analysis?: {
      call_summary?: string;
      user_sentiment?: 'positive' | 'neutral' | 'negative';
      call_successful?: boolean;
      custom_analysis_data?: Record<string, unknown>;
    };
    metadata?: Record<string, unknown>;
  };
}

// Generar resumen con IA
async function generateCallSummary(transcript: string): Promise<{
  resumen: string;
  sentimiento: string;
  intencion: string;
  datosExtraidos: Record<string, unknown>;
  resultado: string;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analiza esta transcripción de una llamada de ventas de Inmova (plataforma de gestión inmobiliaria).

Responde SOLO con un JSON válido con esta estructura:
{
  "resumen": "Resumen de 2-3 frases de la conversación",
  "sentimiento": "positivo" | "neutral" | "negativo",
  "intencion": "agendar_cita" | "consulta" | "queja" | "informacion" | "otro",
  "datosExtraidos": {
    "nombre": "si se mencionó",
    "email": "si se mencionó",
    "numPropiedades": "número si se mencionó",
    "problemas": ["lista de problemas mencionados"],
    "intereses": ["verticales de interés"]
  },
  "resultado": "cita_agendada" | "lead_cualificado" | "no_interesado" | "callback" | "informacion" | "sin_resultado"
}`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content || '{}';
    // Limpiar posible markdown
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('[Retell Events] Error generating summary:', error);
    return {
      resumen: 'Error al generar resumen',
      sentimiento: 'neutral',
      intencion: 'otro',
      datosExtraidos: {},
      resultado: 'sin_resultado',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar firma de Retell (si está configurado)
    const signature = request.headers.get('x-retell-signature');
    // TODO: Verificar signature con RETELL_WEBHOOK_SECRET
    
    const event: RetellEvent = await request.json();
    
    console.log('[Retell Events] Received:', {
      event: event.event,
      call_id: event.call?.call_id,
      status: event.call?.call_status,
    });

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    switch (event.event) {
      case 'call_started': {
        // Crear registro de la llamada
        await prisma.retellCall.create({
          data: {
            retellCallId: event.call.call_id,
            retellAgentId: event.call.agent_id,
            fromNumber: event.call.from_number,
            toNumber: event.call.to_number,
            direction: event.call.direction || 'inbound',
            status: 'in_progress',
            startedAt: event.call.start_timestamp 
              ? new Date(event.call.start_timestamp) 
              : new Date(),
            metadata: event.call.metadata,
          },
        });
        
        console.log('[Retell Events] Call started:', event.call.call_id);
        break;
      }

      case 'call_ended': {
        // Buscar la llamada existente o crearla
        let call = await prisma.retellCall.findUnique({
          where: { retellCallId: event.call.call_id },
        });

        // Convertir transcript a texto plano
        const transcript = event.call.transcript || event.call.transcript_object || [];
        const transcriptText = transcript
          .map((t) => `${t.role === 'agent' ? 'Carmen' : 'Usuario'}: ${t.content}`)
          .join('\n');

        // Calcular duración
        const duracionSegundos = event.call.duration_ms 
          ? Math.round(event.call.duration_ms / 1000)
          : null;

        // Generar resumen con IA si hay transcripción
        let aiAnalysis = {
          resumen: null as string | null,
          sentimiento: null as string | null,
          intencion: null as string | null,
          datosExtraidos: null as Record<string, unknown> | null,
          resultado: null as string | null,
        };

        if (transcriptText.length > 50) {
          const analysis = await generateCallSummary(transcriptText);
          aiAnalysis = {
            resumen: analysis.resumen,
            sentimiento: analysis.sentimiento,
            intencion: analysis.intencion,
            datosExtraidos: analysis.datosExtraidos,
            resultado: analysis.resultado,
          };
        }

        // Usar análisis de Retell si está disponible
        if (event.call.call_analysis) {
          if (event.call.call_analysis.call_summary) {
            aiAnalysis.resumen = event.call.call_analysis.call_summary;
          }
          if (event.call.call_analysis.user_sentiment) {
            const sentimentMap: Record<string, string> = {
              positive: 'positivo',
              neutral: 'neutral',
              negative: 'negativo',
            };
            aiAnalysis.sentimiento = sentimentMap[event.call.call_analysis.user_sentiment] || 'neutral';
          }
        }

        // Buscar lead por número de teléfono
        let leadId: string | null = null;
        if (event.call.from_number) {
          const lead = await prisma.lead.findFirst({
            where: { telefono: event.call.from_number },
            select: { id: true },
          });
          if (lead) {
            leadId = lead.id;
          }
        }

        const updateData = {
          status: event.call.call_status === 'ended' ? 'ended' : event.call.call_status,
          duracionSegundos,
          recordingUrl: event.call.recording_url,
          transcript: transcript.length > 0 ? transcript : undefined,
          transcriptText: transcriptText || undefined,
          resumen: aiAnalysis.resumen,
          sentimiento: aiAnalysis.sentimiento,
          intencion: aiAnalysis.intencion,
          datosExtraidos: aiAnalysis.datosExtraidos,
          resultado: aiAnalysis.resultado,
          leadId,
          endedAt: event.call.end_timestamp 
            ? new Date(event.call.end_timestamp)
            : new Date(),
        };

        if (call) {
          // Actualizar llamada existente
          await prisma.retellCall.update({
            where: { id: call.id },
            data: updateData,
          });
        } else {
          // Crear nueva si no existía (por si se perdió el evento call_started)
          await prisma.retellCall.create({
            data: {
              retellCallId: event.call.call_id,
              retellAgentId: event.call.agent_id,
              fromNumber: event.call.from_number,
              toNumber: event.call.to_number,
              direction: event.call.direction || 'inbound',
              startedAt: event.call.start_timestamp 
                ? new Date(event.call.start_timestamp) 
                : new Date(),
              ...updateData,
            },
          });
        }

        console.log('[Retell Events] Call ended:', {
          call_id: event.call.call_id,
          duration: duracionSegundos,
          resultado: aiAnalysis.resultado,
        });
        break;
      }

      case 'call_analyzed': {
        // Actualizar con análisis adicional de Retell
        if (event.call.call_analysis) {
          await prisma.retellCall.updateMany({
            where: { retellCallId: event.call.call_id },
            data: {
              resumen: event.call.call_analysis.call_summary || undefined,
              sentimiento: event.call.call_analysis.user_sentiment 
                ? (event.call.call_analysis.user_sentiment === 'positive' ? 'positivo' 
                   : event.call.call_analysis.user_sentiment === 'negative' ? 'negativo' 
                   : 'neutral')
                : undefined,
              datosExtraidos: event.call.call_analysis.custom_analysis_data || undefined,
            },
          });
        }
        break;
      }

      default:
        console.log('[Retell Events] Unknown event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Retell Events] Error:', error);
    return NextResponse.json(
      { error: 'Error processing event' },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'Retell Events Webhook',
    events: ['call_started', 'call_ended', 'call_analyzed'],
  });
}
