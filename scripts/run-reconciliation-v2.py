#!/usr/bin/env python3
"""Run bank reconciliation v2 — fixed field names."""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)
c.get_transport().set_keepalive(30)
APP = '/opt/inmova-app'

def run(cmd, t=120):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore').strip()

_, db_url_raw, _ = c.exec_command(f"grep '^DATABASE_URL' {APP}/.env.production | cut -d= -f2-", timeout=5)
db_url = db_url_raw.read().decode().strip()

out = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();

async function reconcile() {{
  const companies = await p.company.findMany({{ where: {{ OR: [{{ nombre: {{ contains: 'Viroda' }} }}, {{ nombre: {{ contains: 'Rovida' }} }}] }}, select: {{ id: true, nombre: true }} }});
  console.log('Companies:', companies.map(c => c.nombre).join(', '));

  let totalMatched = 0, totalSkipped = 0;

  for (const company of companies) {{
    console.log('\\n=== ' + company.nombre + ' ===');

    // Income transactions (monto > 0 = credit)
    const incomeTxs = await p.bankTransaction.findMany({{
      where: {{ companyId: company.id, monto: {{ gt: 0 }} }},
      orderBy: {{ fecha: 'desc' }},
      select: {{ id: true, fecha: true, monto: true, descripcion: true, beneficiario: true, estado: true, paymentId: true }},
    }});
    const notReconciled = incomeTxs.filter(t => !t.paymentId);
    const alreadyReconciled = incomeTxs.filter(t => !!t.paymentId);
    console.log('Income txs:', incomeTxs.length, '| Already reconciled:', alreadyReconciled.length, '| Pending:', notReconciled.length);

    // Pending rent payments
    const pendingPayments = await p.payment.findMany({{
      where: {{
        contract: {{ unit: {{ building: {{ companyId: company.id }} }} }},
        estado: 'pendiente',
      }},
      select: {{ id: true, monto: true, periodo: true, fechaVencimiento: true }},
      orderBy: {{ fechaVencimiento: 'asc' }},
    }});
    console.log('Pending payments:', pendingPayments.length);

    // Match by amount (within 0.50€ tolerance)
    const matchedPaymentIds = new Set();
    const matches = [];

    for (const tx of notReconciled) {{
      const match = pendingPayments.find(p =>
        !matchedPaymentIds.has(p.id) &&
        Math.abs(p.monto - tx.monto) < 0.50
      );
      if (match) {{
        matchedPaymentIds.add(match.id);
        matches.push({{ txId: tx.id, paymentId: match.id, amount: tx.monto, desc: (tx.descripcion || '').substring(0, 60), periodo: match.periodo }});
      }}
    }}

    console.log('New matches:', matches.length);

    // Apply
    let applied = 0;
    for (const m of matches) {{
      try {{
        await p.payment.update({{ where: {{ id: m.paymentId }}, data: {{ estado: 'pagado', fechaPago: new Date(), metodoPago: 'transferencia' }} }});
        await p.bankTransaction.update({{ where: {{ id: m.txId }}, data: {{ paymentId: m.paymentId, estado: 'conciliado', conciliadoEn: new Date() }} }});
        applied++;
      }} catch(e) {{
        // skip
      }}
    }}
    console.log('Applied:', applied);

    if (matches.length > 0) {{
      console.log('\\nSamples:');
      matches.slice(0, 8).forEach(m => console.log('  ' + m.amount.toFixed(2) + 'EUR | ' + m.periodo + ' | ' + m.desc));
    }}

    totalMatched += applied;
    totalSkipped += alreadyReconciled.length;
  }}

  // Final stats
  const stats = await p.payment.groupBy({{ by: ['estado'], _count: true, _sum: {{ monto: true }} }});
  console.log('\\n==============================');
  console.log('RESUMEN CONCILIACION');
  console.log('==============================');
  console.log('Nuevos matches aplicados:', totalMatched);
  console.log('Ya conciliados previamente:', totalSkipped);
  console.log('\\nEstado pagos:');
  stats.forEach(s => console.log('  ' + s.estado + ': ' + s._count + ' pagos (' + ((s._sum.monto || 0) / 1000).toFixed(0) + 'K EUR)'));

  await p.\\$disconnect();
}}
reconcile().catch(e => {{ console.log('ERROR:', e.message.substring(0, 300)); process.exit(1); }});
" 2>&1''', t=120)

print(out)
c.close()
