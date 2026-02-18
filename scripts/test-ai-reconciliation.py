#!/usr/bin/env python3
"""Test AI reconciliation on production server"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)

def run_node(script, t=30):
    sftp = client.open_sftp()
    with sftp.open(f'{APP}/_test.js', 'w') as f:
        f.write('require("dotenv").config({path:".env.production"});\n')
        f.write('require("dotenv").config({path:".env.local"});\n')
        f.write('require("dotenv").config();\n')
        f.write(script)
    sftp.close()
    stdin, stdout, stderr = client.exec_command(f'cd {APP} && node _test.js 2>&1', timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return code, out

# TEST 1
print("=" * 60)
print("TEST 1: Ingresos pendientes")
print("=" * 60)
code, out = run_node("""
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const total = await p.bankTransaction.count({ where: { estado: 'pendiente_revision' } });
  const ingresos = await p.bankTransaction.count({ where: { estado: 'pendiente_revision', monto: { gt: 0 } } });
  console.log('Total pendientes:', total);
  console.log('Ingresos pendientes:', ingresos);
  
  const sample = await p.bankTransaction.findMany({
    where: { estado: 'pendiente_revision', monto: { gt: 100 } },
    orderBy: { monto: 'desc' }, take: 3,
    select: { id: true, monto: true, descripcion: true, debtorName: true, companyId: true }
  });
  console.log('\\nTop ingresos:');
  for (const tx of sample) {
    console.log('  ' + tx.monto + ' EUR | ' + (tx.debtorName || '-').substring(0, 35) + ' | ' + tx.descripcion.substring(0, 50));
  }
  await p.$disconnect();
})().catch(e => { console.error('ERROR:', e.message); });
""")
print(out)

# TEST 2
print("\n" + "=" * 60)
print("TEST 2: Contratos activos")
print("=" * 60)
code, out = run_node("""
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const contracts = await p.contract.findMany({
    where: { estado: 'activo' },
    include: {
      tenant: { select: { id: true, nombreCompleto: true } },
      unit: { select: { numero: true, building: { select: { nombre: true } } } }
    }, take: 8
  });
  console.log('Contratos activos:', contracts.length);
  for (const c of contracts) {
    console.log('  ' + c.tenant.nombreCompleto.padEnd(30) + ' | ' + c.rentaMensual + ' EUR | ' + (c.unit.building?.nombre || '') + ' ' + c.unit.numero);
  }
  if (contracts.length === 0) console.log('  >>> SIN CONTRATOS ACTIVOS - LA IA NO PUEDE MATCHEAR <<<');
  await p.$disconnect();
})().catch(e => { console.error('ERROR:', e.message); });
""")
print(out)

# TEST 3
print("\n" + "=" * 60)
print("TEST 3: Claude API")
print("=" * 60)
code, out = run_node("""
const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.log('ANTHROPIC_API_KEY: NO CONFIGURADA'); process.exit(0); }
console.log('Key:', key.substring(0, 15) + '...' + key.slice(-6));

const https = require('https');
const data = JSON.stringify({
  model: 'claude-sonnet-4-20250514', max_tokens: 30,
  messages: [{ role: 'user', content: 'Responde solo: OK' }]
});
const req = https.request({
  hostname: 'api.anthropic.com', port: 443, path: '/v1/messages', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Length': data.length }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('HTTP:', res.statusCode);
    try {
      const r = JSON.parse(body);
      if (r.content) console.log('Claude dice:', r.content[0]?.text);
      else if (r.error) console.log('Error:', r.error.type, '-', r.error.message);
      else console.log('Body:', body.substring(0, 200));
    } catch(e) { console.log('Raw:', body.substring(0, 200)); }
  });
});
req.on('error', e => console.log('Net Error:', e.message));
req.write(data);
req.end();
""", 20)
print(out)

# TEST 4
print("\n" + "=" * 60)
print("TEST 4: smartReconcileBatch (3 txs, solo reglas)")
print("=" * 60)
code, out = run_node("""
// Need to use tsx or compile TS - use direct Prisma approach instead
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Get income txs
  const txs = await p.bankTransaction.findMany({
    where: { estado: 'pendiente_revision', monto: { gt: 0 } },
    take: 3, orderBy: { monto: 'desc' }
  });
  
  if (txs.length === 0) { console.log('No income txs'); await p.$disconnect(); return; }
  
  // Get active tenants for that company
  const companyId = txs[0].companyId;
  const contracts = await p.contract.findMany({
    where: { estado: 'activo', unit: { building: { companyId } } },
    include: {
      tenant: { select: { id: true, nombreCompleto: true } },
      unit: { select: { id: true, numero: true, building: { select: { nombre: true } } } }
    }
  });
  
  console.log('Company:', companyId.substring(0, 10) + '...');
  console.log('Tenants with contracts:', contracts.length);
  console.log('Testing matching on', txs.length, 'income txs:');
  
  for (const tx of txs) {
    const text = ((tx.debtorName || '') + ' ' + tx.descripcion).toUpperCase();
    let matched = null;
    
    for (const c of contracts) {
      const parts = c.tenant.nombreCompleto.toUpperCase().split(/\\s+/).filter(p => p.length > 2);
      const nameMatches = parts.filter(part => text.includes(part)).length;
      const amountMatch = Math.abs(tx.monto - c.rentaMensual) < 1.0;
      
      if (nameMatches >= 2 || (parts.length <= 2 && nameMatches >= 1 && amountMatch)) {
        matched = { tenant: c.tenant.nombreCompleto, rent: c.rentaMensual, unit: c.unit.numero, nameMatches, amountMatch };
        break;
      }
    }
    
    console.log('');
    console.log('  TX:', tx.monto, 'EUR |', (tx.debtorName || '-').substring(0, 35), '|', tx.descripcion.substring(0, 50));
    if (matched) {
      console.log('  >>> MATCH:', matched.tenant, '|', matched.rent, 'EUR |', matched.unit, '| names:', matched.nameMatches, '| amount:', matched.amountMatch);
    } else {
      console.log('  >>> NO MATCH (0 tenants matched by name in description)');
    }
  }
  
  await p.$disconnect();
})().catch(e => { console.error('ERROR:', e.message); });
""", 20)
print(out)

# Cleanup
run_node("// cleanup", 5)
stdin, stdout, stderr = client.exec_command(f'rm -f {APP}/_test.js', timeout=5)
stdout.channel.recv_exit_status()

print("\n" + "=" * 60)
print("TESTS COMPLETE")
print("=" * 60)
client.close()
