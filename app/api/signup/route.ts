import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import { initializeOnboardingTasks } from '@/lib/onboarding-service';
import { scheduleOnboardingEmailSequence } from '@/lib/onboarding-email-service';
import { scheduleOnboardingEmails } from '@/lib/email-triggers-service';
import { z } from 'zod';
import { withAuthRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validacion Zod para signup
const signupSchema = z.object({
  email: z.string().email('Email invalido').max(255).toLowerCase().trim(),
  password: z.string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .max(128, 'La contrasena no puede exceder 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[a-z]/, 'Debe contener al menos una minuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).trim(),
  role: z.enum(['administrador', 'gestor', 'operador']).optional().default('gestor'),
  businessVertical: z.enum([
    'alquiler_tradicional', 'str_vacacional', 'coliving',
    'room_rental', 'construccion', 'flipping',
    'servicios_profesionales', 'comunidades', 'mixto'
  ]).optional().default('alquiler_tradicional'),
  recoveryEmail: z.string().email().optional().nullable(),
  experienceLevel: z.enum(['principiante', 'intermedio', 'avanzado']).optional().default('intermedio'),
  techSavviness: z.enum(['bajo', 'medio', 'alto']).optional().default('medio'),
  portfolioSize: z.enum(['size_1_5', 'size_6_20', 'size_21_100', 'size_100_plus']).optional().default('size_1_5'),
});

export async function POST(req: NextRequest) {
  // Rate limiting para prevenir spam de registro
  return withAuthRateLimit(req, async () => {
    return handleSignup(req);
  });
}

async function handleSignup(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const body = await req.json();

    // Validar con Zod
    const parseResult = signupSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos invalidos',
          details: parseResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      name,
      role: userRole,
      businessVertical: userVertical,
      recoveryEmail,
      experienceLevel: userExperienceLevel,
      techSavviness: userTechSavviness,
      portfolioSize: userPortfolioSize,
    } = parseResult.data;

    // Lazy load Prisma

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya esta registrado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener la primera empresa disponible (o crear una por defecto)
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          nombre: 'INMOVA',
          cif: 'B12345678',
          direccion: 'Madrid, Espana',
          telefono: '+34 912 345 678',
          email: 'info@inmova.com',
        },
      });
    }

    // Validar que recoveryEmail sea diferente al email principal
    const validRecoveryEmail = recoveryEmail && recoveryEmail !== email ? recoveryEmail : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole as any,
        companyId: company.id,
        businessVertical: userVertical as any,
        recoveryEmail: validRecoveryEmail,
        experienceLevel: userExperienceLevel as any,
        techSavviness: userTechSavviness as any,
        portfolioSize: userPortfolioSize as any,
        uiMode: 'standard',
        onboardingCompleted: false,
      },
    });

    // Inicializar tareas de onboarding basadas en el vertical
    try {
      await initializeOnboardingTasks(user.id, company.id, userVertical);
      logger.info(`Tareas de onboarding inicializadas para usuario ${user.id}`);
    } catch (onboardingError) {
      // No fallar el signup si hay error en onboarding, solo registrar
      logger.error('Error inicializando onboarding tasks:', onboardingError);
    }

    // Programar secuencia automática de emails de onboarding
    try {
      await scheduleOnboardingEmailSequence(user.id, company.id);
      logger.info(`Secuencia de emails programada para usuario ${user.id}`);
    } catch (emailError) {
      // No fallar el signup si hay error en emails, solo registrar
      logger.error('Error programando emails de onboarding:', emailError);
    }

    // Programar emails automáticos diferidos (2h, 24h, 7d, 30d)
    try {
      await scheduleOnboardingEmails(user.id, user.email);
      logger.info(`Emails automáticos diferidos programados para usuario ${user.id}`);
    } catch (emailTriggersError) {
      // No fallar el signup si hay error en triggers, solo registrar
      logger.error('Error programando email triggers:', emailTriggersError);
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessVertical: user.businessVertical,
          experienceLevel: user.experienceLevel,
        },
        onboardingInitialized: true,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
} // handleSignup
