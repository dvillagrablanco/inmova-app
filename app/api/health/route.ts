import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    message: 'Inmova App - Frontend funcionando. APIs requieren configuración de DATABASE_URL.'
  });
}
