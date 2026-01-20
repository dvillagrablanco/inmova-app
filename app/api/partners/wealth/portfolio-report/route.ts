/**
 * API: Reporting de Portfolio para Family Offices
 * 
 * GET /api/partners/wealth/portfolio-report
 * 
 * Genera reportes financieros profesionales para gestores de patrimonio
 * con métricas avanzadas de inversión inmobiliaria.
 * 
 * Modelo de negocio:
 * - Licencia White-Label: €500-2000/mes para Inmova
 * - % sobre AUM gestionado: 0.05-0.1% anual para Inmova
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-partners';

// Verificar token de partner
function verifyPartnerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
  } catch {
    return null;
  }
}

// Schema de parámetros
const reportParamsSchema = z.object({
  companyId: z.string().optional(), // Si es para un cliente específico
  period: z.enum(['month', 'quarter', 'year', 'ytd', 'all']).default('year'),
  includeProjections: z.boolean().default(true),
  includeBenchmark: z.boolean().default(true),
  currency: z.enum(['EUR', 'USD']).default('EUR'),
});

// Calcular métricas de inversión
function calculateInvestmentMetrics(properties: any[]) {
  const totalValue = properties.reduce((sum, p) => sum + (p.valorActual || 0), 0);
  const totalCost = properties.reduce((sum, p) => sum + (p.precioCompra || 0), 0);
  const annualRent = properties.reduce((sum, p) => sum + ((p.rentaMensual || 0) * 12), 0);
  const annualExpenses = properties.reduce((sum, p) => sum + ((p.gastosAnuales || 0)), 0);
  
  // ROI
  const totalGain = totalValue - totalCost;
  const roi = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  
  // Yield (rentabilidad bruta)
  const grossYield = totalValue > 0 ? (annualRent / totalValue) * 100 : 0;
  
  // Net Yield (rentabilidad neta)
  const netIncome = annualRent - annualExpenses;
  const netYield = totalValue > 0 ? (netIncome / totalValue) * 100 : 0;
  
  // Cash-on-Cash (sobre capital invertido)
  const cashOnCash = totalCost > 0 ? (netIncome / totalCost) * 100 : 0;
  
  // Cap Rate
  const noi = netIncome; // NOI simplificado
  const capRate = totalValue > 0 ? (noi / totalValue) * 100 : 0;
  
  return {
    totalValue,
    totalCost,
    totalGain,
    roi: Math.round(roi * 100) / 100,
    annualRent,
    annualExpenses,
    netIncome,
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    cashOnCash: Math.round(cashOnCash * 100) / 100,
    capRate: Math.round(capRate * 100) / 100,
  };
}

// Generar proyecciones a futuro
function generateProjections(metrics: any, years: number = 5) {
  const projections = [];
  const annualAppreciation = 0.03; // 3% anual estimado
  const rentGrowth = 0.02; // 2% anual en rentas
  
  for (let year = 1; year <= years; year++) {
    const projectedValue = metrics.totalValue * Math.pow(1 + annualAppreciation, year);
    const projectedRent = metrics.annualRent * Math.pow(1 + rentGrowth, year);
    const projectedExpenses = metrics.annualExpenses * Math.pow(1 + 0.015, year); // 1.5% inflación gastos
    const projectedNetIncome = projectedRent - projectedExpenses;
    
    projections.push({
      year,
      projectedValue: Math.round(projectedValue),
      projectedRent: Math.round(projectedRent),
      projectedNetIncome: Math.round(projectedNetIncome),
      projectedYield: Math.round((projectedNetIncome / projectedValue) * 10000) / 100,
      cumulativeGain: Math.round(projectedValue - metrics.totalCost),
    });
  }
  
  return projections;
}

// Benchmark de mercado
function getMarketBenchmark() {
  return {
    averageYield: 4.5, // Rentabilidad media mercado español
    averageCapRate: 4.2,
    priceGrowthYTD: 5.2, // Crecimiento precios YTD
    rentGrowthYTD: 3.8,
    vacancyRate: 5.5, // Tasa de vacío media
    indices: {
      ibex35YTD: 12.5,
      eurostoxx50YTD: 8.3,
      bonos10y: 3.2,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de partner
    const decoded = verifyPartnerToken(request);
    if (!decoded?.partnerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const params = reportParamsSchema.parse({
      companyId: searchParams.get('companyId'),
      period: searchParams.get('period') || 'year',
      includeProjections: searchParams.get('includeProjections') !== 'false',
      includeBenchmark: searchParams.get('includeBenchmark') !== 'false',
      currency: searchParams.get('currency') || 'EUR',
    });
    
    // Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    
    // Verificar que el partner tiene acceso
    const partner = await prisma.partner.findUnique({
      where: { id: decoded.partnerId },
      select: { id: true, tipo: true, estado: true },
    });
    
    if (!partner || partner.estado !== 'ACTIVE') {
      return NextResponse.json({ error: 'Partner no activo' }, { status: 403 });
    }
    
    // Obtener clientes del partner
    const whereClause: any = { partnerId: decoded.partnerId };
    if (params.companyId) {
      whereClause.companyId = params.companyId;
    }
    
    const partnerClients = await prisma.partnerClient.findMany({
      where: whereClause,
      include: {
        company: {
          include: {
            buildings: {
              include: {
                units: true,
              },
            },
          },
        },
      },
    });
    
    if (partnerClients.length === 0) {
      return NextResponse.json({
        error: 'No se encontraron clientes',
        portfolios: [],
      });
    }
    
    // Generar reporte por cada cliente/portfolio
    const portfolios = partnerClients.map(client => {
      const company = client.company;
      const buildings = company.buildings || [];
      
      // Simular datos de propiedades (en producción vendrían de la BD)
      const properties = buildings.flatMap(b => 
        (b.units || []).map(u => ({
          id: u.id,
          name: `${b.nombre} - ${u.numero}`,
          type: u.tipo,
          status: u.estado,
          rentaMensual: Number(u.rentaMensual) || 0,
          valorActual: Number(u.rentaMensual) * 12 * 15 || 100000, // Estimación
          precioCompra: Number(u.rentaMensual) * 12 * 12 || 80000, // Estimación
          gastosAnuales: Number(u.rentaMensual) * 12 * 0.15 || 0, // 15% gastos
          ocupacion: u.estado === 'ocupada' ? 100 : 0,
        }))
      );
      
      const metrics = calculateInvestmentMetrics(properties);
      
      return {
        clientId: company.id,
        clientName: company.nombre,
        properties: properties.length,
        metrics,
        projections: params.includeProjections ? generateProjections(metrics) : undefined,
        propertyBreakdown: properties.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          status: p.status,
          value: p.valorActual,
          monthlyRent: p.rentaMensual,
          yield: p.valorActual > 0 ? Math.round((p.rentaMensual * 12 / p.valorActual) * 10000) / 100 : 0,
        })),
      };
    });
    
    // Consolidar métricas totales
    const allProperties = portfolios.flatMap(p => p.propertyBreakdown);
    const consolidatedMetrics = calculateInvestmentMetrics(
      allProperties.map(p => ({
        valorActual: p.value,
        precioCompra: p.value * 0.85, // Estimación
        rentaMensual: p.monthlyRent,
        gastosAnuales: p.monthlyRent * 12 * 0.15,
      }))
    );
    
    // Benchmark de mercado
    const benchmark = params.includeBenchmark ? getMarketBenchmark() : undefined;
    
    // Comparación con benchmark
    const benchmarkComparison = benchmark ? {
      yieldVsMarket: Math.round((consolidatedMetrics.netYield - benchmark.averageYield) * 100) / 100,
      performance: consolidatedMetrics.netYield > benchmark.averageYield ? 'above' : 'below',
      percentile: consolidatedMetrics.netYield > benchmark.averageYield + 1 ? 'top25' :
                  consolidatedMetrics.netYield > benchmark.averageYield ? 'top50' : 'bottom50',
    } : undefined;
    
    const report = {
      // Metadata
      reportInfo: {
        generatedAt: new Date().toISOString(),
        period: params.period,
        currency: params.currency,
        partnerId: decoded.partnerId,
        totalClients: portfolios.length,
        totalProperties: allProperties.length,
      },
      
      // Resumen ejecutivo
      executiveSummary: {
        totalAUM: consolidatedMetrics.totalValue,
        totalIncome: consolidatedMetrics.netIncome,
        portfolioYield: consolidatedMetrics.netYield,
        roi: consolidatedMetrics.roi,
        occupancyRate: allProperties.filter(p => p.status === 'ocupada').length / allProperties.length * 100 || 0,
      },
      
      // Métricas consolidadas
      consolidatedMetrics,
      
      // Proyecciones consolidadas
      consolidatedProjections: params.includeProjections 
        ? generateProjections(consolidatedMetrics, 5) 
        : undefined,
      
      // Benchmark
      benchmark,
      benchmarkComparison,
      
      // Detalle por portfolio
      portfolios,
      
      // Distribución por tipo de activo
      assetAllocation: {
        byType: Object.entries(
          allProperties.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + p.value;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, value]) => ({
          type,
          value,
          percentage: Math.round((value as number) / consolidatedMetrics.totalValue * 10000) / 100,
        })),
        byStatus: {
          ocupadas: allProperties.filter(p => p.status === 'ocupada').length,
          disponibles: allProperties.filter(p => p.status === 'disponible').length,
          otros: allProperties.filter(p => !['ocupada', 'disponible'].includes(p.status)).length,
        },
      },
      
      // Recomendaciones
      recommendations: [
        consolidatedMetrics.netYield < 4 
          ? 'Considerar optimizar rentas o reducir gastos operativos'
          : null,
        allProperties.filter(p => p.status === 'disponible').length > allProperties.length * 0.1
          ? 'Tasa de vacío superior al 10%. Revisar estrategia de comercialización'
          : null,
        consolidatedMetrics.cashOnCash < 6
          ? 'Rentabilidad sobre capital invertido por debajo del objetivo. Evaluar apalancamiento'
          : null,
      ].filter(Boolean),
    };
    
    logger.info('[WealthReport] Reporte generado', {
      partnerId: decoded.partnerId,
      clients: portfolios.length,
      properties: allProperties.length,
      aum: consolidatedMetrics.totalValue,
    });
    
    return NextResponse.json(report);
    
  } catch (error: any) {
    logger.error('[WealthReport] Error:', error);
    return NextResponse.json(
      { error: 'Error generando reporte' },
      { status: 500 }
    );
  }
}
