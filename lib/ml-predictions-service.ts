/**
 * Servicio de ML Predictions
 * 
 * Predicciones con Machine Learning para analytics avanzados:
 * - Predicción de churn (cancelaciones)
 * - Forecast de ingresos
 * - Demand forecasting (ocupación)
 * - Anomaly detection
 * 
 * Usa históricos + Anthropic Claude para análisis
 * 
 * @module MLPredictionsService
 */

import { prisma } from './db';
import { Anthropic } from '@anthropic-ai/sdk';
import logger from './logger';
import { redis } from './redis';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// TIPOS
// ============================================================================

export interface ChurnPrediction {
  userId: string;
  churnProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  predictedChurnDate: Date | null;
  reasons: string[];
  retentionActions: string[];
}

export interface RevenueForecast {
  period: string; // '2026-02', '2026-Q1', etc
  predictedRevenue: number;
  confidence: number; // 0-1
  trend: 'up' | 'down' | 'stable';
  breakdown: {
    subscriptions: number;
    commissions: number;
    addons: number;
  };
}

export interface OccupancyForecast {
  propertyId?: string;
  companyId: string;
  nextMonth: number; // %
  nextQuarter: number; // %
  confidence: number;
  recommendations: string[];
}

export interface AnomalyDetection {
  type: 'revenue' | 'usage' | 'performance';
  severity: 'low' | 'medium' | 'high';
  detected: Date;
  description: string;
  expectedValue: number;
  actualValue: number;
  deviation: number; // %
}

// ============================================================================
// CHURN PREDICTION
// ============================================================================

/**
 * Predice la probabilidad de churn de un usuario
 */
export async function predictChurn(userId: string): Promise<ChurnPrediction> {
  try {
    // Cache check
    const cacheKey = `churn:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Métricas de engagement
    const loginCount = await prisma.auditLog.count({
      where: {
        userId,
        action: 'USER_LOGIN',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const apiUsage = await prisma.aIUsageLog.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const lastLogin = await prisma.auditLog.findFirst({
      where: { userId, action: 'USER_LOGIN' },
      orderBy: { createdAt: 'desc' },
    });

    const daysSinceLastLogin = lastLogin
      ? Math.floor((Date.now() - lastLogin.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Analizar con IA
    const prompt = `Analiza el riesgo de churn de este usuario:

Usuario: ${user.name} (${user.email})
Empresa: ${user.company.nombre || user.company.name}
Plan: ${user.company.subscription?.stripePriceId || 'Free'}
Registrado: ${user.createdAt}

Actividad (últimos 30 días):
- Logins: ${loginCount}
- API Usage: ${apiUsage}
- Último login: hace ${daysSinceLastLogin} días

Responde en JSON:
{
  "churnProbability": number (0-1),
  "riskLevel": "low" | "medium" | "high",
  "predictedChurnDate": "YYYY-MM-DD" o null,
  "reasons": ["razón1", "razón2"],
  "retentionActions": ["acción1", "acción2"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const prediction: ChurnPrediction = JSON.parse(content.text);
    prediction.userId = userId;

    // Cache por 24h
    await redis.setex(cacheKey, 86400, JSON.stringify(prediction));

    logger.info('✅ Churn prediction generated', { userId, riskLevel: prediction.riskLevel });

    return prediction;
  } catch (error: any) {
    logger.error('❌ Error predicting churn:', error);
    throw error;
  }
}

/**
 * Predice churn para todos los usuarios de una empresa
 */
export async function predictChurnBatch(companyId: string): Promise<ChurnPrediction[]> {
  const users = await prisma.user.findMany({
    where: { companyId },
    select: { id: true },
  });

  const predictions = await Promise.all(
    users.map((user) => predictChurn(user.id).catch(() => null))
  );

  return predictions.filter((p): p is ChurnPrediction => p !== null);
}

// ============================================================================
// REVENUE FORECAST
// ============================================================================

/**
 * Forecast de ingresos para próximos períodos
 */
export async function forecastRevenue(companyId: string, periods: number = 3): Promise<RevenueForecast[]> {
  try {
    // Obtener histórico de ingresos (últimos 12 meses)
    const historicalData = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as period,
        SUM(amount) as revenue,
        COUNT(*) as transaction_count
      FROM "Payment"
      WHERE "companyId" = ${companyId}
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period
    `;

    if (historicalData.length < 3) {
      return []; // Insuficientes datos
    }

    // Analizar tendencia con IA
    const prompt = `Analiza estos datos históricos de ingresos y genera forecast:

${JSON.stringify(historicalData, null, 2)}

Genera forecast para los próximos ${periods} meses.
Responde en JSON array:
[
  {
    "period": "YYYY-MM",
    "predictedRevenue": number,
    "confidence": number (0-1),
    "trend": "up" | "down" | "stable",
    "breakdown": {
      "subscriptions": number,
      "commissions": number,
      "addons": number
    }
  }
]`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const forecasts: RevenueForecast[] = JSON.parse(content.text);

    logger.info('✅ Revenue forecast generated', { companyId, periods });

    return forecasts;
  } catch (error: any) {
    logger.error('❌ Error forecasting revenue:', error);
    throw error;
  }
}

// ============================================================================
// OCCUPANCY FORECAST
// ============================================================================

/**
 * Predice ocupación futura de propiedades
 */
export async function forecastOccupancy(companyId: string): Promise<OccupancyForecast> {
  try {
    // Histórico de ocupación
    const properties = await prisma.property.findMany({
      where: { companyId },
      include: {
        contracts: {
          where: {
            status: { in: ['ACTIVE', 'EXPIRED'] },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    const totalProperties = properties.length;
    const currentlyOccupied = properties.filter(
      (p) => p.contracts.some((c) => c.status === 'ACTIVE')
    ).length;

    const currentOccupancy = totalProperties > 0
      ? (currentlyOccupied / totalProperties) * 100
      : 0;

    // Histórico (últimos 12 meses)
    const monthlyOccupancy = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return prisma.contract.count({
          where: {
            property: { companyId },
            status: 'ACTIVE',
            startDate: { lte: date },
            endDate: { gte: date },
          },
        });
      })
    ).then((counts) => counts.map((c) => (c / totalProperties) * 100));

    // Analizar con IA
    const prompt = `Analiza el histórico de ocupación y predice próximos meses:

Total propiedades: ${totalProperties}
Ocupación actual: ${currentOccupancy.toFixed(1)}%

Histórico (últimos 12 meses): ${monthlyOccupancy.map((o) => o.toFixed(1) + '%').join(', ')}

Responde en JSON:
{
  "nextMonth": number (% occupancy),
  "nextQuarter": number (% occupancy average),
  "confidence": number (0-1),
  "recommendations": ["recomendación1", "recomendación2"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const forecast = JSON.parse(content.text);
    forecast.companyId = companyId;

    return forecast;
  } catch (error: any) {
    logger.error('❌ Error forecasting occupancy:', error);
    throw error;
  }
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detecta anomalías en métricas clave
 */
export async function detectAnomalies(companyId: string): Promise<AnomalyDetection[]> {
  try {
    const anomalies: AnomalyDetection[] = [];

    // 1. Revenue anomalies
    const lastMonthRevenue = await prisma.payment.aggregate({
      where: {
        companyId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { amount: true },
    });

    const previousMonthRevenue = await prisma.payment.aggregate({
      where: {
        companyId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { amount: true },
    });

    const lastRev = lastMonthRevenue._sum.amount || 0;
    const prevRev = previousMonthRevenue._sum.amount || 0;

    if (prevRev > 0) {
      const change = ((lastRev - prevRev) / prevRev) * 100;
      
      if (Math.abs(change) > 30) {
        anomalies.push({
          type: 'revenue',
          severity: Math.abs(change) > 50 ? 'high' : 'medium',
          detected: new Date(),
          description: `Revenue cambió ${change > 0 ? '+' : ''}${change.toFixed(1)}% vs mes anterior`,
          expectedValue: prevRev,
          actualValue: lastRev,
          deviation: change,
        });
      }
    }

    // 2. Usage anomalies (API calls)
    const recentUsage = await prisma.aIUsageLog.count({
      where: {
        user: { companyId },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const previousUsage = await prisma.aIUsageLog.count({
      where: {
        user: { companyId },
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (previousUsage > 0) {
      const change = ((recentUsage - previousUsage) / previousUsage) * 100;
      
      if (Math.abs(change) > 50) {
        anomalies.push({
          type: 'usage',
          severity: Math.abs(change) > 80 ? 'high' : 'medium',
          detected: new Date(),
          description: `Uso de IA cambió ${change > 0 ? '+' : ''}${change.toFixed(1)}% vs semana anterior`,
          expectedValue: previousUsage,
          actualValue: recentUsage,
          deviation: change,
        });
      }
    }

    logger.info('✅ Anomaly detection completed', { companyId, anomalies: anomalies.length });

    return anomalies;
  } catch (error: any) {
    logger.error('❌ Error detecting anomalies:', error);
    return [];
  }
}

export default {
  predictChurn,
  predictChurnBatch,
  forecastRevenue,
  forecastOccupancy,
  detectAnomalies,
};
