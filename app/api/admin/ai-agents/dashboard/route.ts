import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { agentCoordinator } from '@/lib/ai-agents/agent-coordinator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== 'super_admin' && session.user.role !== 'administrador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Listar agentes disponibles y su estado
  const agents = agentCoordinator.listAvailableAgents();
  
  // Obtener métricas básicas
  const metrics = await agentCoordinator.getAgentMetrics();

  return NextResponse.json({
    agents,
    metrics,
    systemStatus: 'healthy', // Simplified status
    timestamp: new Date().toISOString()
  });
}
