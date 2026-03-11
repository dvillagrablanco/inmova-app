import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const EXTRACTION_PROMPT = `Eres un experto en extractos bancarios españoles (Bankinter, BBVA, Santander, CaixaBank).

Analiza este texto de extracto bancario y extrae TODOS los movimientos en formato JSON.

Para cada movimiento extrae:
- fecha: "YYYY-MM-DD"
- concepto: descripción completa del movimiento
- importe: número positivo para ingresos, negativo para gastos
- tipo: "ingreso" o "gasto"
- referencia: número de referencia si existe
- ordenante_beneficiario: nombre de la persona/empresa si aparece

Responde SOLO con JSON válido:
{
  "banco": "Bankinter|BBVA|Santander|...",
  "cuenta": "ESXX XXXX ...",
  "periodo": "01/01/2026 - 31/01/2026",
  "movimientos": [
    {
      "fecha": "2026-01-05",
      "concepto": "RECIBO ALQUILER GARCIA LOPEZ",
      "importe": 850.00,
      "tipo": "ingreso",
      "referencia": "REF123456",
      "ordenante_beneficiario": "GARCIA LOPEZ MARIA"
    }
  ],
  "saldo_inicial": 12500.00,
  "saldo_final": 15200.00,
  "total_ingresos": 5000.00,
  "total_gastos": 2300.00
}`;

/**
 * POST /api/banking/ocr-extract
 * Sube un PDF o texto de extracto bancario.
 * La IA extrae los movimientos automáticamente.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let textToProcess = '';

    if (contentType.includes('multipart/form-data')) {
      // PDF upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
      }

      // Convert PDF to text using pdf-parse or similar
      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        const pdfParseModule = await import('pdf-parse');
        const pdfParse =
          typeof pdfParseModule.default === 'function'
            ? pdfParseModule.default
            : typeof (pdfParseModule as any) === 'function'
              ? (pdfParseModule as any)
              : null;
        if (!pdfParse) {
          throw new Error('pdf-parse no disponible como función');
        }
        const pdfData = await pdfParse(buffer);
        textToProcess = pdfData.text;
      } catch {
        // Fallback: send raw buffer to Claude for vision analysis
        textToProcess = buffer.toString('utf-8').substring(0, 50000);
      }
    } else {
      // Plain text
      const body = await request.json();
      textToProcess = body.text || '';
    }

    if (!textToProcess || textToProcess.length < 20) {
      return NextResponse.json(
        { error: 'Texto del extracto demasiado corto o vacío' },
        { status: 400 }
      );
    }

    // Process with Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API de IA no configurada' }, { status: 503 });
    }

    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nExtracto bancario:\n\n${textToProcess.substring(0, 30000)}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Respuesta IA inesperada' }, { status: 500 });
    }

    let extracted;
    try {
      // Try to parse, handling potential markdown code blocks
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText
          .replace(/```json?\n?/g, '')
          .replace(/```$/g, '')
          .trim();
      }
      extracted = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: 'No se pudo interpretar la respuesta de la IA', raw: content.text },
        { status: 422 }
      );
    }

    const movimientos = extracted.movimientos || [];
    const totalIngresos = movimientos
      .filter((m: any) => m.importe > 0)
      .reduce((s: number, m: any) => s + m.importe, 0);
    const totalGastos = movimientos
      .filter((m: any) => m.importe < 0)
      .reduce((s: number, m: any) => s + Math.abs(m.importe), 0);

    logger.info(`[OCR Extract] ${movimientos.length} movimientos extraídos`, {
      banco: extracted.banco,
      companyId: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      extracto: {
        banco: extracted.banco || 'Desconocido',
        cuenta: extracted.cuenta || null,
        periodo: extracted.periodo || null,
        saldoInicial: extracted.saldo_inicial || null,
        saldoFinal: extracted.saldo_final || null,
      },
      movimientos,
      resumen: {
        total: movimientos.length,
        ingresos: movimientos.filter((m: any) => m.importe > 0).length,
        gastos: movimientos.filter((m: any) => m.importe < 0).length,
        totalIngresos: Math.round(totalIngresos * 100) / 100,
        totalGastos: Math.round(totalGastos * 100) / 100,
        neto: Math.round((totalIngresos - totalGastos) * 100) / 100,
      },
    });
  } catch (error: any) {
    logger.error('[OCR Extract]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error procesando extracto' }, { status: 500 });
  }
}
