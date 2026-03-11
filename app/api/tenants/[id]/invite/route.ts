import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { createTenantInvitation } from '@/lib/tenant-invitation-service';

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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        companyId: true,
        company: { select: { nombre: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    if (!tenant.email || tenant.email.includes('@placeholder')) {
      return NextResponse.json({ error: 'El inquilino no tiene email válido' }, { status: 400 });
    }

    if (session.user.companyId !== tenant.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const invitation = await createTenantInvitation(tenant.id, session.user.id, 7);

    // Send invitation email
    const activateUrl = `${process.env.NEXTAUTH_URL || 'https://inmovaapp.com'}/portal-inquilino/activar?code=${invitation.invitationCode}`;

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
          <p><small>Este enlace es de un solo uso y expira el ${new Date(invitation.expiresAt).toLocaleDateString('es-ES')}.</small></p>
        `,
      });
      logger.info('[Tenant Invite] Sent to:', tenant.email);
    } catch (emailErr) {
      logger.warn('[Tenant Invite] Email failed:', emailErr);
      return NextResponse.json({
        success: true,
        message: 'Invitación creada pero no se pudo enviar el email',
        activateUrl,
      });
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
