#!/usr/bin/env python3
"""Check and fix FinancialAccount/Position tables."""
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

_, db_url_raw, _ = c.exec_command(f"grep '^DATABASE_URL' {APP}/.env.production | cut -d= -f2-", timeout=5)
db_url = db_url_raw.read().decode().strip()

out = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();

async function check() {{
  // Check if tables exist and have data
  console.log('=== FINANCIAL ACCOUNTS ===');
  try {{
    const accounts = await p.financialAccount.findMany({{
      select: {{ id: true, companyId: true, entidad: true, alias: true, divisa: true, saldoActual: true, valorMercado: true, conexionTipo: true, activa: true }},
    }});
    console.log('Total accounts:', accounts.length);
    accounts.forEach(a => {{
      console.log('  ' + a.entidad + ' | ' + (a.alias || '-') + ' | ' + a.divisa + ' | Saldo: ' + a.saldoActual + ' | Valor: ' + a.valorMercado + ' | Tipo: ' + a.conexionTipo + ' | Activa: ' + a.activa);
    }});
  }} catch(e) {{
    console.log('ERROR:', e.message.substring(0, 200));
  }}

  console.log('\\n=== FINANCIAL POSITIONS ===');
  try {{
    const positions = await p.financialPosition.findMany({{
      take: 20,
      orderBy: {{ valorActual: 'desc' }},
      select: {{ id: true, accountId: true, instrumento: true, isin: true, valorActual: true, divisa: true, pnl: true, categoria: true }},
      include: {{ account: {{ select: {{ entidad: true, companyId: true }} }} }},
    }});
    console.log('Total positions (top 20 by value):');
    positions.forEach(pos => {{
      console.log('  ' + (pos.account?.entidad || '-') + ' | ' + (pos.instrumento || '-').substring(0,40) + ' | ' + pos.valorActual + ' ' + pos.divisa + ' | PnL: ' + (pos.pnl || 0));
    }});
    
    // Totals
    const totals = await p.financialPosition.aggregate({{ _sum: {{ valorActual: true, pnl: true }} }});
    console.log('\\nTotal valor:', (totals._sum.valorActual || 0).toFixed(0) + ' EUR');
    console.log('Total PnL:', (totals._sum.pnl || 0).toFixed(0) + ' EUR');
  }} catch(e) {{
    console.log('ERROR:', e.message.substring(0, 200));
  }}

  console.log('\\n=== FINANCIAL TRANSACTIONS ===');
  try {{
    const txCount = await p.financialTransaction.count();
    console.log('Total financial transactions:', txCount);
  }} catch(e) {{
    console.log('ERROR:', e.message.substring(0, 200));
  }}

  console.log('\\n=== PARTICIPATIONS (PE) ===');
  try {{
    const parts = await p.participation.findMany({{
      where: {{ activa: true }},
      take: 10,
      orderBy: {{ valorEstimado: 'desc' }},
      select: {{ id: true, companyId: true, nombreFondo: true, valorEstimado: true, tir: true }},
    }});
    console.log('Active participations:', parts.length);
    parts.forEach(p => console.log('  ' + p.nombreFondo?.substring(0,40) + ' | ' + p.valorEstimado + ' EUR | TIR: ' + (p.tir || '-')));
    
    const totPE = await p.participation.aggregate({{ where: {{ activa: true }}, _sum: {{ valorEstimado: true }} }});
    console.log('Total PE:', (totPE._sum.valorEstimado || 0).toFixed(0) + ' EUR');
  }} catch(e) {{
    console.log('PE ERROR:', e.message.substring(0, 150));
  }}

  await p.\\$disconnect();
}}
check().catch(e => console.log('FATAL:', e.message));
" 2>&1''', t=30)

print(out)
c.close()
