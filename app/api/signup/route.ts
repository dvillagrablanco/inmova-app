import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';
import { initializeOnboardingTasks } from '@/lib/onboarding-service';
import { scheduleOnboardingEmailSequence } from '@/lib/onboarding-email-service';
import { scheduleOnboardingEmails } from '@/lib/email-triggers-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      password, 
      name, 
      role, 
      businessVertical,
      recoveryEmail, // Email alternativo para recuperación de contraseña
      // Zero-Touch Onboarding fields
      experienceLevel,
      techSavviness,
      portfolioSize
    } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Validar que el role sea un valor válido del enum UserRole
    const validRoles: any[] = ['administrador', 'gestor', 'operador'];
    const userRole: any = role && validRoles.includes(role as any) 
      ? (role as any) 
      : 'gestor';

    // Validar que el businessVertical sea un valor válido del enum BusinessVertical
    const validVerticals: any[] = [
      'alquiler_tradicional', 
      'str_vacacional', 
      'coliving',
      'room_rental', 
      'construccion', 
      'flipping', 
      'servicios_profesionales',
      'comunidades', 
      'mixto'
    ];
    const userVertical: any | undefined = businessVertical && validVerticals.includes(businessVertical as any) 
      ? (businessVertical as any) 
      : 'alquiler_tradicional'; // Default a tradicional si no se proporciona

    // Validar experienceLevel
    const validExperienceLevels: any[] = ['principiante', 'intermedio', 'avanzado'];
    const userExperienceLevel: any | undefined = experienceLevel && validExperienceLevels.includes(experienceLevel as any)
      ? (experienceLevel as any)
      : 'intermedio'; // Default a intermedio

    // Validar techSavviness
    const validTechSavviness: any[] = ['bajo', 'medio', 'alto'];
    const userTechSavviness: any | undefined = techSavviness && validTechSavviness.includes(techSavviness as any)
      ? (techSavviness as any)
      : 'medio'; // Default a medio

    // Validar portfolioSize
    const validPortfolioSizes: any[] = ['size_1_5', 'size_6_20', 'size_21_100', 'size_100_plus'];
    const userPortfolioSize: any | undefined = portfolioSize && validPortfolioSizes.includes(portfolioSize as any)
      ? (portfolioSize as any)
      : 'size_1_5'; // Default a 1-5

    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener la primera empresa disponible (o crear una por defecto)
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          nombre: 'INMOVA',
          cif: 'B12345678',
          direccion: 'Madrid, España',
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
        role: userRole,
        companyId: company.id,
        businessVertical: userVertical,
        recoveryEmail: validRecoveryEmail, // Email de recuperación
        // Zero-Touch Onboarding fields
        experienceLevel: userExperienceLevel,
        techSavviness: userTechSavviness,
        portfolioSize: userPortfolioSize,
        uiMode: 'standard', // Por defecto standard
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
}
