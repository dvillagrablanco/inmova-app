import { PrismaClient, ActaEstado, CuotaTipo, FondoTipo, PaymentStatus, VotacionEstado } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// LIBRO DE ACTAS DIGITAL
// ============================================

export async function createCommunityMinute(data: {
  companyId: string;
  buildingId: string;
  fecha: Date;
  convocatoria: string;
  asistentes: any[];
  ordenDia: any[];
  acuerdos: any[];
  creadoPor: string;
  documentos?: any[];
  observaciones?: string;
}) {
  // Obtener el próximo número de acta
  const lastActa = await prisma.communityMinute.findFirst({
    where: {
      companyId: data.companyId,
      buildingId: data.buildingId,
    },
    orderBy: { numeroActa: 'desc' },
  });

  const numeroActa = (lastActa?.numeroActa || 0) + 1;

  return await prisma.communityMinute.create({
    data: {
      ...data,
      numeroActa,
      estado: ActaEstado.borrador,
      documentos: data.documentos || [],
    },
  });
}

export async function approveCommunityMinute(id: string, aprobadoPor: string) {
  return await prisma.communityMinute.update({
    where: { id },
    data: {
      estado: ActaEstado.aprobada,
      aprobadoPor,
      fechaAprobacion: new Date(),
    },
  });
}

export async function getCommunityMinutes(companyId: string, buildingId?: string, estado?: ActaEstado) {
  return await prisma.communityMinute.findMany({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
      ...(estado && { estado }),
    },
    orderBy: { fecha: 'desc' },
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
        },
      },
    },
  });
}

export async function getCommunityMinuteById(id: string) {
  return await prisma.communityMinute.findUnique({
    where: { id },
    include: {
      building: true,
      company: {
        select: {
          id: true,
          nombreEmpresa: true,
        },
      },
    },
  });
}

// ============================================
// GESTIÓN DE CUOTAS DE COMUNIDAD
// ============================================

export async function createCommunityFee(data: {
  companyId: string;
  buildingId: string;
  unitId?: string;
  tipo: CuotaTipo;
  periodo: string;
  concepto: string;
  importeBase: number;
  coeficiente?: number;
  fechaVencimiento: Date;
  gastosCorrientes?: number;
  fondoReserva?: number;
  seguros?: number;
  mantenimiento?: number;
  otros?: number;
  notas?: string;
}) {
  const coeficiente = data.coeficiente || 1.0;
  const importeTotal = data.importeBase * coeficiente;

  return await prisma.communityFee.create({
    data: {
      ...data,
      coeficiente,
      importeTotal,
      gastosCorrientes: data.gastosCorrientes || 0,
      fondoReserva: data.fondoReserva || 0,
      seguros: data.seguros || 0,
      mantenimiento: data.mantenimiento || 0,
      otros: data.otros || 0,
    },
  });
}

export async function getCommunityFees(
  companyId: string,
  filters?: {
    buildingId?: string;
    unitId?: string;
    periodo?: string;
    estado?: PaymentStatus;
  }
) {
  return await prisma.communityFee.findMany({
    where: {
      companyId,
      ...(filters?.buildingId && { buildingId: filters.buildingId }),
      ...(filters?.unitId && { unitId: filters.unitId }),
      ...(filters?.periodo && { periodo: filters.periodo }),
      ...(filters?.estado && { estado: filters.estado }),
    },
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
        },
      },
      unit: {
        select: {
          id: true,
          numero: true,
          piso: true,
        },
      },
    },
    orderBy: { fechaVencimiento: 'desc' },
  });
}

export async function markFeeAsPaid(feeId: string, metodoPago: string, referenciaPago: string) {
  return await prisma.communityFee.update({
    where: { id: feeId },
    data: {
      estado: PaymentStatus.pagado,
      fechaPago: new Date(),
      metodoPago,
      referenciaPago,
    },
  });
}

export async function generateMonthlyFees(companyId: string, buildingId: string, periodo: string) {
  // Obtener todas las unidades del edificio
  const units = await prisma.unit.findMany({
    where: { buildingId },
    select: {
      id: true,
      numero: true,
      superficie: true,
    },
  });

  // Obtener configuración de cuotas del edificio (esto debería venir de alguna configuración)
  // Por ahora usamos valores por defecto
  const cuotaBasePorM2 = 1.5; // Ejemplo: 1.5€/m²

  const fees = [];
  for (const unit of units) {
    const importeBase = (unit.superficie || 50) * cuotaBasePorM2;
    
    const fee = await createCommunityFee({
      companyId,
      buildingId,
      unitId: unit.id,
      tipo: CuotaTipo.ordinaria,
      periodo,
      concepto: `Cuota de comunidad ${periodo}`,
      importeBase,
      fechaVencimiento: new Date(periodo + '-01'), // Primer día del mes
      gastosCorrientes: importeBase * 0.6,
      fondoReserva: importeBase * 0.2,
      seguros: importeBase * 0.1,
      mantenimiento: importeBase * 0.1,
    });
    
    fees.push(fee);
  }

  return fees;
}

// ============================================
// FONDOS DE RESERVA Y DERRAMAS
// ============================================

export async function createCommunityFund(data: {
  companyId: string;
  buildingId: string;
  tipo: FondoTipo;
  nombre: string;
  descripcion?: string;
  saldoObjetivo?: number;
  aportacionMensual?: number;
}) {
  return await prisma.communityFund.create({
    data: {
      ...data,
      movimientos: [],
      saldoActual: 0,
      totalAportaciones: 0,
      totalGastos: 0,
      aportacionMensual: data.aportacionMensual || 0,
    },
  });
}

export async function addFundMovement(fundId: string, movement: {
  tipo: 'aportacion' | 'gasto';
  concepto: string;
  monto: number;
  fecha: Date;
  referencia?: string;
}) {
  const fund = await prisma.communityFund.findUnique({
    where: { id: fundId },
  });

  if (!fund) throw new Error('Fondo no encontrado');

  const movimientos = fund.movimientos as any[];
  movimientos.push(movement);

  const nuevoSaldo =
    movement.tipo === 'aportacion'
      ? fund.saldoActual + movement.monto
      : fund.saldoActual - movement.monto;

  const nuevoTotalAportaciones =
    movement.tipo === 'aportacion'
      ? fund.totalAportaciones + movement.monto
      : fund.totalAportaciones;

  const nuevoTotalGastos =
    movement.tipo === 'gasto' ? fund.totalGastos + movement.monto : fund.totalGastos;

  return await prisma.communityFund.update({
    where: { id: fundId },
    data: {
      movimientos,
      saldoActual: nuevoSaldo,
      totalAportaciones: nuevoTotalAportaciones,
      totalGastos: nuevoTotalGastos,
    },
  });
}

export async function getCommunityFunds(
  companyId: string,
  buildingId?: string,
  activo?: boolean
) {
  return await prisma.communityFund.findMany({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
      ...(activo !== undefined && { activo }),
    },
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    orderBy: { fechaCreacion: 'desc' },
  });
}

// ============================================
// VOTACIONES TELEMÁTICAS (usando modelo existente)
// ============================================

export async function getCommunityVotes(
  companyId: string,
  buildingId?: string,
  estado?: any
) {
  return await prisma.communityVote.findMany({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
      ...(estado && { estado }),
    },
    include: {
      votos: true,
    },
    orderBy: { fechaInicio: 'desc' },
  });
}

export async function castVote(data: {
  voteId: string;
  tenantId: string;
  opcionSeleccionada: string;
  comentario?: string;
}) {
  // Verificar que el voto aún está activo
  const vote = await prisma.communityVote.findUnique({
    where: { id: data.voteId },
  });

  if (!vote) throw new Error('Votación no encontrada');
  if (vote.estado !== 'activa') throw new Error('La votación no está activa');
  if (new Date() > vote.fechaCierre) throw new Error('La votación ha cerrado');

  // Registrar el voto
  const voteRecord = await prisma.voteRecord.create({
    data: {
      voteId: data.voteId,
      tenantId: data.tenantId,
      opcionSeleccionada: data.opcionSeleccionada,
      comentario: data.comentario,
    },
  });

  // Actualizar el conteo
  const totalVotos = await prisma.voteRecord.count({
    where: { voteId: data.voteId },
  });

  await prisma.communityVote.update({
    where: { id: data.voteId },
    data: { totalVotos },
  });

  return voteRecord;
}

// ============================================
// ESTADÍSTICAS Y REPORTES
// ============================================

export async function getCommunityStats(companyId: string, buildingId: string) {
  const [fees, funds, votes, minutes] = await Promise.all([
    prisma.communityFee.findMany({
      where: { companyId, buildingId },
    }),
    prisma.communityFund.findMany({
      where: { companyId, buildingId, activo: true },
    }),
    prisma.communityVote.findMany({
      where: { companyId, buildingId },
    }),
    prisma.communityMinute.findMany({
      where: { companyId, buildingId },
    }),
  ]);

  const feesPendientes = fees.filter((f) => f.estado === PaymentStatus.pendiente);
  const feesPagadas = fees.filter((f) => f.estado === PaymentStatus.pagado);
  const totalRecaudado = feesPagadas.reduce((sum, f) => sum + f.importeTotal, 0);
  const totalPendiente = feesPendientes.reduce((sum, f) => sum + f.importeTotal, 0);

  const totalFondos = funds.reduce((sum, f) => sum + f.saldoActual, 0);

  const votacionesActivas = votes.filter((v) => v.estado === 'activa').length;
  const actasAprobadas = minutes.filter((m) => m.estado === ActaEstado.aprobada).length;

  return {
    cuotas: {
      total: fees.length,
      pendientes: feesPendientes.length,
      pagadas: feesPagadas.length,
      totalRecaudado,
      totalPendiente,
      porcentajeRecaudacion: fees.length > 0 ? (feesPagadas.length / fees.length) * 100 : 0,
    },
    fondos: {
      cantidad: funds.length,
      saldoTotal: totalFondos,
    },
    votaciones: {
      total: votes.length,
      activas: votacionesActivas,
    },
    actas: {
      total: minutes.length,
      aprobadas: actasAprobadas,
    },
  };
}
