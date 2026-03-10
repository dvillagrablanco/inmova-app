/**
 * API: Asistente IA contextual por módulo
 * POST /api/ai/module-assistant
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MODULE_SYSTEM_PROMPTS: Record<string, string> = {
  liquidaciones:
    'Experto en liquidaciones inmobiliarias y cálculos de honorarios. Conoces gastos repercutibles, prorrateos, retenciones y normativa española.',
  facturacion:
    'Experto en facturación española: IVA, IRPF, Verifactu, series, facturas rectificativas y normativa contable.',
  candidatos:
    'Experto en scoring de inquilinos, análisis de solvencia, documentación requerida y mejores prácticas de selección.',
  incidencias:
    'Experto en clasificación de incidencias, estimación de costes de reparación, priorización y gestión de mantenimiento.',
  'contratos-gestion':
    'Experto en contratos de gestión inmobiliaria: modelos, honorarios de mercado, cláusulas esenciales y normativa.',
  'check-in-out':
    'Experto en procesos de check-in y check-out: checklists, lecturas de contadores, documentación necesaria y estado del inmueble.',
  reportes:
    'Experto en interpretación de KPIs inmobiliarios, detección de anomalías en datos y recomendaciones de mejora.',
  'acciones-masivas':
    'Experto en operaciones masivas: cobros, gastos, transferencias y buenas prácticas para lotes.',
  suministros:
    'Experto en gestión de suministros (luz, gas, agua, internet): contratos, lecturas, cambio de titular y repercusión.',
  avalistas:
    'Experto en avalistas y garantías: tipos (personal, bancaria, seguro), requisitos y normativa.',
  'actualizaciones-renta':
    'Experto en actualizaciones de renta: IPC, renta de referencia, comunicación al inquilino y plazos legales.',
  'garajes-trasteros':
    'Experto en gestión de garajes y trasteros: vinculación a viviendas, precios de mercado y documentación.',
  visitas:
    'Experto en visitas inmobiliarias: horarios óptimos, preparación del inmueble y tips para conversión.',
};

const MODULE_FALLBACK_TIPS: Record<string, string[]> = {
  liquidaciones: [
    'Los honorarios suelen calcularse como % sobre la renta cobrada o fijo mensual.',
    'Gastos repercutibles: comunidad, IBI, seguros obligatorios según contrato.',
    'Documenta siempre las deducciones en la liquidación.',
  ],
  facturacion: [
    'Servicios inmobiliarios: IVA 21% o exento según tipo de operación.',
    'Retención IRPF 15% para profesionales (autónomos).',
    'Verifactu obligatorio desde 2025 para facturas electrónicas.',
  ],
  candidatos: [
    'Pide nóminas, contrato laboral y referencias bancarias.',
    'Regla 30%: la renta no debería superar el 30% de ingresos netos.',
    'Verifica identidad con DNI y situación laboral estable.',
  ],
  incidencias: [
    'Clasifica por tipo: avería, ruido, limpieza, seguridad, etc.',
    'Prioriza: urgente > alta > media > baja.',
    'Documenta con fotos y descripción detallada.',
  ],
  'contratos-gestion': [
    'Honorarios integral: 8-12% renta. Parcial: 4-6%.',
    'Incluye cláusula de exclusividad y duración mínima.',
    'Especifica qué gastos asume el propietario.',
  ],
  'check-in-out': [
    'Checklist: estado paredes, electrodomésticos, contadores, llaves.',
    'Fotografías del estado inicial/final.',
    'Acta firmada por ambas partes.',
  ],
  reportes: [
    'Compara periodos para detectar tendencias.',
    'Ocupación objetivo: >95% en alquiler residencial.',
    'Morosidad: alerta si supera 5% del portfolio.',
  ],
  'acciones-masivas': [
    'Valida datos antes de ejecutar lotes.',
    'Mantén trazabilidad de cada operación.',
    'Permite rollback en caso de error.',
  ],
  suministros: [
    'Registra lecturas periódicamente para detectar anomalías.',
    'Cambio de titular: documentación del nuevo inquilino.',
    'Repercusión: prorrateo por días de ocupación.',
  ],
  avalistas: [
    'Aval personal: verificar solvencia del avalista.',
    'Aval bancario: suele ser 3-6 meses de renta.',
    'Seguro de impago: alternativa al aval tradicional.',
  ],
  'actualizaciones-renta': [
    'IPC: revisión anual, comunicar con 1 mes de antelación.',
    'Renta referencia: límite legal por zona.',
    'Documenta la comunicación por escrito.',
  ],
  'garajes-trasteros': [
    'Vincula garaje/trastero al contrato de vivienda.',
    'Precio típico garaje: 50-150€/mes según zona.',
    'Incluye en el inventario si aplica.',
  ],
  visitas: [
    'Horarios óptimos: fines de semana mañana, entre semana tarde.',
    'Prepara el inmueble: limpio, iluminado, climatizado.',
    'Ten documentación lista: ficha, precios, disponibilidad.',
  ],
};

const DEFAULT_FALLBACK = [
  'Consulta la documentación del módulo.',
  'Revisa las mejores prácticas del sector.',
  'Contacta con soporte si necesitas ayuda específica.',
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { module: moduleId, context = '', question = '' } = body;

    if (!moduleId || typeof moduleId !== 'string') {
      return NextResponse.json(
        { error: 'Parámetro module requerido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey.length > 10 && !apiKey.includes('placeholder')) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey });

        const systemPrompt =
          MODULE_SYSTEM_PROMPTS[moduleId] ||
          `Experto en el módulo "${moduleId}" de gestión inmobiliaria. Responde de forma concisa y práctica.`;

        const userContent = [
          context ? `Contexto actual: ${context}` : null,
          question ? `Pregunta: ${question}` : '¿Qué sugerencias o ayuda puedo ofrecerte sobre este módulo?',
        ]
          .filter(Boolean)
          .join('\n\n');

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL_PRIMARY,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        });

        const textContent = response.content[0];
        const responseText =
          textContent.type === 'text' ? textContent.text : 'No pude generar una respuesta.';

        return NextResponse.json({
          response: responseText,
          suggestions: MODULE_FALLBACK_TIPS[moduleId]?.slice(0, 3),
          source: 'ai',
        });
      } catch (aiError) {
        console.warn('[ModuleAssistant] AI error, using fallback:', aiError);
      }
    }

    const tips =
      MODULE_FALLBACK_TIPS[moduleId] || DEFAULT_FALLBACK;
    const fallbackMessage = question
      ? `Sin acceso a IA en este momento. Para "${question}":\n\n${tips.map((t) => `• ${t}`).join('\n')}`
      : `Consejos para el módulo ${moduleId}:\n\n${tips.map((t) => `• ${t}`).join('\n')}`;

    return NextResponse.json({
      response: fallbackMessage,
      suggestions: tips.slice(0, 5),
      source: 'fallback',
    });
  } catch (error) {
    console.error('[ModuleAssistant Error]:', error);
    return NextResponse.json(
      { error: 'Error en el asistente' },
      { status: 500 }
    );
  }
}
