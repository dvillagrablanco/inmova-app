import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface GenerateRequest {
  tipo: string;
  contexto: string;
  jurisdiccion?: string;
  detalles?: Record<string, any>;
}

// POST - Generar contenido de plantilla con IA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Servicio de IA no configurado' },
        { status: 503 }
      );
    }

    const body: GenerateRequest = await request.json();
    const { tipo, contexto, jurisdiccion = 'España', detalles } = body;

    if (!tipo || !contexto) {
      return NextResponse.json(
        { error: 'Tipo y contexto son requeridos' },
        { status: 400 }
      );
    }

    const systemPrompt = `Eres un experto abogado inmobiliario español especializado en redacción de documentos legales.
Tu tarea es generar documentos legales profesionales, claros y cumpliendo con la normativa vigente.

Reglas importantes:
- Usa un lenguaje formal y jurídico apropiado
- Incluye todas las cláusulas necesarias según la legislación española
- Utiliza variables con el formato {{nombre_variable}} para datos que deben personalizarse
- Estructura el documento con secciones claras
- Incluye fecha, partes intervinientes y firma al final
- Asegúrate de cumplir con la LAU (Ley de Arrendamientos Urbanos) cuando aplique
- Incluye cláusulas de protección de datos (RGPD)`;

    const userPrompt = `Genera un documento legal de tipo: ${tipo}

Contexto: ${contexto}
Jurisdicción: ${jurisdiccion}
${detalles ? `Detalles adicionales: ${JSON.stringify(detalles)}` : ''}

Por favor genera:
1. El contenido completo del documento con todas las cláusulas necesarias
2. Lista de variables que se deben personalizar (formato: nombre_variable - descripción)
3. Notas importantes sobre el uso del documento

Responde en formato JSON con esta estructura:
{
  "titulo": "Título del documento",
  "contenido": "Contenido completo del documento...",
  "variables": ["nombre_arrendador", "dni_arrendador", "direccion_inmueble", ...],
  "descripcionVariables": {
    "nombre_arrendador": "Nombre completo del propietario",
    "dni_arrendador": "DNI/NIE del propietario",
    ...
  },
  "notas": "Notas importantes sobre el uso...",
  "clausulasOpcionales": ["Cláusula sobre mascotas", "Cláusula de obras..."]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extraer el contenido de texto
    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Respuesta inesperada de la IA');
    }

    // Intentar parsear como JSON
    let result;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Si no hay JSON, devolver el texto como contenido
        result = {
          titulo: `Documento: ${tipo}`,
          contenido: textContent.text,
          variables: [],
          notas: '',
        };
      }
    } catch {
      result = {
        titulo: `Documento: ${tipo}`,
        contenido: textContent.text,
        variables: [],
        notas: '',
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating legal template:', error);
    return NextResponse.json(
      { error: 'Error al generar la plantilla' },
      { status: 500 }
    );
  }
}
