export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const MOCK_NOTES = [
  { id: '1', entityType: 'inmueble', entityId: 'inv1', contenido: 'Revisar estado de la calefacción antes de la próxima visita.', autor: 'Admin', fechaCreacion: '2026-03-08T10:00:00Z' },
  { id: '2', entityType: 'inmueble', entityId: 'inv1', contenido: 'Inquilino solicitó cambio de cerradura. Pendiente de aprobación.', autor: 'Gestor', fechaCreacion: '2026-03-07T14:30:00Z' },
  { id: '3', entityType: 'inmueble', entityId: 'inv1', contenido: 'Entrega de llaves programada para el 15 de marzo.', autor: 'Admin', fechaCreacion: '2026-03-05T09:00:00Z' },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const entityType = req.nextUrl.searchParams.get('entityType');
    const entityId = req.nextUrl.searchParams.get('entityId');
    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType y entityId requeridos' }, { status: 400 });
    }
    const filtered = MOCK_NOTES.filter(
      (n) => n.entityType === entityType && n.entityId === entityId
    );
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('[notas GET]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const body = await req.json();
    const { entityType, entityId, contenido } = body;
    if (!entityType || !entityId || !contenido?.trim()) {
      return NextResponse.json(
        { error: 'entityType, entityId y contenido requeridos' },
        { status: 400 }
      );
    }
    const autor = session.user?.name || session.user?.email || 'Usuario';
    const nuevo = {
      id: String(Date.now()),
      entityType,
      entityId,
      contenido: contenido.trim(),
      autor,
      fechaCreacion: new Date().toISOString(),
    };
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error('[notas POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
