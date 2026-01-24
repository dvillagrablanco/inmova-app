/**
 * API Route: Error AI Suggestion
 * 
 * Obtiene una sugerencia de IA para corregir un error específico.
 * 
 * POST /api/errors/[id]/suggest
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Roles permitidos
const ALLOWED_ROLES = ['super_admin', 'administrador'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    // Obtener el error
    const error = await prisma.errorLog.findUnique({
      where: { id: params.id },
    });
    
    if (!error) {
      return NextResponse.json({ error: 'Error no encontrado' }, { status: 404 });
    }
    
    // Verificar que tenemos API key de Anthropic
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API de IA no configurada' },
        { status: 500 }
      );
    }
    
    // Preparar el prompt
    const prompt = `Eres un experto desarrollador senior de Next.js, React, TypeScript y Prisma.
Analiza el siguiente error de una aplicación web y proporciona una solución clara y práctica.

## Error Information
- **Tipo:** ${error.name}
- **Mensaje:** ${error.message}
- **Fuente:** ${error.source}
- **Severidad:** ${error.severity}
- **Ruta/URL:** ${error.route || error.url || 'No especificada'}
- **Componente:** ${error.component || 'No especificado'}
- **Método HTTP:** ${error.method || 'N/A'}

${error.stack ? `## Stack Trace
\`\`\`
${error.stack.slice(0, 2000)}
\`\`\`` : ''}

${error.metadata ? `## Metadata adicional
\`\`\`json
${JSON.stringify(error.metadata, null, 2).slice(0, 1000)}
\`\`\`` : ''}

## Tu tarea
1. **Diagnóstico**: Explica brevemente qué está causando el error
2. **Solución**: Proporciona el código o los pasos específicos para corregirlo
3. **Prevención**: Sugiere cómo prevenir errores similares en el futuro

Responde en español y sé conciso pero completo.`;

    // Llamar a Claude con fallback de modelos
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Lista de modelos a intentar (en orden de preferencia)
    const modelsToTry = [
      'claude-sonnet-4-20250514',      // Más reciente
      'claude-3-5-sonnet-latest',       // Alias al último 3.5
      'claude-3-haiku-20240307',        // Fallback rápido
    ];

    let message: any = null;
    for (const modelName of modelsToTry) {
      try {
        message = await anthropic.messages.create({
          model: modelName,
          max_tokens: 2000,
          messages: [
            { role: 'user', content: prompt }
          ],
        });
        break; // Si funciona, salimos del loop
      } catch (modelError: any) {
        console.warn(`[API Error Suggest] Modelo ${modelName} no disponible:`, modelError?.message);
        continue;
      }
    }
    
    if (!message) {
      throw new Error('No se pudo conectar con ningún modelo de Claude');
    }
    
    // Extraer respuesta
    const suggestion = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'No se pudo generar sugerencia';
    
    // Guardar la sugerencia en la BD
    await prisma.errorLog.update({
      where: { id: params.id },
      data: { aiSuggestion: suggestion },
    });
    
    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error: any) {
    console.error('[API Error Suggest] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
