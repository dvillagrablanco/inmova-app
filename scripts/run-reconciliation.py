#!/usr/bin/env python3
"""Run bank reconciliation: match Bankinter transactions with rent payments."""
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
    return code, stdout.read().decode('utf-8', errors='ignore').strip(), stderr.read().decode('utf-8', errors='ignore').strip()

_, db_url, _ = run(f"grep '^DATABASE_URL' {APP}/.env.production | cut -d= -f2-", t=5)

# Run reconciliation script
print("=== BANK RECONCILIATION ===\n")
code, out, err = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();

async function reconcile() {{
  // Get companies
  const companies = await p.company.findMany({{ where: {{ OR: [{{ nombre: {{ contains: 'Viroda' }} }}, {{ nombre: {{ contains: 'Rovida' }} }}] }}, select: {{ id: true, nombre: true }} }});
  console.log('Companies:', companies.map(c => c.nombre).join(', '));

  let totalMatched = 0;
  let totalUnmatched = 0;
  let totalAlreadyMatched = 0;

  for (const company of companies) {{
    console.log('\\n═══ ' + company.nombre + ' ═══');

    // Get income transactions (CRDT = credit = money IN)
    const incomeTxs = await p.bankTransaction.findMany({{
      where: {{ companyId: company.id, monto: {{ gt: 0 }} }},
      orderBy: {{ fecha: 'desc' }},
      select: {{ id: true, fecha: true, monto: true, descripcion: true, beneficiario: true, referencia: true, reconciled: true, reconciledPaymentId: true }},
    }});
    console.log('Income transactions:', incomeTxs.length);

    // Get pending payments
    const pendingPayments = await p.payment.findMany({{
      where: {{
        contract: {{ unit: {{ building: {{ companyId: company.id }} }} }},
        estado: 'pendiente',
      }},
      select: {{ id: true, monto: true, periodo: true, fechaVencimiento: true, contractId: true }},
      orderBy: {{ fechaVencimiento: 'asc' }},
    }});
    console.log('Pending payments:', pendingPayments.length);

    // Try to match: for each income tx, find a pending payment with same amount
    let matched = 0;
    let alreadyMatched = 0;
    const matchedPaymentIds = new Set();
    const updates = [];

    for (const tx of incomeTxs) {{
      // Skip if already reconciled
      if (tx.reconciled || tx.reconciledPaymentId) {{
        alreadyMatched++;
        continue;
      }}

      // Find matching payment by amount (within 1€ tolerance)
      const match = pendingPayments.find(p => 
        !matchedPaymentIds.has(p.id) &&
        Math.abs(p.monto - tx.monto) < 1.0
      );

      if (match) {{
        matchedPaymentIds.add(match.id);
        matched++;
        updates.push({{
          txId: tx.id,
          paymentId: match.id,
          amount: tx.monto,
          desc: (tx.descripcion || '').substring(0, 50),
          periodo: match.periodo,
        }});
      }}
    }}

    console.log('Already reconciled:', alreadyMatched);
    console.log('New matches found:', matched);
    console.log('Unmatched income txs:', incomeTxs.length - matched - alreadyMatched);

    // Apply matches (mark payments as paid, link tx)
    if (updates.length > 0) {{
      console.log('\\nApplying ' + updates.length + ' matches...');
      let applied = 0;
      for (const u of updates) {{
        try {{
          await p.payment.update({{
            where: {{ id: u.paymentId }},
            data: {{ estado: 'pagado', fechaPago: new Date(), metodoPago: 'transferencia' }},
          }});
          // Mark tx as reconciled if field exists
          try {{
            await p.bankTransaction.update({{
              where: {{ id: u.txId }},
              data: {{ reconciled: true, reconciledPaymentId: u.paymentId }},
            }});
          }} catch(e) {{
            // reconciled field may not exist
          }}
          applied++;
        }} catch(e) {{
          console.log('  Error matching:', u.paymentId, e.message.substring(0,50));
        }}
      }}
      console.log('Applied:', applied);

      // Show sample matches
      console.log('\\nSample matches:');
      updates.slice(0, 5).forEach(u => {{
        console.log('  ' + u.amount.toFixed(2) + '€ | ' + u.periodo + ' | ' + u.desc);
      }});
    }}

    totalMatched += matched;
    totalUnmatched += incomeTxs.length - matched - alreadyMatched;
    totalAlreadyMatched += alreadyMatched;
  }}

  // Summary
  console.log('\\n══════════════════════════════════');
  console.log('RESUMEN CONCILIACIÓN');
  console.log('══════════════════════════════════');
  console.log('Nuevas coincidencias:', totalMatched);
  console.log('Ya conciliados:', totalAlreadyMatched);
  console.log('Sin match:', totalUnmatched);

  // Updated payment stats
  const stats = await p.payment.groupBy({{ by: ['estado'], _count: true, _sum: {{ monto: true }} }});
  console.log('\\nEstado pagos actualizado:');
  stats.forEach(s => console.log('  ' + s.estado + ': ' + s._count + ' (' + (s._sum.monto || 0).toFixed(0) + '€)'));

  await p.\\$disconnect();
}}

reconcile().catch(e => {{ console.log('ERROR:', e.message); process.exit(1); }});
" 2>&1''', t=120)

print(out)
if err and 'Warning' not in err:
    print(f"\nERR: {err[:200]}")

c.close()
