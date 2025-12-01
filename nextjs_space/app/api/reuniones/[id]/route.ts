import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const reunion = await prisma.communityMeeting.findFirst({ where: { id: params.id, companyId: session.user.companyId }, include: { building: true } });
    if (!reunion) return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 });
    return NextResponse.json(reunion);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener reunión' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!['administrador', 'gestor'].includes(session.user.role || '')) return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    const data = await req.json();
    const reunion = await prisma.communityMeeting.update({
      where: { id: params.id },
      data: { titulo: data.titulo, fechaReunion: data.fecha ? new Date(data.fecha) : undefined, ubicacion: data.lugar, asistentes: data.asistentes, acuerdos: data.acuerdos, estado: data.estado },
    });
    return NextResponse.json(reunion);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar reunión' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (session.user.role !== 'administrador') return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    await prisma.communityMeeting.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar reunión' }, { status: 500 });
  }
}
