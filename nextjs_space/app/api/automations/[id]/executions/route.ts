import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = params;
    // Verificar que la automatización pertenece a la empresa
    const automation = await prisma.automation.findFirst({
      where: { id, companyId },
    });
    if (!automation) {
      return NextResponse.json(
        { error: 'Automatización no encontrada' },
        { status: 404 }
      );
    // Obtener últimas 50 ejecuciones
    const executions = await prisma.automationExecution.findMany({
      where: { automationId: id },
      orderBy: { ejecutadaEn: 'desc' },
      take: 50,
    return NextResponse.json(executions);
  } catch (error) {
    logger.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Error al obtener ejecuciones' },
      { status: 500 }
    );
  }
}
