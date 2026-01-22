/**
 * API Route: Asistente IA para formulario de inquilinos
 * POST /api/ai/tenant-assistant
 * 
 * Proporciona asistencia contextual con Claude para:
 * - Validar datos de inquilino
 * - Sugerir datos faltantes
 * - Ayudar con el formulario
 * - Responder preguntas específicas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as ClaudeAIService from '@/lib/claude-ai-service';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const requestSchema = z.object({
  action: z.enum(['ask', 'validate', 'suggest']),
  question: z.string().optional(),
  formData: z.object({
    nombre: z.string().optional(),
    email: z.string().optional(),
    telefono: z.string().optional(),
    documentoIdentidad: z.string().optional(),
    tipoDocumento: z.string().optional(),
    fechaNacimiento: z.string().optional(),
    nacionalidad: z.string().optional(),
    estadoCivil: z.string().optional(),
    profesion: z.string().optional(),
    ingresosMensuales: z.string().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

// Prompt del sistema para el asistente de inquilinos
const SYSTEM_PROMPT = `Eres un asistente experto en gestión inmobiliaria de INMOVA, especializado en ayudar a registrar inquilinos.

Tu rol:
- Ayudar a completar el formulario de nuevo inquilino
- Validar datos ingresados (DNI/NIE español, emails, teléfonos)
- Sugerir datos faltantes o corregir errores
- Responder preguntas sobre el proceso de registro
- Explicar qué documentos se necesitan

Formato de DNI español: 8 números + 1 letra (ej: 12345678Z)
Formato de NIE español: X/Y/Z + 7 números + 1 letra (ej: X1234567L)

Información importante sobre inquilinos:
- Datos obligatorios: nombre, email, teléfono, documento de identidad
- Datos opcionales pero recomendados: fecha de nacimiento, profesión, ingresos mensuales
- Los documentos ayudan a verificar la solvencia del inquilino

Reglas:
1. Responde SIEMPRE en español
2. Sé conciso (máximo 150 palabras)
3. Si detectas un error en datos, explica cómo corregirlo
4. Usa un tono amigable pero profesional
5. Si no puedes ayudar, sugiere contactar soporte`;

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Parsear y validar body
    const body = await request.json();
    const validated = requestSchema.parse(body);
    const { action, question, formData, conversationHistory } = validated;

    // Verificar si Claude está configurado
    if (!ClaudeAIService.isClaudeConfigured()) {
      logger.warn('[Tenant Assistant] Claude no configurado');
      return NextResponse.json({
        success: true,
        message: getFallbackResponse(action, formData),
        usedAI: false
      });
    }

    let prompt = '';
    
    if (action === 'ask' && question) {
      // Pregunta libre del usuario
      prompt = question;
      if (formData) {
        prompt += `\n\nDatos actuales del formulario:\n${JSON.stringify(formData, null, 2)}`;
      }
    } else if (action === 'validate' && formData) {
      // Validar datos del formulario
      prompt = `Valida los siguientes datos de un inquilino y señala cualquier error o mejora:

Datos:
- Nombre: ${formData.nombre || '(vacío)'}
- Email: ${formData.email || '(vacío)'}
- Teléfono: ${formData.telefono || '(vacío)'}
- Tipo documento: ${formData.tipoDocumento || 'dni'}
- Documento: ${formData.documentoIdentidad || '(vacío)'}
- Fecha nacimiento: ${formData.fechaNacimiento || '(vacío)'}
- Nacionalidad: ${formData.nacionalidad || '(vacío)'}
- Profesión: ${formData.profesion || '(vacío)'}
- Ingresos mensuales: ${formData.ingresosMensuales || '(vacío)'}€

Si hay errores, indica cuáles son y cómo corregirlos. Si todo está bien, confirma que los datos son válidos.`;
    } else if (action === 'suggest' && formData) {
      // Sugerir datos faltantes
      const filledFields = Object.entries(formData).filter(([_, v]) => v).map(([k]) => k);
      const emptyFields = ['nombre', 'email', 'telefono', 'documentoIdentidad', 'profesion', 'ingresosMensuales']
        .filter(f => !filledFields.includes(f));
      
      prompt = `El usuario está completando un formulario de inquilino. 
      
Campos completados: ${filledFields.join(', ') || 'ninguno'}
Campos vacíos: ${emptyFields.join(', ') || 'ninguno'}

Sugiere qué campos debería completar a continuación y por qué son importantes. Si hay campos opcionales pero recomendados, menciónalo.`;
    } else {
      return NextResponse.json(
        { error: 'Acción no válida o datos faltantes' },
        { status: 400 }
      );
    }

    // Llamar a Claude
    const response = await ClaudeAIService.chat(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 400,
      temperature: 0.5
    });

    logger.info(`[Tenant Assistant] Respuesta generada para acción: ${action}`);

    return NextResponse.json({
      success: true,
      message: response,
      usedAI: true,
      action
    });

  } catch (error: any) {
    logger.error('[Tenant Assistant] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Error procesando solicitud',
        message: getFallbackResponse('ask')
      },
      { status: 500 }
    );
  }
}

// Respuestas de fallback cuando Claude no está disponible
function getFallbackResponse(action: string, formData?: any): string {
  if (action === 'validate') {
    const errors: string[] = [];
    
    if (formData) {
      if (!formData.nombre) errors.push('El nombre es obligatorio');
      if (!formData.email) errors.push('El email es obligatorio');
      if (!formData.telefono) errors.push('El teléfono es obligatorio');
      if (!formData.documentoIdentidad) errors.push('El documento de identidad es obligatorio');
      
      if (formData.email && !formData.email.includes('@')) {
        errors.push('El email no tiene un formato válido');
      }
    }
    
    if (errors.length > 0) {
      return `⚠️ Hay algunos campos que revisar:\n\n${errors.map(e => `• ${e}`).join('\n')}`;
    }
    return '✅ Los datos básicos parecen correctos. Puedes continuar con el registro.';
  }
  
  if (action === 'suggest') {
    return '📝 Para registrar un inquilino necesitas:\n\n• Nombre completo\n• Email\n• Teléfono de contacto\n• Documento de identidad (DNI/NIE/Pasaporte)\n\nOpcional pero recomendado: profesión e ingresos para verificar solvencia.';
  }
  
  return '👋 Soy tu asistente para registrar inquilinos. Puedo ayudarte a:\n\n• Completar el formulario\n• Validar los datos\n• Resolver dudas sobre el proceso\n\n¿En qué te puedo ayudar?';
}
