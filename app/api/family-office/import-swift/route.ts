import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseMT940, parseMT535 } from '@/lib/family-office/banking-integrations';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/family-office/import-swift
 * Importar extractos SWIFT MT940 (movimientos) o MT535 (posiciones).
 * Body: { accountId, format: 'mt940'|'mt535', content: string, apply: boolean }
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { accountId, format, content, apply = false } = await request.json();

    if (!accountId || !format || !content) {
      return NextResponse.json({ error: 'accountId, format y content requeridos' }, { status: 400 });
    }

    // Verificar que la cuenta pertenece a la empresa
    const account = await prisma.financialAccount.findFirst({
      where: { id: accountId, companyId: session.user.companyId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    if (format === 'mt940') {
      const parsed = parseMT940(content);

      if (!apply) {
        return NextResponse.json({
          success: true,
          preview: true,
          format: 'MT940',
          cuenta: parsed.cuenta,
          saldoInicial: parsed.saldoInicial,
          saldoFinal: parsed.saldoFinal,
          movimientos: parsed.movimientos.length,
          detalle: parsed.movimientos.slice(0, 20),
        });
      }

      // Aplicar: crear transacciones
      let created = 0;
      for (const mov of parsed.movimientos) {
        await prisma.financialTransaction.create({
          data: {
            accountId,
            tipo: mov.tipo === 'credito' ? 'transferencia_entrada' : 'transferencia_salida',
            fecha: new Date(mov.fecha),
            concepto: mov.concepto,
            importe: mov.importe,
            referencia: mov.referencia,
          },
        });
        created++;
      }

      // Actualizar saldo
      await prisma.financialAccount.update({
        where: { id: accountId },
        data: { saldoActual: parsed.saldoFinal, ultimaSync: new Date() },
      });

      logger.info(`[SWIFT MT940] ${created} movimientos importados para ${account.entidad}`);

      return NextResponse.json({
        success: true,
        format: 'MT940',
        movimientosImportados: created,
        saldoFinal: parsed.saldoFinal,
      });
    }

    if (format === 'mt535') {
      const parsed = parseMT535(content);

      if (!apply) {
        return NextResponse.json({
          success: true,
          preview: true,
          format: 'MT535',
          cuenta: parsed.cuenta,
          fecha: parsed.fecha,
          posiciones: parsed.posiciones.length,
          valorTotal: parsed.valorTotal,
          detalle: parsed.posiciones,
        });
      }

      // Aplicar: crear/actualizar posiciones
      let created = 0;
      let updated = 0;

      for (const pos of parsed.posiciones) {
        const existing = await prisma.financialPosition.findFirst({
          where: { accountId, isin: pos.isin },
        });

        if (existing) {
          await prisma.financialPosition.update({
            where: { id: existing.id },
            data: {
              cantidad: pos.cantidad,
              valorActual: pos.valorMercado,
              pnlNoRealizado: pos.valorMercado - existing.costeTotal,
              pnlPct: existing.costeTotal > 0 ? ((pos.valorMercado - existing.costeTotal) / existing.costeTotal) * 100 : 0,
              ultimaActualizacion: new Date(),
            },
          });
          updated++;
        } else {
          await prisma.financialPosition.create({
            data: {
              accountId,
              nombre: pos.nombre,
              isin: pos.isin,
              tipo: 'fondo_inversion',
              cantidad: pos.cantidad,
              precioMedio: pos.precioUnitario,
              valorActual: pos.valorMercado,
              costeTotal: pos.cantidad * pos.precioUnitario,
              divisa: pos.divisa,
              ultimaActualizacion: new Date(),
            },
          });
          created++;
        }
      }

      // Actualizar valor total de la cuenta
      await prisma.financialAccount.update({
        where: { id: accountId },
        data: { valorMercado: parsed.valorTotal, ultimaSync: new Date() },
      });

      logger.info(`[SWIFT MT535] ${created} creadas, ${updated} actualizadas para ${account.entidad}`);

      return NextResponse.json({
        success: true,
        format: 'MT535',
        posicionesCreadas: created,
        posicionesActualizadas: updated,
        valorTotal: parsed.valorTotal,
      });
    }

    return NextResponse.json({ error: 'Formato no soportado (mt940 o mt535)' }, { status: 400 });
  } catch (error: any) {
    logger.error('[Import SWIFT]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error importando SWIFT' }, { status: 500 });
  }
}
