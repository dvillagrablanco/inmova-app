import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * API para generar sugerencias proactivas usando IA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, context } = await request.json();

    // Obtener datos del usuario para contexto
    const user = await prisma.user.findUnique({
      where: { id: userId || session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Construir contexto del usuario (simplificado)
    const userContext = {
      buildingsCount: 0,
      tenantsCount: 0,
      contractsCount: 0,
      hasCompletedSetup: !!(user.name && user.email),
      ...context,
    };

    const systemPrompt = `Eres un asistente experto en gestión inmobiliaria que genera sugerencias proactivas para mejorar la productividad del usuario.

Basándote en el contexto del usuario, genera hasta 3 sugerencias relevantes y accionables.

Cada sugerencia debe tener:
- type: "wizard" (abre un asistente paso a paso), "action" (acción directa), "tip" (consejo), o "warning" (advertencia)
- title: Título corto y claro
- description: Descripción de 1-2 líneas
- priority: "high", "medium", o "low"
- action: {label: "Texto del botón", route: "/ruta" o callback: "functionName"}
- dismissable: true/false

Ejemplos de sugerencias:
- Si no tiene edificios: Sugerir crear el primero
- Si no tiene inquilinos: Sugerir registrar uno
- Si tiene edificios pero no contratos: Sugerir crear contrato
- Si no ha completado el setup: Sugerir completarlo
- Si tiene muchos pagos pendientes: Avisar de morosidad
- Si no ha configurado integraciones: Sugerir configurar contabilidad

Responde en JSON con la siguiente estructura:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "wizard",
      "title": "...",
      "description": "...",
      "priority": "high",
      "action": {"label": "...", "route": "..."},
      "dismissable": true
    }
  ]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const userMessage = `Contexto del usuario:
- Edificios registrados: ${userContext.buildingsCount}
- Inquilinos registrados: ${userContext.tenantsCount}
- Contratos activos: ${userContext.contractsCount}
- Setup completado: ${userContext.hasCompletedSetup ? 'Sí' : 'No'}

Genera sugerencias relevantes para ayudar al usuario.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // Llamada al LLM API
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error('Error calling LLM API');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
