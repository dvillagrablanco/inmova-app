/**
 * Servicio de IoT y Edificios Inteligentes
 * Gestión de dispositivos IoT, lecturas, automatizaciones y alertas
 */

import { prisma } from './db';
import { subHours, subDays } from 'date-fns';
import logger, { logError } from '@/lib/logger';

/**
 * Registra una lectura de un dispositivo IoT
 */
export async function registrarLectura(
  deviceId: string,
  metrica: string,
  valor: number,
  unidad: string
) {
  // Crear lectura
  const reading = await prisma.ioTReading.create({
    data: {
      deviceId,
      metrica,
      valor,
      unidad,
    },
  });

  // Verificar umbrales y generar alertas si es necesario
  await verificarUmbrales(deviceId, metrica, valor);

  // Actualizar última conexión del dispositivo
  await prisma.ioTDevice.update({
    where: { id: deviceId },
    data: {
      conectado: true,
      ultimaConexion: new Date(),
    },
  });

  return reading;
}

/**
 * Verifica umbrales configurados y genera alertas
 */
export async function verificarUmbrales(deviceId: string, metrica: string, valor: number) {
  const device = await prisma.ioTDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device || !device.umbrales) {
    return;
  }

  const umbrales: any = device.umbrales;
  const umbralMetrica = umbrales[metrica];

  if (!umbralMetrica) {
    return;
  }

  let alerta = false;
  let severidad = 'media';
  let mensaje = '';

  // Verificar umbral máximo
  if (umbralMetrica.max && valor > umbralMetrica.max) {
    alerta = true;
    severidad = umbralMetrica.severidad || 'alta';
    mensaje = `${metrica} ha excedido el umbral máximo: ${valor} ${umbralMetrica.unidad || ''} > ${umbralMetrica.max}`;
  }

  // Verificar umbral mínimo
  if (umbralMetrica.min && valor < umbralMetrica.min) {
    alerta = true;
    severidad = umbralMetrica.severidad || 'media';
    mensaje = `${metrica} está por debajo del umbral mínimo: ${valor} ${umbralMetrica.unidad || ''} < ${umbralMetrica.min}`;
  }

  if (alerta) {
    // Verificar si ya existe una alerta activa similar
    const alertaExistente = await prisma.ioTAlert.findFirst({
      where: {
        deviceId,
        estado: 'activa',
        mensaje: { contains: metrica },
      },
    });

    if (!alertaExistente) {
      await prisma.ioTAlert.create({
        data: {
          companyId: device.companyId,
          deviceId,
          tipo: 'warning',
          titulo: `Alerta de ${metrica}`,
          mensaje,
          severidad,
          metadata: {
            metrica,
            valor,
            umbral: umbralMetrica,
          },
        },
      });
    }
  }
}

/**
 * Obtiene lecturas históricas de un dispositivo
 */
export async function obtenerLecturasHistoricas(
  deviceId: string,
  metrica?: string,
  horasAtras: number = 24
) {
  const fechaDesde = subHours(new Date(), horasAtras);

  const where: any = {
    deviceId,
    timestamp: { gte: fechaDesde },
  };

  if (metrica) {
    where.metrica = metrica;
  }

  const lecturas = await prisma.ioTReading.findMany({
    where,
    orderBy: { timestamp: 'asc' },
  });

  // Agrupar por métrica
  const porMetrica: Record<string, any[]> = {};

  lecturas.forEach((lectura) => {
    if (!porMetrica[lectura.metrica]) {
      porMetrica[lectura.metrica] = [];
    }
    porMetrica[lectura.metrica].push({
      timestamp: lectura.timestamp,
      valor: lectura.valor,
      unidad: lectura.unidad,
    });
  });

  return {
    total: lecturas.length,
    porMetrica,
    lecturas,
  };
}

/**
 * Ejecuta una automatización
 */
export async function ejecutarAutomatizacion(automationId: string) {
  const automation = await prisma.ioTAutomation.findUnique({
    where: { id: automationId },
    include: { device: true },
  });

  if (!automation || !automation.activa) {
    return { ejecutado: false, motivo: 'Automatización no válida o inactiva' };
  }

  // Verificar condiciones
  const condicionesCumplidas = await verificarCondiciones(
    automation.deviceId,
    automation.condiciones as any
  );

  if (!condicionesCumplidas) {
    return { ejecutado: false, motivo: 'Condiciones no cumplidas' };
  }

  // Ejecutar acciones
  const acciones: any = automation.acciones;
  const resultados = [];

  for (const accion of acciones) {
    try {
      const resultado = await ejecutarAccion(automation.deviceId, accion);
      resultados.push({ accion: accion.tipo, resultado, exito: true });
    } catch (error: any) {
      resultados.push({ accion: accion.tipo, error: error.message, exito: false });
    }
  }

  // Actualizar estadísticas
  await prisma.ioTAutomation.update({
    where: { id: automationId },
    data: {
      ultimaEjecucion: new Date(),
      vecesEjecutada: { increment: 1 },
    },
  });

  return {
    ejecutado: true,
    resultados,
  };
}

/**
 * Verifica condiciones de una automatización
 */
async function verificarCondiciones(deviceId: string, condiciones: any): Promise<boolean> {
  // Obtener última lectura del dispositivo
  const ultimaLectura = await prisma.ioTReading.findFirst({
    where: {
      deviceId,
      metrica: condiciones.metrica,
    },
    orderBy: { timestamp: 'desc' },
  });

  if (!ultimaLectura) {
    return false;
  }

  const { operador, valor } = condiciones;

  switch (operador) {
    case '>':
      return ultimaLectura.valor > valor;
    case '<':
      return ultimaLectura.valor < valor;
    case '==':
      return ultimaLectura.valor === valor;
    case '>=':
      return ultimaLectura.valor >= valor;
    case '<=':
      return ultimaLectura.valor <= valor;
    default:
      return false;
  }
}

/**
 * Ejecuta una acción en un dispositivo
 */
async function ejecutarAccion(deviceId: string, accion: any) {
  const device = await prisma.ioTDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device) {
    throw new Error('Dispositivo no encontrado');
  }

  // En un entorno real, aquí se enviaría el comando al dispositivo
  // Por ahora, simulamos la ejecución
  logger.info(`Ejecutando acción en dispositivo ${device.nombre}:`, accion);

  return {
    tipo: accion.tipo,
    parametros: accion.parametros,
    timestamp: new Date(),
  };
}

/**
 * Obtiene estadísticas de consumo energético
 */
export async function obtenerEstadisticasEnergia(
  companyId: string,
  buildingId?: string,
  diasAtras: number = 30
) {
  const fechaDesde = subDays(new Date(), diasAtras);

  const where: any = {
    device: {
      companyId,
      tipo: 'energy_meter',
    },
    metrica: 'power',
    timestamp: { gte: fechaDesde },
  };

  if (buildingId) {
    where.device.buildingId = buildingId;
  }

  const lecturas = await prisma.ioTReading.findMany({
    where,
    include: {
      device: {
        include: { building: true },
      },
    },
  });

  const consumoTotal = lecturas.reduce((sum, l) => sum + l.valor, 0);
  const consumoPromedioDiario = consumoTotal / diasAtras;

  // Por edificio
  const porEdificio: Record<string, number> = {};
  lecturas.forEach((lectura) => {
    const buildingName = lectura.device.building?.nombre || 'Sin edificio';
    if (!porEdificio[buildingName]) {
      porEdificio[buildingName] = 0;
    }
    porEdificio[buildingName] += lectura.valor;
  });

  return {
    periodo: `Últimos ${diasAtras} días`,
    consumoTotal: Math.round(consumoTotal),
    consumoPromedioDiario: Math.round(consumoPromedioDiario),
    unidad: 'kWh',
    porEdificio,
    costEstimado: Math.round(consumoTotal * 0.15), // €0.15/kWh estimado
  };
}

/**
 * Detecta dispositivos desconectados
 */
export async function detectarDispositivosDesconectados(
  companyId: string,
  minutosInactividad: number = 60
) {
  const fechaLimite = subHours(new Date(), minutosInactividad / 60);

  const dispositivosDesconectados = await prisma.ioTDevice.findMany({
    where: {
      companyId,
      OR: [{ ultimaConexion: { lt: fechaLimite } }, { ultimaConexion: null }],
    },
    include: {
      building: true,
      unit: true,
    },
  });

  // Generar alertas para dispositivos críticos desconectados
  for (const device of dispositivosDesconectados) {
    if (['thermostat', 'lock', 'sensor'].includes(device.tipo)) {
      const alertaExistente = await prisma.ioTAlert.findFirst({
        where: {
          deviceId: device.id,
          estado: 'activa',
          tipo: 'error',
        },
      });

      if (!alertaExistente) {
        await prisma.ioTAlert.create({
          data: {
            companyId,
            deviceId: device.id,
            tipo: 'error',
            titulo: 'Dispositivo Desconectado',
            mensaje: `El dispositivo ${device.nombre} lleva más de ${minutosInactividad} minutos sin conexión`,
            severidad: 'alta',
          },
        });
      }
    }
  }

  return dispositivosDesconectados;
}
