import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { processAgentMessage } from '@/lib/ai-agents';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { message, history = [] } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const context = {
      userId: session.user.id as string,
      userType: ((session.user as any).role || 'admin') as any,
      userName: session.user.name || 'Usuario',
      userEmail: session.user.email || '',
      companyId: (session.user as any).companyId || '',
      role: (session.user as any).role,
    };

    const response = await processAgentMessage(
      message,
      context,
      undefined, // conversationId
      'accounting_tax' // preferredAgent
    );

    return NextResponse.json(response);
  } catch (error: any) {
    logger.error('[AI Accounting] Error:', error);
    return NextResponse.json(
      { error: 'Error procesando solicitud de IA', details: error.message },
      { status: 500 }
    );
  }
}
