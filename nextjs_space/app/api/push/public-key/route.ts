import { NextResponse } from 'next/server';
import { getPublicVapidKey } from '@/lib/push-notifications';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const publicKey = getPublicVapidKey();
    
    return NextResponse.json({ publicKey });
  } catch (error: any) {
    logger.error('Error getting public key:', error);
    return NextResponse.json(
      { error: 'Error al obtener la clave pública', details: error.message },
      { status: 500 }
    );
  }
}
