import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Registrar el webhook para debugging (en modo demo no se procesa)
    console.log('📥 [MODO DEMO] Webhook de firma digital recibido:', body.event);

    return NextResponse.json({ received: true, mode: 'demo' });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}
