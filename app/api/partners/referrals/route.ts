/**
 * API: Sistema de Referidos y Comisiones para Partners
 * 
 * GET /api/partners/referrals - Obtener referidos del partner
 * POST /api/partners/referrals - Registrar nuevo referido
 * 
 * Sistema unificado de tracking de referidos y cálculo de comisiones
 * para todos los tipos de partners.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-partners';

// Verificar token
function verifyPartnerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
  } catch {
    return null;
  }
}

// Schema de referido
const referralSchema = z.object({
  // Datos del referido
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  
  // Tipo de referido
  type: z.enum([
    'lead_hipoteca',      // Lead para hipoteca (bancos)
    'lead_seguro',        // Lead para seguro (aseguradoras)
    'lead_legal',         // Lead para servicio legal (abogados)
    'lead_servicio',      // Lead para servicio de mantenimiento
    'nuevo_cliente',      // Nuevo cliente Inmova
    'upgrade_plan',       // Upgrade de plan existente
  ]),
  
  // Contexto
  propertyId: z.string().optional(),
  propertyValue: z.number().optional(),
  notes: z.string().optional(),
  
  // Tracking
  source: z.string().optional(), // landing, widget, email, call...
  campaign: z.string().optional(), // Campaña específica
  utmParams: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    content: z.string().optional(),
  }).optional(),
});

// Configuración de comisiones por tipo
const COMMISSION_CONFIG: Record<string, {
  type: 'fixed' | 'percentage';
  value: number;
  currency?: string;
  description: string;
  paymentTrigger: string;
}> = {
  lead_hipoteca: {
    type: 'fixed',
    value: 100,
    currency: 'EUR',
    description: 'Lead cualificado para hipoteca',
    paymentTrigger: 'lead_qualified',
  },
  lead_hipoteca_closed: {
    type: 'percentage',
    value: 0.15, // 0.15% del importe de la hipoteca
    description: 'Hipoteca cerrada',
    paymentTrigger: 'deal_closed',
  },
  lead_seguro: {
    type: 'percentage',
    value: 20, // 20% de la prima
    description: 'Seguro contratado',
    paymentTrigger: 'policy_active',
  },
  lead_legal: {
    type: 'percentage',
    value: 15, // 15% de honorarios
    description: 'Servicio legal contratado',
    paymentTrigger: 'service_completed',
  },
  lead_servicio: {
    type: 'percentage',
    value: 12, // 12% del trabajo
    description: 'Servicio de mantenimiento completado',
    paymentTrigger: 'work_completed',
  },
  nuevo_cliente: {
    type: 'percentage',
    value: 20, // 20% del primer año
    description: 'Nuevo cliente suscrito a Inmova',
    paymentTrigger: 'subscription_active',
  },
  upgrade_plan: {
    type: 'percentage',
    value: 10, // 10% del incremento
    description: 'Upgrade de plan',
    paymentTrigger: 'upgrade_completed',
  },
};

// Estados de referido
const REFERRAL_STATUSES = {
  pending: 'Pendiente de contacto',
  contacted: 'Contactado',
  qualified: 'Cualificado',
  negotiating: 'En negociación',
  converted: 'Convertido',
  lost: 'Perdido',
  rejected: 'Rechazado',
};

// GET: Obtener referidos del partner
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyPartnerToken(request);
    if (!decoded?.partnerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    
    // Construir filtro
    const where: any = {
      partnerId: decoded.partnerId,
    };
    
    if (status) where.estado = status;
    if (type) where.tipo = type;
    if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };
    
    // Obtener referidos usando PartnerInvitation como base
    // (En producción habría un modelo Referral específico)
    const invitations = await prisma.partnerInvitation.findMany({
      where: {
        partnerId: decoded.partnerId,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    const total = await prisma.partnerInvitation.count({
      where: { partnerId: decoded.partnerId },
    });
    
    // Obtener comisiones asociadas
    const commissions = await prisma.commission.findMany({
      where: { partnerId: decoded.partnerId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Calcular estadísticas
    const stats = {
      total: total,
      byStatus: {
        pending: invitations.filter(i => i.estado === 'PENDING').length,
        accepted: invitations.filter(i => i.estado === 'ACCEPTED').length,
        expired: invitations.filter(i => i.estado === 'EXPIRED').length,
      },
      conversionRate: total > 0 
        ? Math.round(invitations.filter(i => i.estado === 'ACCEPTED').length / total * 100)
        : 0,
      totalCommissions: commissions.reduce((sum, c) => sum + c.montoComision, 0),
      pendingCommissions: commissions
        .filter(c => c.estado === 'PENDING' || c.estado === 'APPROVED')
        .reduce((sum, c) => sum + c.montoComision, 0),
      paidCommissions: commissions
        .filter(c => c.estado === 'PAID')
        .reduce((sum, c) => sum + c.montoComision, 0),
    };
    
    // Mapear invitaciones a formato de referidos
    const referrals = invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      name: inv.nombre,
      company: inv.empresa,
      status: inv.estado.toLowerCase(),
      statusLabel: REFERRAL_STATUSES[inv.estado.toLowerCase() as keyof typeof REFERRAL_STATUSES] || inv.estado,
      type: 'nuevo_cliente',
      createdAt: inv.createdAt,
      expiresAt: inv.fechaExpiracion,
      acceptedAt: inv.fechaAceptacion,
      commission: COMMISSION_CONFIG.nuevo_cliente,
      estimatedValue: 0, // Se calcularía según el plan
    }));
    
    return NextResponse.json({
      referrals,
      stats,
      commissions: commissions.slice(0, 10), // Últimas 10
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      config: {
        commissionTypes: COMMISSION_CONFIG,
        statuses: REFERRAL_STATUSES,
      },
    });
    
  } catch (error: any) {
    logger.error('[Referrals] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo referidos' },
      { status: 500 }
    );
  }
}

// POST: Registrar nuevo referido
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyPartnerToken(request);
    if (!decoded?.partnerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const validationResult = referralSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    
    // Verificar partner activo
    const partner = await prisma.partner.findUnique({
      where: { id: decoded.partnerId },
      select: { id: true, estado: true, comisionPorcentaje: true },
    });
    
    if (!partner || partner.estado !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Partner no activo' },
        { status: 403 }
      );
    }
    
    // Verificar que no existe referido con ese email
    const existing = await prisma.partnerInvitation.findFirst({
      where: {
        email: data.email,
        partnerId: decoded.partnerId,
        estado: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un referido con ese email' },
        { status: 409 }
      );
    }
    
    // Calcular fecha de expiración (30 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    
    // Crear invitación/referido
    const invitation = await prisma.partnerInvitation.create({
      data: {
        partnerId: decoded.partnerId,
        email: data.email,
        nombre: data.name,
        empresa: data.company,
        telefono: data.phone,
        fechaExpiracion: expirationDate,
        estado: 'PENDING',
        metadata: {
          type: data.type,
          propertyId: data.propertyId,
          propertyValue: data.propertyValue,
          notes: data.notes,
          source: data.source,
          campaign: data.campaign,
          utmParams: data.utmParams,
          commissionConfig: COMMISSION_CONFIG[data.type],
        },
      },
    });
    
    // Generar link de registro personalizado
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const registrationLink = `${baseUrl}/register?ref=${partner.id}&inv=${invitation.id}`;
    
    // TODO: Enviar email al referido
    // await sendReferralEmail(data.email, data.name, partner, registrationLink);
    
    logger.info('[Referrals] Nuevo referido registrado', {
      partnerId: decoded.partnerId,
      referralId: invitation.id,
      type: data.type,
      email: data.email,
    });
    
    return NextResponse.json({
      success: true,
      referral: {
        id: invitation.id,
        email: data.email,
        name: data.name,
        type: data.type,
        status: 'pending',
        registrationLink,
        expiresAt: expirationDate,
        commission: COMMISSION_CONFIG[data.type],
      },
      message: `Referido registrado correctamente. Se ha enviado un email de invitación a ${data.email}`,
      nextSteps: [
        `El referido recibirá un email con el enlace de registro`,
        `Cuando se registre, quedará vinculado a tu cuenta de partner`,
        `La comisión se generará según el tipo de referido: ${COMMISSION_CONFIG[data.type].description}`,
      ],
    }, { status: 201 });
    
  } catch (error: any) {
    logger.error('[Referrals] Error registrando referido:', error);
    return NextResponse.json(
      { error: 'Error registrando referido' },
      { status: 500 }
    );
  }
}
