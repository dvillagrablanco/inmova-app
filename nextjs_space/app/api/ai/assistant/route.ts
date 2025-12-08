import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatWithClaude, AssistantContext } from '@/lib/claude-assistant-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Helper function to map user role to assistant context user type
function mapUserRole(role: string | undefined): 'tenant' | 'landlord' | 'admin' | 'provider' | 'operador' | 'gestor' {
  switch (role) {
    case 'super_admin':
    case 'administrador':
    case 'admin':
      return 'admin';
    case 'gestor':
      return 'gestor';
    case 'operador':
      return 'operador';
    case 'tenant':
      return 'tenant';
    case 'soporte':
      return 'provider';
    default:
      return 'admin';
  }
}

/**
 * POST /api/ai/assistant
 * Asistente IA avanzado con Claude y Tool Calling
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Construir contexto del usuario
    const context: AssistantContext = {
      userId: session?.user?.id || '',
      userType: mapUserRole(session?.user?.role),
      userName: session?.user?.name || 'Usuario',
      userEmail: session?.user?.email || '',
      companyId: session?.user?.companyId || '',
      conversationHistory
    };

    logger.info(`🤖 Claude Assistant - New message from ${context.userName} (${context.userType})`);

    // Usar el nuevo servicio de Claude con tool calling
    const response = await chatWithClaude(message, context);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error en asistente IA:', error);
    return NextResponse.json(
      {
        type: 'text',
        content: 'Lo siento, hubo un error. Por favor, inténtalo de nuevo.',
        error: 'Error procesando mensaje'
      },
      { status: 500 }
    );
  }
}
