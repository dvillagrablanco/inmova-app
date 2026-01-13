/**
 * Disparador de llamadas outbound con Retell AI
 * 
 * Funciones para iniciar llamadas salientes a leads
 */

// Tipos para la API de Retell
interface RetellCreateCallRequest {
  agent_id: string;
  customer_number: string;
  from_number?: string;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, string>;
}

interface RetellCreateCallResponse {
  call_id: string;
  agent_id: string;
  call_status: string;
  metadata?: Record<string, unknown>;
}

interface Lead {
  id: string;
  nombre: string;
  apellidos?: string | null;
  telefono?: string | null;
  email?: string | null;
  empresa?: string | null;
  cargo?: string | null;
  linkedinUrl?: string | null;
  enrichmentData?: Record<string, unknown> | null;
  outboundStatus?: string | null;
  outboundCallAttempts?: number;
}

// Configuración de Retell
const RETELL_API_URL = 'https://api.retellai.com';
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_AGENT_ID = process.env.RETELL_OUTBOUND_AGENT_ID || process.env.RETELL_AGENT_ID;
const RETELL_FROM_NUMBER = process.env.RETELL_FROM_NUMBER; // Número desde el que se llama

// Prompt personalizado para outbound
const OUTBOUND_PROMPT_TEMPLATE = `Eres Carmen, asistente comercial de Inmova. Estás haciendo una llamada de prospección.

DATOS DEL CONTACTO:
- Nombre: {{fullName}}
- Cargo: {{role}}
- Empresa: {{company}}
- LinkedIn: {{linkedinUrl}}

SCRIPT DE APERTURA:
"Hola {{firstName}}, soy Carmen de Inmova. He visto tu perfil en LinkedIn como {{role}} en {{company}} y quería preguntarte si trabajáis con herramientas de gestión digital para vuestras propiedades o alquileres."

OBJETIVO:
1. Verificar si gestiona propiedades inmobiliarias
2. Identificar pain points (impagos, comunicación con inquilinos, etc.)
3. Cualificar: número de propiedades, tipo de gestión
4. Si hay interés, proponer demo de 15 minutos
5. Si no gestiona propiedades, agradecer y terminar amablemente

RESPUESTAS A OBJECIONES:
- "No tengo tiempo": "Lo entiendo perfectamente. ¿Te viene mejor que te llame otro día? Solo serían 2 minutos para ver si podemos ayudaros."
- "Ya tenemos software": "Genial que ya estéis digitalizados. ¿Puedo preguntarte qué herramienta usáis? Muchos clientes nos eligen por [ventaja específica]."
- "No me interesa": "Entendido, no te quito más tiempo. Si en algún momento necesitáis una solución de gestión, aquí estamos. ¡Buen día!"

ESTILO:
- Natural y profesional, no robótico
- Respuestas cortas (máximo 2 frases)
- Si detectas que no es buen momento, ofrece llamar otro día
- NUNCA insistas más de una vez si dicen que no

HERRAMIENTAS:
- Puedes consultar disponibilidad para agendar demo
- Puedes crear la cita directamente si confirman`;

/**
 * Dispara una llamada outbound a un lead usando Retell AI
 */
export async function triggerOutboundCall(lead: Lead): Promise<{
  success: boolean;
  callId?: string;
  error?: string;
}> {
  // Validaciones
  if (!RETELL_API_KEY) {
    console.error('[Outbound Caller] RETELL_API_KEY not configured');
    return { success: false, error: 'Retell API key not configured' };
  }

  if (!RETELL_AGENT_ID) {
    console.error('[Outbound Caller] RETELL_AGENT_ID not configured');
    return { success: false, error: 'Retell agent ID not configured' };
  }

  if (!lead.telefono) {
    return { success: false, error: 'Lead does not have phone number' };
  }

  // Preparar variables dinámicas para el prompt
  const fullName = `${lead.nombre}${lead.apellidos ? ' ' + lead.apellidos : ''}`;
  const firstName = lead.nombre;
  
  const dynamicVariables: Record<string, string> = {
    fullName,
    firstName,
    role: lead.cargo || 'profesional del sector inmobiliario',
    company: lead.empresa || 'tu empresa',
    linkedinUrl: lead.linkedinUrl || '',
    leadId: lead.id,
  };

  try {
    console.log('[Outbound Caller] Initiating call to:', {
      leadId: lead.id,
      phone: lead.telefono.replace(/\d{4}$/, '****'), // Ocultar últimos 4 dígitos
      name: fullName,
    });

    // Llamar a la API de Retell
    const response = await fetch(`${RETELL_API_URL}/v2/create-phone-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: RETELL_AGENT_ID,
        customer_number: lead.telefono,
        from_number: RETELL_FROM_NUMBER,
        metadata: {
          lead_id: lead.id,
          lead_name: fullName,
          lead_company: lead.empresa,
          call_type: 'outbound_prospecting',
          source: 'inmova_outbound',
        },
        retell_llm_dynamic_variables: dynamicVariables,
      } as RetellCreateCallRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Outbound Caller] Retell API error:', {
        status: response.status,
        error: errorData,
      });
      return {
        success: false,
        error: `Retell API error: ${response.status} - ${JSON.stringify(errorData)}`,
      };
    }

    const data: RetellCreateCallResponse = await response.json();

    console.log('[Outbound Caller] Call initiated:', {
      callId: data.call_id,
      leadId: lead.id,
    });

    // Actualizar el lead en la base de datos
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        outboundStatus: 'CONTACTED',
        outboundCallAttempts: (lead.outboundCallAttempts || 0) + 1,
        outboundLastAttemptAt: new Date(),
        ultimoContacto: new Date(),
        numeroContactos: { increment: 1 },
      },
    });

    // Crear registro de la llamada en RetellCall
    await prisma.retellCall.create({
      data: {
        retellCallId: data.call_id,
        retellAgentId: RETELL_AGENT_ID,
        fromNumber: RETELL_FROM_NUMBER || null,
        toNumber: lead.telefono,
        leadId: lead.id,
        direction: 'outbound',
        status: 'in_progress',
        metadata: {
          callType: 'outbound_prospecting',
          dynamicVariables,
        },
      },
    });

    return {
      success: true,
      callId: data.call_id,
    };

  } catch (error: any) {
    console.error('[Outbound Caller] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifica si se puede llamar a un lead
 */
export function canCallLead(lead: Lead): { canCall: boolean; reason?: string } {
  if (!lead.telefono) {
    return { canCall: false, reason: 'No phone number' };
  }

  if (lead.outboundStatus === 'REJECTED') {
    return { canCall: false, reason: 'Lead rejected' };
  }

  if (lead.outboundStatus === 'QUALIFIED') {
    return { canCall: false, reason: 'Lead already qualified' };
  }

  // Máximo 3 intentos
  if ((lead.outboundCallAttempts || 0) >= 3) {
    return { canCall: false, reason: 'Max attempts reached' };
  }

  // Verificar horario comercial (9:00 - 20:00 España)
  const now = new Date();
  const spainTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const hour = spainTime.getHours();
  const dayOfWeek = spainTime.getDay();

  // No llamar fines de semana
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { canCall: false, reason: 'Weekend' };
  }

  // Solo llamar de 9:00 a 20:00
  if (hour < 9 || hour >= 20) {
    return { canCall: false, reason: 'Outside business hours' };
  }

  return { canCall: true };
}

/**
 * Obtiene el prompt personalizado para un lead
 */
export function getOutboundPrompt(lead: Lead): string {
  const fullName = `${lead.nombre}${lead.apellidos ? ' ' + lead.apellidos : ''}`;
  
  return OUTBOUND_PROMPT_TEMPLATE
    .replace(/\{\{fullName\}\}/g, fullName)
    .replace(/\{\{firstName\}\}/g, lead.nombre)
    .replace(/\{\{role\}\}/g, lead.cargo || 'profesional del sector inmobiliario')
    .replace(/\{\{company\}\}/g, lead.empresa || 'tu empresa')
    .replace(/\{\{linkedinUrl\}\}/g, lead.linkedinUrl || '');
}
