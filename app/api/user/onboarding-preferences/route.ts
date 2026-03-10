/**
 * API para guardar preferencias de onboarding
 *
 * Almacena rentalType y needs en un store in-memory keyed por userId.
 * Auth requerida.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RENTAL_TYPES = [
  'larga_duracion',
  'media_estancia',
  'corta_duracion',
  'habitaciones',
  'coliving',
  'varios',
] as const;

const VALID_NEEDS = [
  'centralizar_info',
  'contratos',
  'contabilidad',
  'facturas',
  'solvencia',
  'conciliacion',
  'recordatorios',
  'portales',
  'rentabilidad',
  'comunicacion',
  'incidencias',
  'suministros',
  'reservas',
  'portales_portal',
  'liquidaciones',
];

const updateSchema = z.object({
  rentalType: z.enum(RENTAL_TYPES).optional(),
  needs: z.array(z.string().refine((v) => VALID_NEEDS.includes(v))).optional(),
});

type OnboardingPreferences = {
  rentalType?: (typeof RENTAL_TYPES)[number];
  needs?: string[];
};

const onboardingStore = new Map<string, OnboardingPreferences>();

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const userId = session.user.id;
    const existing = onboardingStore.get(userId) ?? {};

    const updated: OnboardingPreferences = {
      ...existing,
      ...(validated.rentalType !== undefined && { rentalType: validated.rentalType }),
      ...(validated.needs !== undefined && { needs: validated.needs }),
    };

    onboardingStore.set(userId, updated);

    return NextResponse.json({ success: true, preferences: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error guardando preferencias' },
      { status: 500 }
    );
  }
}
