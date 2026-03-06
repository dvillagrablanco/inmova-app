#!/usr/bin/env python3
"""Check all data a CFO/owner would review for Monday presentation."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)
c.get_transport().set_keepalive(30)
APP = '/opt/inmova-app'

def run(cmd, t=30):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore').strip()

_, db_url_raw, _ = c.exec_command(f"grep '^DATABASE_URL' {APP}/.env.production | cut -d= -f2-", timeout=5)
db_url = db_url_raw.read().decode().strip()

out = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();

async function report() {{
  // ==== SOCIEDADES ====
  console.log('=== SOCIEDADES GRUPO VIDARO ===');
  const companies = await p.company.findMany({{ select: {{ id: true, nombre: true, cif: true, parentCompanyId: true, activo: true }} }});
  const vidaro = companies.filter(c => c.nombre.match(/vidaro|viroda|rovida|vibla/i));
  vidaro.forEach(c => console.log('  ' + c.nombre + ' | CIF: ' + (c.cif||'-') + ' | ' + (c.parentCompanyId ? 'filial' : 'holding')));

  const virodaId = companies.find(c => c.nombre.includes('Viroda'))?.id;
  const rovidaId = companies.find(c => c.nombre.includes('Rovida'))?.id;
  const vidaroIds = vidaro.map(c => c.id);

  // ==== INMUEBLES ====
  console.log('\\n=== PATRIMONIO INMOBILIARIO ===');
  const buildings = await p.building.findMany({{ where: {{ companyId: {{ in: vidaroIds }}, isDemo: false }}, include: {{ units: {{ select: {{ id: true, estado: true, rentaMensual: true, valorMercado: true }} }}, company: {{ select: {{ nombre: true }} }} }} }});
  let totalUnits = 0, occupied = 0, totalRent = 0, totalValue = 0;
  buildings.forEach(b => {{
    const units = b.units || [];
    const occ = units.filter(u => u.estado === 'ocupada' || u.estado === 'alquilada').length;
    const rent = units.reduce((s,u) => s + (u.rentaMensual || 0), 0);
    const val = units.reduce((s,u) => s + (u.valorMercado || 0), 0);
    totalUnits += units.length;
    occupied += occ;
    totalRent += rent;
    totalValue += val;
    console.log('  ' + b.company.nombre + ' | ' + b.nombre + ' | ' + units.length + ' uds | ' + occ + ' ocup | ' + rent.toFixed(0) + ' EUR/mes | Valor: ' + (val/1000).toFixed(0) + 'K');
  }});
  const occupancy = totalUnits > 0 ? (occupied/totalUnits*100).toFixed(1) : 0;
  console.log('  TOTAL: ' + buildings.length + ' edificios, ' + totalUnits + ' unidades, ' + occupied + ' ocupadas (' + occupancy + '%), ' + totalRent.toFixed(0) + ' EUR/mes, Valor: ' + (totalValue/1e6).toFixed(1) + 'M EUR');

  // ==== CONTRATOS ====
  console.log('\\n=== CONTRATOS ===');
  const contracts = await p.contract.groupBy({{ by: ['estado'], where: {{ unit: {{ building: {{ companyId: {{ in: vidaroIds }} }} }} }}, _count: true }});
  contracts.forEach(c => console.log('  ' + c.estado + ': ' + c._count));

  // ==== PAGOS ====
  console.log('\\n=== PAGOS ALQUILER ===');
  const payments = await p.payment.groupBy({{ by: ['estado'], where: {{ contract: {{ unit: {{ building: {{ companyId: {{ in: vidaroIds }} }} }} }} }}, _count: true, _sum: {{ monto: true }} }});
  payments.forEach(p => console.log('  ' + p.estado + ': ' + p._count + ' pagos (' + ((p._sum.monto||0)/1000).toFixed(0) + 'K EUR)'));

  // Morosidad
  const overdue = await p.payment.count({{ where: {{ estado: 'pendiente', fechaVencimiento: {{ lt: new Date() }}, contract: {{ unit: {{ building: {{ companyId: {{ in: vidaroIds }} }} }} }} }} }});
  console.log('  MOROSIDAD: ' + overdue + ' pagos vencidos sin cobrar');

  // ==== BANCA ====
  console.log('\\n=== MOVIMIENTOS BANCARIOS ===');
  const txStats = await p.bankTransaction.groupBy({{ by: ['companyId'], where: {{ companyId: {{ in: vidaroIds }} }}, _count: true, _sum: {{ monto: true }} }});
  for (const s of txStats) {{
    const comp = vidaro.find(c => c.id === s.companyId);
    console.log('  ' + (comp?.nombre||'?') + ': ' + s._count + ' txs | Sum: ' + (s._sum.monto||0).toFixed(0) + ' EUR');
  }}
  const lastTx = await p.bankTransaction.findFirst({{ where: {{ companyId: {{ in: vidaroIds }} }}, orderBy: {{ fecha: 'desc' }}, select: {{ fecha: true }} }});
  console.log('  Última transacción: ' + (lastTx?.fecha || '-'));

  // ==== CONCILIACION ====
  console.log('\\n=== CONCILIACIÓN ===');
  const reconciled = await p.bankTransaction.count({{ where: {{ companyId: {{ in: vidaroIds }}, paymentId: {{ not: null }} }} }});
  const totalBankTx = await p.bankTransaction.count({{ where: {{ companyId: {{ in: vidaroIds }} }} }});
  console.log('  Conciliados: ' + reconciled + '/' + totalBankTx + ' (' + (totalBankTx > 0 ? (reconciled/totalBankTx*100).toFixed(1) : 0) + '%)');

  // ==== CUENTAS FINANCIERAS ====
  console.log('\\n=== CUENTAS FINANCIERAS (FAMILY OFFICE) ===');
  const accounts = await p.financialAccount.findMany({{ where: {{ companyId: {{ in: vidaroIds }}, activa: true }}, select: {{ entidad: true, alias: true, saldoActual: true, valorMercado: true, divisa: true }} }});
  let totalSaldo = 0, totalValor = 0;
  accounts.forEach(a => {{
    totalSaldo += a.saldoActual || 0;
    totalValor += a.valorMercado || 0;
    if (a.saldoActual > 10000 || a.valorMercado > 10000) {{
      console.log('  ' + a.entidad + ' (' + (a.alias||'-') + ') | Saldo: ' + (a.saldoActual/1000).toFixed(0) + 'K | Valor: ' + (a.valorMercado/1000).toFixed(0) + 'K ' + a.divisa);
    }}
  }});
  console.log('  TOTAL: ' + accounts.length + ' cuentas | Saldo: ' + (totalSaldo/1e6).toFixed(1) + 'M | Valor: ' + (totalValor/1e6).toFixed(1) + 'M EUR');

  // ==== SEGUROS ====
  console.log('\\n=== SEGUROS ===');
  const seguros = await p.insurance.count({{ where: {{ companyId: {{ in: vidaroIds }} }} }});
  const segurosActivos = await p.insurance.count({{ where: {{ companyId: {{ in: vidaroIds }}, estado: 'activa' }} }});
  console.log('  Total: ' + seguros + ' | Activos: ' + segurosActivos);

  // ==== FIRMA DIGITAL ====
  console.log('\\n=== FIRMA DIGITAL ===');
  const signatures = await p.contractSignature.count({{ where: {{ companyId: {{ in: vidaroIds }} }} }});
  const sigPending = await p.contractSignature.count({{ where: {{ companyId: {{ in: vidaroIds }}, status: 'PENDING' }} }});
  const sigSigned = await p.contractSignature.count({{ where: {{ companyId: {{ in: vidaroIds }}, status: 'SIGNED' }} }});
  console.log('  Total: ' + signatures + ' | Pendientes: ' + sigPending + ' | Firmados: ' + sigSigned);

  // ==== INTEGRACIONES ====
  console.log('\\n=== INTEGRACIONES ACTIVAS ===');
  const integrations = {{
    'GoCardless (SEPA)': !!process.env.GOCARDLESS_ACCESS_TOKEN,
    'DocuSign (Firma)': !!process.env.DOCUSIGN_INTEGRATION_KEY,
    'Tink (Open Banking)': !!process.env.TINK_CLIENT_ID,
    'Stripe (Pagos online)': !!process.env.STRIPE_SECRET_KEY,
    'AWS S3 (Documentos)': !!process.env.AWS_ACCESS_KEY_ID,
    'Gmail SMTP (Email)': !!process.env.SMTP_HOST,
    'Anthropic (IA)': !!process.env.ANTHROPIC_API_KEY,
    'Sentry (Monitoring)': !!process.env.SENTRY_DSN,
  }};
  Object.entries(integrations).forEach(([name, ok]) => console.log('  ' + (ok ? '✅' : '❌') + ' ' + name));

  // ==== PAGINAS CLAVE (CURL TEST) ====
  console.log('\\n=== PÁGINAS CLAVE ===');
  
  await p.\\$disconnect();
}}
report().catch(e => console.log('ERROR:', e.message.substring(0, 300)));
" 2>&1''', t=60)

print(out)

# Test key pages
print("\n=== TEST PÁGINAS WEB ===")
pages = [
    '/dashboard',
    '/contabilidad',
    '/pagos',
    '/contratos',
    '/propiedades',
    '/seguros',
    '/firma-digital',
    '/firma-digital/operadores',
    '/family-office/dashboard',
    '/family-office/cartera',
    '/family-office/cuentas',
    '/family-office/pe',
    '/family-office/tesoreria',
    '/inversiones/oportunidades',
    '/inversiones/fiscal',
    '/inversiones/tesoreria',
    '/reportes/financieros',
    '/contabilidad/intragrupo',
    '/admin/integraciones/docusign',
    '/dashboard/ejecutivo',
]
for page in pages:
    status = run(f"curl -sf -o /dev/null -w '%{{http_code}}' http://localhost:3000{page}", t=10)
    icon = '✅' if status == '200' else '⚠️' if status == '302' else '❌'
    print(f"  {icon} {page}: HTTP {status}")

c.close()
