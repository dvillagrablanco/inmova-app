/**
 * Servicio de Generación de PDFs para Análisis de Inversión
 */

import { InvestmentResults } from './investment-analysis-service';

export interface PDFConfig {
  includeCharts: boolean;
  includeSensitivityAnalysis: boolean;
  includeComparison: boolean;
  language: 'es' | 'en';
  branding: {
    logo?: string;
    companyName?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export class PDFGeneratorService {
  /**
   * Genera PDF del análisis de inversión
   */
  static async generateAnalysisReport(
    analysisId: string,
    userId: string,
    config: Partial<PDFConfig> = {}
  ): Promise<Buffer> {
    const { InvestmentAnalysisService } = require('./investment-analysis-service');
    
    // Obtener análisis
    const analysis = await InvestmentAnalysisService.getAnalysis(analysisId, userId);
    
    if (!analysis) {
      throw new Error('Análisis no encontrado');
    }

    const defaultConfig: PDFConfig = {
      includeCharts: true,
      includeSensitivityAnalysis: true,
      includeComparison: false,
      language: 'es',
      branding: {
        companyName: 'INMOVA',
        colors: {
          primary: '#4F46E5',
          secondary: '#10B981',
        },
      },
      ...config,
    };

    // Generar HTML del reporte
    const html = this.generateReportHTML(analysis, defaultConfig);

    // Convertir a PDF usando puppeteer o similar
    return await this.convertHTMLToPDF(html);
  }

  /**
   * Genera HTML del reporte
   */
  private static generateReportHTML(analysis: any, config: PDFConfig): string {
    const date = new Date().toLocaleDateString('es-ES');
    
    return `
<!DOCTYPE html>
<html lang="${config.language}">
<head>
  <meta charset="UTF-8">
  <title>Análisis de Inversión - ${analysis.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      color: #333;
      line-height: 1.6;
    }
    
    .page {
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      border-bottom: 3px solid ${config.branding.colors?.primary || '#4F46E5'};
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: ${config.branding.colors?.primary || '#4F46E5'};
    }
    
    .report-title {
      font-size: 24px;
      font-weight: bold;
      margin: 20px 0;
      color: #1F2937;
    }
    
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: ${config.branding.colors?.primary || '#4F46E5'};
      margin-bottom: 15px;
      border-left: 4px solid ${config.branding.colors?.primary || '#4F46E5'};
      padding-left: 10px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .metric-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .metric-label {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 5px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1F2937;
    }
    
    .metric-value.positive {
      color: ${config.branding.colors?.secondary || '#10B981'};
    }
    
    .metric-value.negative {
      color: #EF4444;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .data-table th {
      background: #F3F4F6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #E5E7EB;
    }
    
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .data-table tr:hover {
      background: #F9FAFB;
    }
    
    .recommendation-box {
      background: ${this.getRecommendationColor(analysis.recommendation).bg};
      border-left: 4px solid ${this.getRecommendationColor(analysis.recommendation).border};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .recommendation-title {
      font-size: 16px;
      font-weight: bold;
      color: ${this.getRecommendationColor(analysis.recommendation).text};
      margin-bottom: 10px;
    }
    
    .list-item {
      padding: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .list-item:before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${config.branding.colors?.primary || '#4F46E5'};
      font-weight: bold;
    }
    
    .strength {
      color: ${config.branding.colors?.secondary || '#10B981'};
    }
    
    .strength:before {
      content: "✓";
    }
    
    .risk {
      color: #EF4444;
    }
    
    .risk:before {
      content: "⚠";
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #6B7280;
      font-size: 12px;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      .page {
        padding: 20px;
      }
      
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">${config.branding.companyName || 'INMOVA'}</div>
      <div style="text-align: right; color: #6B7280;">
        <div>Análisis de Inversión Inmobiliaria</div>
        <div>${date}</div>
      </div>
    </div>
    
    <!-- Título -->
    <h1 class="report-title">${analysis.name}</h1>
    
    ${analysis.property ? `
    <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Propiedad:</strong> ${analysis.property.titulo}<br>
      <strong>Dirección:</strong> ${analysis.property.direccion}<br>
      <strong>Tipo:</strong> ${analysis.assetType}
    </div>
    ` : ''}
    
    <!-- Recomendación Principal -->
    <div class="recommendation-box">
      <div class="recommendation-title">
        ${this.getRecommendationText(analysis.recommendation)}
      </div>
      <div style="font-size: 14px; color: #4B5563;">
        ${this.getRecommendationDescription(analysis.recommendation)}
      </div>
    </div>
    
    <!-- Métricas Principales -->
    <div class="section">
      <div class="section-title">Métricas Principales</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">ROI Anual</div>
          <div class="metric-value ${analysis.roi >= 10 ? 'positive' : ''}">${analysis.roi.toFixed(2)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cash-on-Cash</div>
          <div class="metric-value ${analysis.cashOnCash >= 8 ? 'positive' : ''}">${analysis.cashOnCash.toFixed(2)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cap Rate</div>
          <div class="metric-value ${analysis.capRate >= 6 ? 'positive' : ''}">${analysis.capRate.toFixed(2)}%</div>
        </div>
      </div>
    </div>
    
    <!-- Inversión -->
    <div class="section">
      <div class="section-title">Inversión Requerida (CAPEX)</div>
      <table class="data-table">
        <tr>
          <td>Precio de Compra</td>
          <td style="text-align: right; font-weight: 600;">€${analysis.purchasePrice.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Notaría y Registro</td>
          <td style="text-align: right;">€${analysis.notaryAndRegistry.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Impuestos (ITP/IVA)</td>
          <td style="text-align: right;">€${analysis.transferTax.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Comisiones de Agencia</td>
          <td style="text-align: right;">€${analysis.agencyFees.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Renovación y Mobiliario</td>
          <td style="text-align: right;">€${(analysis.renovationCosts + analysis.furnitureCosts).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Otros Costos</td>
          <td style="text-align: right;">€${(analysis.initialLegalFees + analysis.otherInitialCosts).toLocaleString()}</td>
        </tr>
        <tr style="background: #F3F4F6; font-weight: bold;">
          <td>TOTAL CAPEX</td>
          <td style="text-align: right;">€${analysis.totalCapex.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <div class="page-break"></div>
    
    <!-- Financiación -->
    ${analysis.isFinanced ? `
    <div class="section">
      <div class="section-title">Financiación</div>
      <table class="data-table">
        <tr>
          <td>Capital Propio</td>
          <td style="text-align: right; font-weight: 600;">€${analysis.downPayment.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Préstamo</td>
          <td style="text-align: right;">€${analysis.loanAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Tasa de Interés</td>
          <td style="text-align: right;">${analysis.interestRate}%</td>
        </tr>
        <tr>
          <td>Plazo</td>
          <td style="text-align: right;">${analysis.loanTerm} años</td>
        </tr>
        <tr>
          <td>LTV (Loan-to-Value)</td>
          <td style="text-align: right;">${analysis.loanToValue.toFixed(1)}%</td>
        </tr>
        <tr style="background: #F3F4F6; font-weight: bold;">
          <td>Cuota Mensual</td>
          <td style="text-align: right;">€${(analysis.mortgagePayment / 12).toFixed(2)}</td>
        </tr>
      </table>
    </div>
    ` : ''}
    
    <!-- Cash Flow -->
    <div class="section">
      <div class="section-title">Análisis de Cash Flow Anual</div>
      <table class="data-table">
        <tr>
          <td>Ingresos Brutos</td>
          <td style="text-align: right; color: ${config.branding.colors?.secondary || '#10B981'};">+€${(analysis.monthlyRent * 12).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Ingresos Efectivos (vacancia ${analysis.vacancyRate}%)</td>
          <td style="text-align: right;">€${(analysis.monthlyRent * 12 * (1 - analysis.vacancyRate / 100)).toLocaleString()}</td>
        </tr>
        <tr style="background: #FEF3C7;">
          <td style="font-weight: 600;">Gastos Operativos (OPEX)</td>
          <td style="text-align: right; color: #D97706; font-weight: 600;">-€${analysis.totalAnnualOpex.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding-left: 30px;">Comunidad</td>
          <td style="text-align: right;">€${(analysis.communityFees * 12).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding-left: 30px;">IBI</td>
          <td style="text-align: right;">€${analysis.propertyTax.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding-left: 30px;">Seguro</td>
          <td style="text-align: right;">€${analysis.insurance.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding-left: 30px;">Mantenimiento</td>
          <td style="text-align: right;">€${(analysis.purchasePrice * analysis.maintenanceRate / 100).toLocaleString()}</td>
        </tr>
        <tr style="background: #DBEAFE;">
          <td style="font-weight: 600;">Net Operating Income (NOI)</td>
          <td style="text-align: right; color: #2563EB; font-weight: 600;">€${analysis.netOperatingIncome.toLocaleString()}</td>
        </tr>
        ${analysis.isFinanced ? `
        <tr>
          <td>Pago Hipoteca</td>
          <td style="text-align: right; color: #DC2626;">-€${analysis.mortgagePayment.toLocaleString()}</td>
        </tr>
        ` : ''}
        <tr>
          <td>Impuestos (IRPF)</td>
          <td style="text-align: right; color: #DC2626;">-€${((analysis.netOperatingIncome - (analysis.mortgagePayment || 0) * 0.5) * analysis.incomeTaxRate / 100).toFixed(0)}</td>
        </tr>
        <tr style="background: #D1FAE5; font-weight: bold;">
          <td>CASH FLOW NETO</td>
          <td style="text-align: right; color: ${analysis.netCashFlow >= 0 ? '#059669' : '#DC2626'};">
            ${analysis.netCashFlow >= 0 ? '+' : ''}€${analysis.netCashFlow.toLocaleString()}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: center; font-size: 12px; color: #6B7280;">
            Cash Flow mensual: €${(analysis.netCashFlow / 12).toFixed(2)}
          </td>
        </tr>
      </table>
    </div>
    
    <div class="page-break"></div>
    
    <!-- Proyección a Largo Plazo -->
    <div class="section">
      <div class="section-title">Proyección a ${analysis.holdingPeriod} Años</div>
      <table class="data-table">
        <tr>
          <td>Valor Actual</td>
          <td style="text-align: right;">€${analysis.purchasePrice.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Valor Futuro (apreciación ${analysis.appreciationRate}% anual)</td>
          <td style="text-align: right; font-weight: 600;">€${analysis.futurePropertyValue.toLocaleString()}</td>
        </tr>
        <tr style="background: #D1FAE5;">
          <td>Ganancia de Capital</td>
          <td style="text-align: right; color: #059669;">+€${(analysis.futurePropertyValue - analysis.purchasePrice).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Cash Flow Acumulado (${analysis.holdingPeriod} años)</td>
          <td style="text-align: right;">+€${(analysis.netCashFlow * analysis.holdingPeriod).toLocaleString()}</td>
        </tr>
        <tr style="background: #F3F4F6; font-weight: bold;">
          <td>RETORNO TOTAL</td>
          <td style="text-align: right; color: #059669;">${analysis.totalReturn.toFixed(1)}%</td>
        </tr>
        <tr>
          <td>TIR (IRR)</td>
          <td style="text-align: right;">${analysis.irr.toFixed(2)}%</td>
        </tr>
        <tr>
          <td>Período de Recuperación</td>
          <td style="text-align: right;">
            ${analysis.paybackPeriod === Infinity ? 'N/A' : `${analysis.paybackPeriod.toFixed(1)} años`}
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Fortalezas y Riesgos -->
    <div class="section">
      <div class="section-title">Análisis de Riesgo</div>
      
      <div style="margin: 20px 0;">
        <strong style="color: ${config.branding.colors?.secondary || '#10B981'};">
          Fortalezas (${analysis.strengths.length})
        </strong>
        ${analysis.strengths.length > 0 ? `
          ${analysis.strengths.map((s: string) => `<div class="list-item strength">${s}</div>`).join('')}
        ` : '<div style="padding: 10px 0; color: #6B7280;">No se identificaron fortalezas destacables</div>'}
      </div>
      
      <div style="margin: 20px 0;">
        <strong style="color: #EF4444;">
          Factores de Riesgo (${analysis.riskFactors.length})
        </strong>
        ${analysis.riskFactors.length > 0 ? `
          ${analysis.riskFactors.map((r: string) => `<div class="list-item risk">${r}</div>`).join('')}
        ` : '<div style="padding: 10px 0; color: #6B7280;">No se identificaron riesgos significativos</div>'}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div>Generado por ${config.branding.companyName || 'INMOVA'} - Sistema de Análisis de Inversión Inmobiliaria</div>
      <div>Fecha de generación: ${date}</div>
      <div style="margin-top: 10px; font-size: 10px;">
        Este análisis es informativo y no constituye asesoramiento financiero. 
        Consulte con un profesional antes de tomar decisiones de inversión.
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Convierte HTML a PDF
   */
  private static async convertHTMLToPDF(html: string): Promise<Buffer> {
    // Opción 1: Usar Puppeteer (requiere instalación)
    try {
      const puppeteer = require('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });
      
      await browser.close();
      
      return pdf;
    } catch (error) {
      console.error('Error generando PDF con Puppeteer:', error);
      
      // Opción 2: Usar html-pdf (fallback)
      try {
        const htmlPdf = require('html-pdf');
        
        return new Promise((resolve, reject) => {
          htmlPdf.create(html, {
            format: 'A4',
            border: {
              top: '20mm',
              right: '15mm',
              bottom: '20mm',
              left: '15mm',
            },
          }).toBuffer((err: any, buffer: Buffer) => {
            if (err) reject(err);
            else resolve(buffer);
          });
        });
      } catch (fallbackError) {
        console.error('Error generando PDF con html-pdf:', fallbackError);
        throw new Error('No se pudo generar el PDF');
      }
    }
  }

  /**
   * Colores según recomendación
   */
  private static getRecommendationColor(recommendation: string) {
    switch (recommendation) {
      case 'excellent':
        return {
          bg: '#D1FAE5',
          border: '#10B981',
          text: '#065F46',
        };
      case 'good':
        return {
          bg: '#DBEAFE',
          border: '#3B82F6',
          text: '#1E40AF',
        };
      case 'acceptable':
        return {
          bg: '#FEF3C7',
          border: '#F59E0B',
          text: '#92400E',
        };
      case 'risky':
        return {
          bg: '#FED7AA',
          border: '#F97316',
          text: '#9A3412',
        };
      case 'not_recommended':
        return {
          bg: '#FEE2E2',
          border: '#EF4444',
          text: '#991B1B',
        };
      default:
        return {
          bg: '#F3F4F6',
          border: '#9CA3AF',
          text: '#374151',
        };
    }
  }

  /**
   * Texto de recomendación
   */
  private static getRecommendationText(recommendation: string): string {
    switch (recommendation) {
      case 'excellent':
        return '⭐ EXCELENTE INVERSIÓN';
      case 'good':
        return '✓ BUENA INVERSIÓN';
      case 'acceptable':
        return '~ INVERSIÓN ACEPTABLE';
      case 'risky':
        return '⚠ INVERSIÓN RIESGOSA';
      case 'not_recommended':
        return '✗ NO RECOMENDADA';
      default:
        return 'INVERSIÓN';
    }
  }

  /**
   * Descripción de recomendación
   */
  private static getRecommendationDescription(recommendation: string): string {
    switch (recommendation) {
      case 'excellent':
        return 'Esta inversión presenta métricas excepcionales, bajo riesgo y alto potencial de retorno. Se recomienda proceder con la adquisición.';
      case 'good':
        return 'Esta es una buena oportunidad de inversión con métricas positivas y riesgo controlado. Se recomienda proceder, considerando los factores de riesgo identificados.';
      case 'acceptable':
        return 'La inversión es aceptable pero presenta algunos riesgos. Se recomienda revisar y optimizar los números antes de proceder.';
      case 'risky':
        return 'Esta inversión presenta riesgos significativos que podrían comprometer la rentabilidad. Se recomienda precaución y análisis adicional.';
      case 'not_recommended':
        return 'Esta inversión NO es recomendable en las condiciones actuales. Los números no son favorables y el riesgo es alto.';
      default:
        return '';
    }
  }

  /**
   * Genera PDF comparativo de múltiples análisis
   */
  static async generateComparisonReport(
    analysisIds: string[],
    userId: string
  ): Promise<Buffer> {
    const { InvestmentAnalysisService } = require('./investment-analysis-service');
    
    const analyses = await Promise.all(
      analysisIds.map(id => InvestmentAnalysisService.getAnalysis(id, userId))
    );

    // Generar HTML comparativo
    const html = this.generateComparisonHTML(analyses.filter(Boolean));
    
    return await this.convertHTMLToPDF(html);
  }

  /**
   * Genera HTML de comparación
   */
  private static generateComparisonHTML(analyses: any[]): string {
    // Implementación similar al reporte individual pero en formato tabla comparativa
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Comparativa de Inversiones</title>
  <style>
    /* Estilos similares al reporte individual */
  </style>
</head>
<body>
  <h1>Comparativa de Inversiones</h1>
  <!-- Tabla comparativa -->
</body>
</html>
    `;
  }
}
