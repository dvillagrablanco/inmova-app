/**
 * CRON: Sincronización SQL Server Zucchetti → INMOVA
 *
 * Lee datos contables directamente del SQL Server de Zucchetti
 * y los importa como AccountingTransaction en INMOVA.
 *
 * GET /api/cron/sync-zucchetti-sql
 *
 * Auth: CRON_SECRET header o sesión superadmin
 *
 * Para cada sociedad configurada (RSQ, VID, VIR):
 *   1. Lee asientos desde la última sincronización
 *   2. Los clasifica según el PGC (Plan General Contable)
 *   3. Los inserta en PostgreSQL (evitando duplicados)
 *   4. Actualiza la fecha de última sync
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';
import {
  getConfiguredCompanyKeys,
  getAccountingEntries,
  mapCompanyKeyToInmovaId,
  isZucchettiSqlConfigured,
  closeAllPools,
  type ZucchettiCompanyKey,
} from '@/lib/zucchetti-sqlserver';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Clasificación PGC
function classifySubcuenta(
  subcuenta: string,
  debe: number,
  haber: number
): { tipo: 'ingreso' | 'gasto'; categoria: string } {
  const sub = String(subcuenta);
  if (sub.startsWith('7')) {
    if (sub.startsWith('752')) return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    if (sub.startsWith('765')) return { tipo: 'ingreso', categoria: 'ingreso_deposito' };
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }
  if (sub.startsWith('6')) {
    if (sub.startsWith('622')) return { tipo: 'gasto', categoria: 'gasto_mantenimiento' };
    if (sub.startsWith('631')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (sub.startsWith('625')) return { tipo: 'gasto', categoria: 'gasto_seguro' };
    if (sub.startsWith('628')) return { tipo: 'gasto', categoria: 'gasto_servicio' };
    if (sub.startsWith('627')) return { tipo: 'gasto', categoria: 'gasto_comunidad' };
    if (sub.startsWith('623')) return { tipo: 'gasto', categoria: 'gasto_administracion' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }
  return debe > haber
    ? { tipo: 'gasto', categoria: 'gasto_otro' }
    : { tipo: 'ingreso', categoria: 'ingreso_otro' };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeCronRequest(request, {
      allowSession: false,
      requireSuperAdmin: true,
    });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: auth.status });
    }

    if (!isZucchettiSqlConfigured()) {
      return NextResponse.json({
        message: 'SQL Server de Zucchetti no configurado',
        synced: 0,
      });
    }

    const prisma = await getPrisma();
    const keys = getConfiguredCompanyKeys();

    if (keys.length === 0) {
      return NextResponse.json({
        message: 'No hay sociedades configuradas para SQL Server',
        synced: 0,
      });
    }

    const results: Array<{
      company: string;
      companyId: string;
      created: number;
      skipped: number;
      errors: number;
    }> = [];

    for (const key of keys) {
      const companyId = mapCompanyKeyToInmovaId(key);
      if (!companyId) {
        results.push({ company: key, companyId: 'UNKNOWN', created: 0, skipped: 0, errors: 1 });
        continue;
      }

      try {
        // Obtener última sync
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { zucchettiLastSync: true, zucchettiEnabled: true },
        });

        if (!company?.zucchettiEnabled) {
          results.push({ company: key, companyId, created: 0, skipped: 0, errors: 0 });
          continue;
        }

        const fromDate = company.zucchettiLastSync
          ? company.zucchettiLastSync.toISOString().split('T')[0]
          : '2025-01-01';
        const toDate = new Date().toISOString().split('T')[0];

        // Nombre de BD — se ajustará tras discovery
        const database = `CONT_${key}`;

        const asientos = await getAccountingEntries(key, database, fromDate, toDate);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const asiento of asientos) {
          for (const linea of asiento.lineas) {
            if (linea.debe === 0 && linea.haber === 0) {
              skipped++;
              continue;
            }

            const { tipo, categoria } = classifySubcuenta(linea.subcuenta, linea.debe, linea.haber);
            const monto = Math.abs(linea.debe - linea.haber);
            const referencia = `ZUC-${key}-${asiento.numero}`;

            try {
              const existing = await prisma.accountingTransaction.findFirst({
                where: { companyId, referencia },
                select: { id: true },
              });

              if (existing) {
                skipped++;
                continue;
              }

              await prisma.accountingTransaction.create({
                data: {
                  companyId,
                  tipo: tipo as any,
                  categoria: categoria as any,
                  concepto: `${linea.concepto || asiento.descripcion} (${linea.subcuenta})`.substring(0, 500),
                  monto,
                  fecha: new Date(asiento.fecha),
                  referencia,
                  notas: `Cron sync SQL Server. Sociedad: ${key}. Asiento #${asiento.numero}.`,
                },
              });
              created++;
            } catch {
              errors++;
            }
          }
        }

        // Actualizar sync
        await prisma.company.update({
          where: { id: companyId },
          data: {
            zucchettiLastSync: new Date(),
            zucchettiSyncErrors: errors,
          },
        });

        results.push({ company: key, companyId, created, skipped, errors });

        logger.info(`[Cron Zucchetti SQL] ${key}: ${created} creados, ${skipped} saltados, ${errors} errores`);
      } catch (err: any) {
        logger.error(`[Cron Zucchetti SQL] Error ${key}:`, err);
        results.push({ company: key, companyId, created: 0, skipped: 0, errors: 1 });
      }
    }

    await closeAllPools();

    const totalCreated = results.reduce((s, r) => s + r.created, 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      companies: results,
      totalCreated,
    });
  } catch (error) {
    logger.error('[Cron Zucchetti SQL] Error global:', error);
    await closeAllPools();
    return NextResponse.json({ error: 'Error en sincronización' }, { status: 500 });
  }
}
