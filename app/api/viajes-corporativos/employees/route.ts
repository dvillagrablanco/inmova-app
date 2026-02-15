import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET() {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any)?.companyId;
    if (!companyId) {
      return NextResponse.json({ data: [] });
    }

    const users = await prisma.user.findMany({
      where: { companyId, activo: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });

    const employees = users.map((u: any) => ({
      id: u.id,
      nombre: u.name || '',
      departamento: u.role || '',
    }));

    return NextResponse.json({ data: employees });
  } catch (error) {
    logger.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
