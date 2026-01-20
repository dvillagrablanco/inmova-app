/**
 * Servicio de Stripe para eWoorker
 * 
 * Gestiona pagos separados de Inmova con división de beneficios:
 * - 50% para el socio fundador
 * - 50% para la plataforma (eWoorker/Inmova)
 * 
 * Los pagos de eWoorker se identifican con metadata específica
 * para diferenciarlos de los pagos de Inmova (que son 100% plataforma)
 * 
 * @module EwoorkerStripeService
 */

import Stripe from 'stripe';
import { prisma } from './db';
import logger from './logger';

// Lazy initialization para evitar errores en build
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;
  
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn('[eWoorker Stripe] STRIPE_SECRET_KEY no definida');
    return null;
  }
  
  try {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
    return stripeInstance;
  } catch (error) {
    logger.error('[eWoorker Stripe] Error inicializando:', error);
    return null;
  }
}

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

/**
 * División de beneficios eWoorker
 * 50% para socio fundador, 50% para plataforma
 */
export const EWOORKER_REVENUE_SPLIT = {
  SOCIO_PERCENTAGE: 50,
  PLATAFORMA_PERCENTAGE: 50,
};

/**
 * Planes de suscripción eWoorker
 * Diferenciados de los planes de Inmova
 * 
 * SINCRONIZADO CON: /app/ewoorker/landing/page.tsx
 * 
 * Modelo de negocio:
 * - Plan gratuito con comisión alta (5%) para adquisición
 * - Planes de pago con comisión reducida para retención
 * - Comisión 0% en plan premium incentiva upgrade
 */
export const EWOORKER_PLANS = {
  OBRERO: {
    id: 'ewoorker_obrero',
    name: 'eWoorker Obrero',
    price: 0, // Gratuito - modelo freemium
    interval: 'month' as const,
    features: [
      'Perfil básico',
      'Ver obras públicas',
      '3 ofertas/mes',
      'Chat básico',
      'Soporte email',
    ],
    maxOfertas: 3,
    comisionEscrow: 5, // 5% en pagos escrow (modelo freemium)
  },
  CAPATAZ: {
    id: 'ewoorker_capataz',
    name: 'eWoorker Capataz',
    price: 49, // €/mes - MÁS POPULAR
    interval: 'month' as const,
    features: [
      'Todo de Obrero',
      'Ofertas ilimitadas',
      'Compliance Hub completo',
      'Chat prioritario',
      'Sistema escrow (+2% comisión)',
      'Certificaciones digitales',
    ],
    maxOfertas: -1, // Ilimitado
    comisionEscrow: 2, // 2% en pagos escrow (reducido)
  },
  CONSTRUCTOR: {
    id: 'ewoorker_constructor',
    name: 'eWoorker Constructor',
    price: 149, // €/mes - Premium
    interval: 'month' as const,
    features: [
      'Todo de Capataz',
      'Obras ilimitadas',
      'Marketplace destacado',
      'API de integración',
      'Dashboard analytics avanzado',
      'Account manager dedicado',
      'SIN comisiones extra (0%)',
    ],
    maxOfertas: -1,
    comisionEscrow: 0, // 0% comisión - incentivo para upgrade
  },
};

/**
 * Tipos de comisión eWoorker
 */
export type EwoorkerTipoComision = 
  | 'SUSCRIPCION_MENSUAL'
  | 'PAGO_SEGURO_ESCROW'
  | 'CONTRATACION_URGENTE'
  | 'VERIFICACION_EMPRESA'
  | 'PROMOCION_DESTACADA';

/**
 * Comisiones por tipo
 */
export const EWOORKER_COMISIONES = {
  SUSCRIPCION_MENSUAL: { fijo: true, valor: 0 }, // Se cobra el plan completo
  PAGO_SEGURO_ESCROW: { fijo: false, valor: 4.5 }, // 4.5% del monto
  CONTRATACION_URGENTE: { fijo: true, valor: 99 }, // €99 fijo
  VERIFICACION_EMPRESA: { fijo: true, valor: 49 }, // €49 fijo
  PROMOCION_DESTACADA: { fijo: true, valor: 29 }, // €29/semana
};

// ============================================================================
// METADATA PARA IDENTIFICAR PAGOS EWOORKER
// ============================================================================

/**
 * Metadata que identifica un pago como eWoorker
 * Esto permite diferenciarlo en webhooks
 */
interface EwoorkerPaymentMetadata {
  platform: 'ewoorker';
  tipo: EwoorkerTipoComision;
  empresaId: string;
  empresaNombre?: string;
  socioPercentage: string;
  plataformaPercentage: string;
  contratoId?: string;
  obraId?: string;
}

// ============================================================================
// FUNCIONES DE PAGO
// ============================================================================

/**
 * Crea un pago de suscripción eWoorker
 * El pago se divide 50/50 entre socio y plataforma
 */
export async function crearSuscripcionEwoorker(data: {
  empresaId: string;
  planId: keyof typeof EWOORKER_PLANS;
  paymentMethodId: string;
}): Promise<{
  subscriptionId: string;
  clientSecret: string;
  beneficioSocio: number;
  beneficioPlataforma: number;
}> {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe no configurado');

  try {
    // Obtener perfil de empresa eWoorker
    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { id: data.empresaId },
      include: { company: true },
    });

    if (!perfil) throw new Error('Perfil de empresa no encontrado');

    const plan = EWOORKER_PLANS[data.planId];
    if (!plan) throw new Error('Plan no válido');

    // Calcular división de beneficios
    const beneficioSocio = Math.round((plan.price * EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE) / 100 * 100); // En céntimos
    const beneficioPlataforma = Math.round((plan.price * EWOORKER_REVENUE_SPLIT.PLATAFORMA_PERCENTAGE) / 100 * 100);

    // Crear o obtener customer de Stripe
    let customerId = perfil.company?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: perfil.company?.contactEmail || perfil.emailContacto || undefined,
        name: perfil.nombreEmpresa,
        metadata: {
          platform: 'ewoorker',
          empresaId: data.empresaId,
          companyId: perfil.companyId,
        },
      });
      customerId = customer.id;

      // Actualizar company con stripeCustomerId
      if (perfil.companyId) {
        await prisma.company.update({
          where: { id: perfil.companyId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Attach payment method
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: customerId,
    });

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: data.paymentMethodId,
      },
    });

    // Crear producto eWoorker (o reutilizar existente)
    const productId = `ewoorker_${plan.id}`;
    let product: Stripe.Product;
    try {
      product = await stripe.products.retrieve(productId);
    } catch {
      product = await stripe.products.create({
        id: productId,
        name: plan.name,
        description: plan.features.join(', '),
        metadata: {
          platform: 'ewoorker',
          planId: data.planId,
        },
      });
    }

    // Crear precio
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price * 100,
      currency: 'eur',
      recurring: { interval: plan.interval },
      metadata: {
        platform: 'ewoorker',
        planId: data.planId,
      },
    });

    // Crear suscripción con metadata de eWoorker
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        platform: 'ewoorker',
        tipo: 'SUSCRIPCION_MENSUAL',
        empresaId: data.empresaId,
        empresaNombre: perfil.nombreEmpresa,
        planId: data.planId,
        socioPercentage: EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE.toString(),
        plataformaPercentage: EWOORKER_REVENUE_SPLIT.PLATAFORMA_PERCENTAGE.toString(),
        beneficioSocio: beneficioSocio.toString(),
        beneficioPlataforma: beneficioPlataforma.toString(),
      } as EwoorkerPaymentMetadata & Record<string, string>,
    });

    // Guardar suscripción eWoorker en BD
    await prisma.ewoorkerSuscripcion.create({
      data: {
        perfilEmpresaId: data.empresaId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: price.id,
        plan: data.planId,
        precio: plan.price * 100, // Céntimos
        estado: 'PENDIENTE',
        fechaInicio: new Date(),
        fechaProximoPago: new Date(subscription.current_period_end * 1000),
      },
    });

    logger.info('✅ [eWoorker] Suscripción creada', {
      empresaId: data.empresaId,
      planId: data.planId,
      subscriptionId: subscription.id,
      beneficioSocio: beneficioSocio / 100,
      beneficioPlataforma: beneficioPlataforma / 100,
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret!,
      beneficioSocio: beneficioSocio / 100,
      beneficioPlataforma: beneficioPlataforma / 100,
    };
  } catch (error: any) {
    logger.error('❌ [eWoorker] Error creando suscripción:', error);
    throw error;
  }
}

/**
 * Crea un pago de escrow (pago seguro) para un contrato eWoorker
 * Comisión variable según plan + división 50/50
 */
export async function crearPagoEscrowEwoorker(data: {
  contratoId: string;
  monto: number; // En euros
  concepto: string;
  descripcion?: string;
}): Promise<{
  paymentIntentId: string;
  clientSecret: string;
  comision: number;
  beneficioSocio: number;
  beneficioPlataforma: number;
  montoNeto: number;
}> {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe no configurado');

  try {
    // Obtener contrato con información relacionada
    const contrato = await prisma.ewoorkerContrato.findUnique({
      where: { id: data.contratoId },
      include: {
        constructor: {
          include: { 
            company: true,
            suscripciones: { where: { estado: 'ACTIVA' }, take: 1 },
          },
        },
        subcontratista: {
          include: { company: true },
        },
      },
    });

    if (!contrato) throw new Error('Contrato no encontrado');

    // Determinar comisión según plan del constructor
    const suscripcionActiva = contrato.constructor.suscripciones[0];
    let comisionPorcentaje = EWOORKER_COMISIONES.PAGO_SEGURO_ESCROW.valor; // 4.5% por defecto

    if (suscripcionActiva) {
      const planKey = suscripcionActiva.plan as keyof typeof EWOORKER_PLANS;
      const plan = EWOORKER_PLANS[planKey];
      if (plan) {
        comisionPorcentaje = plan.comisionEscrow;
      }
    }

    // Calcular montos
    const montoEnCentimos = Math.round(data.monto * 100);
    const comision = Math.round(montoEnCentimos * comisionPorcentaje / 100);
    const montoNeto = montoEnCentimos - comision;
    
    // División 50/50 de la comisión
    const beneficioSocio = Math.round(comision * EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE / 100);
    const beneficioPlataforma = comision - beneficioSocio;

    // Crear customer si no existe
    let customerId = contrato.constructor.company?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: contrato.constructor.company?.contactEmail || contrato.constructor.emailContacto || undefined,
        name: contrato.constructor.nombreEmpresa,
        metadata: {
          platform: 'ewoorker',
          empresaId: contrato.constructorId,
        },
      });
      customerId = customer.id;

      if (contrato.constructor.companyId) {
        await prisma.company.update({
          where: { id: contrato.constructor.companyId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Crear PaymentIntent con metadata de eWoorker
    const paymentIntent = await stripe.paymentIntents.create({
      amount: montoEnCentimos,
      currency: 'eur',
      customer: customerId,
      description: data.concepto,
      metadata: {
        platform: 'ewoorker',
        tipo: 'PAGO_SEGURO_ESCROW',
        contratoId: data.contratoId,
        constructorId: contrato.constructorId,
        subcontratistaId: contrato.subcontratistaId,
        obraId: contrato.obraId,
        comision: comision.toString(),
        montoNeto: montoNeto.toString(),
        beneficioSocio: beneficioSocio.toString(),
        beneficioPlataforma: beneficioPlataforma.toString(),
        socioPercentage: EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE.toString(),
        plataformaPercentage: EWOORKER_REVENUE_SPLIT.PLATAFORMA_PERCENTAGE.toString(),
      },
    });

    // Crear registro de pago en BD
    await prisma.ewoorkerPago.create({
      data: {
        contratoId: data.contratoId,
        perfilReceptorId: contrato.subcontratistaId,
        tipo: 'PAGO_SEGURO_ESCROW',
        concepto: data.concepto,
        descripcion: data.descripcion,
        montoBase: montoEnCentimos,
        porcentajeComision: comisionPorcentaje,
        montoComision: comision,
        montoNeto: montoNeto,
        beneficioEwoorker: beneficioPlataforma,
        beneficioSocio: beneficioSocio,
        estado: 'PENDIENTE',
        stripePaymentIntentId: paymentIntent.id,
        retenidoEscrow: true,
        fechaRetencion: new Date(),
      },
    });

    logger.info('✅ [eWoorker] Pago escrow creado', {
      contratoId: data.contratoId,
      monto: data.monto,
      comision: comision / 100,
      beneficioSocio: beneficioSocio / 100,
      beneficioPlataforma: beneficioPlataforma / 100,
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      comision: comision / 100,
      beneficioSocio: beneficioSocio / 100,
      beneficioPlataforma: beneficioPlataforma / 100,
      montoNeto: montoNeto / 100,
    };
  } catch (error: any) {
    logger.error('❌ [eWoorker] Error creando pago escrow:', error);
    throw error;
  }
}

/**
 * Crea un pago de servicio único (verificación, promoción, urgente)
 */
export async function crearPagoServicioEwoorker(data: {
  empresaId: string;
  tipo: EwoorkerTipoComision;
  descripcion?: string;
  contratoId?: string;
}): Promise<{
  paymentIntentId: string;
  clientSecret: string;
  monto: number;
  beneficioSocio: number;
  beneficioPlataforma: number;
}> {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe no configurado');

  try {
    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { id: data.empresaId },
      include: { company: true },
    });

    if (!perfil) throw new Error('Perfil de empresa no encontrado');

    const comisionConfig = EWOORKER_COMISIONES[data.tipo];
    if (!comisionConfig || !comisionConfig.fijo) {
      throw new Error('Tipo de servicio no válido para pago fijo');
    }

    const montoEnCentimos = comisionConfig.valor * 100;
    const beneficioSocio = Math.round(montoEnCentimos * EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE / 100);
    const beneficioPlataforma = montoEnCentimos - beneficioSocio;

    // Customer
    let customerId = perfil.company?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: perfil.company?.contactEmail || perfil.emailContacto || undefined,
        name: perfil.nombreEmpresa,
        metadata: { platform: 'ewoorker', empresaId: data.empresaId },
      });
      customerId = customer.id;

      if (perfil.companyId) {
        await prisma.company.update({
          where: { id: perfil.companyId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: montoEnCentimos,
      currency: 'eur',
      customer: customerId,
      description: `eWoorker - ${data.tipo}${data.descripcion ? `: ${data.descripcion}` : ''}`,
      metadata: {
        platform: 'ewoorker',
        tipo: data.tipo,
        empresaId: data.empresaId,
        empresaNombre: perfil.nombreEmpresa,
        beneficioSocio: beneficioSocio.toString(),
        beneficioPlataforma: beneficioPlataforma.toString(),
        socioPercentage: EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE.toString(),
        plataformaPercentage: EWOORKER_REVENUE_SPLIT.PLATAFORMA_PERCENTAGE.toString(),
        contratoId: data.contratoId || '',
      },
    });

    // Crear registro de pago
    await prisma.ewoorkerPago.create({
      data: {
        contratoId: data.contratoId || null,
        perfilReceptorId: data.empresaId,
        tipo: data.tipo,
        concepto: data.tipo.replace(/_/g, ' '),
        descripcion: data.descripcion,
        montoBase: montoEnCentimos,
        montoComision: montoEnCentimos,
        montoNeto: 0, // Todo es comisión
        beneficioEwoorker: beneficioPlataforma,
        beneficioSocio: beneficioSocio,
        estado: 'PENDIENTE',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    logger.info('✅ [eWoorker] Pago de servicio creado', {
      empresaId: data.empresaId,
      tipo: data.tipo,
      monto: comisionConfig.valor,
      beneficioSocio: beneficioSocio / 100,
      beneficioPlataforma: beneficioPlataforma / 100,
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      monto: comisionConfig.valor,
      beneficioSocio: beneficioSocio / 100,
      beneficioPlataforma: beneficioPlataforma / 100,
    };
  } catch (error: any) {
    logger.error('❌ [eWoorker] Error creando pago de servicio:', error);
    throw error;
  }
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

/**
 * Maneja webhooks de Stripe para pagos de eWoorker
 * Identifica los pagos por la metadata platform: 'ewoorker'
 */
export async function handleEwoorkerStripeWebhook(
  event: Stripe.Event
): Promise<{ handled: boolean; message: string }> {
  try {
    // Verificar si es un evento de eWoorker
    let metadata: Record<string, string> = {};
    
    if (event.type.startsWith('payment_intent')) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      metadata = paymentIntent.metadata || {};
    } else if (event.type.startsWith('invoice') || event.type.startsWith('customer.subscription')) {
      const obj = event.data.object as any;
      metadata = obj.metadata || {};
    }

    // Si no es eWoorker, retornar sin manejar
    if (metadata.platform !== 'ewoorker') {
      return { handled: false, message: 'No es un evento de eWoorker' };
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Actualizar pago en BD
        const pago = await prisma.ewoorkerPago.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (pago) {
          await prisma.ewoorkerPago.update({
            where: { id: pago.id },
            data: {
              estado: 'PAGADO',
              fechaPago: new Date(),
            },
          });

          logger.info('💰 [eWoorker] Pago exitoso', {
            pagoId: pago.id,
            tipo: pago.tipo,
            beneficioSocio: pago.beneficioSocio / 100,
            beneficioEwoorker: pago.beneficioEwoorker / 100,
          });
        }

        return { handled: true, message: 'Pago procesado' };
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await prisma.ewoorkerPago.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { estado: 'FALLIDO' },
        });

        logger.warn('⚠️ [eWoorker] Pago fallido', {
          paymentIntentId: paymentIntent.id,
        });

        return { handled: true, message: 'Pago fallido registrado' };
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.ewoorkerSuscripcion.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            estado: subscription.status === 'active' ? 'ACTIVA' : 
                   subscription.status === 'canceled' ? 'CANCELADA' : 'PENDIENTE',
            fechaProximoPago: new Date(subscription.current_period_end * 1000),
          },
        });

        logger.info('📅 [eWoorker] Suscripción actualizada', {
          subscriptionId: subscription.id,
          status: subscription.status,
        });

        return { handled: true, message: 'Suscripción actualizada' };
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.ewoorkerSuscripcion.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { estado: 'CANCELADA' },
        });

        logger.info('🚫 [eWoorker] Suscripción cancelada', {
          subscriptionId: subscription.id,
        });

        return { handled: true, message: 'Suscripción cancelada' };
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Registrar pago de suscripción
        if (invoice.subscription) {
          const suscripcion = await prisma.ewoorkerSuscripcion.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string },
          });

          if (suscripcion) {
            const beneficioSocio = Math.round(invoice.amount_paid * EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE / 100);
            const beneficioPlataforma = invoice.amount_paid - beneficioSocio;

            await prisma.ewoorkerPago.create({
              data: {
                perfilReceptorId: suscripcion.perfilEmpresaId,
                tipo: 'SUSCRIPCION_MENSUAL',
                concepto: `Suscripción ${suscripcion.plan}`,
                montoBase: invoice.amount_paid,
                montoComision: invoice.amount_paid,
                montoNeto: 0,
                beneficioEwoorker: beneficioPlataforma,
                beneficioSocio: beneficioSocio,
                estado: 'PAGADO',
                fechaPago: new Date(),
              },
            });

            logger.info('💳 [eWoorker] Factura de suscripción pagada', {
              invoiceId: invoice.id,
              monto: invoice.amount_paid / 100,
              beneficioSocio: beneficioSocio / 100,
            });
          }
        }

        return { handled: true, message: 'Factura procesada' };
      }

      default:
        return { handled: false, message: `Evento no manejado: ${event.type}` };
    }
  } catch (error: any) {
    logger.error('❌ [eWoorker] Error en webhook:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE CONSULTA
// ============================================================================

/**
 * Obtiene el resumen de ingresos para el socio
 */
export async function getResumenIngresosSocio(periodo?: {
  desde: Date;
  hasta: Date;
}): Promise<{
  totalIngresos: number;
  beneficioSocio: number;
  beneficioPlataforma: number;
  porTipo: Record<string, { total: number; socio: number; plataforma: number }>;
  pagosCount: number;
}> {
  const where: any = {
    estado: { in: ['PAGADO', 'LIBERADO'] },
  };

  if (periodo) {
    where.fechaPago = {
      gte: periodo.desde,
      lte: periodo.hasta,
    };
  }

  const pagos = await prisma.ewoorkerPago.findMany({
    where,
    select: {
      tipo: true,
      montoComision: true,
      beneficioSocio: true,
      beneficioEwoorker: true,
    },
  });

  const resultado = {
    totalIngresos: 0,
    beneficioSocio: 0,
    beneficioPlataforma: 0,
    porTipo: {} as Record<string, { total: number; socio: number; plataforma: number }>,
    pagosCount: pagos.length,
  };

  for (const pago of pagos) {
    resultado.totalIngresos += pago.montoComision;
    resultado.beneficioSocio += pago.beneficioSocio;
    resultado.beneficioPlataforma += pago.beneficioEwoorker;

    if (!resultado.porTipo[pago.tipo]) {
      resultado.porTipo[pago.tipo] = { total: 0, socio: 0, plataforma: 0 };
    }
    resultado.porTipo[pago.tipo].total += pago.montoComision;
    resultado.porTipo[pago.tipo].socio += pago.beneficioSocio;
    resultado.porTipo[pago.tipo].plataforma += pago.beneficioEwoorker;
  }

  // Convertir de céntimos a euros
  resultado.totalIngresos /= 100;
  resultado.beneficioSocio /= 100;
  resultado.beneficioPlataforma /= 100;
  for (const tipo of Object.keys(resultado.porTipo)) {
    resultado.porTipo[tipo].total /= 100;
    resultado.porTipo[tipo].socio /= 100;
    resultado.porTipo[tipo].plataforma /= 100;
  }

  return resultado;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  crearSuscripcionEwoorker,
  crearPagoEscrowEwoorker,
  crearPagoServicioEwoorker,
  handleEwoorkerStripeWebhook,
  getResumenIngresosSocio,
  EWOORKER_PLANS,
  EWOORKER_COMISIONES,
  EWOORKER_REVENUE_SPLIT,
};
