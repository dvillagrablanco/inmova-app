/**
 * POST /api/open-banking/gocardless/setup-batch
 *
 * Genera links de mandato SEPA para TODOS los inquilinos activos con contrato.
 * Opcionalmente envía el link por email.
 *
 * Body: { companyId?: string, sendEmail?: boolean }
 *
 * Returns: Array de { tenantId, tenantName, email, redirectUrl, status }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const token = process.env.GOCARDLESS_ACCESS_TOKEN;
    const env = (process.env.GOCARDLESS_ENVIRONMENT || 'live') as 'sandbox' | 'live';
    if (!token) {
      return NextResponse.json({ error: 'GoCardless no configurado. Falta GOCARDLESS_ACCESS_TOKEN.' }, { status: 503 });
    }

    const prisma = await getPrisma();
    const body = await request.json().catch(() => ({}));
    const targetCompanyId = body.companyId || (session.user as any).companyId;
    const sendEmail = body.sendEmail === true;

    // Get all active tenants with contracts for this company
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId: targetCompanyId,
        contracts: { some: { estado: 'activo' } },
      },
      include: {
        contracts: {
          where: { estado: 'activo' },
          take: 1,
          select: { id: true, rentaMensual: true, fechaInicio: true, fechaFin: true },
        },
      },
    });

    if (tenants.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay inquilinos activos con contrato para esta empresa',
        results: [],
      });
    }

    // Check which already have GoCardless mandates
    const existingMandates = await prisma.bankConnection.findMany({
      where: {
        companyId: targetCompanyId,
        proveedor: 'gocardless',
        tenantId: { in: tenants.map(t => t.id) },
      },
      select: { tenantId: true, estado: true },
    });
    const mandateMap = new Map(existingMandates.map(m => [m.tenantId, m.estado]));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';
    const baseUrl = env === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';

    const results: Array<{
      tenantId: string;
      tenantName: string;
      email: string;
      rentaMensual: number;
      status: string;
      redirectUrl?: string;
      error?: string;
    }> = [];

    for (const tenant of tenants) {
      const mandateStatus = mandateMap.get(tenant.id);
      if (mandateStatus === 'conectado') {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.nombreCompleto,
          email: tenant.email,
          rentaMensual: tenant.contracts[0]?.rentaMensual || 0,
          status: 'already_active',
        });
        continue;
      }

      try {
        // 1. Create customer in GoCardless
        const nameParts = tenant.nombreCompleto.split(' ');
        const customerRes = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'GoCardless-Version': '2015-07-06',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customers: {
              email: tenant.email,
              given_name: nameParts[0] || tenant.nombreCompleto,
              family_name: nameParts.slice(1).join(' ') || '-',
              country_code: 'ES',
              language: 'es',
              metadata: {
                inmova_tenant_id: tenant.id,
                inmova_company_id: targetCompanyId,
              },
            },
          }),
        });

        const customerData = await customerRes.json();
        if (!customerRes.ok) {
          // Customer may already exist
          const errMsg = customerData.error?.message || JSON.stringify(customerData.error?.errors?.[0] || {});
          if (!errMsg.includes('already') && !errMsg.includes('unique')) {
            results.push({
              tenantId: tenant.id,
              tenantName: tenant.nombreCompleto,
              email: tenant.email,
              rentaMensual: tenant.contracts[0]?.rentaMensual || 0,
              status: 'error',
              error: errMsg,
            });
            continue;
          }
        }

        const customerId = customerData.customers?.id;

        // 2. Create redirect flow for SEPA mandate
        const sessionToken = `batch_${tenant.id}_${Date.now()}`;
        const flowRes = await fetch(`${baseUrl}/redirect_flows`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'GoCardless-Version': '2015-07-06',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            redirect_flows: {
              description: `Domiciliación alquiler mensual - ${tenant.nombreCompleto}`,
              session_token: sessionToken,
              success_redirect_url: `${appUrl}/api/open-banking/gocardless/callback?tenantId=${tenant.id}&companyId=${targetCompanyId}&session=${sessionToken}`,
              scheme: 'sepa_core',
              ...(customerId ? { links: { customer: customerId } } : {}),
            },
          }),
        });

        const flowData = await flowRes.json();
        if (!flowRes.ok) {
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.nombreCompleto,
            email: tenant.email,
            rentaMensual: tenant.contracts[0]?.rentaMensual || 0,
            status: 'error',
            error: flowData.error?.message || 'Error creando redirect flow',
          });
          continue;
        }

        const redirectUrl = flowData.redirect_flows.redirect_url;

        // 3. Optionally send email with mandate link
        if (sendEmail && tenant.email) {
          try {
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.default.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: false,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
              },
            });

            await transporter.sendMail({
              from: process.env.SMTP_FROM || 'noreply@inmovaapp.com',
              to: tenant.email,
              subject: 'Autorización de domiciliación bancaria — Alquiler mensual',
              html: `
                <h2>Domiciliación bancaria del alquiler</h2>
                <p>Estimado/a ${tenant.nombreCompleto},</p>
                <p>Para automatizar el cobro mensual de su alquiler, necesitamos que autorice una domiciliación bancaria SEPA.</p>
                <p>Importe mensual: <strong>${(tenant.contracts[0]?.rentaMensual || 0).toLocaleString('es-ES')}€</strong></p>
                <p><a href="${redirectUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Autorizar domiciliación</a></p>
                <p>Este proceso es seguro y cumple con la normativa SEPA europea. Puede cancelar la domiciliación en cualquier momento.</p>
                <p>Atentamente,<br>Equipo de Gestión</p>
              `,
            });
          } catch (emailErr: any) {
            logger.warn(`[GC Batch] Email failed for ${tenant.email}: ${emailErr.message}`);
          }
        }

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.nombreCompleto,
          email: tenant.email,
          rentaMensual: tenant.contracts[0]?.rentaMensual || 0,
          status: 'link_generated',
          redirectUrl,
        });
      } catch (err: any) {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.nombreCompleto,
          email: tenant.email,
          rentaMensual: tenant.contracts[0]?.rentaMensual || 0,
          status: 'error',
          error: err.message,
        });
      }
    }

    const generated = results.filter(r => r.status === 'link_generated').length;
    const active = results.filter(r => r.status === 'already_active').length;
    const errors = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: tenants.length,
        linksGenerated: generated,
        alreadyActive: active,
        errors,
        emailsSent: sendEmail ? generated : 0,
      },
      results,
    });
  } catch (error: any) {
    logger.error('[GC Setup Batch]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
