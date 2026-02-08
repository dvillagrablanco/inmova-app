/**
 * AI Predictions Service
 * Handles predictive analytics and forecasting
 */

import { AIPrediction } from './types';
import logger from '@/lib/logger';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeEmploymentStatus(status?: string): string {
  return (status || '').toLowerCase();
}

function extractNumeric(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Predict tenant risk
 */
export async function predictTenantRisk(
  tenantData: {
    creditScore?: number;
    employmentStatus?: string;
    rentalHistory?: any[];
    income?: number;
  }
): Promise<AIPrediction> {
  try {
    logger.info('Predicting tenant risk');

    const factors: AIPrediction['factors'] = [];
    let riskScore = 0.5;
    let signalCount = 0;

    if (typeof tenantData.creditScore === 'number') {
      signalCount++;
      if (tenantData.creditScore < 500) riskScore += 0.3;
      else if (tenantData.creditScore < 650) riskScore += 0.15;
      else riskScore -= 0.2;
      factors.push({
        name: 'Credit Score',
        impact: 0.4,
        value: tenantData.creditScore,
      });
    }

    if (tenantData.employmentStatus) {
      signalCount++;
      const status = normalizeEmploymentStatus(tenantData.employmentStatus);
      if (status.includes('desemple')) riskScore += 0.25;
      if (status.includes('temporal')) riskScore += 0.1;
      if (status.includes('indef') || status.includes('full')) riskScore -= 0.15;
      factors.push({
        name: 'Employment',
        impact: 0.3,
        value: tenantData.employmentStatus,
      });
    }

    const historyLength = tenantData.rentalHistory?.length || 0;
    if (historyLength > 0) {
      signalCount++;
      if (historyLength >= 3) riskScore -= 0.1;
      else riskScore += 0.05;
      factors.push({
        name: 'Rental History',
        impact: 0.2,
        value: historyLength,
      });
    }

    if (typeof tenantData.income === 'number') {
      signalCount++;
      if (tenantData.income < 1000) riskScore += 0.2;
      else if (tenantData.income > 2500) riskScore -= 0.15;
      factors.push({
        name: 'Income',
        impact: 0.1,
        value: tenantData.income,
      });
    }

    riskScore = clamp(riskScore, 0, 1);
    const prediction = riskScore > 0.66 ? 'high' : riskScore > 0.33 ? 'medium' : 'low';
    const confidence = clamp(0.3 + signalCount * 0.15, 0, 0.9);

    return {
      prediction,
      confidence,
      factors,
    };
  } catch (error: any) {
    logger.error('Error predicting tenant risk:', error);
    throw error;
  }
}

/**
 * Predict property occupancy
 */
export async function predictOccupancy(
  propertyData: {
    location: string;
    price: number;
    features: string[];
    historicalOccupancy?: number[];
  },
  futureMonths: number = 6
): Promise<AIPrediction> {
  try {
    logger.info('Predicting property occupancy', { futureMonths });

    const history = propertyData.historicalOccupancy || [];
    const average =
      history.length > 0
        ? history.reduce((sum, value) => sum + value, 0) / history.length
        : 0.6;
    const trend =
      history.length >= 2 ? history[history.length - 1] - history[0] : 0;

    const prediction = Array.from({ length: futureMonths }, (_, idx) =>
      clamp(average + (trend * (idx + 1)) / Math.max(history.length, 1), 0, 1)
    );

    const confidence = clamp(0.3 + Math.min(history.length, 6) * 0.1, 0, 0.9);

    return {
      prediction,
      confidence,
      factors: [
        { name: 'Historical Avg', impact: 0.5, value: average.toFixed(2) },
        { name: 'Trend', impact: 0.3, value: trend.toFixed(2) },
        { name: 'Pricing', impact: 0.2, value: propertyData.price },
      ],
    };
  } catch (error: any) {
    logger.error('Error predicting occupancy:', error);
    throw error;
  }
}

/**
 * Predict maintenance costs
 */
export async function predictMaintenanceCosts(
  propertyId: string,
  propertyAge: number,
  maintenanceHistory: any[],
  futureMonths: number = 12
): Promise<AIPrediction> {
  try {
    logger.info('Predicting maintenance costs', { propertyId, futureMonths });

    const costs = (maintenanceHistory || [])
      .map((item: any) => extractNumeric(item?.cost ?? item?.amount ?? item?.monto))
      .filter((value): value is number => value !== null);

    const totalHistorical = costs.reduce((sum, value) => sum + value, 0);
    const avgMonthly =
      costs.length > 0 ? totalHistorical / Math.max(costs.length, 1) : propertyAge * 12;

    const prediction = Math.round(avgMonthly * futureMonths);
    const confidence = clamp(0.25 + Math.min(costs.length, 6) * 0.1, 0, 0.85);

    return {
      prediction,
      confidence,
      factors: [
        { name: 'Property Age', impact: 0.4, value: propertyAge },
        { name: 'Historical Costs', impact: 0.4, value: totalHistorical },
        { name: 'Items Considered', impact: 0.2, value: costs.length },
      ],
    };
  } catch (error: any) {
    logger.error('Error predicting maintenance costs:', error);
    throw error;
  }
}

/**
 * Predict revenue
 */
export async function predictRevenue(
  companyId: string,
  historicalData: any[],
  futureMonths: number = 12
): Promise<AIPrediction> {
  try {
    logger.info('Predicting revenue', { companyId, futureMonths });

    const values = (historicalData || [])
      .map((item: any) => extractNumeric(item?.amount ?? item?.total ?? item))
      .filter((value): value is number => value !== null);

    const avg = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
    const trend =
      values.length >= 2 ? values[values.length - 1] - values[0] : 0;

    const prediction = Array.from({ length: futureMonths }, (_, idx) =>
      Math.round(avg + (trend * (idx + 1)) / Math.max(values.length, 1))
    );

    const confidence = clamp(0.3 + Math.min(values.length, 6) * 0.1, 0, 0.85);

    return {
      prediction,
      confidence,
      factors: [
        { name: 'Historical Avg', impact: 0.5, value: Math.round(avg) },
        { name: 'Trend', impact: 0.3, value: Math.round(trend) },
        { name: 'Data Points', impact: 0.2, value: values.length },
      ],
    };
  } catch (error: any) {
    logger.error('Error predicting revenue:', error);
    throw error;
  }
}
