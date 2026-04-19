#!/usr/bin/env python3
"""Ejecuta el servicio Zucchetti directamente vía tsx en el servidor."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

# Crear script tsx en el servidor
script = '''
import { syncZucchettiGroupVidaro } from './lib/zucchetti-full-sync-service';

async function main() {
  console.log('=== Iniciando Zucchetti Group Vidaro Sync ===');
  const t0 = Date.now();
  const results = await syncZucchettiGroupVidaro();
  const total = Date.now() - t0;
  
  console.log(`\\n=== RESUMEN (${total}ms) ===`);
  for (const r of results) {
    console.log(`\\n[${r.companyKey}] success=${r.success} duracion=${r.durationMs}ms`);
    if (r.error) console.log(`  ERROR: ${r.error}`);
    console.log(`  apuntes: read=${r.apuntes.read} created=${r.apuntes.created} updated=${r.apuntes.updated} skipped=${r.apuntes.skipped} errors=${r.apuntes.errors}`);
    console.log(`  treasury: created=${r.treasury.created} errors=${r.treasury.errors}`);
    console.log(`  iva: read=${r.iva.read} created=${r.iva.created} errors=${r.iva.errors}`);
    console.log(`  terceros: read=${r.terceros.read} created=${r.terceros.created} errors=${r.terceros.errors}`);
    console.log(`  balances: computed=${r.balances.computed} persisted=${r.balances.persisted}`);
  }
  
  process.exit(0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
'''

# Guardar y ejecutar
cmd = f"""
cd /opt/inmova-app
cat > /tmp/run-zucchetti-sync.ts << 'SCRIPT_EOF'
{script}
SCRIPT_EOF

# Cargar env y ejecutar
set -a
. /opt/inmova-app/.env.production
set +a

npx tsx /tmp/run-zucchetti-sync.ts 2>&1 | tail -100
"""
stdin, stdout, stderr = c.exec_command(cmd, timeout=900)
print(stdout.read().decode())
err = stderr.read().decode()
if err:
    print("STDERR:", err[-1000:])

c.close()
