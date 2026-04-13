import { getPrismaClient } from '@/lib/db';

export interface MorosidadResult {
  totalMorosos: number;
  importeVencido: number;
  tasaMorosidad: number;
  pagosVencidos: Array<{
    id: string;
    monto: number;
    fechaVencimiento: Date;
    diasRetraso: number;
    inquilinoNombre: string;
    inquilinoId: string;
    unidad: string;
    edificio: string;
  }>;
}

export async function calcularMorosidad(companyIds: string[]): Promise<MorosidadResult> {
  const prisma = getPrismaClient();
  const now = new Date();

  const pagosVencidos = await prisma.payment.findMany({
    where: {
      estado: { in: ['pendiente', 'atrasado'] },
      fechaVencimiento: { lt: now },
      fechaPago: null,
      isDemo: false,
      contract: {
        unit: {
          building: {
            companyId: { in: companyIds },
          },
        },
      },
    },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: {
            include: { building: true },
          },
        },
      },
    },
    orderBy: { fechaVencimiento: 'asc' },
  });

  const totalExpected = await prisma.payment.count({
    where: {
      isDemo: false,
      contract: {
        unit: {
          building: {
            companyId: { in: companyIds },
          },
        },
      },
    },
  });

  const inquilinosMorosos = new Set(
    pagosVencidos
      .map(p => p.contract?.tenantId)
      .filter(Boolean)
  );

  const importeVencido = pagosVencidos.reduce(
    (sum, p) => sum + Number(p.monto || 0),
    0
  );

  const tasaMorosidad = totalExpected > 0
    ? (pagosVencidos.length / totalExpected) * 100
    : 0;

  const formatted = pagosVencidos.map(p => {
    const diffMs = now.getTime() - new Date(p.fechaVencimiento).getTime();
    const diasRetraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      id: p.id,
      monto: Number(p.monto || 0),
      fechaVencimiento: p.fechaVencimiento,
      diasRetraso,
      inquilinoNombre: (p.contract?.tenant as any)?.nombre
        ? `${(p.contract?.tenant as any).nombre} ${(p.contract?.tenant as any).apellidos || ''}`.trim()
        : (p.contract?.tenant as any)?.nombreCompleto || 'N/A',
      inquilinoId: p.contract?.tenantId || '',
      unidad: p.contract?.unit?.numero || '',
      edificio: (p.contract?.unit?.building as any)?.nombre || '',
    };
  });

  return {
    totalMorosos: inquilinosMorosos.size,
    importeVencido: Math.round(importeVencido * 100) / 100,
    tasaMorosidad: Math.round(tasaMorosidad * 100) / 100,
    pagosVencidos: formatted,
  };
}
