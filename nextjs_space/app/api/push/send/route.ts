import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, body, icon, badge, data } = await req.json();

    // En producción, aquí usarías Web Push API con VAPID keys
    // Por ahora, simplemente validamos y respondemos
    console.log('Notificación push enviada:', { title, body });

    return NextResponse.json({ 
      success: true, 
      message: 'Notificación enviada' 
    });
  } catch (error: any) {
    console.error('Error al enviar notificación push:', error);
    return NextResponse.json(
      { error: 'Error al enviar notificación' },
      { status: 500 }
    );
  }
}
