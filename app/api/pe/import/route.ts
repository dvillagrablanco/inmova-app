import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/pe/import
 * Procesa documentos PDF/Excel de MdF Gestefin para actualizar datos de Private Equity.
 * 
 * Acepta: Excel (.xlsx, .xls, .csv) y PDF.
 * - Excel: parsea filas de transacciones directamente
 * - PDF: envía a Claude para extraer datos estructurados
 * 
 * Formato esperado (Excel MdF):
 * Columnas: Estado, F.operación, Fecha valor, F.liquidación, Contrato, ISIN, Sentido, 
 *           Cantidad, Precio, Tipo cambio, Efectivo final, ...
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let transactions: ParsedTransaction[] = [];

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      transactions = parseExcelMdF(buffer, fileName);
    } else if (fileName.endsWith('.pdf')) {
      transactions = await parsePDFWithAI(buffer, file.name);
    } else {
      return NextResponse.json({ error: 'Formato no soportado. Usa Excel (.xlsx, .csv) o PDF.' }, { status: 400 });
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se encontraron transacciones en el archivo',
        parsed: 0,
      });
    }

    // Aggregate by fund
    const fundAggregates = aggregateByFund(transactions);

    // Upsert participations
    let updated = 0;
    let created = 0;

    for (const [fundName, agg] of Object.entries(fundAggregates)) {
      const existing = await prisma.participation.findFirst({
        where: {
          companyId,
          targetCompanyName: { contains: fundName.split(' ')[0], mode: 'insensitive' },
          tipo: 'pe_fund',
        },
      });

      const dpi = agg.totalCalled > 0 ? agg.totalDistributed / agg.totalCalled : 0;

      const data = {
        capitalLlamado: agg.totalCalled,
        capitalDistribuido: agg.totalDistributed,
        valorContable: agg.totalCalled - agg.totalDistributed,
        costeAdquisicion: agg.totalCalled,
        dpi: Math.round(dpi * 100) / 100,
        fechaUltimaValoracion: agg.lastDate,
        notas: `Actualizado desde ${file.name} el ${new Date().toLocaleDateString('es-ES')}. ${agg.txCount} operaciones. Calls: €${Math.round(agg.totalCalled).toLocaleString('es-ES')}. Distribuciones: €${Math.round(agg.totalDistributed).toLocaleString('es-ES')}.`,
      };

      if (existing) {
        await prisma.participation.update({
          where: { id: existing.id },
          data,
        });
        updated++;
      } else {
        await prisma.participation.create({
          data: {
            companyId,
            targetCompanyName: fundName,
            tipo: 'pe_fund',
            porcentaje: 0,
            fechaAdquisicion: agg.firstDate,
            activa: true,
            vehiculoInversor: 'VIBLA_SCR',
            anoCompromiso: agg.firstDate.getFullYear(),
            ...data,
          },
        });
        created++;
      }
    }

    logger.info('[PE Import] Completed', {
      file: file.name,
      companyId,
      transactions: transactions.length,
      funds: Object.keys(fundAggregates).length,
      updated,
      created,
    });

    return NextResponse.json({
      success: true,
      file: file.name,
      transactionsParsed: transactions.length,
      fundsDetected: Object.keys(fundAggregates).length,
      updated,
      created,
      funds: Object.entries(fundAggregates).map(([name, agg]) => ({
        name,
        transactions: agg.txCount,
        totalCalled: Math.round(agg.totalCalled),
        totalDistributed: Math.round(agg.totalDistributed),
        netInvested: Math.round(agg.totalCalled - agg.totalDistributed),
      })),
    });
  } catch (error: any) {
    logger.error('[PE Import Error]:', error);
    return NextResponse.json({ error: 'Error procesando archivo' }, { status: 500 });
  }
}

// Types
interface ParsedTransaction {
  fund: string;
  date: Date;
  type: 'compra' | 'venta';
  amount: number;
}

interface FundAggregate {
  totalCalled: number;
  totalDistributed: number;
  firstDate: Date;
  lastDate: Date;
  txCount: number;
}

// Parse European number format: "1.234,56" or "1234,56" or "1234.56"
function parseNum(s: string | number | null | undefined): number {
  if (s === null || s === undefined) return 0;
  if (typeof s === 'number') return s;
  const str = String(s).trim();
  if (!str) return 0;
  // If has both . and , assume European: 1.234,56
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // If only comma, treat as decimal separator
  if (str.includes(',') && !str.includes('.')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  return parseFloat(str) || 0;
}

function parseDate(s: string | Date | number): Date {
  if (s instanceof Date) return s;
  const str = String(s).trim();
  // dd/mm/yyyy
  const parts = str.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (parts) {
    return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
  }
  return new Date(str);
}

function parseExcelMdF(buffer: Buffer, fileName: string): ParsedTransaction[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

  const transactions: ParsedTransaction[] = [];

  // Detect header row (look for "Sentido" or "ISIN" or "Contrato")
  let headerIdx = -1;
  let colMap: Record<string, number> = {};

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i].map((c: any) => String(c).toLowerCase().trim());
    if (row.some((c: string) => c.includes('sentido') || c.includes('isin'))) {
      headerIdx = i;
      row.forEach((cell: string, idx: number) => {
        if (cell.includes('operaci')) colMap['fecha'] = idx;
        if (cell === 'isin' || cell.includes('isin')) colMap['isin'] = idx;
        if (cell.includes('sentido')) colMap['sentido'] = idx;
        if (cell.includes('cantidad')) colMap['cantidad'] = idx;
        if (cell.includes('precio')) colMap['precio'] = idx;
        if (cell.includes('efectivo final') && !cell.includes('divisa')) colMap['efectivo'] = idx;
      });
      break;
    }
  }

  if (headerIdx === -1) {
    // Try auto-detect: assume first row is header
    headerIdx = 0;
    colMap = { fecha: 1, isin: 5, sentido: 6, cantidad: 7, precio: 8, efectivo: 10 };
  }

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 7) continue;

    const isin = String(row[colMap['isin'] ?? 5] || '').trim();
    const sentido = String(row[colMap['sentido'] ?? 6] || '').trim().toLowerCase();
    const fechaRaw = row[colMap['fecha'] ?? 1];
    const efectivoRaw = row[colMap['efectivo'] ?? 10];

    if (!isin || !sentido || (!sentido.includes('compra') && !sentido.includes('venta'))) continue;

    const amount = Math.abs(parseNum(efectivoRaw));
    const cantidadRaw = row[colMap['cantidad'] ?? 7];
    const finalAmount = amount || Math.abs(parseNum(cantidadRaw));

    if (finalAmount === 0) continue;

    const date = fechaRaw instanceof Date ? fechaRaw : parseDate(String(fechaRaw));
    if (isNaN(date.getTime())) continue;

    transactions.push({
      fund: isin,
      date,
      type: sentido.includes('compra') ? 'compra' : 'venta',
      amount: finalAmount,
    });
  }

  return transactions;
}

async function parsePDFWithAI(buffer: Buffer, fileName: string): Promise<ParsedTransaction[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn('[PE Import] No ANTHROPIC_API_KEY, cannot parse PDF');
    return [];
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    // Convert PDF buffer to base64 for Claude
    const base64 = buffer.toString('base64');

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: `Analiza este documento de Private Equity de MdF Gestefin. Extrae TODAS las transacciones de fondos PE.

Para cada transacción, extrae:
- fund: nombre del fondo (ej: "PORTOBELLO 20", "HELIA III 19", "ASABYS 20")
- date: fecha en formato YYYY-MM-DD
- type: "compra" (capital call/desembolso) o "venta" (distribución/reembolso)
- amount: importe en euros (valor absoluto, sin signo)

Responde SOLO con un JSON array:
[
  { "fund": "NOMBRE FONDO", "date": "2024-01-15", "type": "compra", "amount": 150000 },
  ...
]

Si no encuentras transacciones PE, responde con un array vacío: []`,
          },
        ],
      }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.map((tx: any) => ({
      fund: tx.fund || '',
      date: new Date(tx.date),
      type: tx.type === 'venta' ? 'venta' as const : 'compra' as const,
      amount: Math.abs(Number(tx.amount) || 0),
    })).filter((tx: ParsedTransaction) => tx.fund && tx.amount > 0);
  } catch (error) {
    logger.error('[PE Import] PDF AI parse error:', error);
    return [];
  }
}

function aggregateByFund(transactions: ParsedTransaction[]): Record<string, FundAggregate> {
  const result: Record<string, FundAggregate> = {};

  for (const tx of transactions) {
    if (!result[tx.fund]) {
      result[tx.fund] = {
        totalCalled: 0,
        totalDistributed: 0,
        firstDate: tx.date,
        lastDate: tx.date,
        txCount: 0,
      };
    }
    const agg = result[tx.fund];
    agg.txCount++;
    if (tx.type === 'compra') agg.totalCalled += tx.amount;
    else agg.totalDistributed += tx.amount;
    if (tx.date < agg.firstDate) agg.firstDate = tx.date;
    if (tx.date > agg.lastDate) agg.lastDate = tx.date;
  }

  return result;
}
