/**
 * API: /api/finanzas/conciliacion/auto-match
 * 
 * POST - Auto-concilia transacciones pendientes usando IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

interface MatchSuggestion {
  transactionId: string;
  paymentId: string;
  confidence: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { applyMatches = false } = await request.json();

    // 1. Obtener transacciones pendientes (solo ingresos)
    const pendingTransactions = await prisma.bankTransaction.findMany({
      where: {
        companyId,
        estado: 'pendiente_revision',
        monto: { gt: 0 } // Solo ingresos
      },
      orderBy: { fecha: 'desc' },
      take: 50
    });

    if (pendingTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        matched: 0,
        suggestions: [],
        message: 'No hay transacciones pendientes para conciliar'
      });
    }

    // 2. Obtener pagos pendientes
    const pendingPayments = await prisma.payment.findMany({
      where: {
        contract: {
          property: { companyId }
        },
        estado: { in: ['pendiente', 'atrasado'] },
        bankTransactions: { none: {} }
      },
      include: {
        contract: {
          select: {
            tenant: {
              select: { nombre: true, apellidos: true }
            },
            property: {
              select: { nombre: true, direccion: true }
            }
          }
        }
      },
      take: 100
    });

    if (pendingPayments.length === 0) {
      return NextResponse.json({
        success: true,
        matched: 0,
        suggestions: [],
        message: 'No hay pagos pendientes para conciliar'
      });
    }

    // 3. Encontrar coincidencias usando algoritmo básico + IA opcional
    const suggestions: MatchSuggestion[] = [];

    // Algoritmo básico: coincidencia por monto exacto o aproximado
    for (const tx of pendingTransactions) {
      // Buscar pago con monto exacto
      let matchedPayment = pendingPayments.find(p => 
        Math.abs(p.monto - tx.monto) < 0.01 && 
        !suggestions.some(s => s.paymentId === p.id)
      );

      if (matchedPayment) {
        // Calcular confianza basada en criterios
        let confidence = 80; // Base por monto exacto
        
        // Bonus por referencia/descripción
        const txDesc = tx.descripcion.toLowerCase();
        const txRef = tx.referencia?.toLowerCase() || '';
        const tenantName = matchedPayment.contract?.tenant 
          ? `${matchedPayment.contract.tenant.nombre} ${matchedPayment.contract.tenant.apellidos}`.toLowerCase()
          : '';
        const propertyName = (matchedPayment.contract?.property?.nombre || 
                            matchedPayment.contract?.property?.direccion || '').toLowerCase();
        
        if (tenantName && (txDesc.includes(tenantName.split(' ')[0]) || txRef.includes(tenantName.split(' ')[0]))) {
          confidence += 10;
        }
        if (txDesc.includes('alquiler') || txDesc.includes('mensualidad') || txRef.includes('alquiler')) {
          confidence += 5;
        }
        
        // Verificar proximidad de fechas
        const txDate = new Date(tx.fecha);
        const dueDate = new Date(matchedPayment.fechaVencimiento);
        const daysDiff = Math.abs((txDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 5) confidence += 5;

        suggestions.push({
          transactionId: tx.id,
          paymentId: matchedPayment.id,
          confidence: Math.min(confidence, 100),
          reason: `Coincidencia por monto exacto (${tx.monto}€)` + 
                  (tenantName ? ` - Posible inquilino: ${matchedPayment.contract?.tenant?.nombre}` : '')
        });
      }
    }

    // 4. Opcional: Usar IA para mejorar las sugerencias
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey.length > 10 && suggestions.length < pendingTransactions.length) {
      try {
        // Solo para transacciones sin coincidencia exacta
        const unmatchedTxs = pendingTransactions.filter(
          tx => !suggestions.some(s => s.transactionId === tx.id)
        );
        
        if (unmatchedTxs.length > 0 && pendingPayments.length > 0) {
          const anthropic = new Anthropic({ apiKey });
          
          const prompt = `Analiza estas transacciones bancarias y pagos pendientes para encontrar coincidencias.

TRANSACCIONES BANCARIAS SIN CONCILIAR:
${unmatchedTxs.slice(0, 10).map(tx => 
  `- ID: ${tx.id}, Fecha: ${tx.fecha.toISOString().split('T')[0]}, Monto: ${tx.monto}€, Descripción: "${tx.descripcion}", Referencia: "${tx.referencia || '-'}"`
).join('\n')}

PAGOS PENDIENTES:
${pendingPayments.filter(p => !suggestions.some(s => s.paymentId === p.id)).slice(0, 10).map(p => 
  `- ID: ${p.id}, Monto: ${p.monto}€, Vencimiento: ${p.fechaVencimiento.toISOString().split('T')[0]}, Inquilino: "${p.contract?.tenant?.nombre || '-'} ${p.contract?.tenant?.apellidos || ''}", Propiedad: "${p.contract?.property?.nombre || p.contract?.property?.direccion || '-'}"`
).join('\n')}

Encuentra coincidencias probables basándote en:
1. Monto similar (diferencia menor a 5%)
2. Nombre del inquilino en la descripción o referencia
3. Cercanía de fechas

Responde SOLO en formato JSON:
{
  "matches": [
    {"transactionId": "xxx", "paymentId": "yyy", "confidence": 75, "reason": "explicación breve"}
  ]
}

Si no hay coincidencias probables, responde: {"matches": []}`;

          const message = await anthropic.messages.create({
            model: DEFAULT_MODEL,
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }]
          });

          const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const aiSuggestions = JSON.parse(jsonMatch[0]);
            if (Array.isArray(aiSuggestions.matches)) {
              suggestions.push(...aiSuggestions.matches.filter((s: MatchSuggestion) => 
                s.confidence >= 60 && 
                !suggestions.some(existing => existing.transactionId === s.transactionId)
              ));
            }
          }
        }
      } catch (aiError) {
        logger.warn('Error en análisis IA de conciliación:', aiError);
        // Continuar sin IA
      }
    }

    // 5. Aplicar matches si se solicita
    let appliedCount = 0;
    if (applyMatches && suggestions.length > 0) {
      // Solo aplicar matches con alta confianza (>= 85%)
      const highConfidenceMatches = suggestions.filter(s => s.confidence >= 85);
      
      for (const match of highConfidenceMatches) {
        try {
          await prisma.$transaction([
            prisma.bankTransaction.update({
              where: { id: match.transactionId },
              data: {
                paymentId: match.paymentId,
                estado: 'conciliado',
                matchScore: match.confidence,
                conciliadoPor: 'ai-auto-match',
                conciliadoEn: new Date(),
                notasConciliacion: `Auto-conciliado por IA: ${match.reason}`
              }
            }),
            prisma.payment.update({
              where: { id: match.paymentId },
              data: {
                estado: 'pagado',
                fechaPago: new Date(),
                metodoPago: 'transferencia'
              }
            })
          ]);
          appliedCount++;
        } catch (matchError) {
          logger.warn(`Error aplicando match ${match.transactionId}:`, matchError);
        }
      }
    }

    logger.info(`Auto-conciliación: ${suggestions.length} sugerencias, ${appliedCount} aplicadas`);

    return NextResponse.json({
      success: true,
      matched: appliedCount,
      suggestions: suggestions.map(s => ({
        ...s,
        applied: applyMatches && s.confidence >= 85
      })),
      message: applyMatches 
        ? `${appliedCount} transacciones conciliadas automáticamente`
        : `${suggestions.length} sugerencias de conciliación encontradas`
    });
  } catch (error: any) {
    logger.error('Error en auto-conciliación:', error);
    return NextResponse.json(
      { error: 'Error en auto-conciliación', details: error.message },
      { status: 500 }
    );
  }
}
