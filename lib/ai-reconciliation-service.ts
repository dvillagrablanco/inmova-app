/**
 * AI RECONCILIATION SERVICE
 *
 * Usa IA (Claude / Anthropic) para interpretar movimientos bancarios
 * y determinar automáticamente:
 * - Qué inquilino realizó el pago
 * - A qué unidad/contrato corresponde
 * - Nivel de confianza del matching
 *
 * Funciona con la descripción de la transacción bancaria,
 * nombre del ordenante, referencia, etc.
 */

import { logger } from '@/lib/logger';
import { getPrismaClient } from '@/lib/db';
import { centsToEuros } from '@/lib/gocardless-integration';

// ============================================================================
// TYPES
// ============================================================================

export interface AIMatchResult {
  tenantId: string | null;
  tenantName: string | null;
  contractId: string | null;
  unitId: string | null;
  unitLabel: string | null;
  confidence: number; // 0-100
  reasoning: string;
  method: 'exact_amount_name' | 'fuzzy_name' | 'reference_code' | 'ai_inference' | 'gocardless_metadata' | 'no_match';
}

interface TenantInfo {
  id: string;
  nombre: string;
  email: string;
  contractId: string;
  unitId: string;
  unitNumero: string;
  buildingNombre: string;
  rentaMensual: number;
  nameParts: string[];
}

// ============================================================================
// LOAD TENANTS CACHE
// ============================================================================

let _tenantsCache: TenantInfo[] | null = null;
let _tenantsCacheExpiry = 0;

async function loadTenants(companyId: string): Promise<TenantInfo[]> {
  if (_tenantsCache && Date.now() < _tenantsCacheExpiry) return _tenantsCache;

  const prisma = getPrismaClient();
  const contracts = await prisma.contract.findMany({
    where: {
      unit: { building: { companyId } },
      estado: 'activo',
    },
    include: {
      tenant: { select: { id: true, nombreCompleto: true, email: true, dni: true } },
      unit: {
        select: { id: true, numero: true, building: { select: { nombre: true } } },
      },
    },
  });

  _tenantsCache = contracts.map(c => ({
    id: c.tenant.id,
    nombre: c.tenant.nombreCompleto,
    email: c.tenant.email,
    contractId: c.id,
    unitId: c.unit.id,
    unitNumero: c.unit.numero,
    buildingNombre: c.unit.building.nombre,
    rentaMensual: c.rentaMensual,
    nameParts: c.tenant.nombreCompleto.toUpperCase().split(/\s+/).filter(p => p.length > 2),
  }));

  _tenantsCacheExpiry = Date.now() + 5 * 60 * 1000; // 5 min
  return _tenantsCache;
}

// ============================================================================
// TEXT CLEANING (eliminar ruido bancario)
// ============================================================================

function cleanBankText(raw: string): string {
  return raw
    .replace(/^CORE/i, '')
    .replace(/NOTPROVIDE?D?/gi, '')
    .replace(/\bESES?\b/g, '')
    .replace(/BANKINTER\s*S\.?A\.?/gi, '')
    .replace(/BANCO\s+(DE\s+)?(SANTANDER|SABADELL|BILBAO|VIZCAYA|ARGENTINA)/gi, '')
    .replace(/CAIXABANK\s*S\.?A\.?/gi, '')
    .replace(/KUTXABANK\s*S\.?A\.?/gi, '')
    .replace(/CITIBANK?/gi, '')
    .replace(/\b[A-Z]{2}\d{10,}\b/g, '') // Remove IBANs/references
    .replace(/\d{4}[-/]\d{2}[-/]\d{2}T[\d:]+/g, '') // Remove dates
    .replace(/[-|\/]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toUpperCase();
}

// ============================================================================
// RULE-BASED MATCHING (rápido, sin IA)
// ============================================================================

function ruleBasedMatch(
  txDescription: string,
  txAmount: number,
  txDebtorName: string | null,
  txReference: string | null,
  tenants: TenantInfo[]
): AIMatchResult {
  const rawText = `${txDebtorName || ''} ${txDescription} ${txReference || ''}`;
  const text = cleanBankText(rawText);

  // 1. GoCardless metadata (si la descripción contiene ID de GC)
  const gcMatch = text.match(/GC[- ]?([A-Z0-9]+)|GOCARDLESS/i);
  if (gcMatch) {
    return {
      tenantId: null, tenantName: null, contractId: null, unitId: null, unitLabel: null,
      confidence: 30, reasoning: 'Pago via GoCardless (se conciliará via webhook)',
      method: 'gocardless_metadata',
    };
  }

  // Helper: check if amount is close to rent
  const amountClose = (txAmt: number, rent: number) => {
    const tolerance = Math.max(rent * 0.03, 2); // 3% o 2€ mínimo
    return Math.abs(txAmt - rent) <= tolerance;
  };
  const amountNear = (txAmt: number, rent: number) => {
    return Math.abs(txAmt - rent) <= rent * 0.15; // 15%
  };

  // Score all tenants and pick best
  let bestMatch: { tenant: TenantInfo; score: number; reason: string; method: string } | null = null;

  for (const t of tenants) {
    if (t.nameParts.length === 0) continue;

    const nameMatchCount = t.nameParts.filter(part => text.includes(part)).length;
    const nameRatio = nameMatchCount / t.nameParts.length;
    const fullName = nameRatio === 1;
    const partialName = nameMatchCount >= 2 || (t.nameParts.length <= 2 && nameMatchCount >= 1);
    const amtExact = amountClose(txAmount, t.rentaMensual);
    const amtClose = amountNear(txAmount, t.rentaMensual);

    let score = 0;
    let reason = '';
    let method = 'fuzzy_name';

    if (fullName && amtExact) {
      score = 95;
      reason = `Nombre completo "${t.nombre}" + monto exacto (${txAmount}€ ≈ ${t.rentaMensual}€)`;
      method = 'exact_amount_name';
    } else if (fullName && amtClose) {
      score = 85;
      reason = `Nombre completo "${t.nombre}" + monto cercano (${txAmount}€ ~ ${t.rentaMensual}€)`;
    } else if (fullName) {
      score = 75;
      reason = `Nombre completo "${t.nombre}" en texto. Monto (${txAmount}€) difiere de renta (${t.rentaMensual}€).`;
    } else if (partialName && amtExact) {
      score = 85;
      reason = `Nombre parcial (${nameMatchCount}/${t.nameParts.length}) + monto exacto (${txAmount}€ ≈ ${t.rentaMensual}€)`;
    } else if (partialName && amtClose) {
      score = 70;
      reason = `Nombre parcial (${nameMatchCount}/${t.nameParts.length}) + monto cercano (${txAmount}€ ~ ${t.rentaMensual}€)`;
    } else if (partialName) {
      score = 50;
      reason = `Nombre parcial (${nameMatchCount}/${t.nameParts.length}). Monto: ${txAmount}€, renta: ${t.rentaMensual}€.`;
    } else if (amtExact) {
      score = 45;
      reason = `Monto ${txAmount}€ coincide con renta ${t.rentaMensual}€ de ${t.nombre}. Sin match de nombre.`;
    }

    if (score > (bestMatch?.score || 0)) {
      bestMatch = { tenant: t, score, reason, method };
    }
  }

  // Si hay match por monto exacto y es el UNICO inquilino con esa renta, subir confianza
  if (bestMatch && bestMatch.method === 'fuzzy_name' && bestMatch.score <= 45) {
    const sameRentCount = tenants.filter(t => amountClose(txAmount, t.rentaMensual)).length;
    if (sameRentCount === 1) {
      bestMatch.score = 70;
      bestMatch.reason += ' (único inquilino con esa renta)';
    }
  }

  if (bestMatch && bestMatch.score >= 40) {
    const t = bestMatch.tenant;
    return {
      tenantId: t.id,
      tenantName: t.nombre,
      contractId: t.contractId,
      unitId: t.unitId,
      unitLabel: `${t.buildingNombre} - ${t.unitNumero}`,
      confidence: bestMatch.score,
      reasoning: bestMatch.reason,
      method: bestMatch.method as any,
    };
  }

  // Fallback: check for building/unit names in text
  for (const t of tenants) {
    const unitInRef = (t.unitNumero.length > 1 && text.includes(t.unitNumero.toUpperCase())) ||
      (t.buildingNombre.length > 3 && text.includes(t.buildingNombre.toUpperCase()));
    if (unitInRef && amountNear(txAmount, t.rentaMensual)) {
      return {
        tenantId: t.id,
        tenantName: t.nombre,
        contractId: t.contractId,
        unitId: t.unitId,
        unitLabel: `${t.buildingNombre} - ${t.unitNumero}`,
        confidence: 55,
        reasoning: `Referencia contiene "${t.unitNumero}" de ${t.buildingNombre} + monto cercano.`,
        method: 'reference_code',
      };
    }
  }

  return {
    tenantId: null, tenantName: null, contractId: null, unitId: null, unitLabel: null,
    confidence: 0, reasoning: 'Sin coincidencia por reglas.',
    method: 'no_match',
  };
}

// ============================================================================
// AI-POWERED MATCHING (para casos ambiguos)
// ============================================================================

async function aiMatch(
  txDescription: string,
  txAmount: number,
  txDebtorName: string | null,
  txReference: string | null,
  tenants: TenantInfo[]
): Promise<AIMatchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      tenantId: null, tenantName: null, contractId: null, unitId: null, unitLabel: null,
      confidence: 0, reasoning: 'IA no disponible (ANTHROPIC_API_KEY no configurada)',
      method: 'no_match',
    };
  }

  try {
    const tenantList = tenants.slice(0, 50).map(t =>
      `- ${t.nombre} | ${t.email} | ${t.buildingNombre} ${t.unitNumero} | ${t.rentaMensual}€/mes | ID:${t.id}`
    ).join('\n');

    const prompt = `Eres un experto en conciliación bancaria inmobiliaria. Analiza este movimiento bancario e identifica a qué inquilino y unidad corresponde.

MOVIMIENTO BANCARIO:
- Descripción: ${txDescription}
- Ordenante: ${txDebtorName || 'N/A'}
- Referencia: ${txReference || 'N/A'}
- Importe: ${txAmount}€

INQUILINOS CON CONTRATOS ACTIVOS:
${tenantList}

Responde SOLO con JSON válido (sin texto adicional):
{
  "tenantId": "string o null",
  "tenantName": "string o null",
  "confidence": number 0-100,
  "reasoning": "explicación breve"
}

Si no hay match claro, devuelve tenantId null y confidence 0.`;

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response');

    // Extraer JSON del response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);

    if (result.tenantId) {
      const tenant = tenants.find(t => t.id === result.tenantId);
      if (tenant) {
        return {
          tenantId: tenant.id,
          tenantName: tenant.nombre,
          contractId: tenant.contractId,
          unitId: tenant.unitId,
          unitLabel: `${tenant.buildingNombre} - ${tenant.unitNumero}`,
          confidence: result.confidence || 60,
          reasoning: result.reasoning || 'Matched by AI',
          method: 'ai_inference',
        };
      }
    }

    return {
      tenantId: null, tenantName: null, contractId: null, unitId: null, unitLabel: null,
      confidence: 0, reasoning: result.reasoning || 'IA no encontró match.',
      method: 'no_match',
    };
  } catch (error: any) {
    logger.error('[AI Reconciliation] Error:', error.message);
    return {
      tenantId: null, tenantName: null, contractId: null, unitId: null, unitLabel: null,
      confidence: 0, reasoning: `Error IA: ${error.message}`,
      method: 'no_match',
    };
  }
}

// ============================================================================
// MAIN EXPORT: Smart Reconciliation
// ============================================================================

/**
 * Identifica inquilino y unidad de un movimiento bancario.
 *
 * Pipeline:
 * 1. Reglas deterministas (nombre, monto, referencia) → rápido
 * 2. Si confidence < 50 → IA (Claude) para análisis semántico
 */
export async function identifyPaymentSource(
  companyId: string,
  txDescription: string,
  txAmount: number,
  txDebtorName: string | null = null,
  txReference: string | null = null,
  useAI: boolean = true
): Promise<AIMatchResult> {
  const tenants = await loadTenants(companyId);

  // 1. Rule-based (instant)
  const ruleResult = ruleBasedMatch(txDescription, Math.abs(txAmount), txDebtorName, txReference, tenants);

  if (ruleResult.confidence >= 50) {
    return ruleResult;
  }

  // 2. AI fallback (for ambiguous cases)
  if (useAI && ruleResult.method !== 'gocardless_metadata') {
    const aiResult = await aiMatch(txDescription, Math.abs(txAmount), txDebtorName, txReference, tenants);
    if (aiResult.confidence > ruleResult.confidence) {
      return aiResult;
    }
  }

  return ruleResult;
}

/**
 * Procesa un lote de transacciones pendientes con identificación inteligente.
 * Actualiza cada BankTransaction con el tenantId/contractId identificado.
 */
export async function smartReconcileBatch(
  companyId: string,
  limit: number = 30,
  useAI: boolean = true
): Promise<{
  processed: number;
  matched: number;
  reconciled: number;
  aiCalls: number;
  results: Array<{ txId: string; match: AIMatchResult }>;
}> {
  const prisma = getPrismaClient();
  const MAX_AI_CALLS = 5; // Limitar llamadas a Claude por batch
  let aiCallCount = 0;

  const tenants = await loadTenants(companyId);

  // Calcular rango de rentas para priorizar ingresos que pueden ser alquileres
  const rents = tenants.map(t => t.rentaMensual).filter(r => r > 0);
  const minRent = rents.length > 0 ? Math.min(...rents) * 0.7 : 20;
  const maxRent = rents.length > 0 ? Math.max(...rents) * 1.5 : 20000;

  // Primero buscar ingresos en rango de alquiler (más probable que sean pagos)
  let transactions = await prisma.bankTransaction.findMany({
    where: {
      companyId,
      estado: 'pendiente_revision',
      monto: { gte: minRent, lte: maxRent },
    },
    orderBy: { fecha: 'desc' },
    take: limit,
  });

  // Si no hay suficientes en rango, completar con otros ingresos
  if (transactions.length < limit) {
    const remaining = limit - transactions.length;
    const existingIds = transactions.map(t => t.id);
    const extra = await prisma.bankTransaction.findMany({
      where: {
        companyId,
        estado: 'pendiente_revision',
        monto: { gt: 0 },
        id: { notIn: existingIds },
      },
      orderBy: { fecha: 'desc' },
      take: remaining,
    });
    transactions = [...transactions, ...extra];
  }

  const results: Array<{ txId: string; match: AIMatchResult }> = [];
  let matched = 0;
  let reconciled = 0;

  for (const tx of transactions) {
    // Limitar llamadas a IA por batch para evitar timeouts
    const canUseAI = useAI && aiCallCount < MAX_AI_CALLS;
    const match = await identifyPaymentSource(
      companyId,
      tx.descripcion,
      tx.monto,
      tx.debtorName,
      tx.referencia,
      canUseAI
    );
    if (match.method === 'ai_inference') aiCallCount++;

    results.push({ txId: tx.id, match });

    if (match.tenantId && match.confidence >= 70) {
      matched++;

      // Buscar pago pendiente que coincida
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          contractId: match.contractId!,
          estado: { in: ['pendiente', 'atrasado'] },
          monto: { gte: tx.monto * 0.99, lte: tx.monto * 1.01 },
        },
        orderBy: { fechaVencimiento: 'asc' },
      });

      if (pendingPayment) {
        await prisma.$transaction([
          prisma.bankTransaction.update({
            where: { id: tx.id },
            data: {
              estado: 'conciliado',
              paymentId: pendingPayment.id,
              conciliadoPor: match.method === 'ai_inference' ? 'ai_auto' : 'rules_auto',
              conciliadoEn: new Date(),
              matchScore: match.confidence,
              matchSuggestions: {
                tenantName: match.tenantName,
                unitLabel: match.unitLabel,
                method: match.method,
                reasoning: match.reasoning,
              } as any,
              notasConciliacion: `Auto: ${match.tenantName} (${match.unitLabel}) [${match.method}:${match.confidence}%]`,
            },
          }),
          prisma.payment.update({
            where: { id: pendingPayment.id },
            data: {
              estado: 'pagado',
              fechaPago: tx.fecha,
              metodoPago: 'transferencia_bancaria',
            },
          }),
        ]);
        reconciled++;
      } else {
        // Guardar sugerencia sin conciliar
        await prisma.bankTransaction.update({
          where: { id: tx.id },
          data: {
            matchScore: match.confidence,
            matchSuggestions: {
              tenantId: match.tenantId,
              tenantName: match.tenantName,
              contractId: match.contractId,
              unitLabel: match.unitLabel,
              method: match.method,
              reasoning: match.reasoning,
            } as any,
          },
        });
      }
    }
  }

  logger.info(
    `[SmartReconcile] ${companyId}: ${transactions.length} processed, ` +
    `${matched} matched, ${reconciled} reconciled, ${aiCallCount} AI calls`
  );

  return { processed: transactions.length, matched, reconciled, aiCalls: aiCallCount, results };
}
