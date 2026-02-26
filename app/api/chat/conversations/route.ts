export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET - Obtener lista de conversaciones
 * 
 * Soporta multi-empresa (grupo):
 * - Si el usuario pertenece a un grupo, ve conversaciones de todas las empresas del grupo
 * - Super admin ve todas las conversaciones de la plataforma
 * - Se puede filtrar por empresa con ?companyId=xxx
 * 
 * Seguridad: solo muestra conversaciones de empresas accesibles al usuario
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterCompanyId = searchParams.get('companyId');

    // Resolve company scope (includes child companies for groups)
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    if (scope.scopeCompanyIds.length === 0) {
      return NextResponse.json({ conversations: [], companies: [] });
    }

    // Filter by specific company if requested (but only if accessible)
    let targetCompanyIds = scope.scopeCompanyIds;
    if (filterCompanyId) {
      if (!scope.scopeCompanyIds.includes(filterCompanyId)) {
        return NextResponse.json({ error: 'No tienes acceso a esta empresa' }, { status: 403 });
      }
      targetCompanyIds = [filterCompanyId];
    }

    // Get ChatConversations (tenant/proveedor chats)
    const chatConversations = await prisma.chatConversation.findMany({
      where: {
        companyId: { in: targetCompanyIds },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { mensaje: true, createdAt: true, senderType: true, leido: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Enrich with tenant/user info and company name
    const enrichedConversations = await Promise.all(
      chatConversations.map(async (conv) => {
        let participantName = 'Desconocido';
        let participantType = 'user';

        if (conv.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: conv.tenantId },
            select: { nombreCompleto: true, email: true },
          });
          participantName = tenant?.nombreCompleto || tenant?.email || 'Inquilino';
          participantType = 'tenant';
        } else if (conv.userId) {
          const user = await prisma.user.findUnique({
            where: { id: conv.userId },
            select: { name: true, email: true },
          });
          participantName = user?.name || user?.email || 'Usuario';
          participantType = 'user';
        }

        // Company info
        const company = await prisma.company.findUnique({
          where: { id: conv.companyId },
          select: { id: true, nombre: true },
        });

        // Unread count
        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderType: { not: 'user' },
            leido: false,
          },
        });

        const lastMsg = conv.messages[0] || null;

        return {
          id: conv.id,
          asunto: conv.asunto,
          estado: conv.estado,
          companyId: conv.companyId,
          companyName: company?.nombre || '',
          participantName,
          participantType,
          tenantId: conv.tenantId,
          userId: conv.userId,
          ultimoMensaje: lastMsg?.mensaje || conv.ultimoMensaje || null,
          ultimoMensajeFecha: lastMsg?.createdAt || conv.ultimoMensajeFecha || null,
          unreadCount,
          createdAt: conv.createdAt,
        };
      })
    );

    // Also get internal user-to-user conversations (from Notification table)
    // These are between users of the same company group
    const internalUsers = await prisma.user.findMany({
      where: {
        companyId: { in: targetCompanyIds },
        id: { not: session.user.id },
        activo: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: { select: { nombre: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Get companies for filter dropdown
    const companies = await prisma.company.findMany({
      where: { id: { in: scope.scopeCompanyIds } },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({
      conversations: enrichedConversations,
      internalUsers,
      companies,
      scope: {
        activeCompanyId: scope.activeCompanyId,
        isGroup: scope.isConsolidated,
        totalCompanies: scope.scopeCompanyIds.length,
      },
    });
  } catch (error) {
    logger.error('Error al obtener conversaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear nueva conversación
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { tenantId, userId, asunto, companyId } = await request.json();

    if (!asunto) {
      return NextResponse.json({ error: 'Asunto requerido' }, { status: 400 });
    }

    // Determine target company
    const targetCompanyId = companyId || session.user.companyId;

    // Verify access to target company
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    if (!scope.scopeCompanyIds.includes(targetCompanyId)) {
      return NextResponse.json({ error: 'No tienes acceso a esta empresa' }, { status: 403 });
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        companyId: targetCompanyId,
        tenantId: tenantId || null,
        userId: userId || session.user.id,
        asunto,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear conversación' },
      { status: 500 }
    );
  }
}
