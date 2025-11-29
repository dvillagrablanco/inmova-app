import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const where: any = { companyId: session.user.companyId };
    if (buildingId) where.buildingId = buildingId;
    const reuniones = await prisma.communityMeeting.findMany({ where, include: { building: true }, orderBy: { fechaReunion: 'desc' } });
    return NextResponse.json(reuniones);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener reuniones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!['administrador', 'gestor'].includes(session.user.role || '')) return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    const data = await req.json();
    const reunion = await prisma.communityMeeting.create({
      data: {
        companyId: session.user.companyId,
        buildingId: data.buildingId,
        titulo: data.titulo,
        tipo: 'ordinaria',
        fechaReunion: new Date(data.fecha),
        ubicacion: data.lugar,
        organizadoPor: session.user.email || '',
        ordenDel: data.descripcion || '',
        asistentes: data.asistentes || [],
      },
    });
    return NextResponse.json(reunion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear reunión' }, { status: 500 });
  }
}
