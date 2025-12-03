import { prisma } from './db';
import logger, { logError } from '@/lib/logger';

export async function conectarCuentaBancaria(params: any) {
  const { companyId, nombreBanco, tipoCuenta } = params;

  const connection = await prisma.bankConnection.create({
    data: {
      companyId,
      proveedor: 'demo',
      proveedorItemId: `DEMO_${Date.now()}`,
      nombreBanco,
      tipoCuenta,
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
    message: '[MODO DEMO] Cuenta bancaria conectada (simulado)'
  };
}

export async function sincronizarTransacciones(connectionId: string) {
  const connection = await prisma.bankConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) {
    throw new Error('Conexión bancaria no encontrada');
  }

  logger.info(`💳 [MODO DEMO] Sincronización simulada`);

  return {
    success: true,
    transacciones: [],
    message: '[MODO DEMO] Transacciones sincronizadas (simulado)'
  };
}

export async function verificarIngresos(tenantId: string) {
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
      verificado: true
    },
    message: '[MODO DEMO] Ingresos verificados (simulado)'
  };
}

export async function conciliarPagos(companyId: string) {
  logger.info(`🔄 [MODO DEMO] Conciliación de pagos simulada`);

  return {
    success: true,
    conciliaciones: [],
    message: '[MODO DEMO] 0 pagos conciliados'
  };
}
