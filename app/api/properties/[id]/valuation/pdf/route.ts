import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/properties/[id]/valuation/pdf
 * Genera un PDF con el informe de valoración
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const propertyId = params.id;

    // Obtener propiedad y última valoración
    const property = await prisma.unit.findUnique({
      where: { id: propertyId },
      include: {
        building: true,
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    if (property.building?.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const latestValuation = await prisma.propertyValuation.findFirst({
      where: { unitId: propertyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestValuation) {
      return NextResponse.json(
        { error: 'No hay valoraciones disponibles para esta propiedad' },
        { status: 404 }
      );
    }

    // Generar HTML para PDF (se puede convertir con puppeteer en producción)
    const html = generateValuationHTML(property, latestValuation, session.user.name || 'Usuario');

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="valoracion-${property.numero}-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error: any) {
    logger.error('[Valuation PDF API Error]:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte de valoración' },
      { status: 500 }
    );
  }
}

function generateValuationHTML(property: any, valuation: any, userName: string): string {
  const date = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Valoración - ${property.numero}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #4F46E5;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .section h2 {
      margin-top: 0;
      color: #1f2937;
      font-size: 20px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .value-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .value-box .label {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .value-box .value {
      color: #4F46E5;
      font-size: 36px;
      font-weight: bold;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .info-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item .label {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-item .value {
      color: #1f2937;
      font-size: 16px;
      font-weight: 600;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .confidence {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      background: #10b981;
      color: white;
    }
    .print-btn {
      background: #4F46E5;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin: 20px 0;
    }
    .print-btn:hover {
      background: #4338CA;
    }
  </style>
</head>
<body>
  <button onclick="window.print()" class="print-btn no-print">🖨️ Imprimir / Guardar PDF</button>
  
  <div class="header">
    <h1>Informe de Valoración Inmobiliaria</h1>
    <p class="subtitle">Propiedad: ${property.numero} - ${property.building.nombre}</p>
    <p class="subtitle">Fecha: ${date}</p>
  </div>

  <div class="section">
    <h2>Información de la Propiedad</h2>
    <div class="grid">
      <div class="info-item">
        <div class="label">Dirección</div>
        <div class="value">${property.building.direccion}</div>
      </div>
      <div class="info-item">
        <div class="label">Superficie</div>
        <div class="value">${property.superficie} m²</div>
      </div>
      <div class="info-item">
        <div class="label">Habitaciones</div>
        <div class="value">${property.habitaciones || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="label">Baños</div>
        <div class="value">${property.banos || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="label">Planta</div>
        <div class="value">${property.planta || 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="value-box">
    <div class="label">Valoración Estimada</div>
    <div class="value">${valuation.estimatedValue.toLocaleString('es-ES')} €</div>
    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
      Rango: ${valuation.minValue.toLocaleString('es-ES')} € - ${valuation.maxValue.toLocaleString('es-ES')} €
    </p>
    <p style="margin: 10px 0 0 0;">
      Confianza: <span class="confidence">${valuation.confidenceScore}%</span>
    </p>
  </div>

  <div class="section">
    <h2>Análisis de Valoración</h2>
    <p><strong>Razonamiento:</strong></p>
    <p>${valuation.reasoning}</p>
    
    <p><strong>Factores Clave:</strong></p>
    <ul>
      ${valuation.keyFactors.map((factor: string) => `<li>${factor}</li>`).join('')}
    </ul>
    
    <p><strong>Potencial de Inversión:</strong> ${valuation.estimatedROI ? `${valuation.estimatedROI}%` : 'N/A'}</p>
  </div>

  ${valuation.recommendations && valuation.recommendations.length > 0 ? `
  <div class="section">
    <h2>Recomendaciones</h2>
    <ul>
      ${valuation.recommendations.map((rec: any) => `
        <li>
          <strong>${rec.improvement}</strong> (${rec.estimatedCost.toLocaleString('es-ES')}€)
          <br><span style="color: #666; font-size: 14px;">
            ROI: ${rec.roi.toFixed(1)}% | Incremento de valor: ${rec.valueIncrease.toLocaleString('es-ES')}€
          </span>
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="section">
    <h2>Comparación de Mercado</h2>
    <div class="grid">
      <div class="info-item">
        <div class="label">Precio por m²</div>
        <div class="value">${valuation.pricePerM2.toLocaleString('es-ES')} €/m²</div>
      </div>
      <div class="info-item">
        <div class="label">Precio Medio Zona</div>
        <div class="value">${(valuation.avgPricePerM2 || 0).toLocaleString('es-ES')} €/m²</div>
      </div>
    </div>
    <p style="margin-top: 15px; color: #666; font-size: 14px;">
      ${valuation.marketTrend ? `Tendencia: ${valuation.marketTrend}` : 'Análisis de mercado no disponible'}
    </p>
  </div>

  <div class="footer">
    <p><strong>INMOVA APP</strong> - Plataforma de Gestión Inmobiliaria</p>
    <p>Este informe ha sido generado automáticamente mediante inteligencia artificial.</p>
    <p>Generado por: ${userName} | Fecha: ${date}</p>
    <p>Modelo: ${valuation.model || 'claude-3.5-sonnet'} | ID: ${valuation.id}</p>
  </div>
</body>
</html>
  `;
}
