import { NextResponse } from 'next/server';
import { getPublicVapidKey } from '@/lib/push-notifications';

export async function GET() {
  try {
    const publicKey = getPublicVapidKey();
    
    return NextResponse.json({ publicKey });
  } catch (error: any) {
    console.error('Error getting public key:', error);
    return NextResponse.json(
      { error: 'Error al obtener la clave pública', details: error.message },
      { status: 500 }
    );
  }
}
