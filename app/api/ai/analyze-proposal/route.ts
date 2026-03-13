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

    // Get market data — multi-source (Idealista Data + portales + Notariado + IPV)
    let marketInfo = '';
    let detectedCity = 'Madrid';

    // Detectar ciudad de la propuesta
    const cityList = [
      'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Malaga', 'Bilbao',
      'Zaragoza', 'Palencia', 'Valladolid', 'Alicante', 'Marbella', 'Benidorm',
      'Palma', 'Córdoba', 'Granada', 'Murcia', 'Vigo', 'Santander', 'Toledo',
      'Burgos', 'Salamanca', 'Cádiz', 'Tarragona', 'Girona',
    ];
    const textForCity = (proposalText + ' ' + (brokerName || '')).toLowerCase();
    for (const city of cityList) {
      if (textForCity.includes(city.toLowerCase())) { detectedCity = city; break; }
    }

    // Obtener datos de todas las fuentes en paralelo
    try {
      const [idealistaReport, platformResult, ipvData] = await Promise.allSettled([
        import('@/lib/idealista-data-service').then(m => m.getIdealistaDataReport(detectedCity)),
        import('@/lib/external-platform-data-service').then(m =>
          m.getAggregatedMarketData({ city: detectedCity, address: proposalText.substring(0, 500) })
            .then(data => ({ data, text: m.formatPlatformDataForPrompt(data) }))
        ),
        import('@/lib/public-market-apis').then(m => m.IPV_STATIC),
      ]);

      const parts: string[] = [];

      // Datos Idealista Data (rentabilidad, subzonas, evolución)
      if (idealistaReport.status === 'fulfilled' && idealistaReport.value) {
        const r = idealistaReport.value;
        parts.push(`DATOS IDEALISTA DATA — ${detectedCity}:`);
        if (r.salePricePerM2) parts.push(`- Precio venta: ${r.salePricePerM2}€/m²${r.salePricePerM2Evolution ? ` (${r.salePricePerM2Evolution > 0 ? '+' : ''}${r.salePricePerM2Evolution}% anual)` : ''}`);
        if (r.rentPricePerM2) parts.push(`- Alquiler: ${r.rentPricePerM2}€/m²/mes`);
        if (r.grossYield) parts.push(`- Rentabilidad bruta alquiler: ${r.grossYield}%`);
        if (r.avgDaysOnMarket) parts.push(`- Tiempo medio en mercado: ${r.avgDaysOnMarket} días`);
        if (r.demandLevel) parts.push(`- Demanda: ${r.demandLevel}`);
        if (r.subZones?.length > 0) {
          parts.push(`- Subzonas:`);
          r.subZones.slice(0, 6).forEach(z => {
            parts.push(`  · ${z.location}: ${z.pricePerM2}€/m²${z.annualVariation ? ` (${z.annualVariation > 0 ? '+' : ''}${z.annualVariation}%)` : ''}`);
          });
        }
        parts.push('');
      }

      // Datos multi-plataforma (Notariado, portales, BD interna)
      if (platformResult.status === 'fulfilled' && platformResult.value) {
        parts.push(platformResult.value.text);
        parts.push('');
      }

      // IPV estático como fallback
      if (parts.length === 0 && ipvData.status === 'fulfilled') {
        parts.push('DATOS IPV ESTÁTICOS (referencia nacional):');
        Object.entries(ipvData.value).forEach(([ccaa, d]: [string, any]) => {
          parts.push(`${ccaa}: ${d.precioMedioM2}€/m², ${d.variacionAnual}% anual, ${d.tendencia}`);
        });
      }

      marketInfo = parts.join('\n');
    } catch {
      // Fallback mínimo
      try {
        const { IPV_STATIC } = await import('@/lib/public-market-apis');
        marketInfo = Object.entries(IPV_STATIC).map(([ccaa, d]: [string, any]) =>
          `${ccaa}: ${d.precioMedioM2}€/m², ${d.variacionAnual}% anual, ${d.tendencia}`
        ).join('\n');
      } catch {}
    }

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
      text: `Eres un analista de inversiones inmobiliarias senior con mentalidad ESCÉPTICA y CONSERVADORA. Un broker ha enviado esta propuesta. Analízala contrastando con DATOS REALES DE MERCADO.

PROPUESTA DEL BROKER: ${brokerName}
${fileName ? `Archivo: ${fileName}` : ''}
${proposalText ? `\nContenido:\n${proposalText.substring(0, 8000)}` : ''}

CONTEXTO DEL INVERSOR:
- Yield medio cartera actual: ${portfolioYield.toFixed(2)}%
- Contratos activos: ${contracts.length}
- Perfil: Holding inmobiliario con cartera diversificada

═══════════════════════════════════════════════════════
DATOS DE MERCADO INDEPENDIENTES (VERIFICADOS)
═══════════════════════════════════════════════════════
${marketInfo.substring(0, 4000)}

═══════════════════════════════════════════════════════
INSTRUCCIONES DE ANÁLISIS
═══════════════════════════════════════════════════════

1. EXTRAE todos los datos de la propuesta del broker
2. CONTRASTA cada dato con los datos de mercado reales:
   - €/m² del broker vs €/m² real de la zona (Notariado/Idealista Data)
   - Yield declarado vs yield real del mercado (datos Idealista)
   - Rentas declaradas vs rentas reales de la zona
   - Si el broker presenta un yield MUY superior al del mercado → ALERTA ROJA
3. CALCULA el precio justo usando datos reales, NO los del broker
4. IDENTIFICA qué datos faltan y qué preguntas hacer al broker
5. DA UN VEREDICTO basado en hechos, no en las proyecciones del broker

PONDERACIÓN PARA PRECIO JUSTO:
- Comparables de mercado reales (transacciones escrituradas): 65% del peso
- Criterio experto y características del activo: 20% del peso
- Capitalización de rentas: 15% del peso — SOLO como validación cruzada, NO como método principal
- Si capitalización da un valor >20% superior a comparables reales, el precio justo debe basarse en comparables
- La capitalización tiende a sobrevalorar cuando las rentas están infladas o el mercado sobrecalentado

REGLAS:
- Asking prices de portales: -10-15% para precio real de cierre
- Si hay rentabilidad de mercado de Idealista: usarla como referencia de yield zona
- Si hay precios por subzona: usar la subzona más cercana como referencia
- Los gastos omitidos (IBI, comunidad, seguro, mantenimiento, gestión) SIEMPRE penalizan

Responde en JSON:
{
  "datosExtraidos": {
    "tipoInmueble": "string",
    "ubicacion": "string",
    "precioVenta": número_o_null,
    "superficie": número_o_null,
    "precioM2": número_o_null,
    "precioM2Mercado": número_o_null,
    "diferenciaVsMercado": número_porcentaje_o_null,
    "rentaActual": número_o_null,
    "rentaMercado": número_o_null,
    "rentaPotencial": número_o_null,
    "ocupacion": número_o_null,
    "estadoConservacion": "string",
    "anoConstruccion": número_o_null,
    "numUnidades": número_o_null,
    "otrosDatos": ["dato1", "dato2"]
  },
  
  "datosQueFaltan": [
    { "dato": "nombre", "importancia": "critica|importante|deseable", "porQue": "razón" }
  ],
  
  "preguntasParaBroker": ["pregunta1", "pregunta2", "pregunta3"],
  
  "analisisFinanciero": {
    "yieldBrutoDeclarado": número_o_null,
    "yieldBrutoReal": número,
    "yieldNetoEstimado": número,
    "yieldMercadoZona": número_o_null,
    "cashFlowAnual": número,
    "roi5anos": número,
    "paybackAnos": número,
    "precioJusto": número,
    "precioMaxRecomendado": número,
    "sobrevalorizacion": número_porcentaje,
    "gastosEstimadosAnuales": número
  },
  
  "analisisRiesgo": {
    "nivel": "bajo|medio|alto|muy_alto",
    "puntuacion": número_1_10,
    "factores": ["riesgo1", "riesgo2"]
  },
  
  "comparativaCartera": {
    "encajaConEstrategia": true_o_false,
    "yieldVsCartera": "mejor|peor|similar",
    "yieldVsMercado": "mejor|peor|similar",
    "razon": "texto"
  },
  
  "veredicto": {
    "decision": "INTERESANTE|NEGOCIAR|PEDIR_MAS_INFO|DESCARTAR",
    "confianza": número_0_100,
    "resumen": "2-3 frases con el veredicto basado en datos reales",
    "precioMaxRecomendado": número,
    "contraofertaSugerida": número_o_null,
    "condicionesCompra": ["condición1", "condición2"],
    "proximosPasos": ["paso1", "paso2", "paso3"]
  },
  
  "puntosFuertes": ["punto1", "punto2"],
  "puntosDebiles": ["punto1", "punto2"],
  "alertasRojas": ["alerta si el broker infla rentas, omite gastos o yield irreal"]
}

Sé MUY CRÍTICO. Contrasta SIEMPRE con datos de mercado reales. Si hay datos sospechosos, márcalos como alerta roja.`,
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

    // Obtener datos de Idealista para la respuesta
    let idealistaYieldData = null;
    try {
      const { getRentalYield } = await import('@/lib/idealista-data-service');
      idealistaYieldData = getRentalYield(detectedCity);
    } catch {}

    return NextResponse.json({
      success: true,
      analysis,
      broker: brokerName,
      fileName,
      detectedCity,
      portfolioContext: { yield: portfolioYield.toFixed(2), contracts: contracts.length },
      marketReference: idealistaYieldData ? {
        grossYield: idealistaYieldData.grossYield,
        city: detectedCity,
        source: 'Idealista Data',
      } : null,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Proposal Analysis Error]:', error);
    return NextResponse.json({ error: 'Error analizando propuesta' }, { status: 500 });
  }
}
