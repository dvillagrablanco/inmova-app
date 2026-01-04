/**
 * API Route: Obtener Uso Actual
 * GET /api/usage/current
 * 
 * Retorna el uso mensual actual de la empresa
 * para mostrar en dashboard
 * 
 * Auth: Requiere sesión activa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMonthlyUsage } from '@/lib/usage-tracking-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/usage/current
 * 
 * Response:
 * {
 *   success: true,
 *   usage: MonthlyUsage
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Obtener uso mensual
    const usage = await getMonthlyUsage(session.user.companyId);

    // 3. Calcular porcentajes
    const percentages = {
      signatures: usage.planSignaturesLimit ? Math.round((usage.signaturesUsed / usage.planSignaturesLimit) * 100) : 0,
      storage: usage.planStorageLimit ? Math.round((usage.storageUsedGB / usage.planStorageLimit) * 100) : 0,
      aiTokens: usage.planAITokensLimit ? Math.round((usage.aiTokensUsed / usage.planAITokensLimit) * 100) : 0,
      sms: usage.planSMSLimit ? Math.round((usage.smsUsed / usage.planSMSLimit) * 100) : 0,
    };

    // 4. Respuesta
    return NextResponse.json({
      success: true,
      usage: {
        period: usage.period,
        
        // Signaturit
        signatures: {
          used: usage.signaturesUsed,
          limit: usage.planSignaturesLimit || 0,
          percentage: percentages.signatures,
          cost: usage.signaturesCost,
        },
        
        // AWS S3
        storage: {
          used: Math.round(usage.storageUsedGB * 100) / 100,
          limit: usage.planStorageLimit || 0,
          percentage: percentages.storage,
          cost: usage.storageCost,
          unit: 'GB',
        },
        
        // Claude IA
        aiTokens: {
          used: usage.aiTokensUsed,
          limit: usage.planAITokensLimit || 0,
          percentage: percentages.aiTokens,
          cost: usage.aiCost,
        },
        
        // Twilio (futuro)
        sms: {
          used: usage.smsUsed,
          limit: usage.planSMSLimit || 0,
          percentage: percentages.sms,
          cost: usage.smsCost,
        },
        
        // Totales
        totalCost: usage.totalCost,
        overageCost: usage.overageCost,
        
        // Warnings
        warnings: [
          percentages.signatures >= 80 && { service: 'signatures', percentage: percentages.signatures },
          percentages.storage >= 80 && { service: 'storage', percentage: percentages.storage },
          percentages.aiTokens >= 80 && { service: 'aiTokens', percentage: percentages.aiTokens },
          percentages.sms >= 80 && { service: 'sms', percentage: percentages.sms },
        ].filter(Boolean),
      },
    });
  } catch (error: any) {
    console.error('[API Usage Current] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo uso actual' },
      { status: 500 }
    );
  }
}
