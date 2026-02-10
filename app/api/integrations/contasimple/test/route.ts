/**
 * API Route: Test de credenciales de Contasimple
 * POST /api/integrations/contasimple/test
 * 
 * Verifica que las credenciales proporcionadas son válidas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const testSchema = z.object({
  authKey: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden probar integraciones' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { authKey } = testSchema.parse(body);

    // Test: intentar hacer una petición simple a Contasimple API
    const apiUrl = process.env.CONTASIMPLE_API_URL || 'https://api.contasimple.com/api/v2';

    const response = await fetch(`${apiUrl}/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Si no hay endpoint de ping, probar listando customers
      const customersResponse = await fetch(`${apiUrl}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!customersResponse.ok) {
        logger.warn(`[Contasimple Test] Credenciales inválidas para empresa ${session.user.companyId}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Credenciales inválidas o API de Contasimple no disponible',
          },
          { status: 401 }
        );
      }
    }

    logger.info(`[Contasimple Test] ✅ Credenciales válidas para empresa ${session.user.companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Credenciales válidas',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[Contasimple Test] Error probando credenciales:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al probar credenciales',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
