import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar webhooks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const webhooks: any[] = [];

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error: any) {
    console.error('[API Webhooks Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, url, eventos, secreto } = body;

    if (!nombre || !url) {
      return NextResponse.json({ error: 'Nombre y URL son obligatorios' }, { status: 400 });
    }

    const nuevoWebhook = {
      id: `wh_${Date.now()}`,
      nombre,
      url,
      eventos: eventos || [],
      secreto: secreto || `whsec_${Date.now()}`,
      estado: 'activo',
      ultimaEjecucion: null,
      ejecucionesExitosas: 0,
      errores: 0,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoWebhook,
      message: 'Webhook creado exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Webhooks Error]:', error);
    return NextResponse.json({ error: 'Error al crear webhook' }, { status: 500 });
  }
}
