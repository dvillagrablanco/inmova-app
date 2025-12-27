/**
 * API: Enviar Email de Onboarding
 * 
 * Permite enviar un email específico de onboarding
 * Puede ser inmediato o programado para el futuro
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendOnboardingEmail, EmailType } from '@/lib/onboarding-email-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface SendEmailRequest {
  type: EmailType;
  templateData?: Record<string, any>;
  scheduledFor?: string; // ISO date string
}

/**
 * POST /api/onboarding/emails/send
 * 
 * Body:
 * {
 *   type: 'welcome' | 'onboarding_reminder' | etc.,
 *   templateData: { ... },
 *   scheduledFor: '2024-12-21T10:00:00Z' // opcional
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: SendEmailRequest = await req.json();
    const { type, templateData = {}, scheduledFor } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'El campo "type" es requerido' },
        { status: 400 }
      );
    }

    // Validar tipo de email
    const validTypes: EmailType[] = [
      'welcome',
      'onboarding_reminder',
      'task_completed',
      'onboarding_completed',
      'building_created',
      'first_contract',
      'milestone_achieved',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipo de email inválido. Tipos válidos: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Parsear fecha si se proporciona
    let scheduledDate: Date | undefined;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Fecha inválida en scheduledFor' },
          { status: 400 }
        );
      }
    }

    // Enviar email
    const result = await sendOnboardingEmail({
      userId: session.user.id,
      companyId: session.user.companyId,
      type,
      templateData,
      scheduledFor: scheduledDate,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: scheduledDate 
          ? `Email programado para ${scheduledDate.toISOString()}`
          : 'Email enviado exitosamente',
        emailLogId: result.emailLogId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Error en /api/onboarding/emails/send:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
