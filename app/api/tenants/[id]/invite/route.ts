import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import crypto from 'crypto';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/tenants/[id]/invite
 * Envía invitación al inquilino para acceder al portal
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, nombreCompleto: true, companyId: true, password: true,
        company: { select: { nombre: true } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Security: verify tenant belongs to same company as the user
    if (tenant.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!tenant.email || tenant.email.includes('@placeholder')) {
      return NextResponse.json({ error: 'El inquilino no tiene email válido' }, { status: 400 });
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Store invitation in dedicated TenantInvitation model (not in tenant.password)
    await prisma.tenantInvitation.create({
      data: {
        companyId: session.user.companyId,
        tenantId: tenant.id,
        email: tenant.email,
        invitationCode: inviteToken,
        status: 'pendiente',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdBy: session.user.id,
      },
    });

    // Send invitation email
    const activateUrl = `${process.env.NEXTAUTH_URL || 'https://inmovaapp.com'}/portal-inquilino/activar?token=${inviteToken}`;

    try {
      const { sendEmail } = await import('@/lib/email-service');
      await sendEmail({
        to: tenant.email,
        subject: `Accede a tu portal de inquilino — ${tenant.company?.nombre || 'Inmova'}`,
        html: `
          <h2>¡Hola ${tenant.nombreCompleto}!</h2>
          <p>Te invitamos a acceder a tu portal de inquilino en <strong>${tenant.company?.nombre || 'Inmova'}</strong>.</p>
          <p>Desde el portal podrás:</p>
          <ul>
            <li>Ver tu contrato y documentos</li>
            <li>Consultar y pagar recibos</li>
            <li>Reportar incidencias</li>
            <li>Comunicarte con tu gestor</li>
          </ul>
          <p><a href="${activateUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Activar mi cuenta</a></p>
          <p><small>Este enlace es de un solo uso.</small></p>
        `,
      });
      logger.info('[Tenant Invite] Sent to:', tenant.email);
    } catch (emailErr) {
      logger.warn('[Tenant Invite] Email failed, invitation created but not sent', { tenantId: tenant.id });
      // Security: do NOT return activateUrl to client — it contains the invitation token
      return NextResponse.json({ 
        success: false, 
        message: 'No se pudo enviar el email de invitación. Verifica el email del inquilino e inténtalo de nuevo.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Invitación enviada a ${tenant.email}`,
    });
  } catch (error: any) {
    logger.error('[Tenant Invite]:', error);
    return NextResponse.json({ error: 'Error enviando invitación' }, { status: 500 });
  }
}
