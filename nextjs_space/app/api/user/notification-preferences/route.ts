// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    let preferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id }
    });

    // Si no existen preferencias, crear con valores por defecto
    if (!preferences) {
      preferences = await prisma.userPreference.create({
        data: {
          userId: session.user.id,
          notificationPreferences: {
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: false
          }
        }
      });
    }

    return NextResponse.json(preferences.notificationPreferences || {});
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Error al obtener preferencias', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const preferences = await request.json();

    const updated = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        notificationPreferences: preferences
      },
      update: {
        notificationPreferences: preferences
      }
    });

    return NextResponse.json({ 
      success: true,
      preferences: updated.notificationPreferences,
      message: 'Preferencias actualizadas exitosamente' 
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Error al actualizar preferencias', details: error.message },
      { status: 500 }
    );
  }
}
