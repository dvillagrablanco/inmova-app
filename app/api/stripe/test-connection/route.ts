import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo super_admin puede configurar Stripe
    if (session.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo los super administradores pueden configurar Stripe' },
        { status: 403 }
      );
    }

    const { secretKey, publishableKey } = await req.json();

    if (!secretKey || !publishableKey) {
      return NextResponse.json(
        { error: 'Se requieren secretKey y publishableKey' },
        { status: 400 }
      );
    }

    // Validar formato de las claves
    if (!secretKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Secret Key inválida. Debe comenzar con sk_test_ o sk_live_' },
        { status: 400 }
      );
    }

    if (!publishableKey.startsWith('pk_')) {
      return NextResponse.json(
        { error: 'Publishable Key inválida. Debe comenzar con pk_test_ o pk_live_' },
        { status: 400 }
      );
    }

    // Intentar inicializar Stripe con la clave provista
    try {
      // Importación dinámica de Stripe
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2024-12-18.acacia',
      });

      // Hacer una llamada simple para verificar la conexión
      const account = await stripe.accounts.retrieve();

      logger.info('Stripe connection test successful', {
        accountId: account.id,
        accountName: account.settings?.dashboard?.display_name,
      });

      return NextResponse.json({
        success: true,
        accountId: account.id,
        accountName: account.settings?.dashboard?.display_name || account.business_profile?.name,
        mode: secretKey.includes('test') ? 'test' : 'live',
      });
    } catch (stripeError: any) {
      logger.error('Stripe connection test failed:', stripeError);
      return NextResponse.json(
        {
          error: 'Error al conectar con Stripe',
          details: stripeError.message || 'Clave API inválida',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error('Error in test-connection:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
