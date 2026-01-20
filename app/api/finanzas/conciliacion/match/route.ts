/**
 * API: /api/finanzas/conciliacion/match
 * 
 * POST - Vincula una transacción bancaria con un pago
 * DELETE - Desvincula una transacción
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Vincular transacción con pago
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { transactionId, paymentId, notes } = await request.json();

    if (!transactionId || !paymentId) {
      return NextResponse.json(
        { error: 'transactionId y paymentId son requeridos' },
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

    // Verificar que el pago existe y pertenece a una propiedad de la compañía
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        contract: {
          property: { companyId: session.user.companyId }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar la transacción
    const updatedTransaction = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        paymentId,
        estado: 'conciliado',
        matchScore: 100, // Manual = 100% confianza
        conciliadoPor: session.user.id,
        conciliadoEn: new Date(),
        notasConciliacion: notes
      }
    });

    // Actualizar el pago como pagado si la transacción es un ingreso
    if (transaction.monto > 0) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          estado: 'pagado',
          fechaPago: transaction.fecha,
          metodoPago: 'transferencia'
        }
      });
    }

    // Crear registro de conciliación manual
    await prisma.conciliacionManual.create({
      data: {
        companyId: session.user.companyId,
        transactionId,
        paymentId,
        diferenciaMonto: Math.abs(transaction.monto) !== payment.monto ? 
          Math.abs(transaction.monto) - payment.monto : null,
        notas: notes,
        conciliadoPor: session.user.id || 'system'
      }
    });

    logger.info(`Transacción ${transactionId} vinculada con pago ${paymentId}`);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Transacción vinculada correctamente'
    });
  } catch (error: any) {
    logger.error('Error vinculando transacción:', error);
    return NextResponse.json(
      { error: 'Error vinculando transacción', details: error.message },
      { status: 500 }
    );
  }
}

// Desvincular transacción
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
        companyId: session.user.companyId
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    const previousPaymentId = transaction.paymentId;

    // Desvincular la transacción
    const updatedTransaction = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        paymentId: null,
        estado: 'pendiente_revision',
        matchScore: null,
        conciliadoPor: null,
        conciliadoEn: null,
        notasConciliacion: null
      }
    });

    // Si había un pago vinculado, actualizarlo a pendiente
    if (previousPaymentId) {
      await prisma.payment.update({
        where: { id: previousPaymentId },
        data: {
          estado: 'pendiente',
          fechaPago: null
        }
      });

      // Eliminar registro de conciliación manual si existe
      await prisma.conciliacionManual.deleteMany({
        where: {
          transactionId,
          paymentId: previousPaymentId
        }
      });
    }

    logger.info(`Transacción ${transactionId} desvinculada`);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Transacción desvinculada correctamente'
    });
  } catch (error: any) {
    logger.error('Error desvinculando transacción:', error);
    return NextResponse.json(
      { error: 'Error desvinculando transacción', details: error.message },
      { status: 500 }
    );
  }
}
