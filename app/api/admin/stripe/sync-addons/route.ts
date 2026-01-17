/**
 * API: Sincronizar Add-ons con Stripe
 * 
 * Endpoint administrativo para sincronizar todos los módulos add-on
 * con Stripe (crear productos y precios).
 * 
 * Solo accesible por super_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncAllModuleAddonsToStripe } from '@/lib/stripe-module-addons';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo super_admin puede sincronizar con Stripe' },
        { status: 403 }
      );
    }

    console.log('[Admin] Iniciando sincronización de add-ons con Stripe...');

    // Sincronizar todos los módulos add-on
    const result = await syncAllModuleAddonsToStripe();

    console.log('[Admin] Sincronización completada:', result);

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${result.synced} módulos sincronizados`,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('[API Error] /api/admin/stripe/sync-addons:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
