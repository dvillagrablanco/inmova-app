/**
 * POST /api/beta/invite
 * Envía invitación de beta privada a un email.
 * Solo accesible por super_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const inviteSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2),
  empresa: z.string().optional(),
  plan: z.enum(['starter', 'professional', 'business']).default('professional'),
  trialDays: z.number().min(7).max(90).default(90),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = inviteSchema.parse(body);

    const APP_URL = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';

    const { sendEmail } = await import('@/lib/email-config');
    const result = await sendEmail({
      to: data.email,
      subject: `${data.nombre}, estás invitado a la beta de INMOVA`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;">Invitación Beta Privada</h1>
    <p style="margin:8px 0 0;opacity:0.9;">INMOVA · Gestión Inmobiliaria Profesional</p>
  </div>
  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;">
    <p>Hola <strong>${data.nombre}</strong>,</p>
    <p>Has sido seleccionado para acceder a la <strong>beta privada de INMOVA</strong>, la plataforma todo-en-uno para gestión inmobiliaria profesional.</p>
    
    <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin-top:0;color:#4F46E5;">Lo que incluye tu acceso beta:</h3>
      <ul style="padding-left:20px;line-height:1.8;">
        <li><strong>${data.trialDays} días gratis</strong> del plan ${data.plan === 'professional' ? 'Profesional' : data.plan === 'business' ? 'Business' : 'Starter'}</li>
        <li>Gestión de edificios, inquilinos y contratos</li>
        <li>Cobros automáticos con Stripe</li>
        <li>Portal del inquilino incluido</li>
        <li>Firma digital de contratos</li>
        <li>Soporte prioritario directo</li>
      </ul>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/registro?beta=true&plan=${data.plan}&trial=${data.trialDays}" 
         style="background:#4F46E5;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;display:inline-block;font-size:16px;font-weight:500;">
        Activar mi cuenta beta
      </a>
    </div>

    <p style="color:#6b7280;font-size:14px;">Esta invitación es personal e intransferible. Tu opinión durante la beta nos ayudará a mejorar la plataforma.</p>
    
    <p>Si tienes alguna pregunta, responde a este email directamente.</p>
    
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      Enxames Investments SL · <a href="${APP_URL}" style="color:#6366f1;">inmovaapp.com</a>
    </p>
  </div>
</body></html>`,
    });

    logger.info(`[Beta Invite] Invitation sent to ${data.email} (plan: ${data.plan}, trial: ${data.trialDays}d)`);

    return NextResponse.json({
      success: true,
      message: `Invitación enviada a ${data.email}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[Beta Invite] Error:', error);
    return NextResponse.json({ error: 'Error enviando invitación' }, { status: 500 });
  }
}
