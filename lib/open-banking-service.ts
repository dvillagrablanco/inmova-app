import { prisma } from './db';
import { bankinterService, isBankinterConfigured } from './bankinter-integration-service';
import logger, { logError } from '@/lib/logger';

/**
 * Servicio de Open Banking
 * 
 * Este servicio actúa como un wrapper que:
 * - Usa la integración real de Bankinter cuando está configurada
 * - Cae en modo DEMO cuando no hay configuración
 */

/**
 * Conecta una cuenta bancaria
 */
export async function conectarCuentaBancaria(params: any) {
  const { companyId, userId, nombreBanco, tipoCuenta, psuIpAddress } = params;

  // Si Bankinter está configurado y es el banco seleccionado, usar integración real
  if (isBankinterConfigured() && nombreBanco?.toLowerCase().includes('bankinter')) {
    try {
      const { consentId, authUrl } = await bankinterService.conectarCuentaBankinter(
        companyId,
        userId,
        psuIpAddress || '127.0.0.1'
      );

      logger.info(`🏦 Cuenta Bankinter conectada: ${consentId}`);

      return {
        success: true,
        consentId,
        authUrl,
        requiresAuth: true,
        message: 'Redirigir al usuario a authUrl para autenticar con Bankinter'
      };
    } catch (error) {
      logError(error as Error, { context: 'conectarCuentaBancaria.bankinter' });
      // Caer en modo demo si falla
    }
  }

  // Modo DEMO (fallback)
  const connection = await prisma.bankConnection.create({
    data: {
      companyId,
      proveedor: 'demo',
      proveedorItemId: `DEMO_${Date.now()}`,
      nombreBanco: nombreBanco || 'Banco Demo',
      tipoCuenta: tipoCuenta || 'corriente',
      ultimosDigitos: String(Math.floor(1000 + Math.random() * 9000)),
      moneda: 'EUR',
      estado: 'conectado' as any,
      ultimaSync: new Date()
    }
  });

  logger.info(`🏦 [MODO DEMO] Cuenta bancaria conectada: ${nombreBanco}`);

  return {
    success: true,
    connection,
    requiresAuth: false,
    message: '[MODO DEMO] Cuenta bancaria conectada (simulado)'
  };
}

/**
 * Sincroniza transacciones de una conexión bancaria
 */
export async function sincronizarTransacciones(connectionId: string, diasAtras?: number) {
  const connection = await prisma.bankConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) {
    throw new Error('Conexión bancaria no encontrada');
  }

  // Si es conexión de Bankinter real, usar integración
  if (connection.proveedor === 'bankinter_redsys' && isBankinterConfigured()) {
    try {
      const resultado = await bankinterService.sincronizarTransaccionesBankinter(
        connectionId,
        diasAtras || 90
      );

      logger.info(`💳 Transacciones sincronizadas de Bankinter: ${resultado.total}`);

      return {
        success: true,
        transacciones: resultado.transacciones,
        total: resultado.total,
        message: `${resultado.total} transacciones sincronizadas de Bankinter`
      };
    } catch (error) {
      logError(error as Error, { context: 'sincronizarTransacciones.bankinter' });
      throw error;
    }
  }

  // Modo DEMO
  logger.info(`💳 [MODO DEMO] Sincronización simulada`);

  return {
    success: true,
    transacciones: [],
    total: 0,
    message: '[MODO DEMO] Transacciones sincronizadas (simulado)'
  };
}

/**
 * Verifica los ingresos de un inquilino
 */
export async function verificarIngresos(tenantId: string, mesesAnalisis?: number) {
  // Buscar si el tenant tiene conexión Bankinter
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      bankConnections: {
        where: {
          proveedor: 'bankinter_redsys',
          estado: 'conectado'
        },
        take: 1
      }
    }
  });

  // Si tiene Bankinter configurado, usar integración real
  if (tenant?.bankConnections?.length && isBankinterConfigured()) {
    try {
      const informe = await bankinterService.verificarIngresosBankinter(
        tenantId,
        mesesAnalisis || 3
      );

      logger.info(`💰 Ingresos verificados con Bankinter para tenant ${tenantId}`);

      return {
        success: true,
        informe,
        message: 'Ingresos verificados con datos reales de Bankinter'
      };
    } catch (error) {
      logError(error as Error, { context: 'verificarIngresos.bankinter' });
      // Caer en modo demo si falla
    }
  }

  // Modo DEMO
  logger.info(`💰 [MODO DEMO] Verificación de ingresos simulada para tenant ${tenantId}`);

  return {
    success: true,
    informe: {
      tenantId,
      fechaVerificacion: new Date(),
      ingresosPromedio: 2500,
      ingresosMinimos: 2000,
      ingresosMaximos: 3000,
      estabilidad: 85,
      fuentesIngresos: ['Salario', 'Transferencia'],
      recomendacion: 'Buena capacidad de pago. Ingresos estables.',
      verificado: true,
      proveedor: 'demo'
    },
    message: '[MODO DEMO] Ingresos verificados (simulado)'
  };
}

/**
 * Concilia pagos automáticamente con transacciones bancarias
 */
export async function conciliarPagos(companyId: string, mesesAtras?: number) {
  // Verificar si hay conexiones Bankinter
  const connections = await prisma.bankConnection.findMany({
    where: {
      companyId,
      proveedor: 'bankinter_redsys',
      estado: 'conectado'
    },
    take: 1
  });

  // Si tiene Bankinter configurado, usar integración real
  if (connections.length > 0 && isBankinterConfigured()) {
    try {
      const resultado = await bankinterService.conciliarPagosBankinter(
        companyId,
        mesesAtras || 1
      );

      logger.info(`🔄 Pagos conciliados con Bankinter: ${resultado.conciliados}/${resultado.total}`);

      return {
        success: true,
        conciliados: resultado.conciliados,
        total: resultado.total,
        message: `${resultado.conciliados} de ${resultado.total} pagos conciliados automáticamente`
      };
    } catch (error) {
      logError(error as Error, { context: 'conciliarPagos.bankinter' });
      // Caer en modo demo si falla
    }
  }

  // Modo DEMO
  logger.info(`🔄 [MODO DEMO] Conciliación de pagos simulada`);

  return {
    success: true,
    conciliados: 0,
    total: 0,
    message: '[MODO DEMO] 0 pagos conciliados'
  };
}

/**
 * Inicia un pago a través de Open Banking
 */
export async function iniciarPago(params: {
  companyId: string;
  userId: string;
  psuIpAddress: string;
  debtorIban: string;
  creditorIban: string;
  creditorName: string;
  amount: number;
  currency: string;
  concept?: string;
}) {
  const {
    companyId,
    userId,
    psuIpAddress,
    debtorIban,
    creditorIban,
    creditorName,
    amount,
    currency,
    concept
  } = params;

  // Si Bankinter está configurado, usar integración real
  if (isBankinterConfigured()) {
    try {
      const { paymentId, scaRedirectUrl } = await bankinterService.initiatePayment(
        companyId,
        userId,
        psuIpAddress || '127.0.0.1',
        {
          instructedAmount: {
            currency: currency || 'EUR',
            amount: amount.toFixed(2)
          },
          debtorAccount: {
            iban: debtorIban,
            currency: currency || 'EUR'
          },
          creditorAccount: {
            iban: creditorIban
          },
          creditorName,
          remittanceInformationUnstructured: concept
        }
      );

      logger.info(`💸 Pago iniciado con Bankinter: ${paymentId}`);

      return {
        success: true,
        paymentId,
        authUrl: scaRedirectUrl,
        requiresAuth: true,
        message: 'Pago iniciado. Redirigir al usuario para autenticar.'
      };
    } catch (error) {
      logError(error as Error, { context: 'iniciarPago.bankinter' });
      throw error;
    }
  }

  // Modo DEMO
  logger.info(`💸 [MODO DEMO] Pago simulado de ${amount} ${currency}`);

  return {
    success: true,
    paymentId: `DEMO_PAY_${Date.now()}`,
    requiresAuth: false,
    message: '[MODO DEMO] Pago iniciado (simulado)'
  };
}
