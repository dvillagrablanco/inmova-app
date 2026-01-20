import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ViviendaSocialService } from '@/lib/services/vivienda-social-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const checkEligibilitySchema = z.object({
  ingresosFamiliares: z.number(),
  miembrosFamilia: z.number(),
  edadSolicitante: z.number(),
  tipoVivienda: z.string(),
  residenciaAnos: z.number(),
  discapacidad: z.boolean().optional(),
  familiaNumerosa: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const validated = checkEligibilitySchema.parse(body);
    const result = await ViviendaSocialService.checkEligibility({
      ...validated,
      discapacidad: validated.discapacidad || false,
      familiaNumerosa: validated.familiaNumerosa || false
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
