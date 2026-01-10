/**
 * Webhook para ingestión de leads desde PhantomBuster/Clay
 * 
 * POST /api/webhooks/leads/ingest
 * 
 * Recibe arrays de leads enriquecidos y los procesa:
 * - Verifica duplicados (por linkedinUrl o teléfono)
 * - Marca como INCOMPLETE si no tienen teléfono
 * - Programa llamada outbound si tienen teléfono
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para leads entrantes
const incomingLeadSchema = z.object({
  linkedinUrl: z.string().url().optional(),
  fullName: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  role: z.string().optional(), // Cargo/título
  company: z.string().optional(), // Empresa donde trabaja
  companySize: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  // Datos adicionales de enriquecimiento
  enrichmentData: z.record(z.unknown()).optional(),
  source: z.string().optional(), // "phantombuster", "clay", etc.
});

const webhookPayloadSchema = z.object({
  leads: z.array(incomingLeadSchema),
  source: z.string().optional(),
  batchId: z.string().optional(),
  apiKey: z.string().optional(), // Para autenticación
});

// Verificar API key del webhook
function verifyWebhookAuth(request: NextRequest, apiKey?: string): boolean {
  const expectedKey = process.env.LEADS_WEBHOOK_SECRET;
  if (!expectedKey) {
    // Si no hay key configurada, aceptar (desarrollo)
    console.warn('[Leads Webhook] No LEADS_WEBHOOK_SECRET configured');
    return true;
  }
  
  // Verificar header o body
  const headerKey = request.headers.get('x-webhook-secret') || 
                    request.headers.get('authorization')?.replace('Bearer ', '');
  
  return headerKey === expectedKey || apiKey === expectedKey;
}

// Normalizar número de teléfono
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Eliminar todo excepto números y +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Si no empieza con +, asumir España
  if (!normalized.startsWith('+')) {
    // Si empieza con 34, añadir +
    if (normalized.startsWith('34')) {
      normalized = '+' + normalized;
    } 
    // Si es un número español (empieza con 6, 7, 8, 9)
    else if (/^[6789]/.test(normalized) && normalized.length === 9) {
      normalized = '+34' + normalized;
    }
  }
  
  // Validar longitud mínima
  if (normalized.length < 9) return null;
  
  return normalized;
}

// Separar nombre completo
function parseFullName(fullName: string): { nombre: string; apellidos: string | null } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { nombre: parts[0], apellidos: null };
  }
  return {
    nombre: parts[0],
    apellidos: parts.slice(1).join(' '),
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validar payload
    const validationResult = webhookPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Payload inválido', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { leads, source, batchId, apiKey } = validationResult.data;
    
    // Verificar autenticación
    if (!verifyWebhookAuth(request, apiKey)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay leads para procesar',
        stats: { total: 0, created: 0, duplicates: 0, incomplete: 0 },
      });
    }
    
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    
    // Obtener company por defecto para asignar leads
    const defaultCompany = await prisma.company.findFirst({
      where: { activa: true },
      select: { id: true },
    });
    
    if (!defaultCompany) {
      return NextResponse.json(
        { error: 'No hay empresa configurada para recibir leads' },
        { status: 500 }
      );
    }
    
    // Estadísticas de procesamiento
    const stats = {
      total: leads.length,
      created: 0,
      duplicates: 0,
      incomplete: 0,
      errors: 0,
      scheduled: 0,
    };
    
    const processedLeads: Array<{
      id: string;
      status: string;
      phone: string | null;
      scheduledAt: Date | null;
    }> = [];
    
    // Procesar cada lead
    for (const incomingLead of leads) {
      try {
        const normalizedPhone = normalizePhone(incomingLead.phone);
        const { nombre, apellidos } = incomingLead.firstName && incomingLead.lastName
          ? { nombre: incomingLead.firstName, apellidos: incomingLead.lastName }
          : parseFullName(incomingLead.fullName);
        
        // Verificar duplicado por LinkedIn URL
        if (incomingLead.linkedinUrl) {
          const existingByLinkedin = await prisma.lead.findFirst({
            where: { linkedinUrl: incomingLead.linkedinUrl },
          });
          
          if (existingByLinkedin) {
            stats.duplicates++;
            continue;
          }
        }
        
        // Verificar duplicado por teléfono
        if (normalizedPhone) {
          const existingByPhone = await prisma.lead.findFirst({
            where: { telefono: normalizedPhone },
          });
          
          if (existingByPhone) {
            stats.duplicates++;
            continue;
          }
        }
        
        // Verificar duplicado por email
        if (incomingLead.email) {
          const existingByEmail = await prisma.lead.findFirst({
            where: { email: incomingLead.email },
          });
          
          if (existingByEmail) {
            stats.duplicates++;
            continue;
          }
        }
        
        // Determinar estado outbound
        // CRÍTICO: Si no hay teléfono, marcar como INCOMPLETE
        const hasPhone = !!normalizedPhone;
        const outboundStatus = hasPhone ? 'NEW' : 'INCOMPLETE';
        
        // Calcular tiempo de llamada programada (si tiene teléfono)
        // Retraso aleatorio entre 2 y 10 minutos
        let outboundCallScheduledAt: Date | null = null;
        if (hasPhone) {
          const delayMinutes = Math.floor(Math.random() * 8) + 2; // 2-10 minutos
          outboundCallScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
          stats.scheduled++;
        } else {
          stats.incomplete++;
        }
        
        // Crear el lead
        const newLead = await prisma.lead.create({
          data: {
            companyId: defaultCompany.id,
            nombre,
            apellidos,
            email: incomingLead.email || `${nombre.toLowerCase()}.${Date.now()}@pendiente.outbound`,
            telefono: normalizedPhone,
            empresa: incomingLead.company,
            cargo: incomingLead.role,
            ciudad: incomingLead.location,
            fuente: 'outbound',
            origenDetalle: `${source || 'webhook'} - ${batchId || 'sin batch'}`,
            estado: 'nuevo',
            temperatura: 'frio',
            // Campos outbound
            linkedinUrl: incomingLead.linkedinUrl,
            enrichmentData: {
              ...incomingLead.enrichmentData,
              companySize: incomingLead.companySize,
              industry: incomingLead.industry,
              originalData: incomingLead,
            },
            enrichmentSource: source || 'webhook',
            outboundStatus,
            outboundCallScheduledAt,
          },
        });
        
        stats.created++;
        processedLeads.push({
          id: newLead.id,
          status: outboundStatus,
          phone: normalizedPhone,
          scheduledAt: outboundCallScheduledAt,
        });
        
      } catch (leadError: any) {
        console.error('[Leads Webhook] Error processing lead:', leadError);
        stats.errors++;
      }
    }
    
    // Log del batch
    console.log('[Leads Webhook] Batch processed:', {
      batchId,
      source,
      stats,
      duration: Date.now() - startTime,
    });
    
    // Si hay leads programados, disparar el job de llamadas
    if (stats.scheduled > 0) {
      // Importar y ejecutar el scheduler de llamadas
      try {
        const { scheduleOutboundCalls } = await import('@/lib/retell/outbound-scheduler');
        // No await - ejecutar en background
        scheduleOutboundCalls().catch(err => 
          console.error('[Leads Webhook] Error scheduling calls:', err)
        );
      } catch (e) {
        console.warn('[Leads Webhook] Outbound scheduler not available');
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Procesados ${stats.total} leads`,
      stats,
      processedLeads: processedLeads.slice(0, 10), // Solo primeros 10 para no saturar respuesta
      batchId,
      duration: Date.now() - startTime,
    });
    
  } catch (error: any) {
    console.error('[Leads Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Error procesando leads', message: error.message },
      { status: 500 }
    );
  }
}

// GET para verificar estado del webhook
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'Leads Ingest Webhook',
    accepts: ['PhantomBuster', 'Clay', 'Apollo', 'Custom'],
    requiredFields: ['fullName'],
    criticalFields: ['phone'], // Sin teléfono = INCOMPLETE
    version: '1.0.0',
  });
}
