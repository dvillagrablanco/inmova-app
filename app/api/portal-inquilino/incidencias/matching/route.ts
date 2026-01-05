/**
 * API de Matching IA para Incidencias
 * POST: Obtener proveedores recomendados para una incidencia
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { tenantProviderMatching } from '@/lib/tenant-provider-matching-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const matchingSchema = z.object({
  tipo: z.string().min(1),
  descripcion: z.string().min(5),
  urgencia: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  unitId: z.string().optional(),
  fotos: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = matchingSchema.parse(body);

    // Obtener matching de proveedores
    const matchingResult = await tenantProviderMatching.matchProviders({
      tenantId,
      tipo: validated.tipo,
      descripcion: validated.descripcion,
      urgencia: validated.urgencia || 'media',
      unitId: validated.unitId,
      fotos: validated.fotos,
    });

    return NextResponse.json({
      success: true,
      data: matchingResult,
    });
  } catch (error: any) {
    console.error('[Matching Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error obteniendo matching' },
      { status: 500 }
    );
  }
}
