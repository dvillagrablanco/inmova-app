/**
 * SERVICIO DE SMS
 * 
 * Sistema de mensajería SMS con:
 * - Plantillas personalizables
 * - Programación automática
 * - Variables dinámicas
 * - Logs de envío
 * - Integración real con Twilio
 */

import { prisma } from './db';
import type {SMSTipo, SMSEstado } from '@prisma/client';
import twilio from 'twilio';
import logger, { logError } from '@/lib/logger';

// Configuración de Twilio
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  fromNumber: process.env.TWILIO_FROM_NUMBER || ''
};

// Cliente de Twilio
const twilioClient = twilioConfig.accountSid && twilioConfig.authToken
  ? twilio(twilioConfig.accountSid, twilioConfig.authToken)
  : null;

/**
 * Verifica si Twilio está configurado
 */
export function isTwilioConfigured(): boolean {
  return !!(twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.fromNumber);
}

interface DatosSMS {
  tenantId: string;
  templateId?: string;
  tipo: SMSTipo;
  mensaje: string;
  fechaProgramada?: Date;
  relacionadoCon?: string;
  relacionadoId?: string;
}

/**
 * ENVÍA (SIMULA) UN SMS A UN INQUILINO
 */
export async function enviarSMS(
  companyId: string,
  datos: DatosSMS,
  enviadoPor: string
): Promise<any> {
  
  // 1. Obtener datos del inquilino
  const tenant = await prisma.tenant.findUnique({
    where: { id: datos.tenantId }
  });
  
  if (!tenant) {
    throw new Error('Inquilino no encontrado');
  }
  
  // 2. Procesar variables en el mensaje
  const mensajeProcesado = procesarVariables(datos.mensaje, tenant);
  
  // 3. Determinar estado inicial
  const estado: SMSEstado = datos.fechaProgramada 
    ? 'programado' 
    : 'enviado';
  
  const fechaEnvio = datos.fechaProgramada ? null : new Date();
  
  // 4. Simular coste (Twilio: ~0.08€ por SMS)
  const costeEstimado = calcularCoste(mensajeProcesado);
  
  // 5. Crear log del SMS
  const smsLog = await prisma.sMSLog.create({
    data: {
      companyId,
      templateId: datos.templateId,
      tenantId: datos.tenantId,
      telefono: tenant.telefono,
      nombreDestinatario: tenant.nombreCompleto,
      mensaje: mensajeProcesado,
      tipo: datos.tipo,
      estado,
      fechaProgramada: datos.fechaProgramada,
      fechaEnvio,
      proveedorSMS: 'Twilio', // Simulado
      idExterno: generarIdExterno(),
      costeEstimado,
      exitoso: estado === 'enviado' ? true : null,
      relacionadoCon: datos.relacionadoCon,
      relacionadoId: datos.relacionadoId,
      enviadoPor
    }
  });
  
  // 6. Si es envío inmediato, enviar SMS real
  if (estado === 'enviado') {
    try {
      const resultado = await enviarSMSReal(tenant.telefono, mensajeProcesado);
      
      // Actualizar con datos reales del envío
      await prisma.sMSLog.update({
        where: { id: smsLog.id },
        data: {
          idExterno: resultado.sid,
          exitoso: true,
          fechaEnvio: new Date(resultado.dateCreated)
        }
      });
      
      logger.info(`📱 SMS enviado exitosamente a ${tenant.nombreCompleto} (${tenant.telefono})`);
      logger.info(`   SID: ${resultado.sid}`);
    } catch (error: any) {
      // Marcar como fallido
      await prisma.sMSLog.update({
        where: { id: smsLog.id },
        data: {
          estado: 'fallido',
          exitoso: false,
          mensajeError: error.message
        }
      });
      
      logger.error(`❌ Error enviando SMS a ${tenant.nombreCompleto}:`, error.message);
    }
  }
  
  // 7. Si usa template, actualizar estadísticas
  if (datos.templateId) {
    await prisma.sMSTemplate.update({
      where: { id: datos.templateId },
      data: {
        vecesUsada: { increment: 1 },
        ultimoEnvio: new Date()
      }
    });
  }
  
  return smsLog;
}

/**
 * PROCESA VARIABLES DINÁMICAS EN EL MENSAJE
 * 
 * Variables soportadas:
 * - {{nombre}} - Nombre del inquilino
 * - {{unidad}} - Número de unidad
 * - {{edificio}} - Nombre del edificio
 * - {{monto}} - Monto de pago
 * - {{fecha}} - Fecha formateada
 */
function procesarVariables(mensaje: string, tenant: any, extra?: any): string {
  let mensajeProcesado = mensaje;
  
  // Variables del inquilino
  mensajeProcesado = mensajeProcesado.replace(/{{nombre}}/g, tenant.nombreCompleto);
  mensajeProcesado = mensajeProcesado.replace(/{{email}}/g, tenant.email);
  mensajeProcesado = mensajeProcesado.replace(/{{telefono}}/g, tenant.telefono);
  
  // Variables extras (si se proporcionan)
  if (extra) {
    if (extra.unidad) {
      mensajeProcesado = mensajeProcesado.replace(/{{unidad}}/g, extra.unidad);
    }
    if (extra.edificio) {
      mensajeProcesado = mensajeProcesado.replace(/{{edificio}}/g, extra.edificio);
    }
    if (extra.monto) {
      const montoFormateado = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(extra.monto);
      mensajeProcesado = mensajeProcesado.replace(/{{monto}}/g, montoFormateado);
    }
    if (extra.fecha) {
      const fechaFormateada = new Date(extra.fecha).toLocaleDateString('es-ES');
      mensajeProcesado = mensajeProcesado.replace(/{{fecha}}/g, fechaFormateada);
    }
  }
  
  return mensajeProcesado;
}

/**
 * Calcula el coste estimado del SMS (según longitud)
 */
function calcularCoste(mensaje: string): number {
  const longitud = mensaje.length;
  
  // Twilio pricing (aproximado):
  // 1 SMS (160 chars): €0.08
  // 2 SMS (320 chars): €0.16
  // 3 SMS (480 chars): €0.24
  
  const numSMS = Math.ceil(longitud / 160);
  return numSMS * 0.08;
}

/**
 * Genera ID externo simulado (como el que daría Twilio)
 */
function generarIdExterno(): string {
  return `SM${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}

/**
 * CREA UNA PLANTILLA DE SMS
 */
export async function crearPlantilla(
  companyId: string,
  datos: {
    nombre: string;
    descripcion?: string;
    tipo: SMSTipo;
    mensaje: string;
    activa?: boolean;
    envioAutomatico?: boolean;
    eventoTrigger?: string;
    anticipacionDias?: number;
    horaEnvio?: string;
  },
  creadoPor: string
) {
  
  // Extraer variables del mensaje
  const variables = extraerVariables(datos.mensaje);
  
  return await prisma.sMSTemplate.create({
    data: {
      companyId,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      tipo: datos.tipo,
      mensaje: datos.mensaje,
      variables,
      activa: datos.activa !== undefined ? datos.activa : true,
      envioAutomatico: datos.envioAutomatico || false,
      eventoTrigger: datos.eventoTrigger,
      anticipacionDias: datos.anticipacionDias,
      horaEnvio: datos.horaEnvio,
      vecesUsada: 0,
      creadoPor
    }
  });
}

/**
 * Extrae las variables presentes en un mensaje
 */
function extraerVariables(mensaje: string): any[] {
  const regex = /{{(\w+)}}/g;
  const variables: any[] = [];
  const encontradas = new Set<string>();
  
  let match;
  while ((match = regex.exec(mensaje)) !== null) {
    const variable = match[1];
    if (!encontradas.has(variable)) {
      encontradas.add(variable);
      
      // Mapear variables a descripciones y ejemplos
      const info = obtenerInfoVariable(variable);
      variables.push({
        nombre: variable,
        descripcion: info.descripcion,
        ejemplo: info.ejemplo
      });
    }
  }
  
  return variables;
}

/**
 * Obtiene información de una variable
 */
function obtenerInfoVariable(variable: string): { descripcion: string; ejemplo: string } {
  const infoVariables: { [key: string]: { descripcion: string; ejemplo: string } } = {
    'nombre': {
      descripcion: 'Nombre completo del inquilino',
      ejemplo: 'Juan Pérez'
    },
    'email': {
      descripcion: 'Email del inquilino',
      ejemplo: 'juan.perez@email.com'
    },
    'telefono': {
      descripcion: 'Teléfono del inquilino',
      ejemplo: '+34 600 123 456'
    },
    'unidad': {
      descripcion: 'Número de unidad',
      ejemplo: '3A'
    },
    'edificio': {
      descripcion: 'Nombre del edificio',
      ejemplo: 'Edificio Central'
    },
    'monto': {
      descripcion: 'Monto económico',
      ejemplo: '850,00€'
    },
    'fecha': {
      descripcion: 'Fecha formateada',
      ejemplo: '15/12/2024'
    }
  };
  
  return infoVariables[variable] || {
    descripcion: 'Variable personalizada',
    ejemplo: variable
  };
}

/**
 * PLANTILLAS PREDEFINIDAS DEL SISTEMA
 */
export const PLANTILLAS_PREDEFINIDAS = [
  {
    nombre: 'Recordatorio de Pago',
    tipo: 'recordatorio_pago' as SMSTipo,
    mensaje: 'Hola {{nombre}}, te recordamos que el pago de tu alquiler de {{monto}} vence el {{fecha}}. ¡Gracias!',
    descripcion: 'Recordatorio de pago de renta próximo a vencer',
    eventoTrigger: 'pago_vencimiento_3dias',
    anticipacionDias: 3,
    horaEnvio: '10:00'
  },
  {
    nombre: 'Confirmación de Visita',
    tipo: 'confirmacion_visita' as SMSTipo,
    mensaje: 'Hola {{nombre}}, confirmamos tu visita a la unidad {{unidad}} en {{edificio}} el {{fecha}}. ¡Te esperamos!',
    descripcion: 'Confirmación de visita programada',
    eventoTrigger: 'visita_programada',
    anticipacionDias: 1,
    horaEnvio: '12:00'
  },
  {
    nombre: 'Mantenimiento Programado',
    tipo: 'mantenimiento' as SMSTipo,
    mensaje: 'Hola {{nombre}}, te informamos que el {{fecha}} se realizará mantenimiento en tu unidad {{unidad}}. Gracias por tu colaboración.',
    descripcion: 'Notificación de mantenimiento programado',
    eventoTrigger: 'mantenimiento_programado',
    anticipacionDias: 2,
    horaEnvio: '09:00'
  },
  {
    nombre: 'Bienvenida Nuevo Inquilino',
    tipo: 'bienvenida' as SMSTipo,
    mensaje: '¡Bienvenido/a {{nombre}}! Nos alegra tenerte en {{edificio}}, unidad {{unidad}}. Cualquier duda, estamos a tu disposición.',
    descripcion: 'Mensaje de bienvenida para nuevos inquilinos',
    eventoTrigger: 'contrato_firmado',
    anticipacionDias: 0,
    horaEnvio: '10:00'
  },
  {
    nombre: 'Alerta Urgente',
    tipo: 'alerta' as SMSTipo,
    mensaje: 'ALERTA: {{nombre}}, necesitamos comunicarte algo urgente sobre tu unidad {{unidad}}. Por favor, contáctanos cuanto antes.',
    descripcion: 'Alerta urgente para inquilinos',
    eventoTrigger: null,
    anticipacionDias: null,
    horaEnvio: null
  }
];

/**
 * Instala las plantillas predefinidas
 */
export async function instalarPlantillasPredefinidas(
  companyId: string,
  creadoPor: string
) {
  
  const plantillasCreadas: any[] = [];
  
  for (const plantilla of PLANTILLAS_PREDEFINIDAS) {
    const existe = await prisma.sMSTemplate.findFirst({
      where: {
        companyId,
        nombre: plantilla.nombre
      }
    });
    
    if (!existe) {
      const creada = await crearPlantilla(
        companyId,
        {
          nombre: plantilla.nombre,
          descripcion: plantilla.descripcion,
          tipo: plantilla.tipo,
          mensaje: plantilla.mensaje,
          activa: true,
          envioAutomatico: false, // Por defecto manual
          eventoTrigger: plantilla.eventoTrigger || undefined,
          anticipacionDias: plantilla.anticipacionDias || undefined,
          horaEnvio: plantilla.horaEnvio || undefined
        },
        creadoPor
      );
      
      plantillasCreadas.push(creada);
    }
  }
  
  return plantillasCreadas;
}

/**
 * PROCESA SMS PROGRAMADOS (ejecutar en cron job)
 */
export async function procesarSMSProgramados() {
  
  const ahora = new Date();
  
  // Buscar SMS programados para enviar ahora
  const smsPendientes = await prisma.sMSLog.findMany({
    where: {
      estado: 'programado',
      fechaProgramada: {
        lte: ahora
      }
    },
    include: {
      tenant: true
    },
    take: 50 // Procesar máx 50 por lote
  });
  
  const resultados = {
    exitosos: 0,
    fallidos: 0
  };
  
  for (const sms of smsPendientes) {
    try {
      // Enviar SMS real con fallback a simulación
      const resultado = await enviarSMSConFallback(sms.telefono, sms.mensaje);
      
      // Actualizar estado
      await prisma.sMSLog.update({
        where: { id: sms.id },
        data: {
          estado: resultado.exitoso ? 'enviado' : 'fallido',
          fechaEnvio: new Date(),
          exitoso: resultado.exitoso,
          idExterno: resultado.sid || sms.idExterno,
          mensajeError: resultado.error || null
        }
      });
      
      if (resultado.exitoso) {
        resultados.exitosos++;
        logger.info(`✅ SMS enviado a ${sms.nombreDestinatario} (${sms.telefono})`);
      } else {
        resultados.fallidos++;
        logger.error(`❌ Error enviando SMS a ${sms.nombreDestinatario}: ${resultado.error}`);
      }
      
    } catch (error: any) {
      resultados.fallidos++;
      logger.error(`Error procesando SMS ${sms.id}:`, error.message);
      
      // Marcar como fallido
      await prisma.sMSLog.update({
        where: { id: sms.id },
        data: {
          estado: 'fallido',
          exitoso: false,
          mensajeError: error.message
        }
      });
    }
  }
  
  return resultados;
}

/**
 * Envía un SMS real usando Twilio
 */
async function enviarSMSReal(telefono: string, mensaje: string): Promise<any> {
  if (!twilioClient || !isTwilioConfigured()) {
    throw new Error('Twilio no está configurado. Por favor, configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_FROM_NUMBER');
  }
  
  // Normalizar número de teléfono (asegurarse que tenga código de país)
  let telefonoNormalizado = telefono.trim();
  if (!telefonoNormalizado.startsWith('+')) {
    // Si no tiene +, asumir España (+34)
    telefonoNormalizado = `+34${telefonoNormalizado.replace(/\s/g, '')}`;
  }
  
  const message = await twilioClient.messages.create({
    body: mensaje,
    from: twilioConfig.fromNumber,
    to: telefonoNormalizado
  });
  
  return message;
}

/**
 * Envía un SMS (con fallback a simulación si Twilio no está configurado)
 */
async function enviarSMSConFallback(telefono: string, mensaje: string): Promise<{ exitoso: boolean; sid?: string; error?: string }> {
  if (isTwilioConfigured()) {
    try {
      const resultado = await enviarSMSReal(telefono, mensaje);
      return { exitoso: true, sid: resultado.sid };
    } catch (error: any) {
      return { exitoso: false, error: error.message };
    }
  } else {
    // Modo simulación si Twilio no está configurado
    logger.info(`📱 SMS SIMULADO (Twilio no configurado) a ${telefono}`);
    logger.info(`   Mensaje: ${mensaje}`);
    const exitoso = Math.random() < 0.9; // 90% de éxito simulado
    return { 
      exitoso, 
      sid: exitoso ? generarIdExterno() : undefined,
      error: exitoso ? undefined : 'Error simulado'
    };
  }
}

/**
 * GENERA SMS AUTOMÁTICOS BASADOS EN EVENTOS
 * 
 * Ejemplos de eventos:
 * - pago_vencimiento_3dias: 3 días antes del vencimiento de pago
 * - visita_programada: Cuando se programa una visita
 * - mantenimiento_programado: Cuando se programa mantenimiento
 */
export async function generarSMSAutomaticos(evento: string, companyId: string) {
  
  // Buscar plantillas activas para este evento
  const plantillas = await prisma.sMSTemplate.findMany({
    where: {
      companyId,
      activa: true,
      envioAutomatico: true,
      eventoTrigger: evento
    }
  });
  
  if (plantillas.length === 0) {
    return [];
  }
  
  const smsGenerados: any[] = [];
  
  // Según el evento, buscar destinatarios
  if (evento === 'pago_vencimiento_3dias') {
    // Buscar pagos que vencen en 3 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 3);
    
    const pagos = await prisma.payment.findMany({
      where: {
        estado: 'pendiente',
        fechaVencimiento: {
          gte: new Date(),
          lte: fechaLimite
        }
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: { building: true }
            }
          }
        }
      },
      take: 100
    });
    
    for (const pago of pagos) {
      for (const plantilla of plantillas) {
        // Crear SMS programado
        const fechaEnvio = new Date();
        fechaEnvio.setHours(parseInt(plantilla.horaEnvio?.split(':')[0] || '10'), 0, 0, 0);
        
        const mensaje = procesarVariables(
          plantilla.mensaje,
          pago.contract.tenant,
          {
            monto: pago.monto,
            fecha: pago.fechaVencimiento,
            unidad: pago.contract.unit.numero,
            edificio: pago.contract.unit.building.nombre
          }
        );
        
        const sms = await prisma.sMSLog.create({
          data: {
            companyId,
            templateId: plantilla.id,
            tenantId: pago.contract.tenantId,
            telefono: pago.contract.tenant.telefono,
            nombreDestinatario: pago.contract.tenant.nombreCompleto,
            mensaje,
            tipo: plantilla.tipo,
            estado: 'programado',
            fechaProgramada: fechaEnvio,
            proveedorSMS: 'Twilio',
            idExterno: generarIdExterno(),
            costeEstimado: calcularCoste(mensaje),
            relacionadoCon: 'payment',
            relacionadoId: pago.id,
            enviadoPor: 'SISTEMA_AUTOMATICO'
          }
        });
        
        smsGenerados.push(sms);
      }
    }
  }
  
  return smsGenerados;
}
