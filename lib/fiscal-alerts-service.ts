/**
 * Fiscal Alerts Service — Alertas de vencimientos tributarios
 *
 * Notifica antes de las fechas límite de presentación de modelos:
 * - Modelo 202 (IS fraccionado): 1-20 abril, octubre, diciembre
 * - Modelo 200 (IS anual): 1-25 julio
 * - Modelo 303 (IVA trimestral): 1-20 abril, julio, octubre, enero
 * - Modelo 347 (operaciones terceros): febrero
 * - Revisión hipoteca: fecha configurada en Mortgage
 * - Depósito fianzas: tras firma contrato
 */

import logger from '@/lib/logger';

export interface FiscalAlert {
  id: string;
  tipo:
    | 'modelo_202'
    | 'modelo_200'
    | 'modelo_303'
    | 'modelo_347'
    | 'revision_hipoteca'
    | 'deposito_fianza';
  titulo: string;
  descripcion: string;
  fechaLimite: Date;
  diasRestantes: number;
  urgencia: 'baja' | 'media' | 'alta' | 'critica';
  companyId: string;
  companyName: string;
}

/**
 * Plazos de presentación de modelos tributarios
 */
const CALENDAR_FISCAL: Array<{
  modelo: string;
  tipo: FiscalAlert['tipo'];
  mes: number; // 0-indexed
  diaLimite: number;
  titulo: string;
  descripcion: string;
}> = [
  // Modelo 202 - Pagos fraccionados IS
  {
    modelo: '202',
    tipo: 'modelo_202',
    mes: 3,
    diaLimite: 20,
    titulo: 'Modelo 202 - 1P',
    descripcion: 'Pago fraccionado IS (abril)',
  },
  {
    modelo: '202',
    tipo: 'modelo_202',
    mes: 9,
    diaLimite: 20,
    titulo: 'Modelo 202 - 2P',
    descripcion: 'Pago fraccionado IS (octubre)',
  },
  {
    modelo: '202',
    tipo: 'modelo_202',
    mes: 11,
    diaLimite: 20,
    titulo: 'Modelo 202 - 3P',
    descripcion: 'Pago fraccionado IS (diciembre)',
  },
  // Modelo 200 - Declaración anual IS
  {
    modelo: '200',
    tipo: 'modelo_200',
    mes: 6,
    diaLimite: 25,
    titulo: 'Modelo 200',
    descripcion: 'Declaración anual Impuesto de Sociedades',
  },
  // Modelo 303 - IVA trimestral
  {
    modelo: '303',
    tipo: 'modelo_303',
    mes: 3,
    diaLimite: 20,
    titulo: 'Modelo 303 - T1',
    descripcion: 'IVA trimestral (1er trimestre)',
  },
  {
    modelo: '303',
    tipo: 'modelo_303',
    mes: 6,
    diaLimite: 20,
    titulo: 'Modelo 303 - T2',
    descripcion: 'IVA trimestral (2o trimestre)',
  },
  {
    modelo: '303',
    tipo: 'modelo_303',
    mes: 9,
    diaLimite: 20,
    titulo: 'Modelo 303 - T3',
    descripcion: 'IVA trimestral (3er trimestre)',
  },
  {
    modelo: '303',
    tipo: 'modelo_303',
    mes: 0,
    diaLimite: 30,
    titulo: 'Modelo 303 - T4',
    descripcion: 'IVA trimestral (4o trimestre)',
  },
  // Modelo 347 - Operaciones con terceros
  {
    modelo: '347',
    tipo: 'modelo_347',
    mes: 1,
    diaLimite: 28,
    titulo: 'Modelo 347',
    descripcion: 'Declaración anual operaciones con terceros',
  },
];

/**
 * Obtiene todas las alertas fiscales pendientes para una empresa y sus filiales
 */
export async function getFiscalAlerts(companyId: string): Promise<FiscalAlert[]> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const selectedCompany = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      nombre: true,
      parentCompanyId: true,
      childCompanies: { select: { id: true, nombre: true } },
    },
  });

  if (!selectedCompany) return [];

  const rootCompany = selectedCompany.parentCompanyId
    ? await prisma.company.findUnique({
        where: { id: selectedCompany.parentCompanyId },
        select: {
          id: true,
          nombre: true,
          childCompanies: { select: { id: true, nombre: true } },
        },
      })
    : selectedCompany;

  if (!rootCompany) return [];

  const allCompanies = [
    { id: rootCompany.id, nombre: rootCompany.nombre },
    ...rootCompany.childCompanies,
  ];

  const today = new Date();
  const alerts: FiscalAlert[] = [];

  // Alertas de calendario fiscal
  for (const co of allCompanies) {
    for (const plazo of CALENDAR_FISCAL) {
      const year = today.getFullYear();
      const fechaLimite = new Date(year, plazo.mes, plazo.diaLimite);

      // Si ya pasó este año, mirar el próximo
      if (fechaLimite < today) {
        fechaLimite.setFullYear(year + 1);
      }

      const diasRestantes = Math.ceil(
        (fechaLimite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Solo alertar si faltan <= 30 días
      if (diasRestantes <= 30) {
        const urgencia: FiscalAlert['urgencia'] =
          diasRestantes <= 3
            ? 'critica'
            : diasRestantes <= 7
              ? 'alta'
              : diasRestantes <= 15
                ? 'media'
                : 'baja';

        alerts.push({
          id: `${plazo.modelo}-${co.id}-${fechaLimite.toISOString().slice(0, 10)}`,
          tipo: plazo.tipo,
          titulo: `${plazo.titulo} — ${co.nombre}`,
          descripcion: plazo.descripcion,
          fechaLimite,
          diasRestantes,
          urgencia,
          companyId: co.id,
          companyName: co.nombre,
        });
      }
    }

    // Alertas de revisión de hipoteca
    const mortgages = await prisma.mortgage.findMany({
      where: {
        companyId: co.id,
        estado: 'activa',
        fechaRevision: { not: null },
      },
      include: { asset: { include: { building: { select: { nombre: true } } } } },
    });

    for (const m of mortgages) {
      if (!m.fechaRevision) continue;
      const diasRestantes = Math.ceil(
        (m.fechaRevision.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasRestantes > 0 && diasRestantes <= 60) {
        alerts.push({
          id: `hipoteca-${m.id}`,
          tipo: 'revision_hipoteca',
          titulo: `Revisión hipoteca — ${m.entidadFinanciera}`,
          descripcion: `Hipoteca de ${m.asset?.building?.nombre || 'inmueble'}. Capital pendiente: ${m.capitalPendiente.toLocaleString('es-ES')}€`,
          fechaLimite: m.fechaRevision,
          diasRestantes,
          urgencia: diasRestantes <= 15 ? 'alta' : 'media',
          companyId: co.id,
          companyName: co.nombre,
        });
      }
    }
  }

  // Ordenar por urgencia y días restantes
  const urgenciaOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
  alerts.sort(
    (a, b) =>
      urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia] || a.diasRestantes - b.diasRestantes
  );

  return alerts;
}
