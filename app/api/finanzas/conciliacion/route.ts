/**
 * API de Conciliación Bancaria
 * 
 * Endpoints para gestión de cuentas bancarias, transacciones y facturas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos
interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  lastSync: string;
  status: 'connected' | 'pending' | 'error';
}

interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  valueDate: string;
  description: string;
  reference?: string;
  amount: number;
  balance: number;
  type: 'income' | 'expense';
  category?: string;
  reconciliationStatus: 'pending' | 'matched' | 'manual' | 'unmatched';
  matchedDocumentId?: string;
  matchedDocumentType?: 'invoice' | 'receipt' | 'payment';
  matchConfidence?: number;
}

interface Invoice {
  id: string;
  number: string;
  tenant: string;
  property: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  reconciled: boolean;
  matchedTransactionId?: string;
}

// Generar datos basados en la sesión del usuario
function generateBankAccounts(): BankAccount[] {
  return [
    {
      id: 'acc-1',
      bankName: 'CaixaBank',
      accountNumber: '****4521',
      iban: 'ES12 2100 0418 4502 0005 4521',
      balance: 45890.50,
      currency: 'EUR',
      lastSync: new Date().toISOString(),
      status: 'connected',
    },
    {
      id: 'acc-2',
      bankName: 'BBVA',
      accountNumber: '****7823',
      iban: 'ES91 0182 2370 4200 0178 2354',
      balance: 12450.00,
      currency: 'EUR',
      lastSync: subDays(new Date(), 1).toISOString(),
      status: 'connected',
    },
    {
      id: 'acc-3',
      bankName: 'Santander',
      accountNumber: '****9012',
      iban: 'ES68 0049 5103 8920 1690 1234',
      balance: 8320.75,
      currency: 'EUR',
      lastSync: subDays(new Date(), 2).toISOString(),
      status: 'pending',
    },
  ];
}

function generateTransactions(): BankTransaction[] {
  return [
    {
      id: 'tx-1',
      accountId: 'acc-1',
      date: new Date().toISOString(),
      valueDate: new Date().toISOString(),
      description: 'TRANSFERENCIA DE GARCIA MARTINEZ JUAN',
      reference: 'ALQUILER ENERO 2026 - PISO 3A',
      amount: 950.00,
      balance: 45890.50,
      type: 'income',
      category: 'alquiler',
      reconciliationStatus: 'pending',
      matchConfidence: 95,
    },
    {
      id: 'tx-2',
      accountId: 'acc-1',
      date: subDays(new Date(), 1).toISOString(),
      valueDate: subDays(new Date(), 1).toISOString(),
      description: 'RECIBO COMUNIDAD EDIFICIO SOL 15',
      amount: -180.50,
      balance: 44940.50,
      type: 'expense',
      category: 'comunidad',
      reconciliationStatus: 'matched',
      matchedDocumentId: 'inv-3',
      matchedDocumentType: 'invoice',
      matchConfidence: 100,
    },
    {
      id: 'tx-3',
      accountId: 'acc-1',
      date: subDays(new Date(), 2).toISOString(),
      valueDate: subDays(new Date(), 2).toISOString(),
      description: 'BIZUM DE LOPEZ FERNANDEZ MARIA',
      reference: 'Alquiler diciembre',
      amount: 850.00,
      balance: 45121.00,
      type: 'income',
      category: 'alquiler',
      reconciliationStatus: 'matched',
      matchedDocumentId: 'inv-2',
      matchedDocumentType: 'invoice',
      matchConfidence: 92,
    },
    {
      id: 'tx-4',
      accountId: 'acc-1',
      date: subDays(new Date(), 3).toISOString(),
      valueDate: subDays(new Date(), 3).toISOString(),
      description: 'PAGO SEGURO HOGAR MAPFRE',
      amount: -425.00,
      balance: 44271.00,
      type: 'expense',
      category: 'seguros',
      reconciliationStatus: 'manual',
      matchedDocumentId: 'inv-5',
      matchedDocumentType: 'receipt',
    },
    {
      id: 'tx-5',
      accountId: 'acc-1',
      date: subDays(new Date(), 4).toISOString(),
      valueDate: subDays(new Date(), 4).toISOString(),
      description: 'TRANSFERENCIA SANCHEZ RODRIGUEZ PEDRO',
      reference: 'Alquiler Local Comercial',
      amount: 1200.00,
      balance: 44696.00,
      type: 'income',
      category: 'alquiler',
      reconciliationStatus: 'pending',
      matchConfidence: 78,
    },
  ];
}

function generateInvoices(): Invoice[] {
  return [
    {
      id: 'inv-1',
      number: 'FAC-2026-001',
      tenant: 'García Martínez, Juan',
      property: 'Piso 3A - C/ Sol 15',
      amount: 950.00,
      dueDate: new Date().toISOString(),
      status: 'pending',
      reconciled: false,
    },
    {
      id: 'inv-2',
      number: 'FAC-2025-156',
      tenant: 'López Fernández, María',
      property: 'Piso 2B - C/ Luna 8',
      amount: 850.00,
      dueDate: subDays(new Date(), 5).toISOString(),
      status: 'paid',
      reconciled: true,
      matchedTransactionId: 'tx-3',
    },
    {
      id: 'inv-3',
      number: 'FAC-2026-002',
      tenant: 'Comunidad',
      property: 'Edificio Sol 15',
      amount: 180.50,
      dueDate: subDays(new Date(), 1).toISOString(),
      status: 'paid',
      reconciled: true,
      matchedTransactionId: 'tx-2',
    },
    {
      id: 'inv-4',
      number: 'FAC-2026-003',
      tenant: 'Sánchez Rodríguez, Pedro',
      property: 'Local Comercial B',
      amount: 1200.00,
      dueDate: subDays(new Date(), 3).toISOString(),
      status: 'pending',
      reconciled: false,
    },
    {
      id: 'inv-5',
      number: 'REC-2026-001',
      tenant: 'Mapfre Seguros',
      property: 'Póliza Hogar',
      amount: 425.00,
      dueDate: subDays(new Date(), 3).toISOString(),
      status: 'paid',
      reconciled: true,
      matchedTransactionId: 'tx-4',
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const accounts = generateBankAccounts();
    const transactions = generateTransactions();
    const invoices = generateInvoices();

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        transactions,
        invoices,
      },
    });
  } catch (error) {
    console.error('[API Error] Conciliación:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos de conciliación' },
      { status: 500 }
    );
  }
}
