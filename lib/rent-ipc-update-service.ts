/**
 * Servicio de Actualización de Rentas por IPC
 *
 * Detecta contratos cuya fecha de aniversario está próxima
 * y calcula la nueva renta según el tipo de escalado:
 * - IPC: según último IPC publicado por INE
 * - IPC + diferencial: IPC + puntos adicionales (incrementoType=porcentaje, incrementoValor)
 * - Fijo: porcentaje fijo anual (incrementoType=fijo, incrementoValor)
 */
import logger from '@/lib/logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export interface RentUpdateResult {
  contractId: string;
  tenantName: string;
  unitNumber: string;
  buildingName: string;
  currentRent: number;
  newRent: number;
  increasePercent: number;
  escalationType: string;
  anniversaryDate: Date;
  applied: boolean;
}

// Last known IPC (INE Spain) - would be fetched from API in production
const CURRENT_IPC = 2.4; // % anual (Feb 2026 approx)

export async function detectPendingRentUpdates(companyIds: string[]): Promise<RentUpdateResult[]> {
  const prisma = await getPrisma();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find active contracts with anniversary in next 30 days
  const contracts = await prisma.contract.findMany({
    where: {
      estado: 'activo',
      unit: { building: { companyId: { in: companyIds }, isDemo: false } },
    },
    include: {
      tenant: { select: { nombreCompleto: true } },
      unit: { select: { numero: true, building: { select: { nombre: true } } } },
    },
  });

  const results: RentUpdateResult[] = [];

  for (const contract of contracts) {
    if (!contract.fechaInicio || !contract.rentaMensual) continue;

    // Calculate anniversary date for this year
    const startDate = new Date(contract.fechaInicio);
    let anniversary = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (anniversary < now) {
      anniversary.setFullYear(anniversary.getFullYear() + 1);
    }

    // Check if anniversary is within 30 days
    if (anniversary <= thirtyDaysFromNow && anniversary > now) {
      const escalationType = contract.incrementoType ?? 'ipc';
      let increasePercent = CURRENT_IPC;

      if (escalationType === 'fijo' && contract.incrementoValor != null) {
        increasePercent = contract.incrementoValor;
      } else if (escalationType === 'porcentaje' && contract.incrementoValor != null) {
        // IPC + diferencial stored in incrementoValor
        increasePercent = contract.incrementoValor;
      }

      const newRent = Math.round(contract.rentaMensual * (1 + increasePercent / 100) * 100) / 100;

      results.push({
        contractId: contract.id,
        tenantName: contract.tenant?.nombreCompleto ?? 'Sin inquilino',
        unitNumber: contract.unit?.numero ?? '',
        buildingName: contract.unit?.building?.nombre ?? '',
        currentRent: contract.rentaMensual,
        newRent,
        increasePercent,
        escalationType,
        anniversaryDate: anniversary,
        applied: false,
      });
    }
  }

  return results.sort((a, b) => a.anniversaryDate.getTime() - b.anniversaryDate.getTime());
}

export async function applyRentUpdate(contractId: string, newRent: number): Promise<boolean> {
  const prisma = await getPrisma();
  try {
    await prisma.contract.update({
      where: { id: contractId },
      data: { rentaMensual: newRent },
    });
    logger.info(`[IPC] Rent updated for contract ${contractId}: ${newRent}€`);
    return true;
  } catch (error) {
    logger.error('[IPC] Error updating rent:', error);
    return false;
  }
}
