import { NextResponse } from 'next/server';
// Temporarily disabled - function not implemented
// import { getPublicVapidKey } from '@/lib/push-notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID public key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener la clave pública' },
      { status: 500 }
    );
  }
}
