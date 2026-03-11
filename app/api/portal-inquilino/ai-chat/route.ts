import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/portal-inquilino/ai-chat
 * Chatbot IA para inquilinos en su portal.
 * Responde consultas: saldo, contrato, incidencias, documentos.
 * Crea incidencias automáticamente cuando detecta un problema.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const userEmail = session.user.email || '';

    // Obtener datos del inquilino
    const tenant = await prisma.tenant.findFirst({
      where: { email: userEmail },
    });

    const contracts = tenant
      ? await prisma.contract.findMany({
          where: { tenantId: tenant.id, estado: 'activo' },
          include: {
            unit: { include: { building: { select: { nombre: true, direccion: true } } } },
            payments: { orderBy: { fechaVencimiento: 'desc' }, take: 6 },
          },
          orderBy: { fechaInicio: 'desc' },
          take: 1,
        })
      : [];
    const contract = contracts[0];
    const maintenanceRequests =
      tenant && contract?.unitId
        ? await prisma.maintenanceRequest.findMany({
            where: {
              unitId: contract.unitId,
              estado: { in: ['pendiente', 'en_progreso'] },
            },
            orderBy: { fechaSolicitud: 'desc' },
            take: 5,
          })
        : [];

    // Contexto del inquilino para la IA
    const payments = contract?.payments || [];
    const pendingPayments = payments.filter(
      (p: any) => p.estado === 'pendiente' || p.estado === 'atrasado'
    );
    const openIncidencias = maintenanceRequests.length || 0;

    const tenantContext = tenant
      ? `
Datos del inquilino:
- Nombre: ${tenant.nombreCompleto}
- Edificio: ${contract?.unit?.building?.nombre || 'N/A'}, Unidad: ${contract?.unit?.numero || 'N/A'}
- Renta mensual: ${contract?.rentaMensual || 0}€
- Contrato hasta: ${contract?.fechaFin ? new Date(contract.fechaFin).toLocaleDateString('es-ES') : 'N/A'}
- Pagos pendientes: ${pendingPayments.length} (${pendingPayments.reduce((s: number, p: any) => s + p.monto, 0)}€)
- Incidencias abiertas: ${openIncidencias}
- Últimos pagos: ${payments
          .slice(0, 3)
          .map((p: any) => `${p.periodo}: ${p.monto}€ (${p.estado})`)
          .join(', ')}
`
      : 'No se encontraron datos del inquilino.';

    // Llamar a Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response: 'El asistente no está disponible en este momento. Contacta con tu gestor.',
      });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `Eres el asistente virtual del portal de inquilinos de INMOVA. Hablas español.

Tu rol:
- Responder consultas sobre pagos, contratos, incidencias
- Si el inquilino reporta un PROBLEMA (fuga, avería, ruido, etc.), responde con empatía y di que vas a crear una incidencia
- Sé amable, claro y conciso
- Si no sabes algo, sugiere contactar con el gestor

Cuando detectes que el inquilino reporta un problema técnico, incluye en tu respuesta la etiqueta [CREAR_INCIDENCIA: descripción del problema] para que el sistema la cree automáticamente.

${tenantContext}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 500,
      messages: [{ role: 'user', content: message }],
      system: systemPrompt,
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    // Detectar si hay que crear incidencia
    const incidenciaMatch = aiResponse.match(/\[CREAR_INCIDENCIA:\s*(.+?)\]/);
    let incidenciaCreada = null;

    if (incidenciaMatch && tenant && contract?.unitId) {
      try {
        const incidencia = await prisma.maintenanceRequest.create({
          data: {
            unitId: contract.unitId,
            titulo: incidenciaMatch[1].substring(0, 100),
            descripcion: `Reportado por inquilino via chatbot: ${message}`,
            prioridad: 'media',
            estado: 'pendiente',
            fechaSolicitud: new Date(),
          },
        });
        incidenciaCreada = incidencia.id;
        logger.info(
          `[Tenant Chat] Incidencia creada: ${incidencia.id} por ${tenant.nombreCompleto}`
        );
      } catch (err) {
        logger.warn('[Tenant Chat] Error creando incidencia:', err);
      }
    }

    // Limpiar etiqueta de la respuesta
    const cleanResponse = aiResponse.replace(/\[CREAR_INCIDENCIA:\s*.+?\]/g, '').trim();

    return NextResponse.json({
      response: cleanResponse,
      incidenciaCreada,
    });
  } catch (error: any) {
    logger.error('[Tenant AI Chat]:', error);
    return NextResponse.json({
      response: 'Lo siento, ha ocurrido un error. Por favor, contacta con tu gestor.',
    });
  }
}
