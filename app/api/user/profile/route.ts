/**
 * API para gestionar el perfil del usuario
 * 
 * Permite actualizar:
 * - Perfil de cliente (propietario, gestor, etc.)
 * - Nivel de experiencia
 * - Preferencias de UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const updateProfileSchema = z.object({
  clientProfile: z.enum([
    'propietario_individual',
    'inversor_pequeno',
    'gestor_profesional',
    'agencia_inmobiliaria',
    'administrador_fincas',
    'promotor_inmobiliario',
    'empresa_coliving',
    'empresa_str',
    'fondo_inversion',
  ]).optional(),
  experienceLevel: z.enum(['principiante', 'intermedio', 'avanzado']).optional(),
  techSavviness: z.enum(['bajo', 'medio', 'alto']).optional(),
  preferredModules: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
  uiPreferences: z.object({
    sidebarCollapsed: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    compactMode: z.boolean().optional(),
    showTips: z.boolean().optional(),
  }).optional(),
}).strict();

/**
 * GET /api/user/profile
 * Obtiene el perfil completo del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // Campos de perfil personalizados (si existen en el schema)
        experienceLevel: true,
        techSavviness: true,
        portfolioSize: true,
        businessVertical: true,
        preferredModules: true,
        onboardingCompleted: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            nombre: true,
            subscriptionPlan: {
              select: {
                id: true,
                nombre: true,
                tier: true,
              },
            },
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Construir respuesta con campos adicionales del localStorage/memoria
    const profile = {
      ...user,
      // Estos pueden venir de la BD o del localStorage
      clientProfile: (user as any).clientProfile || 'propietario_individual',
      subscriptionPlan: user.company?.subscriptionPlan?.tier?.toLowerCase() || 'free',
    };
    
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error obteniendo perfil' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Actualiza campos específicos del perfil
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);
    
    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Mapear campos validados a campos de la BD
        ...(validatedData.experienceLevel && {
          experienceLevel: validatedData.experienceLevel,
        }),
        ...(validatedData.techSavviness && {
          techSavviness: validatedData.techSavviness,
        }),
        ...(validatedData.preferredModules && {
          preferredModules: validatedData.preferredModules,
        }),
        ...(validatedData.onboardingCompleted !== undefined && {
          onboardingCompleted: validatedData.onboardingCompleted,
        }),
        // Guardar clientProfile en un campo JSON o extendido
        // Esto depende de tu schema de Prisma
      },
      select: {
        id: true,
        email: true,
        experienceLevel: true,
        techSavviness: true,
        preferredModules: true,
        onboardingCompleted: true,
      },
    });
    
    // Si se actualizó el perfil de cliente, guardarlo también
    // (puede requerir un campo adicional en el schema)
    if (validatedData.clientProfile) {
      // Guardar en metadata o tabla separada si es necesario
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          // Si tienes un campo JSON para metadata:
          // metadata: { ...existingMetadata, clientProfile: validatedData.clientProfile }
          // O un campo específico:
          businessVertical: mapClientProfileToVertical(validatedData.clientProfile),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      profile: updatedUser,
      message: 'Perfil actualizado correctamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    
    console.error('[API Error] PATCH /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error actualizando perfil' },
      { status: 500 }
    );
  }
}

/**
 * Mapea el perfil de cliente a la vertical de negocio
 */
function mapClientProfileToVertical(clientProfile: string): string {
  const mapping: Record<string, string> = {
    propietario_individual: 'RESIDENTIAL',
    inversor_pequeno: 'RESIDENTIAL',
    gestor_profesional: 'PROPERTY_MANAGEMENT',
    agencia_inmobiliaria: 'REAL_ESTATE_AGENCY',
    administrador_fincas: 'COMMUNITY_MANAGEMENT',
    promotor_inmobiliario: 'CONSTRUCTION',
    empresa_coliving: 'COLIVING',
    empresa_str: 'SHORT_TERM_RENTAL',
    fondo_inversion: 'INSTITUTIONAL',
  };
  
  return mapping[clientProfile] || 'RESIDENTIAL';
}
