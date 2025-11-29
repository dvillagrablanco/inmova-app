import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subscription = await req.json();

    // En producción, aquí guardarías la suscripción en la base de datos
    // Por ahora, simplemente lo registramos en localStorage del cliente
    console.log('Suscripción push recibida:', subscription);

    return NextResponse.json({ 
      success: true, 
      message: 'Suscripción registrada exitosamente' 
    });
  } catch (error: any) {
    console.error('Error al registrar suscripción push:', error);
    return NextResponse.json(
      { error: 'Error al registrar suscripción' },
      { status: 500 }
    );
  }
}
