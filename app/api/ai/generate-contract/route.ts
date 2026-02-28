import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const contractSchema = z.object({
  tenantName: z.string(),
  tenantDni: z.string(),
  buildingName: z.string(),
  unitNumber: z.string(),
  address: z.string(),
  rentaMensual: z.number(),
  deposito: z.number(),
  duracionMeses: z.number().default(12),
  fechaInicio: z.string(),
  tipo: z.enum(['vivienda_habitual', 'temporada', 'local_comercial', 'garaje']).default('vivienda_habitual'),
  clausulasExtra: z.array(z.string()).optional(),
  mascotasPermitidas: z.boolean().default(false),
  obrasPermitidas: z.boolean().default(false),
});

/**
 * POST /api/ai/generate-contract
 * Genera contrato LAU personalizado con IA.
 * Input: datos básicos → Output: contrato HTML completo.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const data = contractSchema.parse(body);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const tipoContrato = {
      vivienda_habitual: 'arrendamiento de vivienda habitual (LAU Art. 2)',
      temporada: 'arrendamiento de temporada (LAU Art. 3)',
      local_comercial: 'arrendamiento de local comercial (LAU Art. 3)',
      garaje: 'arrendamiento de plaza de garaje',
    }[data.tipo];

    const prompt = `Genera un contrato de ${tipoContrato} en España conforme a la Ley de Arrendamientos Urbanos (LAU) vigente.

DATOS:
- Arrendador: ${session.user.name || 'Sociedad arrendadora'} (empresa)
- Arrendatario: ${data.tenantName}, DNI/NIE: ${data.tenantDni}
- Inmueble: ${data.address} (${data.buildingName}, ${data.unitNumber})
- Renta mensual: ${data.rentaMensual}€
- Fianza: ${data.deposito}€ (${data.deposito / data.rentaMensual} mensualidades)
- Duración: ${data.duracionMeses} meses
- Fecha inicio: ${data.fechaInicio}
- Mascotas: ${data.mascotasPermitidas ? 'Permitidas' : 'No permitidas'}
- Obras menores: ${data.obrasPermitidas ? 'Permitidas con autorización' : 'No permitidas'}
${data.clausulasExtra?.length ? `- Cláusulas adicionales: ${data.clausulasExtra.join('; ')}` : ''}

REQUISITOS:
- Formato HTML limpio (sin <html><head><body>, solo contenido)
- Incluir: partes, objeto, duración, renta, fianza, obligaciones, clausulas LAU
- Para vivienda habitual: duración mínima 5 años (LAU Art. 9), actualización IPC
- Para temporada: especificar motivo de temporalidad
- Numerar cláusulas (PRIMERA, SEGUNDA...)
- Incluir espacio para firmas al final
- Redacción jurídica profesional en español`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const contractHtml = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      success: true,
      contract: contractHtml,
      metadata: {
        tipo: data.tipo,
        inquilino: data.tenantName,
        renta: data.rentaMensual,
        duracion: data.duracionMeses,
        generadoPor: 'Claude IA',
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[Generate Contract]:', error);
    return NextResponse.json({ error: 'Error generando contrato' }, { status: 500 });
  }
}
