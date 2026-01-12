import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mapeo de códigos de motivo a texto legible
const REASON_LABELS: Record<string, string> = {
  not_using: 'Ya no usa la aplicación',
  too_expensive: 'Precio demasiado alto',
  found_alternative: 'Encontró otra alternativa',
  missing_features: 'Faltan funciones necesarias',
  too_complicated: 'Demasiado complicada de usar',
  temporary: 'Baja temporal',
  other: 'Otro motivo',
};

/**
 * Notifica a todos los super administradores sobre una baja de usuario
 */
async function notifySuperAdmins(
  user: { id: string; email: string; name: string; companyId: string },
  companyName: string,
  reason: string | null,
  feedback: string | null
) {
  try {
    // Buscar todos los super_admin activos
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'super_admin',
        activo: true,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (superAdmins.length === 0) {
      logger.warn('No super admins found to notify about user deactivation');
      return;
    }

    const reasonText = reason ? (REASON_LABELS[reason] || reason) : 'No especificado';
    const feedbackText = feedback ? `\n\nComentario del usuario: "${feedback}"` : '';

    // Crear notificación para cada super_admin
    const notifications = superAdmins.map((admin) => ({
      companyId: admin.companyId,
      userId: admin.id,
      tipo: 'alerta_sistema' as const,
      titulo: `⚠️ Baja de usuario: ${user.name}`,
      mensaje: `El usuario ${user.name} (${user.email}) de la empresa "${companyName}" se ha dado de baja.\n\n📋 Motivo: ${reasonText}${feedbackText}\n\n💡 Esta información puede ser útil para mejorar la plataforma.`,
      prioridad: 'medio' as const,
      entityId: user.id,
      entityType: 'USER_DEACTIVATION',
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    logger.info('Super admins notified about user deactivation', {
      userId: user.id,
      notifiedCount: superAdmins.length,
    });
  } catch (error) {
    // No fallar la baja si falla la notificación
    logger.error('Error notifying super admins about deactivation:', error);
  }
}

/**
 * POST /api/user/deactivate
 * Permite a cualquier usuario darse de baja de la aplicación
 * Realiza un soft delete (activo = false) para preservar datos históricos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, reason, feedback } = body;

    // Validar que se proporcionó la contraseña
    if (!password) {
      return NextResponse.json(
        { error: 'Debes confirmar tu contraseña para darte de baja' },
        { status: 400 }
      );
    }

    // Buscar usuario actual
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        company: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 400 }
      );
    }

    // No permitir que un super_admin se dé de baja directamente
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Los super administradores deben contactar con soporte para darse de baja' },
        { status: 403 }
      );
    }

    // Verificar si es el único administrador de la empresa
    if (user.role === 'administrador') {
      const adminCount = await prisma.user.count({
        where: {
          companyId: user.companyId,
          role: 'administrador',
          activo: true,
          id: { not: user.id },
        },
      });

      if (adminCount === 0) {
        return NextResponse.json(
          { 
            error: 'Eres el único administrador de esta empresa. Debes asignar otro administrador antes de darte de baja o contactar con soporte.',
            code: 'LAST_ADMIN'
          },
          { status: 400 }
        );
      }
    }

    // Registrar la baja en audit log antes de desactivar
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_DEACTIVATION_REQUEST',
        entityType: 'USER',
        entityId: user.id,
        details: {
          reason: reason || 'No especificado',
          reasonLabel: reason ? (REASON_LABELS[reason] || reason) : 'No especificado',
          feedback: feedback || null,
          email: user.email,
          userName: user.name,
          companyId: user.companyId,
          companyName: user.company?.nombre || 'Empresa desconocida',
          deactivatedAt: new Date().toISOString(),
        },
      },
    });

    // Soft delete: Desactivar usuario
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activo: false,
        // Limpiar datos sensibles opcionales
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidar suscripciones push del usuario
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id },
    });

    // 🔔 Notificar a los super administradores sobre la baja
    await notifySuperAdmins(
      { id: user.id, email: user.email, name: user.name, companyId: user.companyId },
      user.company?.nombre || 'Empresa desconocida',
      reason,
      feedback
    );

    logger.info('User deactivated successfully', {
      userId: user.id,
      email: user.email,
      reason: reason || 'No especificado',
    });

    return NextResponse.json({
      success: true,
      message: 'Tu cuenta ha sido desactivada correctamente. Lamentamos verte partir.',
    });
  } catch (error: any) {
    logger.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Error al procesar la baja. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/deactivate
 * Obtiene información sobre el proceso de baja
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        companyId: true,
        activo: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si es el único admin
    let isLastAdmin = false;
    if (user.role === 'administrador') {
      const adminCount = await prisma.user.count({
        where: {
          companyId: user.companyId,
          role: 'administrador',
          activo: true,
          id: { not: user.id },
        },
      });
      isLastAdmin = adminCount === 0;
    }

    return NextResponse.json({
      canDeactivate: user.role !== 'super_admin' && !isLastAdmin,
      isLastAdmin,
      isSuperAdmin: user.role === 'super_admin',
      message: user.role === 'super_admin' 
        ? 'Los super administradores deben contactar con soporte'
        : isLastAdmin 
          ? 'Debes asignar otro administrador antes de darte de baja'
          : null,
    });
  } catch (error: any) {
    logger.error('Error checking deactivation status:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado' },
      { status: 500 }
    );
  }
}
