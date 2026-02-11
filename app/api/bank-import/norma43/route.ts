import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { parseNorma43, classifyTransaction, getBankName } from '@/lib/norma43-parser';
import type { N43Account, N43Transaction } from '@/lib/norma43-parser';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/bank-import/norma43
 * 
 * Importa un fichero Norma 43 (extracto bancario estándar español).
 * 
 * Body: FormData con:
 * - file: El fichero .n43 / .txt / .aeb
 * - companyId: ID de la sociedad (Rovida, Viroda, etc.)
 * - nombreBanco: (opcional) Nombre del banco si se quiere forzar
 * 
 * Coste: €0
 * El usuario descarga el fichero desde Bankinter Online → lo sube aquí.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const companyId = formData.get('companyId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichero requerido' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    // Verificar que el usuario tiene acceso a esta empresa
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { users: { some: { id: session.user.id } } },
          // Acceso multi-empresa vía UserCompanyAccess
          { userAccess: { some: { userId: session.user.id, activo: true } } },
        ],
      },
      select: { id: true, nombre: true, iban: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta empresa' },
        { status: 403 }
      );
    }

    // Leer contenido del fichero
    const content = await file.text();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Fichero vacío' }, { status: 400 });
    }

    // Parsear Norma 43
    const parseResult = parseNorma43(content, file.name);

    if (parseResult.errors.length > 0 && parseResult.accounts.length === 0) {
      return NextResponse.json(
        {
          error: 'Error parseando fichero Norma 43',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Procesar cada cuenta encontrada en el fichero
    let totalImported = 0;
    let totalDuplicated = 0;
    const accountsProcessed: Array<{
      iban: string;
      banco: string;
      transacciones: number;
      duplicadas: number;
      saldoInicial: number;
      saldoFinal: number;
    }> = [];

    for (const account of parseResult.accounts) {
      const bankName = getBankName(account.bankCode);
      
      // Buscar o crear BankConnection para esta cuenta
      const connectionKey = `n43_${account.bankCode}_${account.branchCode}_${account.accountNumber}`;
      
      let connection = await prisma.bankConnection.findFirst({
        where: {
          companyId,
          proveedorItemId: connectionKey,
        },
      });

      if (!connection) {
        connection = await prisma.bankConnection.create({
          data: {
            companyId,
            proveedor: 'norma43_import',
            provider: 'norma43',
            proveedorItemId: connectionKey,
            nombreBanco: bankName,
            tipoCuenta: 'corriente',
            ultimosDigitos: account.accountNumber.slice(-4),
            moneda: account.currency,
            estado: 'conectado',
            ultimaSync: new Date(),
            autoReconciliar: true,
            notificarErrores: true,
          },
        });
      } else {
        // Actualizar última sincronización
        await prisma.bankConnection.update({
          where: { id: connection.id },
          data: { ultimaSync: new Date() },
        });
      }

      // Importar transacciones
      let accountImported = 0;
      let accountDuplicated = 0;

      for (const tx of account.transactions) {
        // Generar ID único para evitar duplicados
        const txId = generateTransactionId(account, tx);

        // Verificar si ya existe
        const existing = await prisma.bankTransaction.findFirst({
          where: { proveedorTxId: txId },
        });

        if (existing) {
          accountDuplicated++;
          continue;
        }

        const classification = classifyTransaction(tx);

        await prisma.bankTransaction.create({
          data: {
            companyId,
            connectionId: connection.id,
            proveedorTxId: txId,
            fecha: tx.transactionDate,
            fechaContable: tx.valueDate,
            descripcion: tx.description || `Movimiento ${tx.commonConcept}`,
            monto: tx.signedAmount,
            moneda: account.currency,
            categoria: classification.categoriasugerida,
            tipoTransaccion: classification.tipo,
            referencia: tx.reference1 || tx.documentNumber || undefined,
            beneficiario: extractBeneficiary(tx),
            rawData: {
              commonConcept: tx.commonConcept,
              ownConcept: tx.ownConcept,
              debitCredit: tx.debitCredit,
              amount: tx.amount,
              documentNumber: tx.documentNumber,
              reference1: tx.reference1,
              reference2: tx.reference2,
              conceptLines: tx.conceptLines,
              branchCode: tx.branchCode,
            },
            estado: 'pendiente_revision',
          },
        });

        accountImported++;
      }

      totalImported += accountImported;
      totalDuplicated += accountDuplicated;

      accountsProcessed.push({
        iban: account.iban || `****${account.accountNumber.slice(-4)}`,
        banco: bankName,
        transacciones: accountImported,
        duplicadas: accountDuplicated,
        saldoInicial: account.initialBalance,
        saldoFinal: account.finalBalance,
      });
    }

    logger.info(
      `📥 Norma 43 importado: ${totalImported} transacciones para ${company.nombre} (${totalDuplicated} duplicadas omitidas)`
    );

    return NextResponse.json({
      success: true,
      resumen: {
        fichero: file.name,
        empresa: company.nombre,
        cuentas: accountsProcessed,
        totalTransacciones: totalImported,
        totalDuplicadas: totalDuplicated,
        errores: parseResult.errors,
        avisos: parseResult.warnings,
      },
      message: `${totalImported} transacciones importadas correctamente${totalDuplicated > 0 ? ` (${totalDuplicated} duplicadas omitidas)` : ''}`,
    });
  } catch (error: any) {
    logger.error('Error importando Norma 43:', error);
    return NextResponse.json(
      { error: 'Error al importar fichero', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bank-import/norma43
 * 
 * Obtiene las importaciones recientes y cuentas conectadas via N43
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    // Obtener conexiones N43 de esta empresa
    const connections = await prisma.bankConnection.findMany({
      where: {
        companyId,
        proveedor: 'norma43_import',
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { ultimaSync: 'desc' },
    });

    // Estadísticas recientes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await prisma.bankTransaction.count({
      where: {
        companyId,
        connection: { proveedor: 'norma43_import' },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const pendingReview = await prisma.bankTransaction.count({
      where: {
        companyId,
        connection: { proveedor: 'norma43_import' },
        estado: 'pendiente_revision',
      },
    });

    const reconciled = await prisma.bankTransaction.count({
      where: {
        companyId,
        connection: { proveedor: 'norma43_import' },
        estado: 'conciliado',
      },
    });

    return NextResponse.json({
      success: true,
      cuentas: connections.map((c) => ({
        id: c.id,
        banco: c.nombreBanco,
        ultimosDigitos: c.ultimosDigitos,
        ultimaSync: c.ultimaSync,
        totalTransacciones: c._count.transactions,
      })),
      estadisticas: {
        transaccionesRecientes: recentTransactions,
        pendientesRevision: pendingReview,
        conciliadas: reconciled,
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo datos N43:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera un ID único para una transacción N43 (para detectar duplicados)
 */
function generateTransactionId(account: N43Account, tx: N43Transaction): string {
  // Combinación de: cuenta + fecha + importe + documento + referencia
  const parts = [
    'n43',
    account.bankCode,
    account.accountNumber,
    tx.transactionDate.toISOString().split('T')[0],
    tx.valueDate.toISOString().split('T')[0],
    tx.signedAmount.toFixed(2),
    tx.documentNumber || '',
    tx.reference1 || '',
  ];
  return parts.join('_');
}

/**
 * Intenta extraer el beneficiario/ordenante de los conceptos complementarios
 */
function extractBeneficiary(tx: N43Transaction): string | undefined {
  // En Norma 43, el beneficiario suele estar en las líneas de concepto complementario
  // Patrón común: la primera línea suele tener el nombre
  if (tx.conceptLines.length > 0) {
    const firstLine = tx.conceptLines[0].trim();
    // Si la primera línea no parece un número o código, es probablemente un nombre
    if (firstLine && !/^\d+$/.test(firstLine) && firstLine.length > 3) {
      return firstLine;
    }
  }
  return undefined;
}
