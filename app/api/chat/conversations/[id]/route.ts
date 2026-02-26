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

/**
 * Verifica que el usuario tiene acceso a la conversación.
 * Usa scopeCompanyIds para soportar grupos de empresas.
 */
async function verifyConversationAccess(prisma: any, conversationId: string, session: any) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, companyId: true, tenantId: true, userId: true, asunto: true, estado: true },
  });

  if (!conversation) return { ok: false, status: 404, error: 'Conversación no encontrada' };

  // Super admin can access all
  if (session.user.role === 'super_admin') {
    return { ok: true, conversation };
  }

  // Get user's accessible company IDs (including child companies)
  const { resolveCompanyScope } = await import('@/lib/company-scope');
  const scope = await resolveCompanyScope({
    userId: session.user.id,
    role: session.user.role,
    primaryCompanyId: session.user.companyId,
    request: null as any, // We don't need request here
  });

  if (!scope.scopeCompanyIds.includes(conversation.companyId)) {
    return { ok: false, status: 403, error: 'No tienes acceso a esta conversación' };
  }

  return { ok: true, conversation };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const access = await verifyConversationAccess(prisma, params.id, session);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const conversation = access.conversation;

    // Get tenant info if applicable
    let tenantInfo: any = null;
    if (conversation.tenantId) {
      tenantInfo = await prisma.tenant.findUnique({
        where: { id: conversation.tenantId },
        select: { nombreCompleto: true, email: true, telefono: true },
      });
    }

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: conversation.companyId },
      select: { id: true, nombre: true },
    });

    return NextResponse.json({
      conversation: {
        ...conversation,
        tenantInfo,
        company,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar conversación' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Security: verify company access
    const access = await verifyConversationAccess(prisma, params.id, session);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { estado } = await request.json();

    const conversation = await prisma.chatConversation.update({
      where: { id: params.id },
      data: {
        estado,
        ...(estado === 'cerrada' && {
          cerradoPor: session.user.id,
          fechaCierre: new Date(),
        }),
      },
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    logger.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar conversación' },
      { status: 500 }
    );
  }
}
