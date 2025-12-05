import { PrismaClient } from '@prisma/client';
import { addYears, addMonths, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

// ============================================
// CÉDULAS DE HABITABILIDAD
// ============================================

export async function createHabitabilityCertificate(data: {
  companyId: string;
  unitId: string;
  numeroCedula: string;
  tipo: string;
  estado: string;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  vigenciaIndefinida?: boolean;
  superficieUtil?: number;
  numeroHabitaciones?: number;
  organismoExpedidor: string;
  registroNumero?: string;
  documentoURL?: string;
  documentoStorage?: string;
}) {
  return await prisma.habitabilityCertificate.create({
    data,
  });
}

export async function getHabitabilityCertificates(companyId: string, estado?: string) {
  return await prisma.habitabilityCertificate.findMany({
    where: {
      companyId,
      ...(estado && { estado }),
    },
    include: {
      unit: {
        select: {
          id: true,
          numero: true,
          piso: true,
          building: {
            select: {
              nombre: true,
              direccion: true,
            },
          },
        },
      },
    },
    orderBy: { fechaEmision: 'desc' },
  });
}

export async function checkExpiringCertificates(companyId: string, diasAnticipacion: number = 60) {
  const fechaLimite = addMonths(new Date(), Math.floor(diasAnticipacion / 30));

  const certificados = await prisma.habitabilityCertificate.findMany({
    where: {
      companyId,
      vigenciaIndefinida: false,
      estado: 'vigente',
      fechaVencimiento: {
        lte: fechaLimite,
      },
      alertaEnviada: false,
    },
    include: {
      unit: true,
    },
  });

  // Marcar alertas como enviadas
  for (const cert of certificados) {
    await prisma.habitabilityCertificate.update({
      where: { id: cert.id },
      data: { alertaEnviada: true },
    });
  }

  return certificados;
}

// ============================================
// INSPECCIONES TÉCNICAS DE EDIFICIOS (ITE)
// ============================================

export async function createBuildingInspection(data: {
  companyId: string;
  buildingId: string;
  tipo: string;
  estado: string;
  fechaInspeccion: Date;
  fechaVencimiento: Date;
  resultado: string;
  tecnicoNombre: string;
  tecnicoColegio: string;
  numeroRegistro?: string;
  deficienciasEncontradas?: any[];
  accionesRequeridas?: any[];
  certificadoURL?: string;
  documentos?: any[];
}) {
  // Calcular próxima inspección (normalmente cada 10 años)
  const proximaInspeccion = addYears(data.fechaVencimiento, 10);

  return await prisma.buildingInspection.create({
    data: {
      ...data,
      proximaInspeccion,
      deficienciasEncontradas: data.deficienciasEncontradas || [],
      accionesRequeridas: data.accionesRequeridas || [],
      documentos: data.documentos || [],
    },
  });
}

export async function getBuildingInspections(companyId: string, buildingId?: string, estado?: string) {
  return await prisma.buildingInspection.findMany({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
      ...(estado && { estado }),
    },
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
        },
      },
    },
    orderBy: { fechaInspeccion: 'desc' },
  });
}

export async function checkExpiringInspections(companyId: string, diasAnticipacion: number = 90) {
  const fechaLimite = addMonths(new Date(), Math.floor(diasAnticipacion / 30));

  const inspecciones = await prisma.buildingInspection.findMany({
    where: {
      companyId,
      estado: 'vigente',
      fechaVencimiento: {
        lte: fechaLimite,
      },
      alertasEnviadas: false,
    },
    include: {
      building: true,
    },
  });

  // Marcar alertas como enviadas y crear recordatorios
  for (const insp of inspecciones) {
    const diasRestantes = differenceInDays(insp.fechaVencimiento, new Date());
    const recordatorios = insp.recordatorios as any[] || [];
    recordatorios.push({
      fecha: new Date(),
      tipo: 'vencimiento_proximo',
      diasRestantes,
    });

    await prisma.buildingInspection.update({
      where: { id: insp.id },
      data: {
        alertasEnviadas: true,
        recordatorios,
      },
    });
  }

  return inspecciones;
}

// ============================================
// MODELO 347 - DECLARACIÓN ANUAL DE OPERACIONES
// ============================================

export async function generateModelo347Records(companyId: string, ejercicio: number) {
  // Obtener la empresa para datos del declarante
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) throw new Error('Empresa no encontrada');

  // Obtener todos los contratos del año con pagos
  const contratos = await prisma.contract.findMany({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      OR: [
        {
          fechaInicio: {
            gte: new Date(`${ejercicio}-01-01`),
            lte: new Date(`${ejercicio}-12-31`),
          },
        },
        {
          fechaFin: {
            gte: new Date(`${ejercicio}-01-01`),
            lte: new Date(`${ejercicio}-12-31`),
          },
        },
      ],
    },
    include: {
      tenant: true,
      payments: {
        where: {
          fechaPago: {
            gte: new Date(`${ejercicio}-01-01`),
            lte: new Date(`${ejercicio}-12-31`),
          },
          estado: 'pagado',
        },
      },
    },
  });

  const records = [];
  const operacionesPorTercero = new Map();

  // Agrupar operaciones por tercero (inquilino)
  for (const contrato of contratos) {
    const nif = contrato.tenant?.dni || 'SIN_NIF';
    const nombre = `${contrato.tenant?.nombre || ''} ${contrato.tenant?.apellidos || ''}`.trim();

    if (!operacionesPorTercero.has(nif)) {
      operacionesPorTercero.set(nif, {
        nif,
        nombre,
        totalAnual: 0,
        trimestre1: 0,
        trimestre2: 0,
        trimestre3: 0,
        trimestre4: 0,
      });
    }

    const operacion = operacionesPorTercero.get(nif);

    for (const pago of contrato.payments) {
      const mes = pago.fechaPago?.getMonth() || 0;
      const trimestre = Math.floor(mes / 3) + 1;

      operacion.totalAnual += pago.monto;
      operacion[`trimestre${trimestre}`] += pago.monto;
    }
  }

  // Crear registros solo para operaciones superiores a 3.005,06€
  const umbral = 3005.06;

  for (const [nif, operacion] of operacionesPorTercero) {
    if (operacion.totalAnual >= umbral) {
      // Verificar si ya existe
      const existente = await prisma.modelo347Record.findUnique({
        where: {
          companyId_ejercicio_nifDeclarado: {
            companyId,
            ejercicio,
            nifDeclarado: nif,
          },
        },
      });

      const data = {
        companyId,
        ejercicio,
        nifDeclarante: company.cif || 'SIN_CIF',
        razonSocialDeclarante: company.nombreEmpresa,
        nifDeclarado: nif,
        razonSocialDeclarado: operacion.nombre,
        tipoOperacion: 'B', // B = Ventas (ingresos por alquileres)
        importeAnual: operacion.totalAnual,
        importeTrimestre1: operacion.trimestre1,
        importeTrimestre2: operacion.trimestre2,
        importeTrimestre3: operacion.trimestre3,
        importeTrimestre4: operacion.trimestre4,
      };

      if (existente) {
        const updated = await prisma.modelo347Record.update({
          where: { id: existente.id },
          data,
        });
        records.push(updated);
      } else {
        const nuevo = await prisma.modelo347Record.create({
          data,
        });
        records.push(nuevo);
      }
    }
  }

  return records;
}

export async function getModelo347Records(companyId: string, ejercicio: number) {
  return await prisma.modelo347Record.findMany({
    where: {
      companyId,
      ejercicio,
    },
    orderBy: { importeAnual: 'desc' },
  });
}

// ============================================
// MODELO 180 - RETENCIONES E INGRESOS A CUENTA
// ============================================

export async function generateModelo180Records(
  companyId: string,
  ejercicio: number,
  trimestre: number
) {
  // Obtener contratos con pagos en el trimestre
  const mesInicio = (trimestre - 1) * 3 + 1;
  const mesFin = trimestre * 3;

  const fechaInicio = new Date(`${ejercicio}-${String(mesInicio).padStart(2, '0')}-01`);
  const fechaFin = new Date(`${ejercicio}-${String(mesFin).padStart(2, '0')}-31`);

  const contratos = await prisma.contract.findMany({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      payments: {
        some: {
          fechaPago: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          estado: 'pagado',
        },
      },
    },
    include: {
      tenant: true,
      payments: {
        where: {
          fechaPago: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          estado: 'pagado',
        },
      },
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  const records = [];

  for (const contrato of contratos) {
    const baseImponible = contrato.payments.reduce((sum, p) => sum + p.monto, 0);

    if (baseImponible === 0) continue;

    // Determinar tipo de retención (19% para personas físicas, 24% para no residentes)
    const tipoRetencion = 19; // Simplificado
    const importeRetenido = (baseImponible * tipoRetencion) / 100;

    const situacionInmueble = contrato.unit?.building?.ciudad || 'Desconocida';
    const referencialCatastral = contrato.unit?.referenciaCatastral || null;

    const data = {
      companyId,
      ejercicio,
      trimestre,
      nifArrendador: '', // Debe obtenerse del propietario real
      nombreArrendador: '', // Debe obtenerse del propietario real
      nifArrendatario: contrato.tenant?.dni || 'SIN_NIF',
      nombreArrendatario: `${contrato.tenant?.nombre || ''} ${contrato.tenant?.apellidos || ''}`.trim(),
      baseImponible,
      tipoRetencion,
      importeRetenido,
      situacionInmueble,
      referencialCatastral,
    };

    // Verificar si ya existe
    const existente = await prisma.modelo180Record.findUnique({
      where: {
        companyId_ejercicio_trimestre_nifArrendatario: {
          companyId,
          ejercicio,
          trimestre,
          nifArrendatario: data.nifArrendatario,
        },
      },
    });

    if (existente) {
      const updated = await prisma.modelo180Record.update({
        where: { id: existente.id },
        data,
      });
      records.push(updated);
    } else {
      const nuevo = await prisma.modelo180Record.create({
        data,
      });
      records.push(nuevo);
    }
  }

  return records;
}

export async function getModelo180Records(
  companyId: string,
  ejercicio: number,
  trimestre?: number
) {
  return await prisma.modelo180Record.findMany({
    where: {
      companyId,
      ejercicio,
      ...(trimestre && { trimestre }),
    },
    orderBy: [
      { trimestre: 'asc' },
      { baseImponible: 'desc' },
    ],
  });
}

// ============================================
// ALERTAS Y RECORDATORIOS
// ============================================

export async function checkAllCompliance(companyId: string) {
  const alertas = [];

  // Verificar cédulas próximas a vencer
  const cedulasVenciendo = await checkExpiringCertificates(companyId);
  alertas.push(...cedulasVenciendo.map((c) => ({
    tipo: 'cedula_habitabilidad',
    severidad: 'media',
    mensaje: `Cédula de habitabilidad ${c.numeroCedula} próxima a vencer`,
    data: c,
  })));

  // Verificar inspecciones próximas
  const inspeccionesVenciendo = await checkExpiringInspections(companyId);
  alertas.push(...inspeccionesVenciendo.map((i) => ({
    tipo: 'inspeccion_tecnica',
    severidad: 'alta',
    mensaje: `Inspección técnica del edificio ${i.building?.nombre} próxima a vencer`,
    data: i,
  })));

  return alertas;
}
