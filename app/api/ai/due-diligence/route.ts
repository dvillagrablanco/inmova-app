import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/ai/due-diligence
 * Genera informe de due diligence IA a partir de documentación del activo.
 * Input: texto de escritura, nota simple, contratos, IBI
 * Output: informe con verificación de propiedad, cargas, riesgos, valor estimado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { documentText, propertyDescription } = await request.json();
    if (!documentText && !propertyDescription) {
      return NextResponse.json({ error: 'Se requiere texto del documento o descripción' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un abogado inmobiliario especializado en due diligence de activos en España.

DOCUMENTACIÓN DEL ACTIVO:
${(documentText || propertyDescription || '').substring(0, 15000)}

Genera un INFORME DE DUE DILIGENCE completo en JSON:
{
  "resumenEjecutivo": "3-5 líneas con conclusión principal",
  "puntuacionRiesgo": 0-100 (100=sin riesgo),
  "recomendacion": "PROCEDER" | "PROCEDER_CON_CONDICIONES" | "NO_PROCEDER",
  
  "verificacionPropiedad": {
    "titularDetectado": "nombre del propietario",
    "cifNif": "si aparece",
    "tipoPropiedad": "pleno dominio / usufructo / nuda propiedad",
    "registrado": true/false,
    "observaciones": "..."
  },
  
  "cargas": {
    "hipotecas": [{"entidad": "...", "capital": número, "estado": "..."}],
    "embargos": [],
    "servidumbres": [],
    "arrendamientos": [{"inquilino": "...", "renta": número, "vencimiento": "..."}],
    "totalCargasEstimadas": número
  },
  
  "riesgosDetectados": [
    {"tipo": "legal|fiscal|técnico|urbanístico", "descripcion": "...", "severidad": "alta|media|baja", "mitigacion": "..."}
  ],
  
  "aspectosFiscales": {
    "itp_estimado": "% y euros",
    "plusvalia_municipal": "observaciones",
    "is_impacto": "observaciones para sociedad patrimonial"
  },
  
  "valorEstimado": {
    "minimo": número,
    "maximo": número,
    "metodologia": "comparables / descuento flujos / coste reposición"
  },
  
  "condicionesPrevias": ["condición 1 antes de comprar", "condición 2"],
  "documentacionPendiente": ["documento que falta 1", "documento 2"],
  "proximosPasos": ["paso 1", "paso 2"]
}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let dueDiligence;
    try {
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      dueDiligence = JSON.parse(jsonText);
    } catch {
      dueDiligence = { resumenEjecutivo: text, recomendacion: 'REVISAR_MANUAL' };
    }

    return NextResponse.json({ success: true, dueDiligence });
  } catch (error: any) {
    logger.error('[Due Diligence]:', error);
    return NextResponse.json({ error: 'Error en due diligence' }, { status: 500 });
  }
}
