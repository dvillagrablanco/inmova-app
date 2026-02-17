import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { getGCClient } from '@/lib/gocardless-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/gocardless/setup-tenant
 * Configura un inquilino para cobros SEPA:
 * 1. Crea customer en GoCardless (si no existe)
 * 2. Crea redirect flow para autorización de mandato
 * 3. Retorna URL para que el inquilino autorice
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

    const gc = getGCClient();
    if (!gc) {
      return NextResponse.json({ error: 'GoCardless no configurado' }, { status: 503 });
    }

    const prisma = getPrismaClient();
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
    }

    // Obtener inquilino
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, companyId: session.user.companyId },
      include: {
        contracts: { where: { estado: 'activo' }, take: 1, select: { id: true } },
        gcCustomer: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Verificar si ya tiene mandato activo
    if (tenant.gcCustomer) {
      const activeMandate = await prisma.sepaMandate.findFirst({
        where: {
          customer: { id: tenant.gcCustomer.id },
          status: 'active',
        },
      });

      if (activeMandate) {
        return NextResponse.json({
          success: true,
          alreadySetup: true,
          mandateId: activeMandate.gcMandateId,
          message: 'El inquilino ya tiene un mandato SEPA activo',
        });
      }
    }

    // Crear o recuperar GCCustomer
    let gcCustomerRecord = tenant.gcCustomer;

    if (!gcCustomerRecord) {
      const nameParts = tenant.nombreCompleto.split(' ');
      const givenName = nameParts[0] || tenant.nombreCompleto;
      const familyName = nameParts.slice(1).join(' ') || '-';

      const gcCustomer = await gc.createCustomer({
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

      gcCustomerRecord = await prisma.gCCustomer.create({
        data: {
          companyId: session.user.companyId,
          gcCustomerId: gcCustomer.id!,
          tenantId: tenant.id,
          email: tenant.email,
          givenName,
          familyName,
          countryCode: 'ES',
        },
      });

      logger.info(`[GC Setup] Customer created: ${gcCustomer.id} for tenant ${tenant.id}`);
    }

    // Crear redirect flow para mandato SEPA
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const sessionToken = `tenant_${tenantId}_${Date.now()}`;

    const redirectFlow = await gc.createRedirectFlow({
      description: `Autorización domiciliación SEPA - ${tenant.nombreCompleto}`,
      sessionToken,
      successRedirectUrl: `${appUrl}/api/gocardless/callback?tenantId=${tenantId}&companyId=${session.user.companyId}&session_token=${sessionToken}`,
      scheme: 'sepa_core',
      customerId: gcCustomerRecord.gcCustomerId,
    });

    logger.info(`[GC Setup] Redirect flow created: ${redirectFlow.id} for tenant ${tenant.id}`);

    return NextResponse.json({
      success: true,
      redirectUrl: redirectFlow.redirectUrl,
      redirectFlowId: redirectFlow.id,
      customerId: gcCustomerRecord.gcCustomerId,
      tenantName: tenant.nombreCompleto,
      message: 'Enviar la URL al inquilino para que autorice la domiciliación SEPA',
    });
  } catch (error: any) {
    logger.error('[GC Setup Tenant]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
