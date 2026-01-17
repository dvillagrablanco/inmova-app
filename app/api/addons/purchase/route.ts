/**
 * API: Compra de Add-ons de Módulos
 * 
 * Integración con Stripe para:
 * - Procesar pagos de módulos adicionales
 * - Crear suscripciones recurrentes
 * - Facturación automática mensual
 * - Envío de facturas por email
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { MODULE_ADDON_PRICES } from '@/lib/modules-pricing-config';
import { purchaseModuleAddon } from '@/lib/stripe-module-addons';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar permisos
    const userRole = (session.user as any)?.role;
    if (!['administrador', 'super_admin', 'propietario'].includes(userRole)) {
      return NextResponse.json(
        { error: 'No tienes permisos para comprar add-ons' },
        { status: 403 }
      );
    }

    const { addOnCodigo, precio } = await request.json();

    if (!addOnCodigo) {
      return NextResponse.json(
        { error: 'Código del add-on requerido' },
        { status: 400 }
      );
    }

    // Obtener información del add-on desde configuración centralizada
    const addonInfo = MODULE_ADDON_PRICES[addOnCodigo];
    const addonPrice = addonInfo?.monthlyPrice || precio || 0;

    // Verificar si Stripe está configurado
    const stripeEnabled = process.env.STRIPE_SECRET_KEY && 
                          process.env.STRIPE_SECRET_KEY !== 'sk_test_...' &&
                          !process.env.STRIPE_SECRET_KEY.includes('placeholder');

    if (stripeEnabled && addonPrice > 0) {
      // Usar el servicio de Stripe para módulos add-on
      const result = await purchaseModuleAddon({
        moduleId: addOnCodigo,
        companyId: (session.user as any).companyId || 'unknown',
        userId: (session.user as any).id || 'unknown',
        userEmail: session.user.email || '',
        successUrl: `${process.env.NEXTAUTH_URL}/empresa/modulos?purchase=success&addon=${addOnCodigo}`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/empresa/modulos?purchase=cancelled`,
      });

      if (!result.success) {
        console.error('[Stripe Error]:', result.error);
        return NextResponse.json(
          { error: result.error || 'Error al procesar el pago' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        requiresPayment: true,
        checkoutUrl: result.checkoutUrl,
        addon: {
          codigo: addOnCodigo,
          precio: addonPrice,
          descripcion: addonInfo?.description || addOnCodigo,
        },
      });
    }

    // Modo desarrollo o add-on gratuito
    console.log(`[Dev Mode] Activando add-on: ${addOnCodigo} para usuario: ${(session.user as any).id}`);

    // TODO: Guardar en base de datos la compra del add-on
    // const { prisma } = await import('@/lib/db');
    // await prisma.companyAddon.create({
    //   data: {
    //     companyId: (session.user as any).companyId,
    //     addonCodigo: addOnCodigo,
    //     fechaCompra: new Date(),
    //     activo: true,
    //     precioMensual: addonPrice,
    //   },
    // });

    return NextResponse.json({
      success: true,
      requiresPayment: false,
      message: 'Add-on activado correctamente (modo desarrollo)',
      addon: {
        codigo: addOnCodigo,
        precio: addonPrice,
        descripcion: addonInfo?.description || addOnCodigo,
      },
    });
  } catch (error: any) {
    console.error('[API Error] /api/addons/purchase:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
