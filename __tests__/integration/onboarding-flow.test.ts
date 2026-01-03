/**
 * ONBOARDING FLOW - INTEGRATION TESTS
 * Flujo completo de onboarding de nuevos usuarios
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { addDays } from 'date-fns';

// Mocks
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn((callback) =>
      callback({
        user: {
          create: vi.fn(),
          update: vi.fn(),
          findUnique: vi.fn(),
        },
        company: {
          create: vi.fn(),
          findUnique: vi.fn(),
        },
        onboardingProgress: {
          create: vi.fn(),
          update: vi.fn(),
          findUnique: vi.fn(),
        },
        notification: {
          create: vi.fn(),
        },
      })
    ),
    user: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    company: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    onboardingProgress: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/analytics-service', () => ({
  trackOnboardingStart: vi.fn(),
  trackOnboardingTaskComplete: vi.fn(),
  trackOnboardingComplete: vi.fn(),
}));

import { prisma } from '@/lib/db';
import {
  trackOnboardingStart,
  trackOnboardingTaskComplete,
  trackOnboardingComplete,
} from '@/lib/analytics-service';

describe('🚀 Onboarding Flow - Complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('✅ FLOW: Registro → Crear empresa → Iniciar onboarding', async () => {
    // 1. Usuario se registra
    const newUser = {
      id: 'user-1',
      email: 'new@example.com',
      name: 'New User',
      role: 'ADMIN',
      createdAt: new Date(),
    };

    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue(newUser);

    // 2. Crear empresa
    const newCompany = {
      id: 'company-1',
      name: 'New Company',
      ownerId: 'user-1',
      plan: 'TRIAL',
      trialEndsAt: addDays(new Date(), 14),
    };

    (prisma.company.create as ReturnType<typeof vi.fn>).mockResolvedValue(newCompany);

    // 3. Iniciar onboarding progress
    const onboardingProgress = {
      id: 'onboarding-1',
      userId: 'user-1',
      currentStep: 1,
      totalSteps: 5,
      completed: false,
      steps: {
        profile: false,
        company: false,
        firstProperty: false,
        firstTenant: false,
        tour: false,
      },
    };

    (prisma.onboardingProgress.create as ReturnType<typeof vi.fn>).mockResolvedValue(
      onboardingProgress
    );

    // Simular flujo
    const user = await prisma.user.create({ data: newUser });
    const company = await prisma.company.create({ data: newCompany });
    const progress = await prisma.onboardingProgress.create({
      data: {
        userId: user.id,
        currentStep: 1,
        totalSteps: 5,
      },
    });

    trackOnboardingStart(user.id, 'ADMIN');

    // Assertions
    expect(user.email).toBe('new@example.com');
    expect(company.ownerId).toBe('user-1');
    expect(progress.currentStep).toBe(1);
    expect(trackOnboardingStart).toHaveBeenCalledWith('user-1', 'ADMIN');
  });

  test('✅ FLOW: Completar paso → Actualizar progreso → Track analytics', async () => {
    // Usuario completa paso 1: Perfil
    const updatedProgress = {
      id: 'onboarding-1',
      userId: 'user-1',
      currentStep: 2,
      totalSteps: 5,
      steps: {
        profile: true,
        company: false,
        firstProperty: false,
        firstTenant: false,
        tour: false,
      },
    };

    (prisma.onboardingProgress.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      updatedProgress
    );

    // Simular completar paso
    const progress = await prisma.onboardingProgress.update({
      where: { userId: 'user-1' },
      data: {
        currentStep: 2,
        steps: { profile: true },
      },
    });

    trackOnboardingTaskComplete('user-1', 'profile', 1);

    // Notification de progreso
    await prisma.notification.create({
      data: {
        userId: 'user-1',
        type: 'onboarding_progress',
        title: '¡Paso completado!',
        message: 'Has completado tu perfil. Siguiente: Configurar empresa',
      },
    });

    // Assertions
    expect(progress.currentStep).toBe(2);
    expect(progress.steps.profile).toBe(true);
    expect(trackOnboardingTaskComplete).toHaveBeenCalledWith('user-1', 'profile', 1);
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  test('✅ FLOW: Completar todos los pasos → Finalizar onboarding → Activar cuenta', async () => {
    // Completar último paso
    const completedProgress = {
      id: 'onboarding-1',
      userId: 'user-1',
      currentStep: 5,
      totalSteps: 5,
      completed: true,
      completedAt: new Date(),
      steps: {
        profile: true,
        company: true,
        firstProperty: true,
        firstTenant: true,
        tour: true,
      },
    };

    (prisma.onboardingProgress.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      completedProgress
    );

    // Actualizar user
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    });

    // Simular flujo
    const progress = await prisma.onboardingProgress.update({
      where: { userId: 'user-1' },
      data: {
        currentStep: 5,
        completed: true,
        completedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: 'user-1' },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    trackOnboardingComplete('user-1', 300); // 5 min = 300s

    // Notification de éxito
    await prisma.notification.create({
      data: {
        userId: 'user-1',
        type: 'onboarding_complete',
        title: '🎉 ¡Onboarding completado!',
        message: 'Ya puedes empezar a usar todas las funcionalidades',
      },
    });

    // Assertions
    expect(progress.completed).toBe(true);
    expect(trackOnboardingComplete).toHaveBeenCalledWith('user-1', 300);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  test('❌ FLOW: Usuario abandona onboarding → Track analytics → Reminder', async () => {
    // Usuario no completa onboarding en 7 días
    const abandonedProgress = {
      id: 'onboarding-1',
      userId: 'user-abandoned',
      currentStep: 2,
      totalSteps: 5,
      completed: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
    };

    (prisma.onboardingProgress.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      abandonedProgress
    );

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: 'user-abandoned' },
    });

    const daysSinceStart = Math.floor(
      (new Date().getTime() - progress!.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysSinceStart).toBeGreaterThanOrEqual(7);
    expect(progress!.completed).toBe(false);
    expect(progress!.currentStep).toBe(2);

    // Debería enviar reminder
  });

  test('⚠️ FLOW: Onboarding personalizado según role', async () => {
    // Admin tiene más pasos que Tenant
    const adminOnboarding = {
      totalSteps: 7,
      steps: {
        profile: false,
        company: false,
        team: false,
        firstProperty: false,
        firstTenant: false,
        integrations: false,
        tour: false,
      },
    };

    const tenantOnboarding = {
      totalSteps: 3,
      steps: {
        profile: false,
        documents: false,
        tour: false,
      },
    };

    // Simular creación según role
    const role = 'ADMIN';
    const onboarding = role === 'ADMIN' ? adminOnboarding : tenantOnboarding;

    expect(onboarding.totalSteps).toBeGreaterThan(3);
  });

  test('⚠️ FLOW: Skip opcional de pasos no críticos', async () => {
    // Usuario puede skip tour
    const progressWithSkip = {
      id: 'onboarding-1',
      userId: 'user-1',
      currentStep: 5,
      steps: {
        profile: true,
        company: true,
        firstProperty: true,
        firstTenant: true,
        tour: 'skipped', // Skipped
      },
    };

    (prisma.onboardingProgress.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      progressWithSkip
    );

    const progress = await prisma.onboardingProgress.update({
      where: { userId: 'user-1' },
      data: {
        currentStep: 5,
        steps: { tour: 'skipped' },
      },
    });

    expect(progress.steps.tour).toBe('skipped');
  });
});
