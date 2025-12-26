import { NextResponse } from 'next/server';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

/**
 * GET /api/push/vapid-keys
 * Obtiene la clave pública VAPID para el cliente
 */
export async function GET() {
  try {
    // Obtener la clave pública de las variables de entorno
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      return NextResponse.json({ error: 'VAPID keys no configuradas' }, { status: 500 });
    }

    return NextResponse.json({
      publicKey,
    });
  } catch (error) {
    console.error('Error obteniendo VAPID keys:', error);
    return NextResponse.json({ error: 'Error obteniendo claves VAPID' }, { status: 500 });
  }
}

/**
 * POST /api/push/vapid-keys/generate
 * Genera nuevas claves VAPID (solo para desarrollo)
 */
export async function POST() {
  try {
    const vapidKeys = webpush.generateVAPIDKeys();

    return NextResponse.json({
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      message:
        'Agrega estas claves a tu archivo .env:\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=...\nVAPID_PRIVATE_KEY=...',
    });
  } catch (error) {
    console.error('Error generando VAPID keys:', error);
    return NextResponse.json({ error: 'Error generando claves VAPID' }, { status: 500 });
  }
}
