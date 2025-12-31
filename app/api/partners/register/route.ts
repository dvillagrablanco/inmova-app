import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  type: z.enum([
    'BANK',
    'INSURANCE',
    'BUSINESS_SCHOOL',
    'REAL_ESTATE',
    'CONSTRUCTION',
    'LAW_FIRM',
    'OTHER',
  ]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const validated = registerSchema.parse(body);

    // Using global prisma instance

    // Verificar si el email ya existe
    const existingPartner = await prisma.partner.findUnique({
      where: { email: validated.email },
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: 'Este email ya está registrado como partner' },
        { status: 400 }
      );
    }

    // Generar código de referido único
    let referralCode = nanoid(10).toUpperCase();
    let codeExists = await prisma.partner.findUnique({
      where: { referralCode },
    });

    // Regenerar si existe (muy improbable)
    while (codeExists) {
      referralCode = nanoid(10).toUpperCase();
      codeExists = await prisma.partner.findUnique({
        where: { referralCode },
      });
    }

    // Determinar si es early adopter (primeros 100)
    const totalPartners = await prisma.partner.count();
    const earlyAdopterBonus = totalPartners < 100;

    // Crear partner
    const partner = await prisma.partner.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        company: validated.company,
        website: validated.website || undefined,
        type: validated.type,
        referralCode,
        earlyAdopterBonus,
        status: 'PENDING_APPROVAL',
        level: 'BRONZE',
        commissionRate: earlyAdopterBonus ? 25 : 20, // +5% early adopter
      },
    });

    // Send welcome email and admin notification
    try {
      const { sendPartnerWelcomeEmail, sendAdminNewPartnerNotification } =
        await import('@/lib/emails/partner-emails');

      await sendPartnerWelcomeEmail({
        name: partner.name,
        email: partner.email,
        type: partner.type,
        referralCode: partner.referralCode,
      });

      await sendAdminNewPartnerNotification({
        name: partner.name,
        email: partner.email,
        type: partner.type,
        company: partner.company || undefined,
      });

      // Emails sent successfully
    } catch (emailError) {
      console.error('[Partner Registration Email Error]:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          type: partner.type,
          referralCode: partner.referralCode,
          earlyAdopterBonus: partner.earlyAdopterBonus,
          status: partner.status,
        },
        message: 'Solicitud de partner recibida. Te contactaremos en 24h.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('[Partner Register Error]:', error);
    return NextResponse.json({ error: 'Error registrando partner' }, { status: 500 });
  }
}
