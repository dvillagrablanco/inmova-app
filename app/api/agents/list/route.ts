/**
 * API: GET /api/agents/list
 * Lista todos los agentes disponibles y sus capacidades
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { listAgents, SYSTEM_INFO } from '@/lib/ai-agents';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener lista de agentes
    const agents = listAgents();

    return NextResponse.json({
      success: true,
      system: SYSTEM_INFO,
      agents,
      totalAgents: agents.length,
      enabledAgents: agents.filter(a => a.enabled).length
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo lista de agentes',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
