import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const prisma = getPrismaClient();

    const logs = await prisma.apiLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        responseTime: true,
        createdAt: true,
      },
    });

    const formatted = logs.map((l: any) => ({
      id: l.id,
      evento: l.endpoint || 'unknown',
      method: l.method || 'POST',
      statusCode: l.statusCode || 200,
      duracion: l.responseTime || 0,
      createdAt: l.createdAt.toISOString(),
      success: l.statusCode ? l.statusCode < 400 : true,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[admin/webhook-logs GET]:', error);
    return NextResponse.json([], { status: 200 });
  }
}
