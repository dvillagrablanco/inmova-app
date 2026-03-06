#!/usr/bin/env python3
"""Check all Vidaro financial data - banks, accounts, positions."""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)
APP = '/opt/inmova-app'

def run(cmd, t=30):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore').strip()

_, db_url, _ = c.exec_command(f"grep '^DATABASE_URL' {APP}/.env.production | cut -d= -f2-", timeout=5)
db_url = db_url.read().decode().strip()

out = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();

async function check() {{
  // 1. Companies in Vidaro group
  console.log('=== COMPANIES ===');
  const companies = await p.company.findMany({{ select: {{ id: true, nombre: true, cif: true, parentCompanyId: true, iban: true }} }});
  companies.forEach(c => console.log(c.id.substring(0,12), '|', c.nombre, '|', c.cif || '-', '|', c.iban || '-', '|', c.parentCompanyId ? 'child' : 'root'));

  // 2. Bank connections
  console.log('\\n=== BANK CONNECTIONS ===');
  const conns = await p.bankConnection.findMany({{ select: {{ id: true, companyId: true, nombreBanco: true, proveedor: true, ultimosDigitos: true, estado: true, ultimaSync: true }} }});
  conns.forEach(c => console.log(c.id.substring(0,12), '|', c.nombreBanco, '|', c.proveedor, '|', c.estado, '|', c.ultimosDigitos, '|', c.ultimaSync));

  // 3. Bank transactions stats
  console.log('\\n=== BANK TRANSACTIONS ===');
  const txStats = await p.bankTransaction.groupBy({{ by: ['companyId'], _count: true, _sum: {{ monto: true }} }});
  for (const s of txStats) {{
    const comp = companies.find(c => c.id === s.companyId);
    console.log(comp?.nombre || s.companyId.substring(0,12), '| Txs:', s._count, '| Sum:', s._sum.monto?.toFixed(2));
  }}

  // 4. Financial accounts (Family Office)
  console.log('\\n=== FINANCIAL ACCOUNTS ===');
  try {{
    const accounts = await p.financialAccount.findMany({{ select: {{ id: true, companyId: true, entidad: true, tipo: true, iban: true, saldo: true, moneda: true }} }});
    if (accounts.length > 0) {{
      accounts.forEach(a => {{
        const comp = companies.find(c => c.id === a.companyId);
        console.log(comp?.nombre || a.companyId?.substring(0,12), '|', a.entidad, '|', a.tipo, '|', a.iban || '-', '|', a.saldo, a.moneda);
      }});
    }} else {{
      console.log('(no financial accounts)');
    }}
  }} catch(e) {{ console.log('FinancialAccount not available:', e.message.substring(0,80)); }}

  // 5. Financial positions (PE/Funds)
  console.log('\\n=== FINANCIAL POSITIONS ===');
  try {{
    const positions = await p.financialPosition.findMany({{ take: 20, orderBy: {{ valorActual: 'desc' }}, select: {{ id: true, companyId: true, entidad: true, instrumento: true, valorActual: true, moneda: true }} }});
    if (positions.length > 0) {{
      positions.forEach(pos => {{
        const comp = companies.find(c => c.id === pos.companyId);
        console.log(comp?.nombre || pos.companyId?.substring(0,12), '|', pos.entidad, '|', pos.instrumento?.substring(0,40), '|', pos.valorActual, pos.moneda);
      }});
    }} else {{
      console.log('(no financial positions)');
    }}
  }} catch(e) {{ console.log('FinancialPosition not available:', e.message.substring(0,80)); }}

  // 6. Payments stats
  console.log('\\n=== PAYMENTS (rent) ===');
  const payments = await p.payment.groupBy({{ by: ['estado'], _count: true, _sum: {{ monto: true }} }});
  payments.forEach(p => console.log(p.estado, '| Count:', p._count, '| Amount:', p._sum.monto?.toFixed(2)));

  // 7. SEPA mandates
  console.log('\\n=== SEPA ===');
  try {{
    const mandates = await p.sepaMandate.count();
    const sepaPayments = await p.sepaPayment.count();
    console.log('Mandates:', mandates, '| SEPA Payments:', sepaPayments);
  }} catch(e) {{ console.log('SEPA tables:', e.message.substring(0,80)); }}

  await p.\\$disconnect();
}}
check().catch(e => {{ console.log('ERROR:', e.message); process.exit(1); }});
" 2>&1''', t=30)

print(out)
c.close()
