import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoCardlessClient } from '@/lib/gocardless-integration';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/gocardless/setup-tenant
 * 
 * Crea un customer en GoCardless y genera un redirect flow
 * para que el inquilino autorice la domiciliación SEPA.
 * 
 * Body: { tenantId: string }
 * Returns: { redirectUrl: string, customerId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const token = process.env.GOCARDLESS_ACCESS_TOKEN;
    const env = (process.env.GOCARDLESS_ENVIRONMENT || 'live') as 'sandbox' | 'live';
    if (!token) {
      return NextResponse.json({ error: 'GoCardless no configurado' }, { status: 503 });
    }

    const gc = new GoCardlessClient({ accessToken: token, environment: env, enabled: true });
    const prisma = getPrismaClient();

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
    }

    // Get tenant from DB
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, companyId: session.user.companyId },
      include: { contracts: { where: { estado: 'activo' }, take: 1 } },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Check if already has GoCardless customer
    // Store gcCustomerId in tenant metadata or a separate field
    let gcCustomerId = (tenant as any).gcCustomerId;

    if (!gcCustomerId) {
      // Create customer in GoCardless
      const nameParts = tenant.nombreCompleto.split(' ');
      const givenName = nameParts[0] || tenant.nombreCompleto;
      const familyName = nameParts.slice(1).join(' ') || '-';

      const customer = await gc.createCustomer({
        email: tenant.email,
        givenName,
        familyName,
        addressLine1: tenant.direccionActual || undefined,
        countryCode: 'ES',
        language: 'es',
        phoneNumber: tenant.telefono || undefined,
        metadata: {
          inmova_tenant_id: tenant.id,
          inmova_company_id: session.user.companyId,
          dni: tenant.dni,
        },
      });

      gcCustomerId = customer.id;
      logger.info(`[GC] Customer creado para inquilino ${tenant.id}: ${gcCustomerId}`);
    }

    // Create redirect flow for SEPA mandate authorization
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';
    const baseUrl = env === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';

    const res = await fetch(`${baseUrl}/redirect_flows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'GoCardless-Version': '2015-07-06',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect_flows: {
          description: `Autorización domiciliación SEPA - ${tenant.nombreCompleto}`,
          session_token: `tenant_${tenantId}_${Date.now()}`,
          success_redirect_url: `${appUrl}/api/open-banking/gocardless/callback?tenantId=${tenantId}&companyId=${session.user.companyId}`,
          scheme: 'sepa_core',
          links: {
            customer: gcCustomerId,
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Error creando redirect flow');
    }

    const redirectFlowId = data.redirect_flows.id;
    const redirectUrl = data.redirect_flows.redirect_url;

    logger.info(`[GC] Redirect flow creado para ${tenant.nombreCompleto}: ${redirectFlowId}`);

    return NextResponse.json({
      success: true,
      redirectUrl,
      redirectFlowId,
      customerId: gcCustomerId,
      tenantName: tenant.nombreCompleto,
      message: 'Enviar redirectUrl al inquilino para que autorice la domiciliación SEPA',
    });
  } catch (error: any) {
    logger.error('[GC Setup Tenant Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
