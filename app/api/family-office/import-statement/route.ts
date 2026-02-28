import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const importSchema = z.object({
  text: z.string().min(20, 'Texto del extracto demasiado corto'),
});

const EXTRACTION_PROMPT = `Eres un experto en extractos de cuentas de banca privada y gestoras de fondos (Pictet, UBS, Banca March, CACEIS, Inversis, Bankinter, etc.).

Analiza este extracto/informe de posiciones y extrae TODA la información en formato JSON.

Extrae:
1. Nombre de la entidad/cuenta
2. Posiciones (instrumentos financieros):
   - nombre: Nombre completo del fondo/acción/bono
   - isin: Código ISIN si aparece (ej: LU0128467544)
   - tipo: uno de [fondo_inversion, sicav, accion, bono, etf, deposito, cuenta_corriente, plan_pensiones, seguro_vida, pe_fund, real_estate_fund, derivado, divisa, cripto, otro_instrumento]
   - cantidad: Participaciones o títulos (número)
   - precioMedio: Precio medio de compra si aparece
   - valorActual: Valor de mercado actual
   - divisa: EUR, USD, GBP, CHF, etc.
3. Transacciones/movimientos si aparecen:
   - fecha: "YYYY-MM-DD"
   - concepto: Descripción
   - tipo: uno de [compra, venta, dividendo, cupon, comision, transferencia_entrada, transferencia_salida, aportacion, reembolso, interes]
   - importe: Positivo=entrada, negativo=salida

Responde SOLO con JSON válido:
{
  "entidad": "Pictet",
  "cuenta": "Cuenta/referencia si aparece",
  "fechaExtracto": "YYYY-MM-DD",
  "divisa": "EUR",
  "posiciones": [
    {
      "nombre": "Pictet Global Bonds P",
      "isin": "LU0128467544",
      "tipo": "fondo_inversion",
      "cantidad": 150.5,
      "precioMedio": null,
      "valorActual": 25340.50,
      "divisa": "EUR"
    }
  ],
  "transacciones": [
    {
      "fecha": "2026-01-15",
      "concepto": "Suscripción fondo",
      "tipo": "compra",
      "importe": -10000.00
    }
  ],
  "resumen": {
    "valorTotal": 250000.00,
    "pnl": 12500.00
  }
}`;

/**
 * POST /api/family-office/import-statement
 * Receives { text } (extracted from PDF or pasted) and uses Claude to extract positions/transactions.
 * Returns extracted data for review before saving.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = importSchema.parse(body);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API de IA no configurada (ANTHROPIC_API_KEY)' },
        { status: 503 }
      );
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
          content: `${EXTRACTION_PROMPT}\n\nExtracto financiero:\n\n${validated.text.substring(0, 30000)}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Respuesta IA inesperada' }, { status: 500 });
    }

    let extracted;
    try {
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

    const posiciones = extracted.posiciones || [];
    const transacciones = extracted.transacciones || [];

    const totalValor = posiciones.reduce((sum: number, p: any) => sum + (p.valorActual || 0), 0);

    logger.info('[Family Office Import] Extracto procesado', {
      entidad: extracted.entidad,
      posiciones: posiciones.length,
      transacciones: transacciones.length,
      companyId: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      data: {
        entidad: extracted.entidad || 'Desconocida',
        cuenta: extracted.cuenta || null,
        fechaExtracto: extracted.fechaExtracto || null,
        divisa: extracted.divisa || 'EUR',
        posiciones,
        transacciones,
        resumen: {
          totalPositions: posiciones.length,
          totalTransactions: transacciones.length,
          valorTotal: Math.round(totalValor * 100) / 100,
          pnl: extracted.resumen?.pnl ?? null,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Family Office Import]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error procesando extracto' }, { status: 500 });
  }
}
