import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: /api/messages
 * Implementación mínima para evitar 404 y fallos en UI.
 * Devuelve lista vacía cuando no hay datos disponibles.
 */
export async function GET() {
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    return NextResponse.json(
      {
        id: `msg_${Date.now()}`,
        asunto: body?.asunto || 'Sin asunto',
        contenido: body?.contenido || '',
        remitente: {
          id: 'system',
          nombre: 'Sistema',
          email: 'no-reply@inmovaapp.com',
        },
        destinatario: {
          id: 'unknown',
          nombre: body?.destinatario || 'Destinatario',
          email: body?.destinatario || '',
        },
        leido: false,
        destacado: false,
        archivado: false,
        createdAt: now,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
