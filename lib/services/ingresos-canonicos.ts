/**
 * Fuente canónica de ingresos mensuales del grupo.
 *
 * Regla de negocio:
 *   Ingresos mensuales = SUM(rentaMensual) de contratos ACTIVOS
 *   (un contrato por unidad, excluyendo demos).
 *
 * Este es el dato "esperado contractual". Se corrobora contra
 * ingresos bancarios reales, pero la cifra de referencia es siempre
 * la contractual.
 */
import { getPrismaClient } from '@/lib/db';

export interface IngresosCanonicos {
  ingresosMensualesContractuales: number;
  totalContratosActivos: number;
  desglosePorTipo: Record<string, { contratos: number; renta: number }>;
}

export async function calcularIngresosCanonicos(companyIds: string[]): Promise<IngresosCanonicos> {
  const prisma = getPrismaClient();

  const contratos = await prisma.contract.findMany({
    where: {
      estado: 'activo',
      isDemo: false,
      unit: {
        building: {
          companyId: { in: companyIds },
        },
      },
    },
    select: {
      rentaMensual: true,
      tipo: true,
    },
  });

  const desglose: Record<string, { contratos: number; renta: number }> = {};
  let total = 0;

  for (const c of contratos) {
    const tipo = c.tipo || 'residencial';
    if (!desglose[tipo]) {
      desglose[tipo] = { contratos: 0, renta: 0 };
    }
    desglose[tipo].contratos++;
    desglose[tipo].renta += c.rentaMensual;
    total += c.rentaMensual;
  }

  return {
    ingresosMensualesContractuales: Math.round(total * 100) / 100,
    totalContratosActivos: contratos.length,
    desglosePorTipo: desglose,
  };
}
