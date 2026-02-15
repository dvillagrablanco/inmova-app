import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log del error del cliente
    logger.error(`[CLIENT ERROR] [AI Document Analysis] Frontend error:`, JSON.stringify({
      error: body.error,
      filename: body.filename,
      timestamp: body.timestamp,
      stack: body.stack?.substring(0, 500),
    }));
    
    return NextResponse.json({ logged: true });
  } catch (e) {
    return NextResponse.json({ logged: false });
  }
}
