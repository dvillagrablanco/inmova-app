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
  tipo: z.enum([
    'vivienda_habitual', 'temporada', 'local_comercial', 'garaje',
    'habitaciones', 'rent_to_rent', 'reforma', 'arras', 'trastero',
  ]).default('vivienda_habitual'),
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

    const tipoContrato: Record<string, string> = {
      vivienda_habitual: 'arrendamiento de vivienda habitual (LAU Art. 2)',
      temporada: 'arrendamiento de temporada (LAU Art. 3)',
      local_comercial: 'arrendamiento de local comercial (LAU Art. 3)',
      garaje: 'arrendamiento de plaza de garaje',
      habitaciones: 'arrendamiento de habitación (Código Civil Art. 1554+, NO regulado por LAU)',
      rent_to_rent: 'subarriendo autorizado (LAU Art. 8 + autorización propietario)',
      reforma: 'contrato de obra de reforma entre propietario y contratista',
      arras: 'contrato de arras (penitenciales, Art. 1454 Código Civil)',
      trastero: 'arrendamiento de trastero (no vivienda, Código Civil)',
    };
    const tipoDesc = tipoContrato[data.tipo] || data.tipo;

    const clausulasEspecificas: Record<string, string> = {
      habitaciones: `
CLÁUSULAS ESPECÍFICAS OBLIGATORIAS PARA ALQUILER DE HABITACIÓN:
- Especificar la habitación exacta que se arrienda y las zonas comunes compartidas (cocina, baño, salón)
- Incluir inventario de mobiliario de la habitación
- Suministros incluidos (electricidad, agua, internet, gas) y límites de consumo si aplica
- Normas de convivencia (horarios, limpieza zonas comunes, visitas, ruido)
- Fianza: 1 mensualidad (no aplica mínimo LAU al no ser vivienda habitual)
- Régimen jurídico: Código Civil (Arts. 1554 y ss.), NO la LAU
- Clausula de desistimiento con preaviso de 30 días`,
      rent_to_rent: `
CLÁUSULAS ESPECÍFICAS OBLIGATORIAS PARA RENT-TO-RENT:
- Autorización expresa del propietario para subarrendar (adjuntar como anexo)
- Responsabilidad solidaria del arrendatario principal ante el propietario
- Plazo mínimo del contrato principal que cubra el subarriendo
- Condiciones del subarriendo: precio máximo, perfil de subarrendatarios, uso
- Obligación de mantener seguro de responsabilidad civil
- Devolución del inmueble en el estado recibido al finalizar`,
      reforma: `
CLÁUSULAS ESPECÍFICAS OBLIGATORIAS PARA CONTRATO DE REFORMA:
- Presupuesto cerrado con desglose por partidas (anexo obligatorio)
- Calidades y materiales especificados (marcas, modelos o equivalentes)
- Plazo de ejecución con fecha inicio y fin, y penalización por retraso (ej: 0.5% presupuesto/semana)
- Forma de pago por hitos (ej: 30% inicio, 40% mitad obra, 30% al finalizar)
- Garantía post-obra mínima 1 año sobre mano de obra y 2 años sobre materiales
- Licencia de obra a cargo de: propietario/contratista (especificar)
- Seguro de responsabilidad civil del contratista obligatorio
- Gestión de residuos y contenedor a cargo de: especificar`,
      arras: `
CLÁUSULAS ESPECÍFICAS OBLIGATORIAS PARA CONTRATO DE ARRAS:
- Tipo de arras: PENITENCIALES (Art. 1454 CC) - si comprador desiste pierde la señal, si vendedor desiste devuelve el doble
- Importe de las arras: especificar cantidad y forma de pago
- Plazo máximo para formalizar escritura pública de compraventa
- Condiciones suspensivas (si aplican): obtención de financiación hipotecaria, resultado ITE, etc.
- Estado de cargas del inmueble (referencia a nota simple)
- Descripción registral y catastral del inmueble
- Penalización por incumplimiento de plazos
- Distribución de gastos de la compraventa (ITP, notaría, registro, plusvalía)`,
      trastero: `
CLÁUSULAS ESPECÍFICAS PARA ARRENDAMIENTO DE TRASTERO:
- Uso exclusivo: almacenamiento de enseres personales (prohibir mercancías peligrosas, perecederas, animales)
- Sin derecho a pernocta ni uso como vivienda
- Régimen: Código Civil, no LAU
- Horario de acceso si aplica
- Seguro del contenido a cargo del arrendatario`,
    };
    const extraClauses = clausulasEspecificas[data.tipo] || '';

    const prompt = `Genera un contrato de ${tipoDesc} en España conforme a la legislación vigente.

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
- Incluir: partes, objeto, duración, renta, fianza, obligaciones
- Para vivienda habitual: duración mínima 5 años (LAU Art. 9), actualización IPC
- Para temporada: especificar motivo de temporalidad
- Numerar cláusulas (PRIMERA, SEGUNDA...)
- Incluir espacio para firmas al final
- Redacción jurídica profesional en español
${extraClauses}`;

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
