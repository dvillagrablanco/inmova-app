/**
 * Seed Vidaro monthly data from Excel files
 * Reads INMUEBLES_ROVIDA_MENSUAL.xlsx and INMUEBLES_VIRODA_MENSUAL.xlsx
 * Parses contract/tenant info per sheet (building).
 * DRY RUN by default - use --execute to write to DB.
 */

import * as XLSX from 'xlsx';
import { config } from 'dotenv';

config({ path: '.env.production' });
config({ path: '.env.local' });
config({ path: '.env' });

const CONTRACT_TYPE_MAP: Record<string, string> = {
  'LARGA ESTANCIA': 'larga_estancia',
  'CONTRATO TEMPORADA': 'temporada',
  TEMPORADA: 'temporada',
  VACIO: '__SKIP__',
  'USO FAMILIAR': 'uso_propio',
  'USO EMPRESA': 'uso_propio',
  'CONTRATO ALQUILER EMPRESA': 'uso_propio',
  'AGENCIA VIVIENDA': 'agencia',
  'AGENCI VIVIENDA 2': 'agencia',
  'CONTRATO TEMPORADA (ALAMO)': 'temporada',
  'CONTRATO TEMPORADA(ÁLAMO)': 'temporada',
  'CONTRATO TEMPORADA(GUIDEBRIGE)': 'temporada',
  'SPOTAHOME(CONTRATO TEMPORADA)': 'temporada',
  'ÁLAMO(CONTRATO TEMPORADA)': 'temporada',
  'AGENCIA ÁLAMO(TEMPORADA)': 'temporada',
};

interface ParsedRow {
  building: string;
  unit: string;
  contractType: string;
  tenant: string;
  startDate: string;
  endDate: string;
  renta: number;
  sheetName: string;
}

interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  contractsFound: number;
  vacancies: number;
  typesBreakdown: Record<string, number>;
}

function parseExcel(filePath: string): ParseResult {
  const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: true });
  const result: ParseResult = {
    rows: [],
    totalRows: 0,
    contractsFound: 0,
    vacancies: 0,
    typesBreakdown: {},
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (data.length < 2) continue;

    const headers = (data[0] as string[]).map((h) => String(h || '').trim().toUpperCase());
    const fincaIdx = headers.findIndex(
      (h) => h.includes('FINCA') || h.includes('INMUEBLE') || h === 'FINCA/INMUEBLE'
    );
    const tipoIdx = headers.findIndex(
      (h) => h.includes('TIPO') && h.includes('CONTRATO')
    );
    const inquilinoIdx = headers.findIndex((h) => h.includes('INQUILINO'));
    const fechaContratoIdx = headers.findIndex(
      (h) => h.includes('FECHA') && h.includes('CONTRATO')
    );
    const finContratoIdx = headers.findIndex(
      (h) => h.includes('FIN') && h.includes('CONTRATO')
    );
    const rentaIdx = headers.findIndex((h) => h.includes('RENTA'));

    if (fincaIdx < 0 || tipoIdx < 0) continue;

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[];
      result.totalRows++;

      const rawUnit = String(row[fincaIdx] ?? '').trim();
      const rawTipo = String(row[tipoIdx] ?? '').trim().toUpperCase();
      const tenant = String(row[inquilinoIdx ?? -1] ?? '').trim();
      const startDate = row[fechaContratoIdx ?? -1];
      const endDate = row[finContratoIdx ?? -1];
      const rentaVal = row[rentaIdx ?? -1];

      const mappedType = CONTRACT_TYPE_MAP[rawTipo] ?? (rawTipo || 'unknown');
      if (mappedType === '__SKIP__') {
        result.vacancies++;
        continue;
      }

      const renta =
        typeof rentaVal === 'number'
          ? rentaVal
          : typeof rentaVal === 'string'
            ? parseFloat(String(rentaVal).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0
            : 0;

      if (!tenant || renta <= 0) continue;

      result.contractsFound++;
      result.typesBreakdown[mappedType] = (result.typesBreakdown[mappedType] || 0) + 1;

      const formatDate = (d: unknown): string => {
        if (!d) return '';
        if (d instanceof Date) return d.toISOString().slice(0, 10);
        const s = String(d);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        return s;
      };

      result.rows.push({
        building: sheetName,
        unit: rawUnit,
        contractType: mappedType,
        tenant,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        renta,
        sheetName,
      });
    }
  }

  return result;
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  console.log(
    dryRun ? '🔍 DRY RUN (use --execute to write to DB)' : '⚡ EXECUTING'
  );
  console.log('');

  const pathRovida = 'data/vidaro-files/INMUEBLES_ROVIDA_MENSUAL.xlsx';
  const pathViroda = 'data/vidaro-files/INMUEBLES_VIRODA_MENSUAL.xlsx';

  let roviData: ParseResult | null = null;
  let virData: ParseResult | null = null;

  try {
    roviData = parseExcel(pathRovida);
    console.log(`📂 Parsed ${pathRovida}`);
  } catch (e) {
    console.warn(`⚠️ Could not read ${pathRovida}:`, (e as Error).message);
  }

  try {
    virData = parseExcel(pathViroda);
    console.log(`📂 Parsed ${pathViroda}`);
  } catch (e) {
    console.warn(`⚠️ Could not read ${pathViroda}:`, (e as Error).message);
  }

  const allRows: ParsedRow[] = [];
  const allTypes: Record<string, number> = {};
  let totalRows = 0;
  let totalContracts = 0;
  let totalVacancies = 0;

  for (const data of [roviData, virData]) {
    if (!data) continue;
    allRows.push(...data.rows);
    totalRows += data.totalRows;
    totalContracts += data.contractsFound;
    totalVacancies += data.vacancies;
    for (const [k, v] of Object.entries(data.typesBreakdown)) {
      allTypes[k] = (allTypes[k] || 0) + v;
    }
  }

  console.log('');
  console.log('--- Rows to update ---');
  for (const r of allRows) {
    console.log(
      `  ${r.building} | ${r.unit} | ${r.tenant} | ${r.contractType} | ${r.renta}€ | ${r.startDate} → ${r.endDate}`
    );
  }

  console.log('');
  console.log('--- Summary ---');
  console.log(`  Total rows: ${totalRows}`);
  console.log(`  Contracts found: ${totalContracts}`);
  console.log(`  Vacancies (skipped): ${totalVacancies}`);
  console.log('  Types breakdown:', allTypes);
}

main().catch(console.error);
