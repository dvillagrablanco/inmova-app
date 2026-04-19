#!/usr/bin/env python3
"""Ejecuta enrichment masivo via tsx en el servidor (saltando HTTP/auth)."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

cmd = """
cd /opt/inmova-app

cat > scripts/_enrich_run.ts << 'SCRIPT'
import { getPrismaClient } from '../lib/db';

const STOPWORDS = new Set([
  'calle','avda','avenida','plaza','paseo','carretera','autovia','autopista',
  'inmueble','edificio','local','garaje','garajes','oficina','oficinas',
  'palencia','madrid','valladolid','spain','espana',
  'naves','nave','apartamentos','apartamento',
]);

function normalize(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
}

(async () => {
  const prisma = getPrismaClient();
  const VIDARO = ['cef19f55f7b6ce0637d5ffb53','c65159283deeaf6815f8eda95','cmkctneuh0001nokn7nvhuweq'];

  // Cargar buildings del grupo
  const buildings = await prisma.building.findMany({
    where: {
      OR: [
        { companyId: { in: VIDARO } },
        { units: { some: { ownerCompanyId: { in: VIDARO } } } },
      ],
    },
    select: { id: true, nombre: true, direccion: true },
  });

  interface Matcher { id: string; tokens: string[]; numeros: string[]; }
  const matchers: Matcher[] = buildings.map(b => {
    const text = normalize(`${b.nombre || ''} ${b.direccion || ''}`);
    const allTokens = text.split(/[\\s,.\\-/]+/).filter(Boolean);
    const tokens = allTokens.filter(t => t.length >= 4 && !STOPWORDS.has(t) && !/^\\d+$/.test(t));
    const numeros = allTokens.filter(t => /^\\d+$/.test(t));
    return { id: b.id, tokens, numeros };
  });

  function findBuildingByText(text: string): string | null {
    const norm = normalize(text);
    if (!norm) return null;
    let bestId: string | null = null;
    let bestScore = 0;
    for (const m of matchers) {
      let score = 0;
      for (const tok of m.tokens) if (norm.includes(tok)) score += tok.length;
      for (const num of m.numeros) {
        const re = new RegExp(`(^|[^0-9])${num}([^0-9]|$)`);
        if (re.test(norm)) score += 5;
      }
      if (score > bestScore) { bestScore = score; bestId = m.id; }
    }
    return bestScore >= 8 ? bestId : null;
  }

  console.log(`Loaded ${buildings.length} buildings, ${matchers.length} matchers`);

  // Procesar en batch
  const txs = await prisma.accountingTransaction.findMany({
    where: { companyId: { in: VIDARO }, buildingId: null },
    select: { id: true, concepto: true, notas: true },
    take: 50000,
  });
  console.log(`Found ${txs.length} unassigned transactions`);

  let updated = 0;
  let unmatched = 0;
  let i = 0;
  for (const tx of txs) {
    const text = `${tx.concepto || ''} ${tx.notas || ''}`;
    const bId = findBuildingByText(text);
    if (bId) {
      await prisma.accountingTransaction.update({
        where: { id: tx.id },
        data: { buildingId: bId },
      });
      updated++;
    } else {
      unmatched++;
    }
    i++;
    if (i % 200 === 0) console.log(`  ${i}/${txs.length} processed (${updated} matched, ${unmatched} unmatched)`);
  }
  console.log(`\\nDONE: ${updated} matched, ${unmatched} unmatched out of ${txs.length}`);

  // Estado final por building
  console.log('\\n=== Estado final por building ===');
  const summary = await prisma.accountingTransaction.groupBy({
    by: ['buildingId', 'tipo'],
    where: { companyId: { in: VIDARO }, fecha: { gte: new Date('2026-01-01') } },
    _sum: { monto: true },
    _count: true,
  });
  const byBld: Record<string, any> = {};
  for (const s of summary) {
    const k = s.buildingId || 'NULL';
    byBld[k] = byBld[k] || { ingresos: 0, gastos: 0, n: 0 };
    if (s.tipo === 'ingreso') byBld[k].ingresos += s._sum.monto || 0;
    else if (s.tipo === 'gasto') byBld[k].gastos += s._sum.monto || 0;
    byBld[k].n += s._count;
  }
  const bMap = Object.fromEntries(buildings.map(b => [b.id, b.nombre]));
  const sorted = Object.entries(byBld).sort((a, b) => b[1].n - a[1].n);
  for (const [bId, d] of sorted) {
    const name = bId === 'NULL' ? '(SIN ASIGNAR)' : bMap[bId] || bId;
    const noi = d.ingresos - d.gastos;
    console.log(`  ${name.padEnd(36)} ${String(d.n).padStart(5)} apuntes  ing=${Math.round(d.ingresos).toString().padStart(8)}  gas=${Math.round(d.gastos).toString().padStart(8)}  NOI=${Math.round(noi).toString().padStart(8)}`);
  }

  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
SCRIPT

# Cargar env (sin BEGIN/END que causan errores con shell)
set +e
while IFS='=' read -r key value; do
  if [[ "$key" =~ ^[A-Z][A-Z0-9_]+$ ]] && [[ ! "$value" =~ "BEGIN" ]] && [[ ! "$value" =~ "END" ]]; then
    export "$key"="$value"
  fi
done < /opt/inmova-app/.env.production

cd /opt/inmova-app && timeout 1200 npx tsx scripts/_enrich_run.ts 2>&1 | tail -200
rm -f scripts/_enrich_run.ts
"""
stdin, stdout, stderr = c.exec_command(cmd, timeout=1500)
print(stdout.read().decode())
c.close()
