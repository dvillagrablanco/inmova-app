import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface FormField {
  name: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  description?: string;
}

interface RequestBody {
  formContext: string;
  fields: FormField[];
  currentValues: Record<string, any>;
  userRequest: string;
  additionalContext?: string;
}

const FORM_CONTEXT_PROMPTS: Record<string, string> = {
  propiedad: `Eres un experto inmobiliario español especializado en gestión de propiedades.
Considera:
- Precios de mercado en España por zona
- Normativa española de alquileres (LAU)
- Características típicas de viviendas españolas
- Rentabilidad y ROI típicos del mercado`,

  edificio: `Eres un experto en gestión de edificios y comunidades de propietarios en España.
Considera:
- Normativa de propiedad horizontal
- Características constructivas típicas en España
- Gestión de comunidades de vecinos
- Certificaciones energéticas y normativa técnica`,

  mantenimiento: `Eres un experto en gestión de mantenimiento de propiedades inmobiliarias.
Considera:
- Tipos de incidencias comunes en viviendas
- Priorización según urgencia y tipo
- Proveedores y servicios técnicos
- Plazos de resolución razonables`,

  seguro: `Eres un experto en seguros inmobiliarios en España.
Considera:
- Tipos de seguros para propiedades (hogar, comunidad, responsabilidad civil)
- Coberturas típicas y exclusiones
- Primas según tipo de inmueble y zona
- Normativa española de seguros`,

  inquilino: `Eres un experto en gestión de inquilinos y arrendamientos en España.
Considera:
- Requisitos legales para contratos de alquiler
- Documentación necesaria del inquilino
- Verificación de solvencia
- Derechos y obligaciones según LAU`,

  contrato: `Eres un experto en contratos de arrendamiento españoles.
Considera:
- Ley de Arrendamientos Urbanos (LAU)
- Cláusulas obligatorias y opcionales
- Actualizaciones de renta (IPC)
- Fianzas y garantías legales`,

  pago: `Eres un experto en gestión de cobros y pagos inmobiliarios.
Considera:
- Métodos de pago habituales en España
- Gestión de impagos y morosidad
- Conceptos de cobro (renta, comunidad, suministros)
- Retenciones fiscales y facturación`,

  usuario: `Eres un experto en gestión de equipos inmobiliarios.
Considera:
- Roles típicos (administrador, gestor, agente)
- Permisos y accesos según función
- Organización de equipos de trabajo`,

  default: `Eres un asistente experto en gestión inmobiliaria en España.
Proporciona sugerencias útiles y prácticas basadas en el contexto del formulario.`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { formContext, fields, currentValues, userRequest, additionalContext } = body;

    if (!formContext || !fields || !userRequest) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Form Assistant] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'Servicio de IA no configurado' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build field descriptions
    const fieldDescriptions = fields.map(f => {
      let desc = `- ${f.name} (${f.label}): tipo ${f.type}`;
      if (f.required) desc += ' [REQUERIDO]';
      if (f.options) {
        desc += ` | Opciones: ${f.options.map(o => `${o.value}="${o.label}"`).join(', ')}`;
      }
      if (f.description) desc += ` | ${f.description}`;
      return desc;
    }).join('\n');

    // Current values
    const currentValuesStr = Object.entries(currentValues)
      .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n') || 'Ningún campo completado todavía';

    const contextPrompt = FORM_CONTEXT_PROMPTS[formContext] || FORM_CONTEXT_PROMPTS.default;

    const prompt = `${contextPrompt}

FORMULARIO: ${formContext}

CAMPOS DISPONIBLES:
${fieldDescriptions}

VALORES ACTUALES:
${currentValuesStr}

${additionalContext ? `CONTEXTO ADICIONAL:\n${additionalContext}\n` : ''}

SOLICITUD DEL USUARIO:
"${userRequest}"

TAREA: Analiza la solicitud del usuario y proporciona sugerencias para los campos del formulario.
Para cada sugerencia, indica:
1. El campo exacto (usa el nombre del campo, no la etiqueta)
2. El valor sugerido (debe coincidir con las opciones si el campo las tiene)
3. Una breve razón
4. Tu nivel de confianza (0.0 a 1.0)

RESPONDE ESTRICTAMENTE EN JSON:
{
  "success": true,
  "suggestions": [
    {
      "field": "nombre_campo",
      "value": "valor_sugerido",
      "reason": "Razón breve de la sugerencia",
      "confidence": 0.8
    }
  ],
  "explanation": "Explicación general de tus sugerencias",
  "tips": ["Consejo útil 1", "Consejo útil 2"]
}

REGLAS IMPORTANTES:
- Solo sugiere campos que estén vacíos o que el usuario pida modificar
- Usa los valores de opciones exactos si el campo tiene opciones predefinidas
- Para campos numéricos, usa números sin formato
- Para fechas, usa formato YYYY-MM-DD
- Para booleanos, usa true/false
- Si no puedes sugerir un valor con confianza, no lo incluyas
- Incluye tips prácticos relacionados con el contexto`;

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No se recibió respuesta de texto de Claude');
    }

    // Parse JSON response
    let aiResponse;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      aiResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Form Assistant] JSON parse error:', parseError);
      console.error('[Form Assistant] Raw response:', textContent.text);
      
      // Return a fallback response
      aiResponse = {
        success: true,
        suggestions: [],
        explanation: 'No se pudieron procesar las sugerencias. Por favor, intenta ser más específico en tu solicitud.',
        tips: ['Intenta describir con más detalle lo que necesitas'],
      };
    }

    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error('[Form Assistant] Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error.message },
      { status: 500 }
    );
  }
}
