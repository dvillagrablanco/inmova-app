/**
 * API: /api/finanzas/conciliacion/ignore
 * 
 * POST - Marca una transacción como ignorada
 * DELETE - Restaura una transacción ignorada a pendiente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { transactionId, reason } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la transacción pertenece a la compañía
    const transaction = await prisma.bankTransaction.findFirst({
      where: {
        id: transactionId,
        companyId: session.user.companyId
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    // Marcar como ignorada
    const updatedTransaction = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        estado: 'descartado',
        notasConciliacion: reason || 'Ignorado por el usuario',
        conciliadoPor: session.user.id,
        conciliadoEn: new Date()
      }
    });

    logger.info(`Transacción ${transactionId} marcada como ignorada`);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Transacción marcada como ignorada'
    });
  } catch (error: any) {
    logger.error('Error ignorando transacción:', error);
    return NextResponse.json(
      { error: 'Error ignorando transacción', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la transacción pertenece a la compañía
    const transaction = await prisma.bankTransaction.findFirst({
      where: {
        id: transactionId,
        companyId: session.user.companyId,
        estado: 'descartado'
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada o no está ignorada' },
        { status: 404 }
      );
    }

    // Restaurar a pendiente
    const updatedTransaction = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        estado: 'pendiente_revision',
        notasConciliacion: null,
        conciliadoPor: null,
        conciliadoEn: null
      }
    });

    logger.info(`Transacción ${transactionId} restaurada a pendiente`);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Transacción restaurada a pendiente'
    });
  } catch (error: any) {
    logger.error('Error restaurando transacción:', error);
    return NextResponse.json(
      { error: 'Error restaurando transacción', details: error.message },
      { status: 500 }
    );
  }
}
