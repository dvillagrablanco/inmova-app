import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ success: true, data: { propietarios: [], inmuebles: [] } });
    }

    const [users, units] = await Promise.all([
      prisma.user.findMany({
        where: { companyId, activo: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.unit.findMany({
        where: { building: { companyId } },
        select: {
          id: true,
          numero: true,
          building: { select: { nombre: true, direccion: true } },
        },
        orderBy: { numero: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        propietarios: users.map((u: any) => ({
          id: u.id,
          nombre: u.name,
          email: u.email,
        })),
        inmuebles: units.map((u: any) => ({
          id: u.id,
          nombre: `${u.building?.nombre || ''} - ${u.numero}`,
          direccion: u.building?.direccion || '',
        })),
      },
    });
  } catch (error) {
    console.error('[Liquidaciones Options GET]:', error);
    return NextResponse.json({ error: 'Error al obtener opciones' }, { status: 500 });
  }
}
