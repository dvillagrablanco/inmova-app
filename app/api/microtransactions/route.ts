/**
 * API Endpoint: Microtransacciones
 * Sistema de pagos pequeños y wallet digital
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createTransactionSchema = z.object({
  tenantId: z.string(),
  tipo: z.enum(['recarga', 'pago', 'reembolso', 'cashback']),
  monto: z.number(),
  concepto: z.string(),
  referencia: z.string().optional(),
  categoria: z.string().optional(),
});

// Almacenamiento temporal en memoria
let transactionsStore: any[] = [];
let walletsStore: Map<string, { balance: number; tenantId: string; companyId: string }> = new Map();
const ALLOW_IN_MEMORY = process.env.NODE_ENV !== 'production';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Microtransacciones no disponibles en producción' },
        { status: 501 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const tipo = searchParams.get('tipo');

    // Filtrar transacciones
    let transactions = transactionsStore.filter(t => t.companyId === companyId);
    
    if (tenantId) {
      transactions = transactions.filter(t => t.tenantId === tenantId);
    }
    if (tipo) {
      transactions = transactions.filter(t => t.tipo === tipo);
    }

    // Obtener info de wallets si hay tenantId
    let walletInfo = null;
    if (tenantId) {
      const wallet = walletsStore.get(`${companyId}-${tenantId}`);
      walletInfo = wallet || { balance: 0, tenantId, companyId };
    }

    // Stats generales
    const stats = {
      totalTransacciones: transactions.length,
      recargas: transactions.filter(t => t.tipo === 'recarga').reduce((sum, t) => sum + t.monto, 0),
      pagos: transactions.filter(t => t.tipo === 'pago').reduce((sum, t) => sum + Math.abs(t.monto), 0),
      cashback: transactions.filter(t => t.tipo === 'cashback').reduce((sum, t) => sum + t.monto, 0),
      walletBalance: walletInfo?.balance || 0,
    };

    return NextResponse.json({
      success: true,
      data: transactions.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
      wallet: walletInfo,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching microtransactions:', error);
    return NextResponse.json({ error: 'Error al obtener transacciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Microtransacciones no disponibles en producción' },
        { status: 501 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Obtener o crear wallet
    const walletKey = `${companyId}-${data.tenantId}`;
    let wallet = walletsStore.get(walletKey);
    
    if (!wallet) {
      wallet = { balance: 0, tenantId: data.tenantId, companyId };
      walletsStore.set(walletKey, wallet);
    }

    // Calcular nuevo balance
    let nuevoBalance = wallet.balance;
    if (data.tipo === 'recarga' || data.tipo === 'reembolso' || data.tipo === 'cashback') {
      nuevoBalance += Math.abs(data.monto);
    } else if (data.tipo === 'pago') {
      if (wallet.balance < Math.abs(data.monto)) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
      }
      nuevoBalance -= Math.abs(data.monto);
    }

    // Actualizar wallet
    wallet.balance = nuevoBalance;
    walletsStore.set(walletKey, wallet);

    // Crear transacción
    const transaction = {
      id: `tx-${Date.now()}`,
      companyId,
      ...data,
      balanceAnterior: wallet.balance - (data.tipo === 'pago' ? -Math.abs(data.monto) : Math.abs(data.monto)),
      balanceNuevo: nuevoBalance,
      fecha: new Date().toISOString(),
      createdBy: session.user.id,
    };

    transactionsStore.push(transaction);

    logger.info('Microtransaction created', { 
      txId: transaction.id, 
      tipo: data.tipo, 
      monto: data.monto,
      tenantId: data.tenantId,
    });

    return NextResponse.json({
      success: true,
      data: transaction,
      wallet: { balance: nuevoBalance },
      message: 'Transacción registrada',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating microtransaction:', error);
    return NextResponse.json({ error: 'Error al crear transacción' }, { status: 500 });
  }
}
