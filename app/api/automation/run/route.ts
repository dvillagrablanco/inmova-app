/**
 * ENDPOINT PARA EJECUTAR AUTOMATIZACIONES
 * Este endpoint debe ser llamado periódicamente (por ejemplo, por un cron job)
 * para ejecutar las automatizaciones programadas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  contractRenewalService, 
  incidentEscalationService, 
  paymentReminderService 
} from '@/lib/automation-service-simple';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


// Token de seguridad para proteger este endpoint
const AUTOMATION_TOKEN = process.env.AUTOMATION_TOKEN || 'inmova_automation_2024';

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    // Verificar token de autorización
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== AUTOMATION_TOKEN) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId, automations } = body;

    // Si no se especifica compañía, ejecutar para todas
    const companies = companyId 
      ? [await prisma.company.findUnique({ where: { id: companyId } })]
      : await prisma.company.findMany({ where: { activo: true } });

    const results = {
      companies: 0,
      contractRenewals: { notified: 0, renewed: 0, errors: [] as string[] },
      incidentEscalations: { escalated: 0, errors: [] as string[] },
      paymentReminders: { sent: 0, errors: [] as string[] },
      executionTime: 0
    };

    const startTime = Date.now();

    for (const company of companies) {
      if (!company) continue;
      
      results.companies++;
      logger.info(`Ejecutando automatizaciones para empresa: ${company.nombre}`);

      try {
        // Renovación de contratos
        if (!automations || automations.includes('contract_renewal')) {
          const renewalResults = await contractRenewalService.processUpcomingExpirations(company.id);
          results.contractRenewals.notified += renewalResults.notified;
          results.contractRenewals.renewed += renewalResults.renewed;
          results.contractRenewals.errors.push(...renewalResults.errors);
        }

        // Escalado de incidencias
        if (!automations || automations.includes('incident_escalation')) {
          // Obtener admins de la empresa para notificaciones
          const admins = await prisma.user.findMany({
            where: {
              companyId: company.id,
              role: { in: ['super_admin', 'administrador'] },
              activo: true
            }
          });
          const adminIds = admins.map((a: { id: string }) => a.id);

          const escalationResults = await incidentEscalationService.processEscalations(
            company.id,
            { notifyUsers: adminIds, urgentHours: 2, highHours: 12, mediumHours: 48 }
          );
          results.incidentEscalations.escalated += escalationResults.escalated;
          results.incidentEscalations.errors.push(...escalationResults.errors);
        }

        // Recordatorios de pago
        if (!automations || automations.includes('payment_reminders')) {
          const reminderResults = await paymentReminderService.processReminders(company.id);
          results.paymentReminders.sent += reminderResults.sent;
          results.paymentReminders.errors.push(...reminderResults.errors);
        }
      } catch (error) {
        logger.error(`Error procesando automatizaciones para empresa ${company.id}:`, error);
      }
    }

    results.executionTime = Date.now() - startTime;

    logger.info('Automatizaciones ejecutadas:', results);

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error('Error executing automations:', error);
    return NextResponse.json(
      { error: 'Error al ejecutar automatizaciones' },
      { status: 500 }
    );
  }
}

// También permitir GET para ejecución manual (solo con token)
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token !== AUTOMATION_TOKEN) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  // Ejecutar todas las automatizaciones para todas las empresas
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${AUTOMATION_TOKEN}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({})
  });

  return POST(mockRequest as NextRequest);
}
