/**
 * API Route para resetear onboarding de usuarios
 * Solo accesible por superadmin
 * POST /api/admin/reset-onboarding
 * 
 * Body: { userIds?: string[] } - IDs específicos, o todos los usuarios de prueba si no se especifica
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TEST_USER_EMAILS = [
  'admin@inmova.app',
  'test@inmova.app',
  'demo@inmova.app',
];

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // 2. Obtener IDs de usuarios a resetear
    const body = await request.json().catch(() => ({}));
    const { userIds } = body as { userIds?: string[] };

    let targetUsers;

    if (userIds && userIds.length > 0) {
      // IDs específicos
      targetUsers = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      });
    } else {
      // Usuarios de prueba por defecto
      targetUsers = await prisma.user.findMany({
        where: {
          email: { in: TEST_USER_EMAILS },
        },
        select: { id: true, email: true },
      });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron usuarios para actualizar',
        updated: 0,
      });
    }

    // 3. Resetear onboarding para cada usuario
    let updated = 0;
    const results = [];

    for (const user of targetUsers) {
      try {
        // Crear o actualizar preferencias
        await prisma.userPreferences.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            onboardingCompleted: false, // Forzar onboarding
            theme: 'light',
            language: 'es',
          },
          update: {
            onboardingCompleted: false, // Reset
          },
        });

        updated++;
        results.push({
          email: user.email,
          status: 'updated',
        });
      } catch (error: any) {
        results.push({
          email: user.email,
          status: 'error',
          error: error.message,
        });
      }
    }

    // 4. Respuesta
    return NextResponse.json({
      success: true,
      updated,
      total: targetUsers.length,
      users: results,
      note: 'Los usuarios deben limpiar localStorage del navegador: localStorage.clear()',
    });

  } catch (error: any) {
    console.error('[Reset Onboarding API Error]:', error);
    return NextResponse.json(
      { error: 'Error reseteando onboarding', details: error.message },
      { status: 500 }
    );
  }
}
