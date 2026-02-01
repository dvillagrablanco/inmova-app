/**
 * Webhook principal de Vapi
 * Recibe eventos de llamadas y procesa funciones
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos de eventos de Vapi
type VapiEventType = 
  | 'assistant-request'
  | 'function-call'
  | 'status-update'
  | 'transcript'
  | 'end-of-call-report'
  | 'hang'
  | 'speech-update';

interface VapiWebhookPayload {
  message: {
    type: VapiEventType;
    call?: {
      id: string;
      assistantId: string;
      phoneNumber?: string;
      customer?: {
        number: string;
        name?: string;
      };
      metadata?: Record<string, any>;
    };
    functionCall?: {
      name: string;
      parameters: Record<string, any>;
    };
    transcript?: string;
    status?: string;
    endedReason?: string;
    summary?: string;
    messages?: any[];
    recordingUrl?: string;
    cost?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: VapiWebhookPayload = await request.json();
    const { message } = payload;
    
    console.log('[Vapi Webhook]', message.type, JSON.stringify(message, null, 2));
    
    switch (message.type) {
      // --------------------------------------------------------------------------
      // SOLICITUD DE ASISTENTE (para llamadas entrantes dinámicas)
      // --------------------------------------------------------------------------
      case 'assistant-request':
        // Aquí podrías retornar un asistente diferente según el número que llama
        return NextResponse.json({
          // Usar el asistente por defecto configurado
        });
      
      // --------------------------------------------------------------------------
      // LLAMADA A FUNCIÓN
      // --------------------------------------------------------------------------
      case 'function-call':
        if (!message.functionCall) {
          return NextResponse.json({ error: 'No function call provided' }, { status: 400 });
        }
        
        const { name, parameters } = message.functionCall;
        const result = await handleFunctionCall(name, parameters, message.call);
        
        return NextResponse.json({ result });
      
      // --------------------------------------------------------------------------
      // ACTUALIZACIÓN DE ESTADO
      // --------------------------------------------------------------------------
      case 'status-update':
        await handleStatusUpdate(message.call, message.status);
        return NextResponse.json({ received: true });
      
      // --------------------------------------------------------------------------
      // TRANSCRIPCIÓN
      // --------------------------------------------------------------------------
      case 'transcript':
        // Podríamos guardar transcripciones en tiempo real
        return NextResponse.json({ received: true });
      
      // --------------------------------------------------------------------------
      // REPORTE DE FIN DE LLAMADA
      // --------------------------------------------------------------------------
      case 'end-of-call-report':
        await handleEndOfCallReport(message);
        return NextResponse.json({ received: true });
      
      // --------------------------------------------------------------------------
      // OTROS EVENTOS
      // --------------------------------------------------------------------------
      default:
        return NextResponse.json({ received: true });
    }
    
  } catch (error: any) {
    console.error('[Vapi Webhook Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// MANEJADORES DE FUNCIONES
// ============================================================================

async function handleFunctionCall(
  name: string,
  parameters: Record<string, any>,
  call?: any
): Promise<any> {
  console.log(`[Vapi Function] ${name}`, parameters);
  
  switch (name) {
    // --------------------------------------------------------------------------
    // FUNCIONES DEL RECEPCIONISTA (TRANSFERENCIAS)
    // --------------------------------------------------------------------------
    case 'transfer_to_agent':
      // Mapeo de agentes a sus IDs en Vapi
      const agentMapping: Record<string, string> = {
        sales: 'inmova-sales-agent',
        customer_service: 'inmova-customer-service-agent',
        incidents: 'inmova-incidents-agent',
        valuations: 'inmova-valuations-agent',
        acquisition: 'inmova-acquisition-agent',
        coliving: 'inmova-coliving-agent',
        communities: 'inmova-communities-agent',
      };
      
      const agentNames: Record<string, string> = {
        sales: 'Elena',
        customer_service: 'María',
        incidents: 'Carlos',
        valuations: 'Patricia',
        acquisition: 'Roberto',
        coliving: 'Laura',
        communities: 'Antonio',
      };

      const targetAgentId = agentMapping[parameters.targetAgent];
      const targetAgentName = agentNames[parameters.targetAgent] || parameters.targetAgent;
      
      return {
        success: true,
        transfer: true,
        targetAssistantId: targetAgentId,
        message: `Te transfiero con ${targetAgentName}, nuestro especialista en ${parameters.reason}. Un momento por favor.`,
        metadata: {
          customerName: parameters.customerName,
          customerPhone: parameters.customerPhone,
          summary: parameters.summary,
          originalAgent: 'receptionist',
        },
      };
    
    case 'get_business_hours':
      const hours: Record<string, { schedule: string; note: string }> = {
        ventas: { schedule: 'L-V 9:00-21:00, S 10:00-14:00', note: 'Asesoramiento comercial' },
        soporte: { schedule: 'L-V 8:00-20:00', note: 'Atención al cliente' },
        tecnico: { schedule: '24/7 emergencias', note: 'L-V 8:00-20:00 consultas generales' },
        valoraciones: { schedule: 'L-V 9:00-19:00', note: 'Tasaciones e informes' },
        captacion: { schedule: 'L-V 9:00-21:00', note: 'Propietarios' },
        coliving: { schedule: 'L-V 10:00-20:00', note: 'Espacios compartidos' },
        comunidades: { schedule: 'L-V 9:00-18:00', note: 'Administración de fincas' },
        general: { schedule: '24/7 con IA', note: 'Agentes humanos L-V 9:00-21:00' },
      };
      
      const dept = parameters.department || 'general';
      const deptHours = hours[dept] || hours.general;
      
      return {
        success: true,
        department: dept,
        schedule: deptHours.schedule,
        note: deptHours.note,
        message: `El departamento de ${dept} atiende ${deptHours.schedule}. ${deptHours.note}.`,
      };
    
    case 'leave_message':
      // Aquí integrarías con tu sistema de mensajes/tickets
      return {
        success: true,
        messageId: `MSG-${Date.now()}`,
        message: `He registrado tu mensaje para el departamento de ${parameters.department}. Te llamaremos ${parameters.preferredContactTime || 'lo antes posible'}. ¿Hay algo más en lo que pueda ayudarte?`,
        details: {
          customerName: parameters.customerName,
          customerPhone: parameters.customerPhone,
          customerEmail: parameters.customerEmail,
          department: parameters.department,
          urgency: parameters.urgency || 'media',
        },
      };
    
    case 'get_office_location':
      return {
        success: true,
        offices: [
          {
            city: 'Madrid',
            address: 'Calle Gran Vía 123, 28013 Madrid',
            phone: '+34 91 XXX XX XX',
            hours: 'L-V 9:00-19:00',
          },
          {
            city: 'Barcelona',
            address: 'Passeig de Gràcia 45, 08007 Barcelona',
            phone: '+34 93 XXX XX XX',
            hours: 'L-V 9:00-19:00',
          },
        ],
        message: 'Tenemos oficinas en Madrid y Barcelona. ¿Cuál te queda más cerca?',
      };
    
    case 'check_appointment_availability':
      // Simular disponibilidad
      return {
        success: true,
        available: true,
        slots: [
          { date: parameters.preferredDate || 'mañana', time: '10:00' },
          { date: parameters.preferredDate || 'mañana', time: '12:00' },
          { date: parameters.preferredDate || 'mañana', time: '16:00' },
        ],
        message: `Tengo disponibilidad para una cita ${parameters.appointmentType || 'telefónica'} el ${parameters.preferredDate || 'mañana'}. ¿A qué hora te vendría mejor: 10:00, 12:00 o 16:00?`,
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES COMPARTIDAS
    // --------------------------------------------------------------------------
    case 'transfer_to_human':
      return {
        success: true,
        message: `Transferencia solicitada al departamento de ${parameters.department}. Un agente humano se pondrá en contacto contigo en breve.`,
        ticketId: `TKT-${Date.now()}`,
      };
    
    case 'schedule_callback':
      // Aquí integrarías con tu sistema de calendario
      return {
        success: true,
        message: `He programado una llamada de vuelta para ${parameters.preferredTime || 'lo antes posible'}. Te llamaremos al ${parameters.phoneNumber}.`,
        callbackId: `CB-${Date.now()}`,
      };
    
    case 'send_information':
      // Aquí integrarías con tu sistema de emails/WhatsApp
      return {
        success: true,
        message: `Te he enviado la información por ${parameters.channel} a ${parameters.destination}.`,
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES DE VENTAS
    // --------------------------------------------------------------------------
    case 'search_properties':
      // Aquí integrarías con tu API de propiedades
      return {
        success: true,
        properties: [
          {
            id: 'PROP-001',
            address: 'Calle Mayor 123, Madrid',
            price: parameters.operation === 'alquiler' ? 1200 : 250000,
            rooms: 3,
            bathrooms: 2,
            squareMeters: 85,
          },
          {
            id: 'PROP-002',
            address: 'Paseo de la Castellana 50, Madrid',
            price: parameters.operation === 'alquiler' ? 1500 : 320000,
            rooms: 4,
            bathrooms: 2,
            squareMeters: 110,
          },
        ],
        message: `He encontrado 2 propiedades que podrían interesarte en ${parameters.city}.`,
      };
    
    case 'schedule_visit':
      return {
        success: true,
        visitId: `VIS-${Date.now()}`,
        message: `Perfecto, he agendado una visita ${parameters.visitType} para el ${parameters.preferredDate} a las ${parameters.preferredTime}. Te enviaré un recordatorio por email.`,
      };
    
    case 'create_lead':
      // Aquí integrarías con tu CRM
      return {
        success: true,
        leadId: `LEAD-${Date.now()}`,
        message: `Gracias ${parameters.name}, he registrado tu interés en ${parameters.interest}. Un asesor se pondrá en contacto contigo pronto.`,
      };
    
    case 'get_property_details':
      return {
        success: true,
        property: {
          id: parameters.propertyId,
          address: 'Calle Mayor 123, Madrid',
          price: 1200,
          rooms: 3,
          bathrooms: 2,
          squareMeters: 85,
          description: 'Precioso piso reformado con mucha luz natural...',
          features: ['Terraza', 'Parking', 'Trastero'],
        },
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES DE ATENCIÓN AL CLIENTE
    // --------------------------------------------------------------------------
    case 'check_payment_status':
      return {
        success: true,
        payments: {
          lastPayment: { date: '2026-01-15', amount: 1200, status: 'pagado' },
          nextPayment: { date: '2026-02-01', amount: 1200, status: 'pendiente' },
          balance: 0,
        },
        message: 'Tu último pago fue registrado correctamente el 15 de enero. El próximo pago vence el 1 de febrero.',
      };
    
    case 'create_maintenance_request':
      return {
        success: true,
        requestId: `MNT-${Date.now()}`,
        message: `He creado una solicitud de mantenimiento de ${parameters.category} con prioridad ${parameters.urgency}. Un técnico se pondrá en contacto contigo para coordinar la visita.`,
        estimatedResponse: parameters.urgency === 'urgente' ? '2 horas' : '24-48 horas',
      };
    
    case 'get_contract_info':
      return {
        success: true,
        contract: {
          id: parameters.contractId,
          startDate: '2025-06-01',
          endDate: '2026-05-31',
          monthlyRent: 1200,
          deposit: 2400,
          status: 'activo',
        },
      };
    
    case 'update_tenant_info':
      return {
        success: true,
        message: 'He actualizado tus datos de contacto correctamente.',
      };
    
    case 'create_complaint':
      return {
        success: true,
        complaintId: `CMP-${Date.now()}`,
        message: 'He registrado tu reclamación. Nuestro equipo la revisará y te contactaremos en un plazo máximo de 48 horas.',
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES DE INCIDENCIAS
    // --------------------------------------------------------------------------
    case 'create_incident':
      return {
        success: true,
        incidentId: `INC-${Date.now()}`,
        priority: parameters.urgency,
        message: `He registrado la incidencia de ${parameters.category}. ${
          parameters.urgency === 'urgente' 
            ? 'Un técnico te contactará en menos de 2 horas.' 
            : 'Te contactaremos en las próximas 24 horas para coordinar la visita.'
        }`,
      };
    
    case 'assign_technician':
      return {
        success: true,
        technicianName: 'Juan García',
        technicianPhone: '+34 600 123 456',
        appointmentDate: parameters.preferredDate,
        appointmentTime: parameters.preferredTimeSlot,
        message: 'He asignado al técnico Juan García. Te llamará para confirmar la hora exacta.',
      };
    
    case 'get_incident_status':
      return {
        success: true,
        incident: {
          id: parameters.incidentId,
          status: 'en_proceso',
          technicianAssigned: 'Juan García',
          estimatedResolution: '2026-02-03',
        },
      };
    
    case 'escalate_incident':
      return {
        success: true,
        message: `He escalado la incidencia a ${parameters.escalateTo}. Te contactarán directamente.`,
      };
    
    case 'request_emergency_service':
      return {
        success: true,
        emergencyTicket: `EMG-${Date.now()}`,
        message: 'He activado el servicio de emergencia. Un técnico está en camino y llegará en aproximadamente 30-45 minutos.',
        technicianPhone: '+34 600 999 999',
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES DE VALORACIONES
    // --------------------------------------------------------------------------
    case 'start_valuation':
      const pricePerSqm = 3500; // Precio medio simulado
      const estimatedValue = Math.round(parameters.squareMeters * pricePerSqm);
      
      return {
        success: true,
        valuationId: `VAL-${Date.now()}`,
        estimation: {
          minValue: Math.round(estimatedValue * 0.9),
          maxValue: Math.round(estimatedValue * 1.1),
          estimatedValue: estimatedValue,
          pricePerSqm: pricePerSqm,
          confidence: 75,
        },
        message: `Basándome en los datos que me has proporcionado, estimo que tu propiedad tiene un valor de mercado entre ${(estimatedValue * 0.9).toLocaleString()}€ y ${(estimatedValue * 1.1).toLocaleString()}€. Para una valoración más precisa, te recomiendo programar una visita de nuestro tasador.`,
      };
    
    case 'get_market_data':
      return {
        success: true,
        marketData: {
          city: parameters.city,
          avgPricePerSqm: 3500,
          trend: 'estable',
          demandLevel: 'alta',
          avgDaysOnMarket: 45,
        },
      };
    
    case 'calculate_roi':
      const annualRent = parameters.monthlyRent * 12;
      const annualExpenses = (parameters.expenses || 0) * 12;
      const netIncome = annualRent - annualExpenses;
      const roi = (netIncome / parameters.purchasePrice) * 100;
      
      return {
        success: true,
        roi: {
          grossYield: ((annualRent / parameters.purchasePrice) * 100).toFixed(2),
          netYield: roi.toFixed(2),
          paybackPeriod: Math.round(parameters.purchasePrice / netIncome),
        },
        message: `La rentabilidad neta estimada es del ${roi.toFixed(2)}% anual, lo que significa que recuperarías la inversión en aproximadamente ${Math.round(parameters.purchasePrice / netIncome)} años.`,
      };
    
    case 'schedule_professional_valuation':
      return {
        success: true,
        appointmentId: `APT-${Date.now()}`,
        message: `He programado una tasación ${parameters.valuationType} para el ${parameters.preferredDate}. Nuestro tasador te llamará para confirmar la hora.`,
      };
    
    case 'compare_properties':
      return {
        success: true,
        comparables: [
          { address: 'Calle cercana 1', price: 280000, sqm: 85, pricePerSqm: 3294 },
          { address: 'Calle cercana 2', price: 310000, sqm: 92, pricePerSqm: 3370 },
          { address: 'Calle cercana 3', price: 265000, sqm: 78, pricePerSqm: 3397 },
        ],
        avgPricePerSqm: 3354,
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES DE CAPTACIÓN
    // --------------------------------------------------------------------------
    case 'register_property':
      return {
        success: true,
        registrationId: `REG-${Date.now()}`,
        message: `He registrado tu propiedad en ${parameters.address}. Un asesor comercial te contactará en las próximas 24 horas para coordinar la visita de valoración.`,
      };
    
    case 'schedule_property_visit':
      return {
        success: true,
        visitId: `PVIS-${Date.now()}`,
        message: `He programado una visita de ${parameters.visitPurpose} para el ${parameters.preferredDate}. Te enviaré un recordatorio por SMS.`,
      };
    
    case 'send_owner_proposal':
      return {
        success: true,
        message: `Te he enviado nuestra propuesta de servicios ${parameters.proposalType} por email. Incluye todos los detalles de nuestros servicios y tarifas.`,
      };
    
    case 'check_property_legal_status':
      return {
        success: true,
        legalStatus: {
          registryCheck: 'ok',
          cadastralCheck: 'ok',
          encumbrances: 'ninguna',
        },
        message: 'La verificación inicial no muestra problemas. Recomendamos una nota simple del Registro para confirmación definitiva.',
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES DE COLIVING
    // --------------------------------------------------------------------------
    case 'search_coliving_rooms':
      return {
        success: true,
        rooms: [
          {
            id: 'COL-001',
            name: 'Coliving Madrid Centro',
            roomType: 'individual',
            price: 650,
            available: true,
          },
          {
            id: 'COL-002',
            name: 'Coliving Malasaña',
            roomType: 'suite',
            price: 850,
            available: true,
          },
        ],
        message: `He encontrado 2 espacios de coliving disponibles en ${parameters.city} dentro de tu presupuesto.`,
      };
    
    case 'create_resident_profile':
      return {
        success: true,
        profileId: `PROF-${Date.now()}`,
        message: `Perfecto ${parameters.name}, he creado tu perfil. Ahora buscaré los mejores espacios que coincidan con tu estilo de vida.`,
      };
    
    case 'check_community_events':
      return {
        success: true,
        events: [
          { date: '2026-02-05', name: 'Networking Afterwork', type: 'networking' },
          { date: '2026-02-10', name: 'Yoga Matutino', type: 'deportivo' },
          { date: '2026-02-15', name: 'Cena Comunitaria', type: 'social' },
        ],
      };
    
    case 'schedule_coliving_visit':
      return {
        success: true,
        visitId: `CVIS-${Date.now()}`,
        message: `He programado tu visita ${parameters.visitType} para el ${parameters.preferredDate}. Te enviaré los detalles por email.`,
      };
    
    // --------------------------------------------------------------------------
    // FUNCIONES DE COMUNIDADES
    // --------------------------------------------------------------------------
    case 'get_community_info':
      return {
        success: true,
        community: {
          name: 'Comunidad Calle Mayor 123',
          totalUnits: 24,
          monthlyFee: 85,
          president: 'María López',
          administrator: 'Inmova Administración',
        },
      };
    
    case 'check_community_balance':
      return {
        success: true,
        balance: {
          currentBalance: 12500,
          reserveFund: 8000,
          pendingPayments: 340,
          lastAudit: '2025-12-31',
        },
      };
    
    case 'check_owner_debt':
      return {
        success: true,
        debt: {
          totalDebt: 0,
          status: 'al_corriente',
        },
        message: 'Estás al corriente de pago. No tienes ninguna deuda pendiente con la comunidad.',
      };
    
    case 'request_community_certificate':
      return {
        success: true,
        certificateId: `CERT-${Date.now()}`,
        message: `He solicitado el certificado de ${parameters.certificateType}. Lo recibirás por email en un plazo de 3-5 días laborables.`,
      };
    
    case 'report_community_issue':
      return {
        success: true,
        issueId: `ISS-${Date.now()}`,
        message: `He registrado la incidencia de ${parameters.issueType} en zonas comunes. El administrador la revisará y tomará las medidas necesarias.`,
      };
    
    case 'get_next_meeting_info':
      return {
        success: true,
        meeting: {
          date: '2026-03-15',
          time: '19:00',
          location: 'Sala de reuniones - Planta baja',
          type: 'ordinaria',
          agenda: ['Aprobación de cuentas', 'Presupuesto 2026', 'Obras ascensor'],
        },
      };
    
    case 'submit_meeting_proposal':
      return {
        success: true,
        proposalId: `PROP-${Date.now()}`,
        message: 'Tu propuesta ha sido registrada y se incluirá en el orden del día de la próxima junta para su votación.',
      };
    
    // --------------------------------------------------------------------------
    // FUNCIÓN NO RECONOCIDA
    // --------------------------------------------------------------------------
    default:
      console.warn(`[Vapi] Función no reconocida: ${name}`);
      return {
        success: false,
        error: `Función ${name} no implementada`,
      };
  }
}

// ============================================================================
// MANEJADORES DE EVENTOS
// ============================================================================

async function handleStatusUpdate(call: any, status?: string): Promise<void> {
  console.log(`[Vapi Status] Call ${call?.id}: ${status}`);
  
  // Aquí podrías actualizar el estado en tu base de datos
  // Por ejemplo, marcar un lead como "en llamada" o "llamada completada"
}

async function handleEndOfCallReport(message: any): Promise<void> {
  console.log('[Vapi End of Call Report]', {
    callId: message.call?.id,
    duration: message.call?.startedAt && message.call?.endedAt 
      ? (new Date(message.call.endedAt).getTime() - new Date(message.call.startedAt).getTime()) / 1000 
      : 0,
    endedReason: message.endedReason,
    cost: message.cost,
  });
  
  // Guardar resumen de la llamada
  if (message.summary) {
    console.log('[Vapi Call Summary]', message.summary);
  }
  
  // Guardar transcripción
  if (message.messages) {
    console.log('[Vapi Transcript]', message.messages);
  }
  
  // Aquí integrarías con tu sistema para:
  // 1. Guardar la transcripción en la base de datos
  // 2. Actualizar el CRM con el resultado de la llamada
  // 3. Crear tareas de seguimiento si es necesario
  // 4. Enviar notificaciones al equipo
}

// También exportamos un GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Vapi Webhook',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
