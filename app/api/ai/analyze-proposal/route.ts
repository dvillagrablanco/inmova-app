import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 90;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/ai/analyze-proposal
 * 
 * Analiza una propuesta de inversión de un broker/inmobiliaria.
 * Acepta: PDF, Excel, imagen, o texto libre.
 * 
 * La IA:
 * 1. Extrae todos los datos de la propuesta
 * 2. Identifica qué datos FALTAN para tomar una decisión
 * 3. Calcula KPIs financieros
 * 4. Compara con la cartera actual
 * 5. Da veredicto y recomendaciones
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textInput = formData.get('text') as string | null;
    const brokerName = formData.get('broker') as string || 'No especificado';

    if (!file && !textInput) {
      return NextResponse.json({ error: 'Proporciona un archivo (PDF/Excel) o texto de la propuesta' }, { status: 400 });
    }

    // Extract text from file
    let proposalText = textInput || '';
    let fileName = '';

    if (file) {
      fileName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileType = file.name.toLowerCase();

      if (fileType.endsWith('.xlsx') || fileType.endsWith('.xls') || fileType.endsWith('.csv')) {
        // Parse Excel
        const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
          proposalText += `\n=== Hoja: ${sheetName} ===\n`;
          for (const row of rows.slice(0, 100)) {
            proposalText += row.filter((c: any) => c !== '').join(' | ') + '\n';
          }
        }
      } else if (fileType.endsWith('.pdf')) {
        // Send PDF to Claude for extraction
        const base64 = buffer.toString('base64');
        proposalText = `[PDF DOCUMENT: ${file.name}, ${buffer.length} bytes, base64 attached]`;
        // Will be sent as document to Claude
      } else {
        // Try as text
        proposalText = buffer.toString('utf-8');
      }
    }

    // Get portfolio context
    const companyId = session.user.companyId;
    const contracts = await prisma.contract.findMany({
      where: { unit: { building: { companyId } }, estado: 'activo' },
      select: { rentaMensual: true, unit: { select: { superficie: true, tipo: true } } },
    });
    const portfolioYield = contracts.length > 0
      ? contracts.reduce((s, c) => s + (Number(c.rentaMensual) || 0), 0) * 12 /
        (contracts.reduce((s, c) => s + ((c.unit?.superficie || 60) * 4500), 0)) * 100
      : 0;

    // Get market data
    let marketInfo = '';
    try {
      const { IPV_STATIC } = await import('@/lib/public-market-apis');
      marketInfo = Object.entries(IPV_STATIC).map(([ccaa, d]) =>
        `${ccaa}: ${d.precioMedioM2}€/m², ${d.variacionAnual}% anual, ${d.tendencia}`
      ).join('\n');
    } catch {}

    // Call Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    // Build message content
    const messageContent: any[] = [];

    // If PDF, attach as document
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      messageContent.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') },
      });
    }

    // If image, attach
    if (file && /\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      messageContent.push({
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: buffer.toString('base64') },
      });
    }

    messageContent.push({
      type: 'text',
      text: `Eres un analista de inversiones inmobiliarias senior. Un broker/inmobiliaria ha enviado esta propuesta de inversión. Analízala EN PROFUNDIDAD.

PROPUESTA DEL BROKER: ${brokerName}
${fileName ? `Archivo: ${fileName}` : ''}
${proposalText ? `\nContenido:\n${proposalText.substring(0, 8000)}` : ''}

CONTEXTO DEL INVERSOR:
- Yield medio cartera actual: ${portfolioYield.toFixed(2)}%
- Contratos activos: ${contracts.length}
- Perfil: Holding inmobiliario con cartera diversificada

DATOS DE MERCADO ESPAÑA:
${marketInfo.substring(0, 2000)}

Analiza la propuesta y responde en JSON:
{
  "datosExtraidos": {
    "tipoInmueble": "string",
    "ubicacion": "string",
    "precioVenta": número_o_null,
    "superficie": número_o_null,
    "precioM2": número_o_null,
    "rentaActual": número_o_null,
    "rentaPotencial": número_o_null,
    "ocupacion": número_o_null,
    "estadoConservacion": "string",
    "anoConstuccion": número_o_null,
    "numUnidades": número_o_null,
    "otrosDatos": ["dato1", "dato2"]
  },
  
  "datosQueFaltan": [
    { "dato": "nombre del dato", "importancia": "critica|importante|deseable", "porQue": "razón" }
  ],
  
  "preguntasParaBroker": [
    "pregunta1 que deberías hacer al broker",
    "pregunta2",
    "pregunta3"
  ],
  
  "analisisFinanciero": {
    "yieldBrutoEstimado": número,
    "yieldNetoEstimado": número,
    "cashFlowAnual": número,
    "roi5anos": número,
    "paybackAnos": número,
    "precioJusto": número,
    "sobrevalorizacion": número_porcentaje
  },
  
  "analisisRiesgo": {
    "nivel": "bajo|medio|alto|muy_alto",
    "puntuacion": número_1_10,
    "factores": ["riesgo1", "riesgo2"]
  },
  
  "comparativaCartera": {
    "encajaConEstrategia": true_o_false,
    "yieldVsCartera": "mejor|peor|similar",
    "razon": "texto"
  },
  
  "veredicto": {
    "decision": "INTERESANTE|NEGOCIAR|PEDIR_MAS_INFO|DESCARTAR",
    "confianza": número_0_100,
    "resumen": "2-3 frases con el veredicto",
    "precioMaxRecomendado": número,
    "condicionesCompra": ["condición1", "condición2"],
    "proximosPasos": ["paso1", "paso2", "paso3"]
  },
  
  "puntosFuertes": ["punto1", "punto2"],
  "puntosDebiles": ["punto1", "punto2"],
  "alertasRojas": ["alerta si hay algo sospechoso o peligroso"]
}

Sé MUY CRÍTICO y DETALLADO. Identifica todo lo que falta. Si hay datos ambiguos o sospechosos, márcalos.`,
    });

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: messageContent }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: 'Error procesando análisis', rawResponse: text.substring(0, 500) }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    logger.info('[Proposal Analysis] Completed', {
      broker: brokerName,
      file: fileName,
      veredicto: analysis.veredicto?.decision,
    });

    return NextResponse.json({
      success: true,
      analysis,
      broker: brokerName,
      fileName,
      portfolioContext: { yield: portfolioYield.toFixed(2), contracts: contracts.length },
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Proposal Analysis Error]:', error);
    return NextResponse.json({ error: 'Error analizando propuesta' }, { status: 500 });
  }
}
