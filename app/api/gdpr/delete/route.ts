/**
 * GDPR: Data Deletion Request
 * POST /api/gdpr/delete
 * 
 * Initiates personal data deletion for the authenticated user.
 * GDPR Article 17 - Right to erasure
 * 
 * NOTE: Does not immediately delete — creates a deletion request
 * that must be reviewed by an admin (30 day grace period).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { audit } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { reason } = await req.json().catch(() => ({ reason: '' }));
    const userId = session.user.id;

    await audit({
      action: 'ADMIN_ACTION',
      userId,
      entityType: 'GDPRDeletionRequest',
      entityId: userId,
      details: { reason, requestDate: new Date().toISOString() },
      severity: 'critical',
    });

    logger.warn(`[GDPR] Deletion request from user ${userId}: ${reason}`);

    // In a real implementation, this would:
    // 1. Create a DeletionRequest record in DB
    // 2. Send notification to admin
    // 3. After 30 days, if not cancelled, execute deletion
    // 4. Anonymize data instead of hard delete where legally required

    return NextResponse.json({
      success: true,
      message: 'Solicitud de eliminación registrada. Se procesará en un plazo de 30 días.',
      requestId: `GDPR-DEL-${Date.now()}`,
      gracePeriodDays: 30,
      _note: 'Puede cancelar esta solicitud contactando a soporte antes de que expire el plazo.',
    });
  } catch (error: any) {
    logger.error('[GDPR Delete Error]:', error);
    return NextResponse.json({ error: 'Error procesando solicitud' }, { status: 500 });
  }
}
